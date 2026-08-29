'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { timeAgo } from '@/lib/utils';

type WishlistItem = {
  id: string; title: string; author: string | null; createdAt: string;
  book: { slug: string; status: string } | null;
};

export function WishlistClient() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    const res = await apiFetch<WishlistItem[]>('/api/wishlist');
    if (res.ok) setItems(res.data);
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!title.trim()) { toast.error('Enter a book title.'); return; }
    setAdding(true);
    const res = await apiFetch('/api/wishlist', { body: { title, author } });
    setAdding(false);
    if (res.ok) { setTitle(''); setAuthor(''); toast.success('Added to wishlist.'); load(); }
    else toast.error(res.error);
  }

  async function remove(id: string) {
    const res = await apiFetch(`/api/wishlist/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Removed.'); load(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row">
          <Input placeholder="Book title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Button onClick={add} disabled={adding}><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      {items === null ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Add titles you're looking for and we'll notify you when they're listed." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.author ? `by ${item.author} · ` : ''}Added {timeAgo(item.createdAt)}</p>
                  {item.book && item.book.status === 'AVAILABLE' && (
                    <Link href={`/books/${item.book.slug}`} className="text-xs text-primary hover:underline">Now available — view listing</Link>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
