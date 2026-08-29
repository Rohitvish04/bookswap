import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { acceptExchange } from '@/lib/exchange-service';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const exchange = await acceptExchange(id, user.id);
    return ok(exchange);
  } catch (err) {
    return handleError(err);
  }
}
