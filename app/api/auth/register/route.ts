import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { registerSchema } from '@/lib/validation';
import { hashPassword, createSession, newToken, hashToken, HttpError } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notify } from '@/lib/notify';
import { sendEmail, verificationEmailHtml } from '@/lib/email';
import { geocode } from '@/lib/location';

export async function POST(req: Request) {
  try {
    rateLimit(`register:${clientIp(req)}`, 5, 60_000);
    const body = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, 'An account with this email already exists.');

    const passwordHash = await hashPassword(body.password);
    const geo = await geocode({ addressLine: body.addressLine, area: body.area, city: body.city, state: body.state, pincode: body.pincode });

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        passwordHash,
        profile: { create: {} },
        addresses: {
          create: {
            fullName: body.fullName,
            phone: body.phone,
            addressLine: body.addressLine,
            area: body.area,
            city: body.city,
            state: body.state,
            pincode: body.pincode,
            latitude: geo?.latitude,
            longitude: geo?.longitude,
            isDefault: true,
          },
        },
      },
    });

    const token = newToken();
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 3600_000),
      },
    });
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    await sendEmail(user.email, 'Verify your BookSwap email', verificationEmailHtml(link));
    await notify(user.id, 'ACCOUNT', 'Welcome to BookSwap!', 'Please verify your email to unlock all features.');

    await createSession(user.id);

    return ok({ id: user.id, fullName: user.fullName, email: user.email }, 201);
  } catch (err) {
    return handleError(err);
  }
}
