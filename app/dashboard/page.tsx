import Link from 'next/link';
import type { Metadata } from 'next';
import { BookMarked, CheckCircle2, Repeat, Clock, HandCoins, TrendingUp, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABEL, timeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardData(userId: string) {
  const [totalBooks, availableBooks, exchangeRequests, acceptedExchanges, completedExchanges, pendingPayments, recentEvents] =
    await Promise.all([
      prisma.book.count({ where: { ownerId: userId } }),
      prisma.book.count({ where: { ownerId: userId, status: 'AVAILABLE' } }),
      prisma.exchange.count({ where: { responderId: userId, status: 'PENDING' } }),
      prisma.exchange.count({ where: { OR: [{ requesterId: userId }, { responderId: userId }], status: { in: ['ACCEPTED', 'PAYMENT_PENDING'] } } }),
      prisma.exchange.count({ where: { OR: [{ requesterId: userId }, { responderId: userId }], status: 'COMPLETED' } }),
      prisma.exchange.count({ where: { requesterId: userId, status: { in: ['ACCEPTED', 'PAYMENT_PENDING'] } } }),
      prisma.exchangeEvent.findMany({
        where: { exchange: { OR: [{ requesterId: userId }, { responderId: userId }] } },
        include: { exchange: { select: { id: true, code: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

  return { totalBooks, availableBooks, exchangeRequests, acceptedExchanges, completedExchanges, pendingPayments, recentEvents };
}

export default async function DashboardHomePage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  const cards = [
    { label: 'Total Books', value: data.totalBooks, icon: BookMarked, href: '/dashboard/books' },
    { label: 'Available Books', value: data.availableBooks, icon: CheckCircle2, href: '/dashboard/books' },
    { label: 'Exchange Requests', value: data.exchangeRequests, icon: Repeat, href: '/dashboard/exchanges/requests' },
    { label: 'Accepted Exchanges', value: data.acceptedExchanges, icon: Clock, href: '/dashboard/exchanges' },
    { label: 'Completed Exchanges', value: data.completedExchanges, icon: TrendingUp, href: '/dashboard/exchanges' },
    { label: 'Pending Payments', value: data.pendingPayments, icon: HandCoins, href: '/dashboard/exchanges' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.fullName.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your books and exchanges.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-2 pt-6">
                <c.icon className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet — request your first exchange to get started.</p>
            ) : (
              <ul className="space-y-4">
                {data.recentEvents.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm">{e.detail || e.type.replaceAll('_', ' ')}</p>
                      <Link href={`/dashboard/exchanges/${e.exchange.id}`} className="text-xs text-primary hover:underline">
                        {e.exchange.code}
                      </Link>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { href: '/dashboard/books/new', label: 'List a new book' },
              { href: '/dashboard/discover', label: 'Discover matches' },
              { href: '/dashboard/wishlist', label: 'Manage your wishlist' },
              { href: '/dashboard/address', label: 'Update your location' },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted">
                {a.label} <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
