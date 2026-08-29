import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { proposeCounterOffer } from '@/lib/exchange-service';
import { counterOfferSchema } from '@/lib/validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(req, counterOfferSchema);
    const offer = await proposeCounterOffer({ exchangeId: id, userId: user.id, bookId: body.bookId, note: body.note });
    return ok(offer, 201);
  } catch (err) {
    return handleError(err);
  }
}
