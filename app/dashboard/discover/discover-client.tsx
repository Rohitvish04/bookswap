'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MapPin, Sparkles, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/site/empty-state';
import { BookCover } from '@/components/site/book-cover';
import { RequestExchangeButton } from '@/components/site/request-exchange-button';
import { CONDITION_LABEL } from '@/lib/utils';
import { describeDistance } from '@/lib/location';

type Owner = { id: string; fullName: string; addresses: { city: string; state: string }[] };
type Book = { id: string; slug: string; title: string; author: string; coverUrl: string | null; condition: string; owner: Owner; distanceKm?: number | null };
type Match = { theirBook: Book; myOfferedBook: { id: string; title: string }; score: number; distanceKm: number | null; reasons: string[] };

const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '0', label: 'Anywhere' },
];

export function DiscoverClient() {
  const [tab, setTab] = useState('matches');
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [radius, setRadius] = useState('25');
  const [sort, setSort] = useState('recent');
  const [q, setQ] = useState('');

  useEffect(() => {
    apiFetch<Match[]>('/api/matches').then((res) => { if (res.ok) setMatches(res.data); });
  }, []);

  useEffect(() => {
    setBooks(null);
    const params = new URLSearchParams({ distance: radius, sort, availability: 'available' });
    if (q) params.set('q', q);
    apiFetch<{ books: Book[] }>(`/api/books/discover?${params.toString()}`).then((res) => {
      if (res.ok) setBooks(res.data.books);
    });
  }, [radius, sort, q]);

  async function updateRadius(v: string) {
    setRadius(v);
    await apiFetch('/api/users/me/radius', { body: { searchRadiusKm: Number(v) } });
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="matches"><Sparkles className="mr-1.5 h-4 w-4" /> Best Matches</TabsTrigger>
        <TabsTrigger value="all"><Search className="mr-1.5 h-4 w-4" /> All Books</TabsTrigger>
      </TabsList>

      <TabsContent value="matches">
        {matches === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No matches yet"
            description="List a book and tell us what you want in return — we'll surface compatible exchanges here."
            actionHref="/dashboard/books/new"
            actionLabel="+ Add a Book"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <Card key={m.theirBook.id} className="overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><BookCover src={m.theirBook.coverUrl} title={m.theirBook.title} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-semibold">{m.theirBook.title}</h3>
                      <Badge variant="success" className="shrink-0">{m.score}% Match</Badge>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{m.theirBook.author}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{describeDistance(m.distanceKm)}</p>
                    <p className="mt-1 text-xs">Offering: <span className="font-medium">{m.myOfferedBook.title}</span></p>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <Link href={`/books/${m.theirBook.slug}`} className="text-xs text-primary hover:underline">View book</Link>
                  <RequestExchangeButton
                    requestedBookId={m.theirBook.id}
                    bookTitle={m.theirBook.title}
                    isAuthed
                    available
                    defaultOfferedBookId={m.myOfferedBook.id}
                    triggerLabel="Request"
                    size="sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-input px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author, ISBN" className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <Select value={radius} onValueChange={updateRadius}>
            <SelectTrigger className="w-36"><MapPin className="mr-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>{RADIUS_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="nearest">Nearest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {books === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}</div>
        ) : books.length === 0 ? (
          <EmptyState icon={Search} title="No books found" description="Try a larger radius or a different search term." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {books.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`}>
                <Card className="h-full overflow-hidden">
                  <div className="aspect-[3/4] w-full overflow-hidden bg-muted"><BookCover src={b.coverUrl} title={b.title} /></div>
                  <CardContent className="p-3">
                    <h3 className="line-clamp-1 text-sm font-semibold">{b.title}</h3>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{b.author}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <Badge variant="outline" className="text-[10px]">{CONDITION_LABEL[b.condition]}</Badge>
                      <span className="text-[10px] text-muted-foreground">{describeDistance(b.distanceKm)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
