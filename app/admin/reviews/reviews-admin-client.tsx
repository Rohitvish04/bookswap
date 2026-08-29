'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Star } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { formatDate } from '@/lib/utils';

type Review = {
  id: string; rating: number; comment: string | null; createdAt: string;
  author: { fullName: string; email: string }; subject: { fullName: string; email: string }; exchange: { code: string };
};

export function ReviewsAdminClient() {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  async function load() {
    const res = await apiFetch<Review[]>('/api/admin/reviews');
    if (res.ok) setReviews(res.data);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Remove this review?')) return;
    const res = await apiFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Review removed.'); load(); }
    else toast.error(res.error);
  }

  if (reviews === null) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (reviews.length === 0) return <EmptyState icon={Star} title="No reviews yet" description="Reviews appear once exchanges are completed." />;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex text-secondary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-secondary' : ''}`} />)}</div>
                <span className="text-xs text-muted-foreground">{r.exchange.code}</span>
              </div>
              <p className="mt-1 text-sm">{r.author.fullName} → {r.subject.fullName}</p>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground">"{r.comment}"</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
