import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Truck, Users } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { exchangeDetailInclude } from '@/lib/exchange-include';
import { publicLocation } from '@/lib/location';
import { STATUS_LABEL, CONDITION_LABEL, formatINR, formatDateTime, initials } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookCover } from '@/components/site/book-cover';
import { ExchangeActions } from '@/components/dashboard/exchange-actions';

export const metadata: Metadata = { title: 'Exchange Details' };

export default async function ExchangeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const exchange = await prisma.exchange.findUnique({ where: { id }, include: exchangeDetailInclude });
  if (!exchange) notFound();
  if (exchange.requesterId !== user.id && exchange.responderId !== user.id) redirect('/dashboard/exchanges');

  const conversation = await prisma.conversation.findUnique({ where: { exchangeId: id } });

  const isRequester = exchange.requesterId === user.id;
  const other = isRequester ? exchange.responder : exchange.requester;
  const myBook = isRequester ? exchange.offeredBook : exchange.requestedBook;
  const theirBook = isRequester ? exchange.requestedBook : exchange.offeredBook;
  const myCompleted = isRequester ? exchange.requesterCompleted : exchange.responderCompleted;
  const hasReviewed = exchange.reviews.some((r) => r.authorId === user.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Exchange {exchange.code}</h1>
          <p className="text-sm text-muted-foreground">Started {formatDateTime(exchange.createdAt)}</p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 text-sm">{STATUS_LABEL[exchange.status]}</Badge>
      </div>

      <Card>
        <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">You give</p>
            <div className="flex gap-3">
              <div className="h-24 w-16 overflow-hidden rounded-lg bg-muted"><BookCover src={myBook.coverUrl} title={myBook.title} /></div>
              <div>
                <p className="font-medium">{myBook.title}</p>
                <p className="text-sm text-muted-foreground">{myBook.author}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">{CONDITION_LABEL[myBook.condition]}</Badge>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">You receive</p>
            <div className="flex gap-3">
              <div className="h-24 w-16 overflow-hidden rounded-lg bg-muted"><BookCover src={theirBook.coverUrl} title={theirBook.title} /></div>
              <div>
                <p className="font-medium">{theirBook.title}</p>
                <p className="text-sm text-muted-foreground">{theirBook.author}</p>
                <Badge variant="outline" className="mt-1 text-[10px]">{CONDITION_LABEL[theirBook.condition]}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11"><AvatarFallback>{initials(other.fullName)}</AvatarFallback></Avatar>
            <div>
              <Link href={`/users/${isRequester ? exchange.responderId : exchange.requesterId}`} className="font-medium hover:underline">{other.fullName}</Link>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {publicLocation(other.addresses[0]?.city, other.addresses[0]?.state)}
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Service Fee</p>
            <p className="font-semibold">{formatINR(exchange.feeAmount)}</p>
          </div>
        </CardContent>
      </Card>

      {exchange.deliveryMode && (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6 text-sm">
            {exchange.deliveryMode === 'MEETUP' ? <Users className="h-4 w-4 text-primary" /> : <Truck className="h-4 w-4 text-primary" />}
            Handover method: <span className="font-medium">{exchange.deliveryMode === 'MEETUP' ? 'Meet Nearby' : 'Delivery'}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent>
          <ExchangeActions
            exchangeId={exchange.id}
            status={exchange.status}
            isRequester={isRequester}
            isResponder={!isRequester}
            conversationId={conversation?.id}
            feeAmount={exchange.feeAmount}
            userName={user.fullName}
            userEmail={user.email}
            otherName={other.fullName.split(' ')[0]}
            hasReviewed={hasReviewed}
            myCompleted={myCompleted}
            offers={exchange.offers}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {exchange.events.map((e) => (
              <li key={e.id} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0">
                <span>{e.detail || e.type.replaceAll('_', ' ')}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
