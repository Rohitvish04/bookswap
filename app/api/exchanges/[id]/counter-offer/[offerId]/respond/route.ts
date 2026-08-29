import { z } from 'zod';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { respondToCounterOffer } from '@/lib/exchange-service';

const schema = z.object({ accept: z.boolean() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string; offerId: string }> }) {
  try {
    const user = await requireUser();
    const { id, offerId } = await params;
    const { accept } = await parseBody(req, schema);
    const result = await respondToCounterOffer({ exchangeId: id, offerId, userId: user.id, accept });
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
