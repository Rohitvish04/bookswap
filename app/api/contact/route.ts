import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { contactSchema } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    rateLimit(`contact:${clientIp(req)}`, 5, 60_000);
    const body = await parseBody(req, contactSchema);
    const msg = await prisma.contactMessage.create({ data: body });
    return ok({ id: msg.id }, 201);
  } catch (err) {
    return handleError(err);
  }
}
