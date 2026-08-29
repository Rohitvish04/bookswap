import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { addressSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { geocode } from '@/lib/location';

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return ok(addresses);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, addressSchema);

    let { latitude, longitude } = body;
    if (latitude == null || longitude == null) {
      const geo = await geocode(body);
      latitude = geo?.latitude ?? null;
      longitude = geo?.longitude ?? null;
    }

    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      }
      const count = await tx.address.count({ where: { userId: user.id } });
      return tx.address.create({
        data: { ...body, userId: user.id, latitude, longitude, isDefault: body.isDefault || count === 0 },
      });
    });

    return ok(address, 201);
  } catch (err) {
    return handleError(err);
  }
}
