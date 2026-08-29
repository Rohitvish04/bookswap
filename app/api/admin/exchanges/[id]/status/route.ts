import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';
import { adminExchangeStatusSchema } from '@/lib/validation';
import { notify } from '@/lib/notify';

/** Admin dispute resolution: force an exchange to DISPUTED, COMPLETED, or CANCELLED. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status, note } = await parseBody(req, adminExchangeStatusSchema);

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) throw new HttpError(404, 'Exchange not found.');

    const updated = await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED') {
        await tx.book.updateMany({
          where: { id: { in: [exchange.offeredBookId, exchange.requestedBookId] }, status: { in: ['EXCHANGE_PENDING', 'RESERVED'] } },
          data: { status: 'AVAILABLE' },
        });
      }
      if (status === 'COMPLETED') {
        await tx.book.update({ where: { id: exchange.offeredBookId }, data: { status: 'EXCHANGED', ownerId: exchange.responderId, available: false } });
        await tx.book.update({ where: { id: exchange.requestedBookId }, data: { status: 'EXCHANGED', ownerId: exchange.requesterId, available: false } });
      }
      return tx.exchange.update({
        where: { id },
        data: {
          status,
          ...(status === 'COMPLETED' ? { completedAt: new Date(), requesterCompleted: true, responderCompleted: true } : {}),
          events: { create: { type: `ADMIN_${status}`, detail: note || 'Resolved by admin.' } },
        },
      });
    });

    await Promise.all([
      notify(exchange.requesterId, 'ACCOUNT', 'Exchange updated by admin', note || `An admin set this exchange to ${status}.`, `/dashboard/exchanges/${id}`),
      notify(exchange.responderId, 'ACCOUNT', 'Exchange updated by admin', note || `An admin set this exchange to ${status}.`, `/dashboard/exchanges/${id}`),
    ]);

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
