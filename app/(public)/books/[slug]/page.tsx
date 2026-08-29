export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, BookOpen, Calendar, Globe, Layers } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { publicBookInclude } from '@/lib/book-service';
import { haversineKm, describeDistance, publicLocation } from '@/lib/location';
import { CONDITION_LABEL, initials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookCover } from '@/components/site/book-cover';
import { RequestExchangeButton } from '@/components/site/request-exchange-button';
import { WishlistButton } from '@/components/site/wishlist-button';

async function getBook(slug: string) {
  const book = await prisma.book.findUnique({ where: { slug }, include: publicBookInclude });
  if (book) await prisma.book.update({ where: { id: book.id }, data: { viewCount: { increment: 1 } } });
  return book;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await prisma.book.findUnique({ where: { slug }, select: { title: true, author: true, description: true } });
  if (!book) return { title: 'Book not found' };
  return {
    title: `${book.title} by ${book.author}`,
    description: book.description?.slice(0, 155) || `Exchange "${book.title}" by ${book.author} on BookSwap.`,
    openGraph: { title: `${book.title} by ${book.author}` },
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [book, user] = await Promise.all([getBook(slug), getCurrentUser()]);
  if (!book) notFound();

  const isOwner = user?.id === book.ownerId;
  let distanceKm: number | null = null;
  if (user && !isOwner) {
    const myAddress = await prisma.address.findFirst({ where: { userId: user.id, isDefault: true } });
    const theirAddress = book.owner.addresses[0];
    if (myAddress?.latitude != null && myAddress.longitude != null && theirAddress?.latitude != null && theirAddress.longitude != null) {
      distanceKm = haversineKm(myAddress.latitude, myAddress.longitude, theirAddress.latitude, theirAddress.longitude);
    }
  }

  return (
    <div className="container py-10">
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
            <BookCover src={book.coverUrl} title={book.title} />
          </div>
          <div className="mt-4 flex gap-2">
            {!isOwner && <WishlistButton title={book.title} author={book.author} bookId={book.id} isAuthed={!!user} />}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={book.status === 'AVAILABLE' ? 'success' : 'muted'}>
              {book.status === 'AVAILABLE' ? 'Available for Exchange' : book.status.replace('_', ' ')}
            </Badge>
            {book.category && <Badge variant="outline">{book.category.name}</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold">{book.title}</h1>
          <p className="mt-1 text-lg text-muted-foreground">by {book.author}</p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Layers, label: 'Condition', value: CONDITION_LABEL[book.condition] },
              { icon: Globe, label: 'Language', value: book.language },
              { icon: Calendar, label: 'Published', value: book.publishYear ?? '—' },
              { icon: BookOpen, label: 'Edition', value: book.edition || '—' },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-border p-3 text-center">
                <f.icon className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium">{f.value}</p>
              </div>
            ))}
          </div>

          {book.description && (
            <div className="mt-6">
              <h2 className="font-semibold">Description</h2>
              <p className="mt-1 text-sm text-muted-foreground">{book.description}</p>
            </div>
          )}

          {book.wantedBy.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold">Owner wants in exchange</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {book.wantedBy.map((w) => <Badge key={w.id} variant="outline">{w.title}</Badge>)}
              </div>
            </div>
          )}

          <Card className="mt-8">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={book.owner.profile?.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials(book.owner.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/users/${book.owner.id}`} className="font-medium hover:underline">{book.owner.fullName.split(' ')[0]}</Link>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-secondary text-secondary" />
                    {(book.owner.profile?.ratingAvg ?? 0).toFixed(1)} ({book.owner.profile?.ratingCount ?? 0} reviews)
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {publicLocation(book.owner.addresses[0]?.city, book.owner.addresses[0]?.state)}
                    {distanceKm !== null && ` · ${describeDistance(distanceKm)}`}
                  </div>
                </div>
              </div>

              {!isOwner && <RequestExchangeButton requestedBookId={book.id} bookTitle={book.title} isAuthed={!!user} available={book.status === 'AVAILABLE'} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
