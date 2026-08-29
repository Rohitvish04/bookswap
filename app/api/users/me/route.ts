import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { profileSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const full = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true, addresses: { orderBy: [{ isDefault: 'desc' }] } },
    });
    return ok({
      id: full.id,
      fullName: full.fullName,
      email: full.email,
      phone: full.phone,
      role: full.role,
      emailVerifiedAt: full.emailVerifiedAt,
      searchRadiusKm: full.searchRadiusKm,
      createdAt: full.createdAt,
      bio: full.profile?.bio ?? '',
      avatarUrl: full.profile?.avatarUrl ?? '',
      ratingAvg: full.profile?.ratingAvg ?? 0,
      ratingCount: full.profile?.ratingCount ?? 0,
      addresses: full.addresses,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, profileSchema);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { fullName: body.fullName, phone: body.phone || null } }),
      prisma.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, bio: body.bio || null, avatarUrl: body.avatarUrl || null },
        update: { bio: body.bio || null, avatarUrl: body.avatarUrl || null },
      }),
    ]);

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
