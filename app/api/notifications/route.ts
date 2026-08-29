import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(notifications);
  } catch (err) {
    return handleError(err);
  }
}
