import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';
import { reviewSchema } from '@/lib/validation';
import { notify } from '@/lib/notify';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(req, reviewSchema);

    const exchange = await prisma.exchange.findUnique({ where: { id } });
    if (!exchange) throw new HttpError(404, 'Exchange not found.');
    if (exchange.requesterId !== user.id && exchange.responderId !== user.id) {
      throw new HttpError(403, 'You do not have access to this exchange.');
    }
    if (exchange.status !== 'COMPLETED') throw new HttpError(409, 'You can only review a completed exchange.');

    const subjectId = exchange.requesterId === user.id ? exchange.responderId : exchange.requesterId;

    const existing = await prisma.review.findUnique({ where: { exchangeId_authorId: { exchangeId: id, authorId: user.id } } });
    if (existing) throw new HttpError(409, 'You already reviewed this exchange.');

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { exchangeId: id, authorId: user.id, subjectId, rating: body.rating, comment: body.comment || null },
      });

      const agg = await tx.review.aggregate({ where: { subjectId }, _avg: { rating: true }, _count: true });
      await tx.profile.upsert({
        where: { userId: subjectId },
        create: { userId: subjectId, ratingAvg: agg._avg.rating ?? body.rating, ratingCount: agg._count },
        update: { ratingAvg: agg._avg.rating ?? body.rating, ratingCount: agg._count },
      });

      return created;
    });

    await notify(subjectId, 'REVIEW_RECEIVED', 'You received a review', `${user.fullName} left you a ${body.rating}-star review.`, `/dashboard/exchanges/${id}`);

    return ok(review, 201);
  } catch (err) {
    return handleError(err);
  }
}
