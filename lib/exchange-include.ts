import type { Prisma } from '@prisma/client';

/** Shared include for exchange detail views — masks nothing here; masking of address happens at read time. */
export const exchangeDetailInclude = {
  requester: { select: { id: true, fullName: true, profile: true, addresses: { where: { isDefault: true }, take: 1, select: { city: true, state: true } } } },
  responder: { select: { id: true, fullName: true, profile: true, addresses: { where: { isDefault: true }, take: 1, select: { city: true, state: true } } } },
  offeredBook: true,
  requestedBook: true,
  offers: { orderBy: { createdAt: 'desc' }, include: { book: true, proposedBy: { select: { id: true, fullName: true } } } },
  payments: { orderBy: { createdAt: 'desc' } },
  events: { orderBy: { createdAt: 'desc' } },
  reviews: true,
} satisfies Prisma.ExchangeInclude;
