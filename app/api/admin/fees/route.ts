import { ok, handleError, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { feeSettingsSchema } from '@/lib/validation';
import { getFeeSettings, setFeeSettings } from '@/lib/settings';

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getFeeSettings();
    return ok(settings);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await parseBody(req, feeSettingsSchema);
    await setFeeSettings(body);
    return ok(body);
  } catch (err) {
    return handleError(err);
  }
}
