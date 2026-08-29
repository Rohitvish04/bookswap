import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import type { bookQuerySchema } from '@/lib/validation';

type BookQuery = z.infer<typeof bookQuerySchema>;

// Filler words users naturally type ("rich dad AND poor dad") that shouldn't have to appear in the title.
const STOPWORDS = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'in', 'by', 'to', 'for']);

/** Shared filter-building logic between the public browse page and the /api/books routes. */
export function buildBookWhere(q: BookQuery, extra?: Prisma.BookWhereInput): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { moderation: 'APPROVED', ...extra };
  if (!q.availability || q.availability === 'available') {
    where.status = 'AVAILABLE';
    where.available = true;
  }
  if (q.q) {
    // Tokenized search: every meaningful word must appear somewhere in
    // title/author/ISBN, so "rich dad and poor dad" still finds
    // "Rich Dad Poor Dad" despite word-order and filler differences.
    const tokens = q.q
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));

    if (tokens.length > 0) {
      where.AND = tokens.map((token) => ({
        OR: [
          { title: { contains: token, mode: 'insensitive' as const } },
          { author: { contains: token, mode: 'insensitive' as const } },
          { isbn: { contains: token, mode: 'insensitive' as const } },
        ],
      }));
    }
  }
  if (q.category) where.categoryId = q.category;
  if (q.language) where.language = { equals: q.language, mode: 'insensitive' };
  if (q.condition) where.condition = q.condition as Prisma.EnumBookConditionFilter['equals'];
  if (q.city) where.owner = { addresses: { some: { isDefault: true, city: { equals: q.city, mode: 'insensitive' } } } };
  return where;
}
