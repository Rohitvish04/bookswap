import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';
import { exchangeDetailInclude } from '@/lib/exchange-include';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const exchange = await prisma.exchange.findUnique({ where: { id }, include: exchangeDetailInclude });
    if (!exchange) throw new HttpError(404, 'Exchange not found.');
    if (exchange.requesterId !== user.id && exchange.responderId !== user.id) {
      throw new HttpError(403, 'You do not have access to this exchange.');
    }
    return ok(exchange);
  } catch (err) {
    return handleError(err);
  }
}
