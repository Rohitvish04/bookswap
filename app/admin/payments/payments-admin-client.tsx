'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR, formatDateTime } from '@/lib/utils';

type Payment = {
  id: string; razorpayOrderId: string; razorpayPaymentId: string | null; amount: number; currency: string;
  status: string; createdAt: string; user: { fullName: string; email: string }; exchange: { code: string };
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  CREATED: 'muted', PENDING: 'warning', PAID: 'success', FAILED: 'destructive', REFUNDED: 'muted',
};

export function PaymentsAdminClient() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    apiFetch<{ payments: Payment[] }>(`/api/admin/payments?${params.toString()}`).then((res) => { if (res.ok) setPayments(res.data.payments); });
  }, [status]);

  return (
    <div className="space-y-4">
      <Select value={status ?? 'ALL'} onValueChange={(v) => setStatus(v === 'ALL' ? undefined : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="CREATED">Created</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Order ID</th><th className="p-3">User</th><th className="p-3">Exchange</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
          </thead>
          <tbody>
            {payments === null ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>)
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{p.razorpayOrderId}</td>
                <td className="p-3">{p.user.fullName}</td>
                <td className="p-3 text-muted-foreground">{p.exchange.code}</td>
                <td className="p-3">{formatINR(p.amount)}</td>
                <td className="p-3"><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></td>
                <td className="p-3 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
