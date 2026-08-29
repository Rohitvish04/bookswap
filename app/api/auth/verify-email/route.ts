import { z } from 'zod';
import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { hashToken, HttpError } from '@/lib/auth';

const schema = z.object({ token: z.string().min(10, 'Invalid verification link.') });

export async function POST(req: Request) {
  try {
    const { token } = await parseBody(req, schema);

    const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== 'EMAIL_VERIFICATION') throw new HttpError(400, 'Invalid or expired verification link.');
    if (record.usedAt) throw new HttpError(400, 'This verification link has already been used.');
    if (record.expiresAt < new Date()) throw new HttpError(400, 'This verification link has expired. Please request a new one.');

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return ok({ verified: true });
  } catch (err) {
    return handleError(err);
  }
}
