import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { bookStatusUpdateSchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';

/** Owner-driven status toggle: mark available/unavailable. Cannot jump into exchange states directly. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { status } = await parseBody(req, bookStatusUpdateSchema);

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new HttpError(404, 'Book not found.');
    if (book.ownerId !== user.id) throw new HttpError(403, 'You can only manage your own books.');
    if (!['AVAILABLE', 'INACTIVE'].includes(book.status)) {
      throw new HttpError(409, 'This book has an active exchange — resolve it before changing its status.');
    }
    if (!['AVAILABLE', 'INACTIVE'].includes(status)) {
      throw new HttpError(400, 'You can only mark a book Available or Inactive manually.');
    }

    const updated = await prisma.book.update({
      where: { id },
      data: { status, available: status === 'AVAILABLE' },
    });
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
