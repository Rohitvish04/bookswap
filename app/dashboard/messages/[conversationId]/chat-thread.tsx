'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDateTime } from '@/lib/utils';

type Message = { id: string; body: string; senderId: string; createdAt: string; readAt: string | null };

export function ChatThread({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await apiFetch<Message[]>(`/api/messages/${conversationId}`);
    if (res.ok) setMessages(res.data);
    else if (messages === null) toast.error(res.error);
  }

  useEffect(() => {
    apiFetch<{ user: { id: string } | null }>('/api/auth/me').then((res) => { if (res.ok && res.data.user) setUserId(res.data.user.id); });
    load();
    const interval = setInterval(load, 4000); // ponytail: polling; swap for websockets/SSE if real-time chat becomes a priority
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const res = await apiFetch(`/api/messages/${conversationId}`, { body: { body: text } });
    setSending(false);
    if (res.ok) { setText(''); load(); }
    else toast.error(res.error);
  }

  if (messages === null) {
    return <div className="space-y-3"><Skeleton className="h-16 w-2/3" /><Skeleton className="ml-auto h-16 w-2/3" /></div>;
  }

  return (
    <Card className="flex h-[70vh] flex-col">
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>}
        {messages.map((m) => {
          const mine = m.senderId === userId;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div className={cn('max-w-[75%] rounded-2xl px-4 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                {m.body}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(m.createdAt)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." disabled={sending} />
        <Button type="submit" size="icon" disabled={sending}><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
