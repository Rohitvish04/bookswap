import type { Metadata } from 'next';
import { Repeat } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { exchangeDetailInclude } from '@/lib/exchange-include';
import { sweepExpiredExchangesThrottled } from '@/lib/exchange-service';
import { ExchangeCard } from '@/components/dashboard/exchange-card';
import { EmptyState } from '@/components/site/empty-state';

export const metadata: Metadata = { title: 'Exchange Requests' };

export default async function ExchangeRequestsPage() {
  const user = await requireUser();
  await sweepExpiredExchangesThrottled();

  const [received, sent] = await Promise.all([
    prisma.exchange.findMany({
      where: { responderId: user.id, status: 'PENDING' },
      include: exchangeDetailInclude,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.exchange.findMany({
      where: { requesterId: user.id, status: 'PENDING' },
      include: exchangeDetailInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Exchange Requests</h1>
        <p className="mt-1 text-muted-foreground">Requests from other readers awaiting your response.</p>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Awaiting Your Response ({received.length})</h2>
        {received.length === 0 ? (
          <EmptyState icon={Repeat} title="No exchange requests yet" description="When someone requests one of your books, it will show up here." />
        ) : (
          <div className="space-y-3">{received.map((e) => <ExchangeCard key={e.id} exchange={e} currentUserId={user.id} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Your Sent Requests ({sent.length})</h2>
        {sent.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't sent any pending requests.</p>
        ) : (
          <div className="space-y-3">{sent.map((e) => <ExchangeCard key={e.id} exchange={e} currentUserId={user.id} />)}</div>
        )}
      </section>
    </div>
  );
}
