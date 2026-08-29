import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { exchangeCode } from '@/lib/utils';
import { haversineKm } from '@/lib/location';
import { scoreMatch } from '@/lib/matching';
import { getFeeSettings, computeFee } from '@/lib/settings';
import type { Prisma } from '@prisma/client';

async function assertNotBlocked(tx: Prisma.TransactionClient, a: string, b: string) {
  const blocked = await tx.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  if (blocked) throw new HttpError(403, 'You cannot exchange with this user.');
}

/**
 * Creates an exchange request. Uses a transaction with row locks (via
 * conditional updateMany) so two simultaneous requests for the same book
 * cannot both succeed — the second one fails cleanly instead of racing.
 */
export async function createExchangeRequest(params: {
  requesterId: string;
  requestedBookId: string;
  offeredBookId: string;
  message?: string;
}) {
  const { requesterId, requestedBookId, offeredBookId, message } = params;

  if (requestedBookId === offeredBookId) {
    throw new HttpError(400, 'You cannot offer the same book you are requesting.');
  }

  return prisma.$transaction(async (tx) => {
    const [requestedBook, offeredBook] = await Promise.all([
      tx.book.findUnique({ where: { id: requestedBookId }, include: { owner: true } }),
      tx.book.findUnique({ where: { id: offeredBookId }, include: { owner: true } }),
    ]);

    if (!requestedBook) throw new HttpError(404, 'Book not found.');
    if (!offeredBook) throw new HttpError(404, 'Your offered book was not found.');
    if (offeredBook.ownerId !== requesterId) {
      throw new HttpError(403, 'You can only offer a book you own.');
    }
    if (requestedBook.ownerId === requesterId) {
      throw new HttpError(400, 'You cannot exchange your own book.');
    }
    if (requestedBook.status !== 'AVAILABLE' || !requestedBook.available) {
      throw new HttpError(409, 'This book is no longer available.');
    }
    if (offeredBook.status !== 'AVAILABLE' || !offeredBook.available) {
      throw new HttpError(409, 'The book you are offering is not currently available.');
    }

    await assertNotBlocked(tx, requesterId, requestedBook.ownerId);

    // Atomic reservation: only succeeds if both books are still AVAILABLE.
    // This is what prevents two users from requesting the same book at once.
    const [reservedRequested, reservedOffered] = await Promise.all([
      tx.book.updateMany({
        where: { id: requestedBookId, status: 'AVAILABLE' },
        data: { status: 'EXCHANGE_PENDING' },
      }),
      tx.book.updateMany({
        where: { id: offeredBookId, status: 'AVAILABLE' },
        data: { status: 'EXCHANGE_PENDING' },
      }),
    ]);

    if (reservedRequested.count === 0 || reservedOffered.count === 0) {
      throw new HttpError(409, 'This book was just reserved by someone else. Please try another match.');
    }

    const [requesterAddr, responderAddr] = await Promise.all([
      tx.address.findFirst({ where: { userId: requesterId, isDefault: true } }),
      tx.address.findFirst({ where: { userId: requestedBook.ownerId, isDefault: true } }),
    ]);
    const distanceKm =
      requesterAddr?.latitude != null &&
      requesterAddr?.longitude != null &&
      responderAddr?.latitude != null &&
      responderAddr?.longitude != null
        ? haversineKm(requesterAddr.latitude, requesterAddr.longitude, responderAddr.latitude, responderAddr.longitude)
        : null;

    const requesterBookForScore = await tx.book.findUnique({
      where: { id: offeredBookId },
      include: { wantedBy: true },
    });
    const requestedBookForScore = await tx.book.findUnique({
      where: { id: requestedBookId },
      include: { wantedBy: true },
    });
    const scored =
      requesterBookForScore && requestedBookForScore
        ? scoreMatch({
            theirBook: requestedBookForScore,
            myBook: requesterBookForScore,
            distanceKm,
            maxDistanceKm: 0,
          })
        : null;

    const feeSettings = await getFeeSettings();
    const fee = computeFee(feeSettings);
    const expiresAt = new Date(Date.now() + feeSettings.exchangeExpiryDays * 864e5);

    const exchange = await tx.exchange.create({
      data: {
        code: exchangeCode(),
        requesterId,
        responderId: requestedBook.ownerId,
        offeredBookId,
        requestedBookId,
        message: message || null,
        status: 'PENDING',
        matchScore: scored?.score ?? 0,
        distanceKm,
        feeAmount: fee.amount,
        feeType: fee.type,
        expiresAt,
        items: {
          create: [
            { bookId: offeredBookId, fromRole: 'REQUESTER', titleSnapshot: offeredBook.title },
            { bookId: requestedBookId, fromRole: 'RESPONDER', titleSnapshot: requestedBook.title },
          ],
        },
        events: { create: { actorId: requesterId, type: 'CREATED', detail: 'Exchange request created.' } },
      },
    });

    await tx.conversation.create({
      data: {
        exchangeId: exchange.id,
        participants: {
          create: [{ userId: requesterId }, { userId: requestedBook.ownerId }],
        },
      },
    });

    return exchange;
  });
}

async function loadExchangeOrThrow(tx: Prisma.TransactionClient, exchangeId: string) {
  const exchange = await tx.exchange.findUnique({
    where: { id: exchangeId },
    include: { offeredBook: true, requestedBook: true },
  });
  if (!exchange) throw new HttpError(404, 'Exchange not found.');
  return exchange;
}

function assertParticipant(exchange: { requesterId: string; responderId: string }, userId: string) {
  if (exchange.requesterId !== userId && exchange.responderId !== userId) {
    throw new HttpError(403, 'You do not have access to this exchange.');
  }
}

async function releaseBooks(tx: Prisma.TransactionClient, bookIds: string[]) {
  await tx.book.updateMany({
    where: { id: { in: bookIds }, status: { in: ['EXCHANGE_PENDING', 'RESERVED'] } },
    data: { status: 'AVAILABLE' },
  });
}

export async function acceptExchange(exchangeId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    if (exchange.responderId !== userId) {
      throw new HttpError(403, 'Only the book owner can accept this exchange.');
    }
    if (exchange.status !== 'PENDING') {
      throw new HttpError(409, 'This exchange request has already been processed.');
    }

    const updated = await tx.exchange.update({
      where: { id: exchangeId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        events: { create: { actorId: userId, type: 'ACCEPTED', detail: 'Exchange accepted.' } },
      },
    });

    await notify(
      exchange.requesterId,
      'EXCHANGE_ACCEPTED',
      'Exchange accepted!',
      'Your exchange request was accepted. Complete payment to confirm it.',
      `/dashboard/exchanges/${exchangeId}`,
    );
    return updated;
  });
}

export async function rejectExchange(exchangeId: string, userId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);
    if (!['PENDING', 'ACCEPTED'].includes(exchange.status)) {
      throw new HttpError(409, 'This exchange request has already been processed.');
    }

    await releaseBooks(tx, [exchange.offeredBookId, exchange.requestedBookId]);

    const updated = await tx.exchange.update({
      where: { id: exchangeId },
      data: {
        status: 'REJECTED',
        cancelReason: reason || null,
        events: { create: { actorId: userId, type: 'REJECTED', detail: reason || 'Exchange rejected.' } },
      },
    });

    const otherId = exchange.requesterId === userId ? exchange.responderId : exchange.requesterId;
    await notify(otherId, 'EXCHANGE_REJECTED', 'Exchange rejected', 'Your exchange request was declined.', `/dashboard/exchanges/${exchangeId}`);
    return updated;
  });
}

export async function cancelExchange(exchangeId: string, userId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);
    if (['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(exchange.status)) {
      throw new HttpError(409, 'This exchange can no longer be cancelled.');
    }

    await releaseBooks(tx, [exchange.offeredBookId, exchange.requestedBookId]);

    const updated = await tx.exchange.update({
      where: { id: exchangeId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || null,
        events: { create: { actorId: userId, type: 'CANCELLED', detail: reason || 'Exchange cancelled.' } },
      },
    });

    const otherId = exchange.requesterId === userId ? exchange.responderId : exchange.requesterId;
    await notify(otherId, 'EXCHANGE_CANCELLED', 'Exchange cancelled', 'The other user cancelled this exchange.', `/dashboard/exchanges/${exchangeId}`);
    return updated;
  });
}

/** Counter-offer: propose swapping in a different book than the one currently offered. */
export async function proposeCounterOffer(params: {
  exchangeId: string;
  userId: string;
  bookId: string;
  note?: string;
}) {
  const { exchangeId, userId, bookId, note } = params;

  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);
    if (!['PENDING', 'ACCEPTED'].includes(exchange.status)) {
      throw new HttpError(409, 'Counter offers are only allowed while the exchange is pending.');
    }

    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) throw new HttpError(404, 'Book not found.');
    if (book.ownerId !== userId) throw new HttpError(403, 'You can only counter with a book you own.');
    if (book.status !== 'AVAILABLE' || !book.available) {
      throw new HttpError(409, 'That book is not currently available.');
    }

    // Replaces the *other* side's book from this proposer's point of view:
    // if I'm the requester, I'm changing what I offer (REQUESTER side);
    // if I'm the responder, I'm changing what I want in return (RESPONDER side).
    const replaces = userId === exchange.requesterId ? 'REQUESTER' : 'RESPONDER';

    await tx.exchangeOffer.updateMany({
      where: { exchangeId, status: 'PROPOSED' },
      data: { status: 'SUPERSEDED' },
    });

    const offer = await tx.exchangeOffer.create({
      data: { exchangeId, proposedById: userId, bookId, replaces, note: note || null },
    });

    await tx.exchange.update({
      where: { id: exchangeId },
      data: {
        status: 'PENDING',
        events: { create: { actorId: userId, type: 'COUNTER_OFFER', detail: note || 'Counter offer proposed.' } },
      },
    });

    const otherId = userId === exchange.requesterId ? exchange.responderId : exchange.requesterId;
    await notify(otherId, 'COUNTER_OFFER', 'New counter offer', 'The other user proposed a different book for this exchange.', `/dashboard/exchanges/${exchangeId}`);
    return offer;
  });
}

/** Both sides must accept the counter offer before it actually swaps the book on the exchange. */
export async function respondToCounterOffer(params: {
  exchangeId: string;
  offerId: string;
  userId: string;
  accept: boolean;
}) {
  const { exchangeId, offerId, userId, accept } = params;

  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);

    const offer = await tx.exchangeOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.exchangeId !== exchangeId) throw new HttpError(404, 'Counter offer not found.');
    if (offer.status !== 'PROPOSED') throw new HttpError(409, 'This counter offer was already resolved.');
    if (offer.proposedById === userId) throw new HttpError(403, 'You cannot respond to your own counter offer.');

    if (!accept) {
      await tx.exchangeOffer.update({ where: { id: offerId }, data: { status: 'REJECTED' } });
      await notify(offer.proposedById, 'EXCHANGE_REJECTED', 'Counter offer declined', 'Your counter offer was declined.', `/dashboard/exchanges/${exchangeId}`);
      return { accepted: false };
    }

    const newBook = await tx.book.findUnique({ where: { id: offer.bookId } });
    if (!newBook || newBook.status !== 'AVAILABLE') {
      throw new HttpError(409, 'That book is no longer available.');
    }

    // Free up the book being swapped out, reserve the new one.
    const oldBookId = offer.replaces === 'REQUESTER' ? exchange.offeredBookId : exchange.requestedBookId;
    await releaseBooks(tx, [oldBookId]);
    await tx.book.update({ where: { id: offer.bookId }, data: { status: 'EXCHANGE_PENDING' } });

    await tx.exchangeOffer.update({ where: { id: offerId }, data: { status: 'ACCEPTED' } });
    await tx.exchange.update({
      where: { id: exchangeId },
      data: offer.replaces === 'REQUESTER' ? { offeredBookId: offer.bookId } : { requestedBookId: offer.bookId },
    });

    await notify(offer.proposedById, 'EXCHANGE_ACCEPTED', 'Counter offer accepted', 'Your counter offer was accepted.', `/dashboard/exchanges/${exchangeId}`);
    return { accepted: true };
  });
}

export async function markDeliveryMode(exchangeId: string, userId: string, mode: 'MEETUP' | 'DELIVERY') {
  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);
    if (!['CONFIRMED', 'PAID'].includes(exchange.status)) {
      throw new HttpError(409, 'Delivery mode can only be set once the exchange is confirmed.');
    }
    return tx.exchange.update({ where: { id: exchangeId }, data: { deliveryMode: mode } });
  });
}

/** Each side marks completion independently; both must confirm to finalize. */
export async function markExchangeCompleted(exchangeId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const exchange = await loadExchangeOrThrow(tx, exchangeId);
    assertParticipant(exchange, userId);
    if (exchange.status !== 'CONFIRMED') {
      throw new HttpError(409, 'This exchange is not ready to be marked completed.');
    }

    const isRequester = exchange.requesterId === userId;
    const data: Prisma.ExchangeUpdateInput = isRequester
      ? { requesterCompleted: true }
      : { responderCompleted: true };

    const bothWillBeDone =
      (isRequester ? true : exchange.requesterCompleted) && (isRequester ? exchange.responderCompleted : true);

    if (bothWillBeDone) {
      Object.assign(data, { status: 'COMPLETED', completedAt: new Date() });

      await tx.book.update({
        where: { id: exchange.offeredBookId },
        data: { status: 'EXCHANGED', ownerId: exchange.responderId, available: false },
      });
      await tx.book.update({
        where: { id: exchange.requestedBookId },
        data: { status: 'EXCHANGED', ownerId: exchange.requesterId, available: false },
      });
    }

    const updated = await tx.exchange.update({
      where: { id: exchangeId },
      data: {
        ...data,
        events: { create: { actorId: userId, type: 'MARK_COMPLETED', detail: bothWillBeDone ? 'Both sides confirmed.' : 'Waiting for the other side.' } },
      },
    });

    if (bothWillBeDone) {
      await Promise.all([
        notify(exchange.requesterId, 'EXCHANGE_COMPLETED', 'Exchange completed!', 'Your book exchange is complete. Leave a review!', `/dashboard/exchanges/${exchangeId}`),
        notify(exchange.responderId, 'EXCHANGE_COMPLETED', 'Exchange completed!', 'Your book exchange is complete. Leave a review!', `/dashboard/exchanges/${exchangeId}`),
      ]);
    } else {
      const otherId = isRequester ? exchange.responderId : exchange.requesterId;
      await notify(otherId, 'EXCHANGE_COMPLETED', 'Confirm your exchange', 'The other user marked this exchange as completed. Please confirm on your end.', `/dashboard/exchanges/${exchangeId}`);
    }

    return updated;
  });
}

let lastExpirySweep = 0;

/**
 * Throttled wrapper around expireStaleExchanges — safe to call on every request
 * that lists exchanges. Actually sweeps at most once a minute per server instance.
 * ponytail: in-process throttle, not cross-instance; a real cron/queue removes
 * the "at most once a minute per instance" caveat if you run >1 instance.
 */
export async function sweepExpiredExchangesThrottled() {
  const now = Date.now();
  if (now - lastExpirySweep < 60_000) return;
  lastExpirySweep = now;
  await expireStaleExchanges();
}

/** Auto-expire stale pending/payment-pending exchanges and free their books. Call opportunistically. */
export async function expireStaleExchanges() {
  const stale = await prisma.exchange.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING'] },
      expiresAt: { lt: new Date() },
    },
    select: { id: true, offeredBookId: true, requestedBookId: true },
  });

  for (const ex of stale) {
    await prisma.$transaction(async (tx) => {
      await releaseBooks(tx, [ex.offeredBookId, ex.requestedBookId]);
      await tx.exchange.update({
        where: { id: ex.id },
        data: { status: 'EXPIRED', events: { create: { type: 'EXPIRED', detail: 'Exchange expired automatically.' } } },
      });
    });
  }
  return stale.length;
}
