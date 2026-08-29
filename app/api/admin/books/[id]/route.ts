import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';

/** Force-unpublish (soft) rather than hard delete, so exchange history referencing the book survives. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new HttpError(404, 'Book not found.');
    if (!['AVAILABLE', 'INACTIVE'].includes(book.status)) {
      throw new HttpError(409, 'Cannot remove a book with an active exchange.');
    }

    await prisma.book.update({ where: { id }, data: { status: 'INACTIVE', available: false, moderation: 'REJECTED' } });
    return ok({ removed: true });
  } catch (err) {
    return handleError(err);
  }
}
