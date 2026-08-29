import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== user.id) throw new HttpError(404, 'Address not found.');

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
