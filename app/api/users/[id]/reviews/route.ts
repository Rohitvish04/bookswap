import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { subjectId: id },
      include: { author: { select: { fullName: true, profile: { select: { avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(reviews);
  } catch (err) {
    return handleError(err);
  }
}
