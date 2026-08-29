'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { cn, timeAgo } from '@/lib/utils';

type Notification = { id: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);

  async function load() {
    const res = await apiFetch<Notification[]>('/api/notifications');
    if (res.ok) setItems(res.data);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    load();
  }

  async function markAllRead() {
    const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
    if (res.ok) { toast.success('All caught up!'); load(); }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay on top of exchange requests, payments, and messages.</p>
        </div>
        <Button variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4" /> Mark all as read</Button>
      </div>

      {items === null ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something happens with your books or exchanges." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={cn(!n.readAt && 'border-primary/40 bg-primary/5')}>
              <CardContent className="flex items-start justify-between gap-4 pt-4">
                <Link href={n.link ?? '#'} onClick={() => !n.readAt && markRead(n.id)} className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </Link>
                {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
