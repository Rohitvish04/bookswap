import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { exchangeCreateSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createExchangeRequest, sweepExpiredExchangesThrottled } from '@/lib/exchange-service';
import { exchangeDetailInclude } from '@/lib/exchange-include';

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await sweepExpiredExchangesThrottled();
    const role = new URL(req.url).searchParams.get('role'); // 'requested' | 'received' | undefined

    const where =
      role === 'requested'
        ? { requesterId: user.id }
        : role === 'received'
          ? { responderId: user.id }
          : { OR: [{ requesterId: user.id }, { responderId: user.id }] };

    const exchanges = await prisma.exchange.findMany({
      where,
      include: exchangeDetailInclude,
      orderBy: { createdAt: 'desc' },
    });
    return ok(exchanges);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`exchange-create:${user.id}`, 20, 60_000);
    const body = await parseBody(req, exchangeCreateSchema);

    const exchange = await createExchangeRequest({
      requesterId: user.id,
      requestedBookId: body.requestedBookId,
      offeredBookId: body.offeredBookId,
      message: body.message,
    });

    const { notify } = await import('@/lib/notify');
    await notify(
      exchange.responderId,
      'EXCHANGE_REQUESTED',
      'New exchange request',
      `${user.fullName} wants to exchange a book with you.`,
      `/dashboard/exchanges/${exchange.id}`,
    );

    return ok(exchange, 201);
  } catch (err) {
    return handleError(err);
  }
}
