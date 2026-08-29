import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';
import { moderationSchema } from '@/lib/validation';
import { notify } from '@/lib/notify';

/** Approve / reject / remove a listing. Rejecting also takes it off the marketplace. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { moderation } = await parseBody(req, moderationSchema);

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new HttpError(404, 'Book not found.');

    const updated = await prisma.book.update({
      where: { id },
      data: {
        moderation,
        ...(moderation === 'REJECTED' ? { available: false, status: 'INACTIVE' } : {}),
      },
    });

    await notify(
      book.ownerId,
      'ACCOUNT',
      moderation === 'APPROVED' ? 'Listing approved' : 'Listing rejected',
      moderation === 'APPROVED'
        ? `"${book.title}" is now live on BookSwap.`
        : `"${book.title}" was rejected by our moderation team.`,
      `/dashboard/books`,
    );

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
