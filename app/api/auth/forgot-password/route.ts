import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/validation';
import { newToken, hashToken } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { sendEmail, resetEmailHtml } from '@/lib/email';

export async function POST(req: Request) {
  try {
    rateLimit(`forgot-password:${clientIp(req)}`, 5, 60_000);
    const { email } = await parseBody(req, forgotPasswordSchema);

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success — never reveal whether an email is registered.
    if (user) {
      const token = newToken();
      await prisma.verificationToken.create({
        data: { userId: user.id, type: 'PASSWORD_RESET', tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) },
      });
      const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendEmail(user.email, 'Reset your BookSwap password', resetEmailHtml(link));
    }

    return ok({ sent: true });
  } catch (err) {
    return handleError(err);
  }
}
