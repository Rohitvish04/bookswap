import { ok, handleError, parseBody } from '@/lib/api';
import { geocodeSchema } from '@/lib/validation';
import { requireUser, HttpError } from '@/lib/auth';
import { geocode } from '@/lib/location';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    rateLimit(`geocode:${user.id}`, 20, 60_000);
    const body = await parseBody(req, geocodeSchema);

    const result = await geocode(body);
    if (!result) throw new HttpError(422, 'Could not locate that address. Try a nearby major city.');

    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
