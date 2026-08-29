import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    const reviews = await prisma.review.findMany({
      include: {
        author: { select: { fullName: true, email: true } },
        subject: { select: { fullName: true, email: true } },
        exchange: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return ok(reviews);
  } catch (err) {
    return handleError(err);
  }
}
