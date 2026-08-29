import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== user.id) throw new HttpError(404, 'Notification not found.');
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
