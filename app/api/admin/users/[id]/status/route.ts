import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin, HttpError } from '@/lib/auth';
import { userStatusSchema } from '@/lib/validation';
import { notify } from '@/lib/notify';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) throw new HttpError(400, 'You cannot change your own status.');
    const { status } = await parseBody(req, userStatusSchema);

    const user = await prisma.user.update({ where: { id }, data: { status } });
    if (status === 'SUSPENDED') await prisma.session.deleteMany({ where: { userId: id } });

    await notify(id, 'ACCOUNT', 'Account status updated', `Your account status was changed to ${status}.`);
    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}
