import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { changePasswordSchema } from '@/lib/validation';
import { requireUser, hashPassword, verifyPassword, HttpError } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, changePasswordSchema);

    const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const valid = await verifyPassword(body.currentPassword, full.passwordHash);
    if (!valid) throw new HttpError(401, 'Current password is incorrect.');

    const passwordHash = await hashPassword(body.password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return ok({ changed: true });
  } catch (err) {
    return handleError(err);
  }
}
