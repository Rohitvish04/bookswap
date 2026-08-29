import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        addresses: true,
        books: { orderBy: { createdAt: 'desc' } },
        sentRequests: { orderBy: { createdAt: 'desc' }, take: 20, include: { offeredBook: true, requestedBook: true } },
        receivedRequests: { orderBy: { createdAt: 'desc' }, take: 20, include: { offeredBook: true, requestedBook: true } },
      },
    });
    if (!user) throw new HttpError(404, 'User not found.');
    const { passwordHash: _passwordHash, ...safe } = user;
    return ok(safe);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) throw new HttpError(400, 'You cannot delete your own admin account.');

    // Soft delete: anonymize contact info, keep exchange history intact for audit purposes.
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { status: 'DELETED', email: `deleted-${id}@bookswap.invalid`, phone: null },
      }),
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.book.updateMany({ where: { ownerId: id, status: 'AVAILABLE' }, data: { status: 'INACTIVE', available: false } }),
    ]);

    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
