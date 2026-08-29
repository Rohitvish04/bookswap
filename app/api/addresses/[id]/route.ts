import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { addressSchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';
import { geocode } from '@/lib/location';

async function assertOwner(id: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) throw new HttpError(404, 'Address not found.');
  return address;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await assertOwner(id, user.id);
    const body = await parseBody(req, addressSchema);

    let { latitude, longitude } = body;
    if (latitude == null || longitude == null) {
      const geo = await geocode(body);
      latitude = geo?.latitude ?? null;
      longitude = geo?.longitude ?? null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id, NOT: { id } }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id }, data: { ...body, latitude, longitude } });
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const address = await assertOwner(id, user.id);

    await prisma.address.delete({ where: { id } });

    if (address.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
