import type { Metadata } from 'next';
import { FeesAdminClient } from './fees-admin-client';

export const metadata: Metadata = { title: 'Fee Management' };

export default function AdminFeesPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Fee Management</h1>
      <p className="mt-1 text-muted-foreground">Configure the exchange service fee. Changes apply to future exchanges only.</p>
      <div className="mt-6">
        <FeesAdminClient />
      </div>
    </div>
  );
}
