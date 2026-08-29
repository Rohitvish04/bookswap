import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { notify } from '@/lib/notify';

/**
 * Razorpay server-to-server webhook. This is the safety net for the case
 * where a payment succeeds but the user's browser disconnects before the
 * client-side /api/payments/verify call fires — Razorpay always redelivers
 * this event. WebhookEvent.eventId is unique so duplicate deliveries are
 * ignored instead of double-processing.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    return Response.json({ ok: false, error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    id: string;
    event: string;
    payload: { payment?: { entity?: { id: string; order_id: string; status: string } } };
  };

  try {
    await prisma.webhookEvent.create({ data: { eventId: payload.id, event: payload.event, payload } });
  } catch {
    // Unique constraint hit = already processed this delivery.
    return Response.json({ ok: true, duplicate: true });
  }

  const entity = payload.payload.payment?.entity;
  if (!entity) return Response.json({ ok: true });

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: entity.order_id } });
  if (!payment) return Response.json({ ok: true });

  if (payload.event === 'payment.captured' && payment.status !== 'PAID') {
    const exchange = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', razorpayPaymentId: entity.id },
      });
      return tx.exchange.update({
        where: { id: payment.exchangeId },
        data: { status: 'CONFIRMED', paidAt: new Date(), confirmedAt: new Date() },
      });
    });
    await Promise.all([
      notify(exchange.requesterId, 'PAYMENT_SUCCESS', 'Payment successful', 'Your exchange is now confirmed.', `/dashboard/exchanges/${exchange.id}`),
      notify(exchange.responderId, 'EXCHANGE_CONFIRMED', 'Exchange confirmed', 'Payment was received. Coordinate the handover.', `/dashboard/exchanges/${exchange.id}`),
    ]);
  }

  if (payload.event === 'payment.failed' && payment.status !== 'PAID') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureReason: 'Payment failed at gateway.' } });
    await notify(payment.userId, 'PAYMENT_FAILED', 'Payment failed', 'Your payment could not be completed. You can retry from the exchange page.', `/dashboard/exchanges/${payment.exchangeId}`);
  }

  return Response.json({ ok: true });
}
