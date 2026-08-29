import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { resetPasswordSchema } from '@/lib/validation';
import { hashPassword, hashToken, HttpError } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    rateLimit(`reset-password:${clientIp(req)}`, 8, 60_000);
    const { token, password } = await parseBody(req, resetPasswordSchema);

    const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.type !== 'PASSWORD_RESET') throw new HttpError(400, 'Invalid or expired reset link.');
    if (record.usedAt) throw new HttpError(400, 'This reset link has already been used.');
    if (record.expiresAt < new Date()) throw new HttpError(400, 'This reset link has expired. Please request a new one.');

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidate all existing sessions so a stolen session can't survive a password reset.
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);

    return ok({ reset: true });
  } catch (err) {
    return handleError(err);
  }
}
