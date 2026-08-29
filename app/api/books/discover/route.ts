import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { bookQuerySchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { publicBookInclude } from '@/lib/book-service';
import { buildBookWhere } from '@/lib/book-query';
import { haversineKm } from '@/lib/location';

/**
 * Discover page feed: excludes the current user's own books, computes
 * distance from their default address, and supports nearest/match sorting
 * that a plain SQL ORDER BY can't express (distance is derived, not stored).
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const q = parseQuery(req, bookQuerySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 12;

    const [me, blocks] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, include: { addresses: { where: { isDefault: true }, take: 1 } } }),
      prisma.block.findMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } }),
    ]);
    const blockedIds = new Set(blocks.map((b) => (b.blockerId === user.id ? b.blockedId : b.blockerId)));
    const myAddress = me?.addresses[0];

    const where = buildBookWhere(q, { ownerId: { not: user.id, notIn: [...blockedIds] } });

    const candidates = await prisma.book.findMany({
      where,
      include: publicBookInclude,
      orderBy: { createdAt: 'desc' },
      take: 500, // ponytail: scan cap; add DB-side geo index (PostGIS) if catalogue grows past a few thousand
    });

    const maxDistance = q.distance ?? 0;
    let withDistance = candidates.map((b) => {
      const addr = b.owner.addresses[0];
      const distanceKm =
        myAddress?.latitude != null && myAddress?.longitude != null && addr?.latitude != null && addr?.longitude != null
          ? haversineKm(myAddress.latitude, myAddress.longitude, addr.latitude, addr.longitude)
          : null;
      return { ...b, distanceKm };
    });

    if (maxDistance > 0) {
      withDistance = withDistance.filter((b) => b.distanceKm === null || b.distanceKm <= maxDistance);
    }

    if (q.sort === 'nearest') {
      withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (q.sort === 'popular') {
      withDistance.sort((a, b) => b.viewCount - a.viewCount);
    } // 'recent' is already the default order; 'match' handled by /api/matches

    const total = withDistance.length;
    const pageItems = withDistance.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

    return ok({ books: pageItems, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (err) {
    return handleError(err);
  }
}
