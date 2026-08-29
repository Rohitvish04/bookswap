'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { StarRating } from '@/components/site/star-rating';

export function ReviewDialog({ exchangeId, subjectName }: { exchangeId: string; subjectName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const res = await apiFetch(`/api/exchanges/${exchangeId}/review`, { body: { rating, comment } });
    setSubmitting(false);
    if (res.ok) {
      toast.success('Review submitted. Thank you!');
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Star className="h-4 w-4" /> Leave a Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {subjectName}</DialogTitle>
          <DialogDescription>Share how this exchange went. This helps the whole community.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <StarRating value={rating} onChange={setRating} size={28} />
          <Textarea placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
