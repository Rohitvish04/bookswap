import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, createSession, HttpError } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    rateLimit(`login:${clientIp(req)}`, 10, 60_000);
    const body = await parseBody(req, loginSchema);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new HttpError(401, 'Invalid email or password.');

    rateLimit(`login-user:${user.id}`, 10, 60_000);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid email or password.');

    if (user.status === 'SUSPENDED') throw new HttpError(403, 'Your account has been suspended. Contact support.');
    if (user.status === 'DELETED') throw new HttpError(403, 'This account no longer exists.');

    await createSession(user.id);

    return ok({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
