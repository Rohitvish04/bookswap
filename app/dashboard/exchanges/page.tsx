import type { Metadata } from 'next';
import { History } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { exchangeDetailInclude } from '@/lib/exchange-include';
import { sweepExpiredExchangesThrottled } from '@/lib/exchange-service';
import { ExchangeCard } from '@/components/dashboard/exchange-card';
import { EmptyState } from '@/components/site/empty-state';

export const metadata: Metadata = { title: 'My Exchanges' };

export default async function MyExchangesPage() {
  const user = await requireUser();
  await sweepExpiredExchangesThrottled();
  const exchanges = await prisma.exchange.findMany({
    where: { OR: [{ requesterId: user.id }, { responderId: user.id }] },
    include: exchangeDetailInclude,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">My Exchanges</h1>
      <p className="mt-1 text-muted-foreground">Track every exchange you've sent or received, from request to completion.</p>

      <div className="mt-6 space-y-3">
        {exchanges.length === 0 ? (
          <EmptyState icon={History} title="No exchanges yet" description="Browse books and send your first exchange request." actionHref="/books" actionLabel="Browse Books" />
        ) : (
          exchanges.map((e) => <ExchangeCard key={e.id} exchange={e} currentUserId={user.id} />)
        )}
      </div>
    </div>
  );
}
