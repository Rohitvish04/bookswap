'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { initials, timeAgo } from '@/lib/utils';

type Conversation = {
  id: string;
  updatedAt: string;
  exchange: { code: string; offeredBook: { title: string }; requestedBook: { title: string } };
  otherUser?: { fullName: string };
  messages: { body: string; createdAt: string }[];
  unread: number;
};

export function MessagesClient() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    apiFetch<Conversation[]>('/api/messages').then((res) => { if (res.ok) setConversations(res.data); });
  }, []);

  if (conversations === null) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  if (conversations.length === 0) {
    return <EmptyState icon={MessageSquare} title="No conversations yet" description="Messaging opens automatically once you send or receive an exchange request." />;
  }

  return (
    <div className="space-y-3">
      {conversations.map((c) => (
        <Link key={c.id} href={`/dashboard/messages/${c.id}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar><AvatarFallback>{initials(c.otherUser?.fullName ?? '?')}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{c.otherUser?.fullName ?? 'Unknown user'}</p>
                  <span className="text-xs text-muted-foreground">{c.messages[0] ? timeAgo(c.messages[0].createdAt) : ''}</span>
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">{c.messages[0]?.body ?? 'No messages yet'}</p>
                <p className="text-xs text-muted-foreground">Re: {c.exchange.offeredBook.title} ⇄ {c.exchange.requestedBook.title}</p>
              </div>
              {c.unread > 0 && <Badge>{c.unread}</Badge>}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
