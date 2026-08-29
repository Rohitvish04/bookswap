import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createRazorpayOrder } from '@/lib/razorpay';

const schema = z.object({ exchangeId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`payment-order:${user.id}`, 15, 60_000);
    const { exchangeId } = await parseBody(req, schema);

    const exchange = await prisma.exchange.findUnique({ where: { id: exchangeId } });
    if (!exchange) throw new HttpError(404, 'Exchange not found.');
    if (exchange.requesterId !== user.id) throw new HttpError(403, 'Only the requester pays the service fee.');
    if (!['ACCEPTED', 'PAYMENT_PENDING'].includes(exchange.status)) {
      throw new HttpError(409, 'This exchange is not awaiting payment.');
    }

    // Reuse an existing unpaid order instead of creating duplicates on refresh/retry.
    const existing = await prisma.payment.findFirst({
      where: { exchangeId, status: { in: ['CREATED', 'PENDING'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return ok({
        orderId: existing.razorpayOrderId,
        amount: existing.amount,
        currency: existing.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    const order = await createRazorpayOrder(exchange.feeAmount, exchange.code, { exchangeId });

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          exchangeId,
          userId: user.id,
          razorpayOrderId: order.id,
          amount: exchange.feeAmount,
          currency: 'INR',
          status: 'CREATED',
        },
      }),
      prisma.exchange.update({ where: { id: exchangeId }, data: { status: 'PAYMENT_PENDING' } }),
    ]);

    return ok({ orderId: order.id, amount: exchange.feeAmount, currency: 'INR', keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (err) {
    return handleError(err);
  }
}
