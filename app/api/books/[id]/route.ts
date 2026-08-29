import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { bookSchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';
import { publicBookInclude } from '@/lib/book-service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({ where: { id }, include: publicBookInclude });
    if (!book) throw new HttpError(404, 'Book not found.');
    return ok(book);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new HttpError(404, 'Book not found.');
    if (book.ownerId !== user.id) throw new HttpError(403, 'You can only edit your own books.');
    if (book.status !== 'AVAILABLE' && book.status !== 'INACTIVE') {
      throw new HttpError(409, 'This book is part of an active exchange and cannot be edited.');
    }

    const body = await parseBody(req, bookSchema);
    if (body.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!cat || !cat.isActive) throw new HttpError(422, 'Selected category is not available.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.wantedBook.deleteMany({ where: { bookId: id } });
      return tx.book.update({
        where: { id },
        data: {
          title: body.title,
          author: body.author,
          isbn: body.isbn || null,
          description: body.description || null,
          categoryId: body.categoryId || null,
          language: body.language,
          edition: body.edition || null,
          publishYear: body.publishYear ?? null,
          condition: body.condition,
          coverUrl: body.coverUrl || null,
          available: body.available,
          status: body.available ? 'AVAILABLE' : 'INACTIVE',
          wantedBy: { create: (body.wantedBooks ?? []).map((w) => ({ title: w.title, author: w.author || null })) },
        },
        include: publicBookInclude,
      });
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) throw new HttpError(404, 'Book not found.');
    if (book.ownerId !== user.id) throw new HttpError(403, 'You can only delete your own books.');
    if (!['AVAILABLE', 'INACTIVE'].includes(book.status)) {
      throw new HttpError(409, 'This book has an active exchange and cannot be deleted. Cancel the exchange first.');
    }

    await prisma.book.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
