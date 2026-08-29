'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shuffle } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MyBook = { id: string; title: string; author: string; status: string };

export function CounterOfferDialog({ exchangeId }: { exchangeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [myBooks, setMyBooks] = useState<MyBook[]>([]);
  const [bookId, setBookId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiFetch<MyBook[]>('/api/books/mine').then((res) => {
      if (res.ok) setMyBooks(res.data.filter((b) => b.status === 'AVAILABLE'));
    });
  }, [open]);

  async function submit() {
    if (!bookId) { toast.error('Choose a book to propose.'); return; }
    setSubmitting(true);
    const res = await apiFetch(`/api/exchanges/${exchangeId}/counter-offer`, { body: { bookId, note } });
    setSubmitting(false);
    if (res.ok) {
      toast.success('Counter offer sent.');
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Shuffle className="h-4 w-4" /> Counter Offer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose a Counter Offer</DialogTitle>
          <DialogDescription>Suggest a different book from your shelf. The other person must accept it.</DialogDescription>
        </DialogHeader>
        {myBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">You have no other available books to propose.</p>
        ) : (
          <div className="space-y-4">
            <Select value={bookId} onValueChange={setBookId}>
              <SelectTrigger><SelectValue placeholder="Select a book" /></SelectTrigger>
              <SelectContent>{myBooks.map((b) => <SelectItem key={b.id} value={b.id}>{b.title} — {b.author}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || myBooks.length === 0}>{submitting ? 'Sending...' : 'Send Counter Offer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
