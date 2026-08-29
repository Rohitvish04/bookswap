import type { Metadata } from 'next';
import { Users, BookMarked, Repeat, CheckCircle2, Clock, IndianRupee, AlertTriangle, BookCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '@/lib/utils';
import { AdminCharts } from './admin-charts';

export const metadata: Metadata = { title: 'Admin Dashboard' };

async function getStats() {
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
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
      FROM "User" WHERE "createdAt" > now() - interval '30 days' GROUP BY 1 ORDER BY 1 ASC`,
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
      FROM "Exchange" WHERE "createdAt" > now() - interval '30 days' GROUP BY 1 ORDER BY 1 ASC`,
  ]);

  return {
    totalUsers, activeUsers, totalBooks, availableBooks, totalExchanges, completedExchanges, pendingExchanges,
    revenue: paidPayments._sum.amount ?? 0, failedPayments,
    registrationsByDay: registrationsByDay.map((r) => ({ day: r.day.toISOString(), count: Number(r.count) })),
    exchangesByDay: exchangesByDay.map((r) => ({ day: r.day.toISOString(), count: Number(r.count) })),
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const s = await getStats();

  const cards = [
    { label: 'Total Users', value: s.totalUsers, icon: Users },
    { label: 'Active Users', value: s.activeUsers, icon: Users },
    { label: 'Total Books', value: s.totalBooks, icon: BookMarked },
    { label: 'Available Books', value: s.availableBooks, icon: BookCheck },
    { label: 'Total Exchanges', value: s.totalExchanges, icon: Repeat },
    { label: 'Completed Exchanges', value: s.completedExchanges, icon: CheckCircle2 },
    { label: 'Pending Exchanges', value: s.pendingExchanges, icon: Clock },
    { label: 'Revenue', value: formatINR(s.revenue), icon: IndianRupee },
    { label: 'Failed Payments', value: s.failedPayments, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview and metrics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <c.icon className="h-5 w-5 text-primary" />
              <div className="text-xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminCharts registrationsByDay={s.registrationsByDay} exchangesByDay={s.exchangesByDay} />
    </div>
  );
}
