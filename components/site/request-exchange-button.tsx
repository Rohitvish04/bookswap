'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Repeat } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MyBook = { id: string; title: string; author: string; status: string };

export function RequestExchangeButton({
  requestedBookId,
  bookTitle,
  isAuthed,
  available,
  defaultOfferedBookId,
  triggerLabel,
  size = 'lg',
}: {
  requestedBookId: string;
  bookTitle: string;
  isAuthed: boolean;
  available: boolean;
  defaultOfferedBookId?: string;
  triggerLabel?: string;
  size?: 'sm' | 'lg';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [myBooks, setMyBooks] = useState<MyBook[]>([]);
  const [offeredBookId, setOfferedBookId] = useState(defaultOfferedBookId ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<MyBook[]>('/api/books/mine').then((res) => {
      if (res.ok) setMyBooks(res.data.filter((b) => b.status === 'AVAILABLE'));
    });
  }, [open]);

  if (!isAuthed) {
    return <Button asChild size={size}><Link href="/login">Log in to Request Exchange</Link></Button>;
  }

  if (!available) {
    return <Button size={size} disabled>Not Available</Button>;
  }

  async function submit() {
    if (!offeredBookId) { toast.error('Choose one of your books to offer.'); return; }
    setSubmitting(true);
    const res = await apiFetch('/api/exchanges', { body: { requestedBookId, offeredBookId, message } });
    setSubmitting(false);
    if (res.ok) {
      toast.success('Exchange request sent!');
      setOpen(false);
      router.push('/dashboard/exchanges');
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size}><Repeat className="h-4 w-4" /> {triggerLabel ?? 'Request Exchange'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Exchange for "{bookTitle}"</DialogTitle>
          <DialogDescription>Offer one of your own books in return. The owner must accept before anything is final.</DialogDescription>
        </DialogHeader>

        {myBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don't have any available books to offer yet.{' '}
            <Link href="/dashboard/books/new" className="text-primary hover:underline">List a book</Link> first.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Your book to offer</label>
              <Select value={offeredBookId} onValueChange={setOfferedBookId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a book" /></SelectTrigger>
                <SelectContent>
                  {myBooks.map((b) => <SelectItem key={b.id} value={b.id}>{b.title} — {b.author}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea className="mt-1.5" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say hello, mention meetup preferences, etc." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || myBooks.length === 0}>
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
