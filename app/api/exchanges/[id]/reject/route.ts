import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { rejectExchange } from '@/lib/exchange-service';
import { exchangeRejectSchema } from '@/lib/validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { reason } = await parseBody(req, exchangeRejectSchema);
    const exchange = await rejectExchange(id, user.id, reason);
    return ok(exchange);
  } catch (err) {
    return handleError(err);
  }
}
