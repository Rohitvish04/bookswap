import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { wishlistSchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { book: { include: { owner: { select: { fullName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(items);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, wishlistSchema);

    const exists = await prisma.wishlistItem.findFirst({
      where: { userId: user.id, title: { equals: body.title, mode: 'insensitive' }, author: body.author || null },
    });
    if (exists) throw new HttpError(409, 'This book is already on your wishlist.');

    const item = await prisma.wishlistItem.create({
      data: { userId: user.id, title: body.title, author: body.author || null, bookId: body.bookId || null },
    });
    return ok(item, 201);
  } catch (err) {
    return handleError(err);
  }
}
