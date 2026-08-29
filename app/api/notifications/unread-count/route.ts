import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const count = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
    return ok({ count });
  } catch (err) {
    return handleError(err);
  }
}
