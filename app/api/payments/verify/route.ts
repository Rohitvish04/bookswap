import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';
import { paymentVerifySchema } from '@/lib/validation';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { notify } from '@/lib/notify';
import { rateLimit } from '@/lib/rate-limit';

/**
 * The only place a payment is marked PAID. Trusts nothing from the client
 * except the three Razorpay fields, and re-derives the signature server-side
 * against RAZORPAY_KEY_SECRET before touching the database.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`payment-verify:${user.id}`, 20, 60_000);
    const body = await parseBody(req, paymentVerifySchema);

    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: body.razorpay_order_id } });
    if (!payment) throw new HttpError(404, 'Payment order not found.');
    if (payment.userId !== user.id) throw new HttpError(403, 'This payment does not belong to you.');

    if (payment.status === 'PAID') {
      return ok({ verified: true, alreadyProcessed: true });
    }

    const valid = verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    if (!valid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: 'Signature verification failed.' },
      });
      throw new HttpError(400, 'Payment verification failed. Please try again or contact support.');
    }

    const exchange = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          razorpayPaymentId: body.razorpay_payment_id,
          razorpaySignature: body.razorpay_signature,
        },
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

    return ok({ verified: true });
  } catch (err) {
    return handleError(err);
  }
}
