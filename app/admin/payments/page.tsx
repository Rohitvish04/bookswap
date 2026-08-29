import type { Metadata } from 'next';
import { PaymentsAdminClient } from './payments-admin-client';

export const metadata: Metadata = { title: 'Payments' };

export default function AdminPaymentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-1 text-muted-foreground">All Razorpay transactions processed on BookSwap.</p>
      <div className="mt-6">
        <PaymentsAdminClient />
      </div>
    </div>
  );
}
