import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABEL, CONDITION_LABEL, formatDate, formatINR } from '@/lib/utils';

export const metadata: Metadata = { title: 'User Details' };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      addresses: true,
      books: { orderBy: { createdAt: 'desc' } },
      sentRequests: { orderBy: { createdAt: 'desc' }, take: 10, include: { offeredBook: true, requestedBook: true } },
      receivedRequests: { orderBy: { createdAt: 'desc' }, take: 10, include: { offeredBook: true, requestedBook: true } },
    },
  });
  if (!user) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-muted-foreground">{user.email} · {user.phone ?? 'No phone'}</p>
        </div>
        <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'destructive' : 'muted'}>{user.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="text-xl font-bold">{user.books.length}</div><div className="text-xs text-muted-foreground">Books</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xl font-bold">{user.sentRequests.length}</div><div className="text-xs text-muted-foreground">Sent Requests</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xl font-bold">{user.receivedRequests.length}</div><div className="text-xs text-muted-foreground">Received Requests</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-xl font-bold">{formatDate(user.createdAt)}</div><div className="text-xs text-muted-foreground">Joined</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Addresses</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {user.addresses.length === 0 && <p className="text-sm text-muted-foreground">No addresses on file.</p>}
          {user.addresses.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
              {a.addressLine}, {a.area}, {a.city}, {a.state} — {a.pincode} {a.isDefault && <Badge variant="outline" className="ml-2 text-[10px]">Default</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Books</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {user.books.length === 0 && <p className="text-sm text-muted-foreground">No books listed.</p>}
          {user.books.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{b.title} <span className="text-muted-foreground">by {b.author}</span></span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px]">{CONDITION_LABEL[b.condition]}</Badge>
                <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[b.status]}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Exchange History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...user.sentRequests, ...user.receivedRequests].length === 0 && <p className="text-sm text-muted-foreground">No exchanges yet.</p>}
          {[...user.sentRequests, ...user.receivedRequests].map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{e.offeredBook.title} ⇄ {e.requestedBook.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatINR(e.feeAmount)}</span>
                <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[e.status]}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
