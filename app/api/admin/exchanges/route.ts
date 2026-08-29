import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  status: z.string().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = parseQuery(req, querySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 20;

    const where: Prisma.ExchangeWhereInput = {};
    if (q.status) where.status = q.status as Prisma.EnumExchangeStatusFilter['equals'];
    if (q.q) where.code = { contains: q.q, mode: 'insensitive' };

    const [total, exchanges] = await Promise.all([
      prisma.exchange.count({ where }),
      prisma.exchange.findMany({
        where,
        include: {
          requester: { select: { fullName: true, email: true } },
          responder: { select: { fullName: true, email: true } },
          offeredBook: { select: { title: true } },
          requestedBook: { select: { title: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ exchanges, total, page: page, perPage: perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (err) {
    return handleError(err);
  }
}
