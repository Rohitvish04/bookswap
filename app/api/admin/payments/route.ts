import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = parseQuery(req, querySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 20;
    const where: Prisma.PaymentWhereInput = q.status ? { status: q.status as Prisma.EnumPaymentStatusFilter['equals'] } : {};

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } }, exchange: { select: { code: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({ payments, total, page: page, perPage: perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (err) {
    return handleError(err);
  }
}
