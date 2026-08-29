import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookCover } from '@/components/site/book-cover';
import { STATUS_LABEL, formatDate, formatINR } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted' | 'outline'> = {
  PENDING: 'warning',
  ACCEPTED: 'warning',
  PAYMENT_PENDING: 'warning',
  PAID: 'success',
  CONFIRMED: 'success',
  COMPLETED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'muted',
  DISPUTED: 'destructive',
  EXPIRED: 'muted',
};

export type ExchangeSummary = {
  id: string;
  code: string;
  status: string;
  feeAmount: number;
  createdAt: string | Date;
  requesterId: string;
  responderId: string;
  offeredBook: { title: string; coverUrl: string | null };
  requestedBook: { title: string; coverUrl: string | null };
  requester: { fullName: string };
  responder: { fullName: string };
};

export function ExchangeCard({ exchange, currentUserId }: { exchange: ExchangeSummary; currentUserId: string }) {
  const isRequester = exchange.requesterId === currentUserId;
  const mine = isRequester ? exchange.offeredBook : exchange.requestedBook;
  const theirs = isRequester ? exchange.requestedBook : exchange.offeredBook;
  const otherName = isRequester ? exchange.responder.fullName : exchange.requester.fullName;

  return (
    <Link href={`/dashboard/exchanges/${exchange.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex items-center gap-2">
            <div className="h-16 w-11 overflow-hidden rounded-md bg-muted"><BookCover src={mine.coverUrl} title={mine.title} /></div>
            <span className="text-xs text-muted-foreground">⇄</span>
            <div className="h-16 w-11 overflow-hidden rounded-md bg-muted"><BookCover src={theirs.coverUrl} title={theirs.title} /></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium">{mine.title} <span className="text-muted-foreground">for</span> {theirs.title}</p>
            <p className="text-xs text-muted-foreground">with {otherName} · {exchange.code} · {formatDate(exchange.createdAt)}</p>
          </div>
          <div className="text-right">
            <Badge variant={STATUS_VARIANT[exchange.status] ?? 'outline'}>{STATUS_LABEL[exchange.status]}</Badge>
            <p className="mt-1 text-xs text-muted-foreground">Fee: {formatINR(exchange.feeAmount)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
