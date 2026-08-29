import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { HttpError } from '@/lib/auth';
import { publicLocation } from '@/lib/location';

/** Public-safe profile: no email, phone, or exact address — ever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id, status: 'ACTIVE' },
      include: {
        profile: true,
        addresses: { where: { isDefault: true }, take: 1, select: { city: true, state: true } },
        _count: { select: { books: { where: { status: { not: 'INACTIVE' } } } } },
      },
    });
    if (!user) throw new HttpError(404, 'User not found.');

    const completedExchanges = await prisma.exchange.count({
      where: { status: 'COMPLETED', OR: [{ requesterId: id }, { responderId: id }] },
    });

    return ok({
      id: user.id,
      fullName: user.fullName,
      bio: user.profile?.bio ?? '',
      avatarUrl: user.profile?.avatarUrl ?? '',
      ratingAvg: user.profile?.ratingAvg ?? 0,
      ratingCount: user.profile?.ratingCount ?? 0,
      location: publicLocation(user.addresses[0]?.city, user.addresses[0]?.state),
      totalBooks: user._count.books,
      completedExchanges,
      memberSince: user.createdAt,
    });
  } catch (err) {
    return handleError(err);
  }
}
