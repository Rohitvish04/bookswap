'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, Pencil, Trash2, EyeOff, CheckCircle2, BookMarked } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { BookCover } from '@/components/site/book-cover';
import { CONDITION_LABEL, STATUS_LABEL, formatDate } from '@/lib/utils';

type Book = {
  id: string; slug: string; title: string; author: string; coverUrl: string | null;
  condition: string; status: string; createdAt: string;
  offeredIn: unknown[]; requestedIn: unknown[];
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'muted' | 'outline'> = {
  AVAILABLE: 'success',
  RESERVED: 'warning',
  EXCHANGE_PENDING: 'warning',
  EXCHANGED: 'muted',
  INACTIVE: 'outline',
};

export function BooksClient() {
  const [books, setBooks] = useState<Book[] | null>(null);

  async function load() {
    const res = await apiFetch<Book[]>('/api/books/mine');
    if (res.ok) setBooks(res.data);
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(book: Book) {
    const next = book.status === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE';
    const res = await apiFetch(`/api/books/${book.id}/status`, { method: 'PATCH', body: { status: next } });
    if (res.ok) { toast.success(`Marked ${STATUS_LABEL[next]}.`); load(); }
    else toast.error(res.error);
  }

  async function deleteBook(book: Book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    const res = await apiFetch(`/api/books/${book.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Book deleted.'); load(); }
    else toast.error(res.error);
  }

  if (books === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={BookMarked}
        title="No books listed yet"
        description="Add your first book to start discovering exchange matches near you."
        actionHref="/dashboard/books/new"
        actionLabel="+ Add Your First Book"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <Card key={book.id} className="overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <BookCover src={book.coverUrl} title={book.title} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 font-semibold">{book.title}</h3>
              <p className="line-clamp-1 text-sm text-muted-foreground">{book.author}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={STATUS_VARIANT[book.status] ?? 'outline'}>{STATUS_LABEL[book.status]}</Badge>
                <Badge variant="outline">{CONDITION_LABEL[book.condition]}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Listed {formatDate(book.createdAt)}</p>
            </div>
          </div>
          <CardContent className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button size="sm" variant="outline" asChild><Link href={`/books/${book.slug}`}><Eye className="h-3.5 w-3.5" /> View</Link></Button>
            {['AVAILABLE', 'INACTIVE'].includes(book.status) && (
              <>
                <Button size="sm" variant="outline" asChild><Link href={`/dashboard/books/${book.id}/edit`}><Pencil className="h-3.5 w-3.5" /> Edit</Link></Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(book)}>
                  {book.status === 'AVAILABLE' ? <><EyeOff className="h-3.5 w-3.5" /> Mark Unavailable</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark Available</>}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBook(book)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
