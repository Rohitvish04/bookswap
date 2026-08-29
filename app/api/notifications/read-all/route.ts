import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
