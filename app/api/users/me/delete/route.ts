import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, verifyPassword, destroySession, HttpError } from '@/lib/auth';

const schema = z.object({ password: z.string().min(1, 'Enter your password to confirm.') });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role === 'ADMIN') throw new HttpError(400, 'Admin accounts cannot be self-deleted. Ask another admin to remove this account.');
    const { password } = await parseBody(req, schema);

    const activeExchanges = await prisma.exchange.count({
      where: {
        OR: [{ requesterId: user.id }, { responderId: user.id }],
        status: { in: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'] },
      },
    });
    if (activeExchanges > 0) throw new HttpError(409, 'You have active exchanges. Please complete or cancel them before deleting your account.');

    const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const valid = await verifyPassword(password, full.passwordHash);
    if (!valid) throw new HttpError(401, 'Incorrect password.');

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { status: 'DELETED', email: `deleted-${user.id}@bookswap.invalid`, phone: null } }),
      prisma.book.updateMany({ where: { ownerId: user.id, status: 'AVAILABLE' }, data: { status: 'INACTIVE', available: false } }),
    ]);

    await destroySession();
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
