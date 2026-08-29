import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';

/** Remove an abusive/fake review and recompute the subject's rating average. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, 'Review not found.');

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      const agg = await tx.review.aggregate({ where: { subjectId: review.subjectId }, _avg: { rating: true }, _count: true });
      await tx.profile.updateMany({
        where: { userId: review.subjectId },
        data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
      });
    });

    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
