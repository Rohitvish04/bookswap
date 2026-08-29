import type { Metadata } from 'next';
import { ReportsAdminClient } from './reports-admin-client';

export const metadata: Metadata = { title: 'Reports' };

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="mt-1 text-muted-foreground">User-submitted reports and disputes awaiting review.</p>
      <div className="mt-6">
        <ReportsAdminClient />
      </div>
    </div>
  );
}
