import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { reportResolveSchema } from '@/lib/validation';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await parseBody(req, reportResolveSchema);
    const report = await prisma.report.update({
      where: { id },
      data: { status: body.status, resolution: body.resolution || null },
    });
    return ok(report);
  } catch (err) {
    return handleError(err);
  }
}
