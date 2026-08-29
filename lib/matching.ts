import { prisma } from '@/lib/db';
import { haversineKm } from '@/lib/location';
import { normalizeTitle } from '@/lib/utils';
import type { Book, WantedBook } from '@prisma/client';

export type MatchCandidate = {
  theirBook: Book & { wantedBy: WantedBook[] };
  myOfferedBook: Book & { wantedBy: WantedBook[] };
  score: number;
  distanceKm: number | null;
  reasons: string[];
};

/**
 * Given a book a user wants, find their own books that satisfy it in return
 * and score the resulting exchange. Mirrors the rules from the spec:
 * title/author/category match, distance, and condition all weigh in.
 */
export function scoreMatch(opts: {
  theirBook: Book & { wantedBy: WantedBook[] };
  myBook: Book & { wantedBy: WantedBook[] };
  distanceKm: number | null;
  maxDistanceKm: number; // 0 = anywhere
}): { score: number; reasons: string[] } | null {
  const { theirBook, myBook, distanceKm, maxDistanceKm } = opts;

  if (maxDistanceKm > 0 && distanceKm !== null && distanceKm > maxDistanceKm) return null;

  const reasons: string[] = [];
  let score = 0;

  // Does the other owner want *my* book back? (direct exchange = best case)
  const myTitleKey = normalizeTitle(myBook.title);
  const theyWantMine = theirBook.wantedBy.some((w) => normalizeTitle(w.title) === myTitleKey);
  if (theyWantMine) {
    score += 55;
    reasons.push('They want your book too — direct match');
  } else {
    score += 15;
    reasons.push('One-sided exchange — they may still accept');
  }

  // Condition of the book being received.
  const conditionScore: Record<string, number> = {
    LIKE_NEW: 20,
    VERY_GOOD: 15,
    GOOD: 10,
    ACCEPTABLE: 5,
  };
  score += conditionScore[theirBook.condition] ?? 5;
  if (theirBook.condition === 'LIKE_NEW' || theirBook.condition === 'VERY_GOOD') {
    reasons.push(`Book condition: ${theirBook.condition.replace('_', ' ').toLowerCase()}`);
  }

  // Category match between the two books nudges relevance slightly.
  if (theirBook.categoryId && theirBook.categoryId === myBook.categoryId) {
    score += 5;
    reasons.push('Same category');
  }

  // Distance — closer is better, capped contribution.
  if (distanceKm !== null) {
    const distScore = Math.max(0, 20 - distanceKm / 5);
    score += distScore;
    if (distanceKm < 10) reasons.push('Nearby');
  } else {
    score += 5; // unknown distance: small neutral credit, don't punish
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

/**
 * Finds compatible exchange candidates for `userId`: books they want that
 * other people own, matched against books they themselves can offer.
 * Excludes own books, unavailable books, and blocked users.
 */
export async function findMatchesForUser(userId: string, limit = 20): Promise<MatchCandidate[]> {
  const [me, myBooks, blocks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
    }),
    prisma.book.findMany({
      where: { ownerId: userId, status: 'AVAILABLE', available: true, moderation: 'APPROVED' },
      include: { wantedBy: true },
    }),
    prisma.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
  ]);

  if (!me || myBooks.length === 0) return [];

  const blockedIds = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));
  const myAddress = me.addresses[0];
  const maxDistanceKm = me.searchRadiusKm ?? 25;

  // All wanted titles across my listed books.
  const wantedTitles = new Set(myBooks.flatMap((b) => b.wantedBy.map((w) => normalizeTitle(w.title))));
  if (wantedTitles.size === 0) return [];

  const candidateBooks = await prisma.book.findMany({
    where: {
      ownerId: { not: userId, notIn: [...blockedIds] },
      status: 'AVAILABLE',
      available: true,
      moderation: 'APPROVED',
    },
    include: {
      wantedBy: true,
      owner: { include: { addresses: { where: { isDefault: true }, take: 1 }, profile: true } },
    },
    take: 300, // ponytail: naive scan; add a title index/search service if catalogue grows large
  });

  const results: MatchCandidate[] = [];

  for (const theirBook of candidateBooks) {
    if (!wantedTitles.has(normalizeTitle(theirBook.title))) continue;

    const theirAddress = theirBook.owner.addresses[0];
    const distanceKm =
      myAddress?.latitude != null &&
      myAddress?.longitude != null &&
      theirAddress?.latitude != null &&
      theirAddress?.longitude != null
        ? haversineKm(myAddress.latitude, myAddress.longitude, theirAddress.latitude, theirAddress.longitude)
        : null;

    // Pick the best of my books to offer for this specific match.
    let best: { book: (typeof myBooks)[number]; score: number; reasons: string[] } | null = null;
    for (const myBook of myBooks) {
      const wantsThis = myBook.wantedBy.some((w) => normalizeTitle(w.title) === normalizeTitle(theirBook.title));
      if (!wantsThis) continue;
      const result = scoreMatch({ theirBook, myBook, distanceKm, maxDistanceKm });
      if (result && (!best || result.score > best.score)) {
        best = { book: myBook, score: result.score, reasons: result.reasons };
      }
    }

    if (best) {
      results.push({
        theirBook,
        myOfferedBook: best.book,
        score: best.score,
        distanceKm,
        reasons: best.reasons,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
