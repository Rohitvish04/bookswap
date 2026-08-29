import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const books = await prisma.book.findMany({
      where: { ownerId: user.id },
      include: {
        category: true,
        wantedBy: true,
        offeredIn: { where: { status: { in: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'] } } },
        requestedIn: { where: { status: { in: ['PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED'] } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(books);
  } catch (err) {
    return handleError(err);
  }
}
