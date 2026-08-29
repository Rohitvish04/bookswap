import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';

const schema = z.object({ userId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { userId } = await parseBody(req, schema);
    if (userId === user.id) throw new HttpError(400, 'You cannot block yourself.');

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
      create: { blockerId: user.id, blockedId: userId },
      update: {},
    });
    return ok({ blocked: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { userId } = await parseBody(req, schema);
    await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: userId } });
    return ok({ blocked: false });
  } catch (err) {
    return handleError(err);
  }
}
