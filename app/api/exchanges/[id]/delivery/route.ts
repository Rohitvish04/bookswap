import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { markDeliveryMode } from '@/lib/exchange-service';
import { deliveryModeSchema } from '@/lib/validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { deliveryMode } = await parseBody(req, deliveryModeSchema);
    const exchange = await markDeliveryMode(id, user.id, deliveryMode);
    return ok(exchange);
  } catch (err) {
    return handleError(err);
  }
}
