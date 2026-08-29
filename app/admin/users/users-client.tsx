'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Search, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

type User = {
  id: string; fullName: string; email: string; phone: string | null; role: string; status: string;
  createdAt: string; emailVerifiedAt: string | null;
  _count: { books: number; sentRequests: number; receivedRequests: number };
};

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'muted'> = { ACTIVE: 'success', SUSPENDED: 'destructive', DELETED: 'muted' };

export function UsersClient() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const res = await apiFetch<{ users: User[] }>(`/api/admin/users?${params.toString()}`);
    if (res.ok) setUsers(res.data.users);
  }

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q, status]);

  async function setUserStatus(id: string, newStatus: string) {
    const res = await apiFetch(`/api/admin/users/${id}/status`, { method: 'PATCH', body: { status: newStatus } });
    if (res.ok) { toast.success('Status updated.'); load(); }
    else toast.error(res.error);
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This anonymizes their account.')) return;
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User deleted.'); load(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-input px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="w-full bg-transparent py-2 text-sm outline-none" />
        </div>
        <Select value={status ?? 'ALL'} onValueChange={(v) => setStatus(v === 'ALL' ? undefined : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DELETED">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th>
              <th className="p-3">Books</th><th className="p-3">Joined</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users === null ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-3"><Skeleton className="h-6 w-full" /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3"><Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">{u.fullName}</Link> {u.role === 'ADMIN' && <Badge variant="outline" className="ml-1 text-[10px]">Admin</Badge>}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3"><Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge></td>
                <td className="p-3">{u._count.books}</td>
                <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {u.status !== 'SUSPENDED' && u.role !== 'ADMIN' && (
                      <Button size="sm" variant="outline" onClick={() => setUserStatus(u.id, 'SUSPENDED')}><Ban className="h-3.5 w-3.5" /></Button>
                    )}
                    {u.status === 'SUSPENDED' && (
                      <Button size="sm" variant="outline" onClick={() => setUserStatus(u.id, 'ACTIVE')}><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    )}
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
