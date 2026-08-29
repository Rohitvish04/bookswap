import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.string().optional(),
  moderation: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = parseQuery(req, querySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 20;

    const where: Prisma.BookWhereInput = {};
    if (q.q) where.OR = [{ title: { contains: q.q, mode: 'insensitive' } }, { author: { contains: q.q, mode: 'insensitive' } }];
    if (q.status) where.status = q.status as Prisma.EnumBookStatusFilter['equals'];
    if (q.moderation) where.moderation = q.moderation as Prisma.EnumModerationStatusFilter['equals'];

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: { owner: { select: { fullName: true, email: true } }, category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ books, total, page: page, perPage: perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (err) {
    return handleError(err);
  }
}
