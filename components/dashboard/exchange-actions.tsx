'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X, MessageSquare, Truck, Users, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { CounterOfferDialog } from './counter-offer-dialog';
import { ReviewDialog } from './review-dialog';
import { RazorpayPayButton } from './razorpay-pay-button';

export function ExchangeActions({
  exchangeId,
  status,
  isRequester,
  isResponder,
  conversationId,
  feeAmount,
  userName,
  userEmail,
  otherName,
  hasReviewed,
  myCompleted,
  offers,
}: {
  exchangeId: string;
  status: string;
  isRequester: boolean;
  isResponder: boolean;
  conversationId?: string;
  feeAmount: number;
  userName: string;
  userEmail: string;
  otherName: string;
  hasReviewed: boolean;
  myCompleted: boolean;
  offers: { id: string; status: string; proposedById: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: string, url: string, body?: unknown) {
    setBusy(action);
    const res = await apiFetch(url, { method: 'POST', body: body ?? {} });
    setBusy(null);
    if (res.ok) {
      toast.success('Done!');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const pendingOffer = offers.find((o) => o.status === 'PROPOSED');

  return (
    <div className="flex flex-wrap gap-2">
      {conversationId && (
        <Button variant="outline" asChild>
          <a href={`/dashboard/messages/${conversationId}`}><MessageSquare className="h-4 w-4" /> Message</a>
        </Button>
      )}

      {status === 'PENDING' && isResponder && (
        <>
          <Button onClick={() => act('accept', `/api/exchanges/${exchangeId}/accept`)} disabled={busy !== null}>
            <Check className="h-4 w-4" /> Accept Exchange
          </Button>
          <Button variant="destructive" onClick={() => act('reject', `/api/exchanges/${exchangeId}/reject`)} disabled={busy !== null}>
            <X className="h-4 w-4" /> Reject
          </Button>
          <CounterOfferDialog exchangeId={exchangeId} />
        </>
      )}

      {status === 'PENDING' && isRequester && (
        <>
          <Button variant="outline" onClick={() => act('cancel', `/api/exchanges/${exchangeId}/cancel`)} disabled={busy !== null}>
            <X className="h-4 w-4" /> Cancel Request
          </Button>
          <CounterOfferDialog exchangeId={exchangeId} />
        </>
      )}

      {pendingOffer && (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/10 p-3">
          <span className="text-sm">A counter offer is awaiting your response.</span>
          <Button size="sm" onClick={() => act('accept-offer', `/api/exchanges/${exchangeId}/counter-offer/${pendingOffer.id}/respond`, { accept: true })} disabled={busy !== null}>
            Accept Counter
          </Button>
          <Button size="sm" variant="outline" onClick={() => act('reject-offer', `/api/exchanges/${exchangeId}/counter-offer/${pendingOffer.id}/respond`, { accept: false })} disabled={busy !== null}>
            Decline
          </Button>
        </div>
      )}

      {status === 'ACCEPTED' && isRequester && (
        <RazorpayPayButton exchangeId={exchangeId} amount={feeAmount} userName={userName} userEmail={userEmail} />
      )}
      {status === 'ACCEPTED' && isResponder && (
        <p className="text-sm text-muted-foreground">Waiting for {otherName} to pay the service fee.</p>
      )}
      {status === 'PAYMENT_PENDING' && isRequester && (
        <RazorpayPayButton exchangeId={exchangeId} amount={feeAmount} userName={userName} userEmail={userEmail} />
      )}
      {status === 'PAYMENT_PENDING' && isResponder && (
        <p className="text-sm text-muted-foreground">Payment in progress by {otherName}...</p>
      )}

      {status === 'CONFIRMED' && (
        <>
          <Button variant="outline" onClick={() => act('meetup', `/api/exchanges/${exchangeId}/delivery`, { deliveryMode: 'MEETUP' })} disabled={busy !== null}>
            <Users className="h-4 w-4" /> Meet Nearby
          </Button>
          <Button variant="outline" onClick={() => act('delivery', `/api/exchanges/${exchangeId}/delivery`, { deliveryMode: 'DELIVERY' })} disabled={busy !== null}>
            <Truck className="h-4 w-4" /> Arrange Delivery
          </Button>
          {!myCompleted && (
            <Button onClick={() => act('complete', `/api/exchanges/${exchangeId}/complete`)} disabled={busy !== null}>
              <CheckCircle2 className="h-4 w-4" /> Mark Exchange Completed
            </Button>
          )}
          {myCompleted && <p className="text-sm text-muted-foreground">Waiting for {otherName} to confirm completion.</p>}
        </>
      )}

      {status === 'COMPLETED' && !hasReviewed && <ReviewDialog exchangeId={exchangeId} subjectName={otherName} />}
      {status === 'COMPLETED' && hasReviewed && <p className="text-sm text-success">You reviewed this exchange. Thank you!</p>}
    </div>
  );
}
