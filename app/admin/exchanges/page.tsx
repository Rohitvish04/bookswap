import type { Metadata } from 'next';
import { ExchangesAdminClient } from './exchanges-admin-client';

export const metadata: Metadata = { title: 'Manage Exchanges' };

export default function AdminExchangesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Exchanges</h1>
      <p className="mt-1 text-muted-foreground">Monitor exchanges and resolve disputes.</p>
      <div className="mt-6">
        <ExchangesAdminClient />
      </div>
    </div>
  );
}
