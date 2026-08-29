import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = parseQuery(req, querySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 20;

    const where: Prisma.UserWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.q) {
      where.OR = [
        { fullName: { contains: q.q, mode: 'insensitive' } },
        { email: { contains: q.q, mode: 'insensitive' } },
        { phone: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, fullName: true, email: true, phone: true, role: true, status: true,
          createdAt: true, emailVerifiedAt: true,
          _count: { select: { books: true, sentRequests: true, receivedRequests: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ users, total, page: page, perPage: perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (err) {
    return handleError(err);
  }
}
