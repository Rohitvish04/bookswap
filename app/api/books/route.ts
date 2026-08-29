import { prisma } from '@/lib/db';
import { ok, handleError, parseBody, parseQuery } from '@/lib/api';
import { bookSchema, bookQuerySchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { uniqueBookSlug, publicBookInclude } from '@/lib/book-service';
import { buildBookWhere } from '@/lib/book-query';
import type { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const q = parseQuery(req, bookQuerySchema);
    const page = q.page ?? 1;
    const perPage = q.perPage ?? 12;

    const where = buildBookWhere(q);

    const orderBy: Prisma.BookOrderByWithRelationInput =
      q.sort === 'popular' ? { viewCount: 'desc' } : { createdAt: 'desc' };

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: publicBookInclude,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return ok({
      books,
      total,
      page: page,
      perPage: perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`book-create:${user.id}`, 20, 60_000);
    const body = await parseBody(req, bookSchema);

    if (body.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!cat || !cat.isActive) throw new HttpError(422, 'Selected category is not available.');
    }

    const slug = await uniqueBookSlug(body.title);

    const book = await prisma.book.create({
      data: {
        slug,
        ownerId: user.id,
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

    // Notify wishlisters whose wanted title just became available.
    const interested = await prisma.wishlistItem.findMany({
      where: { title: { equals: body.title, mode: 'insensitive' }, userId: { not: user.id } },
    });
    if (interested.length) {
      await prisma.notification.createMany({
        data: interested.map((w) => ({
          userId: w.userId,
          type: 'WISHLIST_MATCH' as const,
          title: 'A book on your wishlist is available!',
          body: `"${book.title}" was just listed on BookSwap.`,
          link: `/books/${book.slug}`,
        })),
      });
    }

    return ok(book, 201);
  } catch (err) {
    return handleError(err);
  }
}
