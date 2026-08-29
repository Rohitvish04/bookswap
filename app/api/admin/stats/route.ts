import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers, activeUsers, totalBooks, availableBooks,
      totalExchanges, completedExchanges, pendingExchanges,
      paidPayments, failedPayments,
      registrationsByDay, exchangesByDay,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.book.count(),
      prisma.book.count({ where: { status: 'AVAILABLE', available: true } }),
      prisma.exchange.count(),
      prisma.exchange.count({ where: { status: 'COMPLETED' } }),
      prisma.exchange.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING'] } } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
        FROM "User" WHERE "createdAt" > now() - interval '30 days'
        GROUP BY 1 ORDER BY 1 ASC`,
      prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
        FROM "Exchange" WHERE "createdAt" > now() - interval '30 days'
        GROUP BY 1 ORDER BY 1 ASC`,
    ]);

    return ok({
      totalUsers,
      activeUsers,
      totalBooks,
      availableBooks,
      totalExchanges,
      completedExchanges,
      pendingExchanges,
      revenue: paidPayments._sum.amount ?? 0,
      paidCount: paidPayments._count,
      failedPayments,
      registrationsByDay: registrationsByDay.map((r) => ({ day: r.day, count: Number(r.count) })),
      exchangesByDay: exchangesByDay.map((r) => ({ day: r.day, count: Number(r.count) })),
    });
  } catch (err) {
    return handleError(err);
  }
}
