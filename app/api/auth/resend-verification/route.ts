import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser, newToken, hashToken, HttpError } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail, verificationEmailHtml } from '@/lib/email';

export async function POST() {
  try {
    const user = await requireUser();
    if (user.emailVerifiedAt) throw new HttpError(400, 'Your email is already verified.');
    rateLimit(`resend-verify:${user.id}`, 3, 300_000);

    const token = newToken();
    await prisma.verificationToken.create({
      data: { userId: user.id, type: 'EMAIL_VERIFICATION', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 24 * 3600_000) },
    });
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await sendEmail(user.email, 'Verify your BookSwap email', verificationEmailHtml(link));

    return ok({ sent: true });
  } catch (err) {
    return handleError(err);
  }
}
