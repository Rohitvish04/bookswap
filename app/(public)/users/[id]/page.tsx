export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Star, BookMarked, Repeat, Calendar } from 'lucide-react';
import { prisma } from '@/lib/db';
import { publicLocation } from '@/lib/location';
import { initials, formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { BookCover } from '@/components/site/book-cover';
import { StarRating } from '@/components/site/star-rating';

export const metadata: Metadata = { title: 'Reader Profile' };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id, status: 'ACTIVE' },
    include: {
      profile: true,
      addresses: { where: { isDefault: true }, take: 1 },
      books: { where: { status: 'AVAILABLE', moderation: 'APPROVED' }, take: 8, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) notFound();

  const [completedExchanges, reviews] = await Promise.all([
    prisma.exchange.count({ where: { status: 'COMPLETED', OR: [{ requesterId: id }, { responderId: id }] } }),
    prisma.review.findMany({ where: { subjectId: id }, include: { author: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 text-center sm:flex-row sm:text-left">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profile?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xl">{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            {user.profile?.bio && <p className="mt-1 text-sm text-muted-foreground">{user.profile.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {publicLocation(user.addresses[0]?.city, user.addresses[0]?.state)}</span>
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-secondary text-secondary" /> {(user.profile?.ratingAvg ?? 0).toFixed(1)} ({user.profile?.ratingCount ?? 0})</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card><CardContent className="flex items-center gap-3 pt-6"><BookMarked className="h-5 w-5 text-primary" /><div><div className="text-xl font-bold">{user.books.length}</div><div className="text-xs text-muted-foreground">Books Listed</div></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 pt-6"><Repeat className="h-5 w-5 text-primary" /><div><div className="text-xl font-bold">{completedExchanges}</div><div className="text-xs text-muted-foreground">Successful Exchanges</div></div></CardContent></Card>
      </div>

      {user.books.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold">Available Books</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {user.books.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`}>
                <div className="aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                  <BookCover src={b.coverUrl} title={b.title} />
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium">{b.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 font-semibold">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.author.fullName}</span>
                    <StarRating value={r.rating} readOnly size={14} />
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
