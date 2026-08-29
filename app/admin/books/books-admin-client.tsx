'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, Check, X, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABEL } from '@/lib/utils';

type Book = {
  id: string; title: string; author: string; status: string; moderation: string;
  owner: { fullName: string; email: string }; category: { name: string } | null;
};

const MOD_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'destructive' };

export function BooksAdminClient() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [q, setQ] = useState('');
  const [moderation, setModeration] = useState<string | undefined>(undefined);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (moderation) params.set('moderation', moderation);
    const res = await apiFetch<{ books: Book[] }>(`/api/admin/books?${params.toString()}`);
    if (res.ok) setBooks(res.data.books);
  }

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q, moderation]);

  async function moderate(id: string, decision: 'APPROVED' | 'REJECTED') {
    const res = await apiFetch(`/api/admin/books/${id}/moderation`, { method: 'PATCH', body: { moderation: decision } });
    if (res.ok) { toast.success(`Book ${decision.toLowerCase()}.`); load(); }
    else toast.error(res.error);
  }

  async function remove(id: string) {
    if (!confirm('Remove this listing?')) return;
    const res = await apiFetch(`/api/admin/books/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Book removed.'); load(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-input px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or author" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <Select value={moderation ?? 'ALL'} onValueChange={(v) => setModeration(v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All moderation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All moderation</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Title</th><th className="p-3">Owner</th><th className="p-3">Status</th><th className="p-3">Moderation</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {books === null ? (
              Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>)
            ) : books.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No books found.</td></tr>
            ) : books.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="p-3 font-medium">{b.title} <span className="font-normal text-muted-foreground">by {b.author}</span></td>
                <td className="p-3 text-muted-foreground">{b.owner.fullName}</td>
                <td className="p-3"><Badge variant="outline">{STATUS_LABEL[b.status]}</Badge></td>
                <td className="p-3"><Badge variant={MOD_VARIANT[b.moderation]}>{b.moderation}</Badge></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {b.moderation !== 'APPROVED' && <Button size="sm" variant="outline" onClick={() => moderate(b.id, 'APPROVED')}><Check className="h-3.5 w-3.5" /></Button>}
                    {b.moderation !== 'REJECTED' && <Button size="sm" variant="outline" onClick={() => moderate(b.id, 'REJECTED')}><X className="h-3.5 w-3.5" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
