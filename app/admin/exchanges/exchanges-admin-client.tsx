'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABEL, formatINR, formatDate } from '@/lib/utils';

type Exchange = {
  id: string; code: string; status: string; feeAmount: number; createdAt: string;
  requester: { fullName: string }; responder: { fullName: string };
  offeredBook: { title: string }; requestedBook: { title: string };
  payments: { status: string }[];
};

const STATUSES = ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'DISPUTED', 'EXPIRED'];

export function ExchangesAdminClient() {
  const [exchanges, setExchanges] = useState<Exchange[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const res = await apiFetch<{ exchanges: Exchange[] }>(`/api/admin/exchanges?${params.toString()}`);
    if (res.ok) setExchanges(res.data.exchanges);
  }

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q, status]);

  async function resolve(id: string, newStatus: 'DISPUTED' | 'COMPLETED' | 'CANCELLED') {
    const note = prompt(`Note for ${newStatus} (optional):`) || '';
    const res = await apiFetch(`/api/admin/exchanges/${id}/status`, { method: 'PATCH', body: { status: newStatus, note } });
    if (res.ok) { toast.success('Exchange updated.'); load(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-input px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exchange code" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <Select value={status ?? 'ALL'} onValueChange={(v) => setStatus(v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Code</th><th className="p-3">Users</th><th className="p-3">Books</th><th className="p-3">Fee</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {exchanges === null ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>)
            ) : exchanges.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No exchanges found.</td></tr>
            ) : exchanges.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="p-3 font-medium">{e.code}</td>
                <td className="p-3 text-muted-foreground">{e.requester.fullName} ⇄ {e.responder.fullName}</td>
                <td className="p-3 text-muted-foreground">{e.offeredBook.title} ⇄ {e.requestedBook.title}</td>
                <td className="p-3">{formatINR(e.feeAmount)}</td>
                <td className="p-3"><Badge variant="outline">{STATUS_LABEL[e.status]}</Badge></td>
                <td className="p-3 text-muted-foreground">{formatDate(e.createdAt)}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => resolve(e.id, 'DISPUTED')}>Dispute</Button>
                    <Button size="sm" variant="outline" onClick={() => resolve(e.id, 'CANCELLED')}>Cancel</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
