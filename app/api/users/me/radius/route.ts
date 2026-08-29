import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { radiusSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { searchRadiusKm } = await parseBody(req, radiusSchema);
    await prisma.user.update({ where: { id: user.id }, data: { searchRadiusKm } });
    return ok({ searchRadiusKm });
  } catch (err) {
    return handleError(err);
  }
}
