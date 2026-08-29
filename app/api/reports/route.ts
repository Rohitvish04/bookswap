import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { reportSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`report:${user.id}`, 10, 60_000);
    const body = await parseBody(req, reportSchema);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetUserId: body.targetUserId || null,
        exchangeId: body.exchangeId || null,
        reason: body.reason,
        detail: body.detail || null,
      },
    });
    return ok(report, 201);
  } catch (err) {
    return handleError(err);
  }
}
