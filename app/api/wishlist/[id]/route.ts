import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const item = await prisma.wishlistItem.findUnique({ where: { id } });
    if (!item || item.userId !== user.id) throw new HttpError(404, 'Wishlist item not found.');
    await prisma.wishlistItem.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
