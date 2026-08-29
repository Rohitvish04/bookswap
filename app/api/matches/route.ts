import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { findMatchesForUser } from '@/lib/matching';

export async function GET() {
  try {
    const user = await requireUser();
    const matches = await findMatchesForUser(user.id);
    return ok(matches);
  } catch (err) {
    return handleError(err);
  }
}
