import { prisma } from '@/lib/db';
import { ok, handleError, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({ status: z.string().optional() });

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const q = parseQuery(req, querySchema);
    const where: Prisma.ReportWhereInput = q.status ? { status: q.status as Prisma.EnumReportStatusFilter['equals'] } : {};

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: { select: { fullName: true, email: true } },
        targetUser: { select: { fullName: true, email: true } },
        exchange: { select: { code: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(reports);
  } catch (err) {
    return handleError(err);
  }
}
