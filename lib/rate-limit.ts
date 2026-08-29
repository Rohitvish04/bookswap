import { HttpError } from '@/lib/auth';

type Bucket = { count: number; resetAt: number };

// ponytail: in-memory fixed window; swap for Redis/Upstash when running >1 instance.
const buckets = new Map<string, Bucket>();

/**
 * Throws 429 once `limit` hits occur inside `windowMs` for the same key.
 * Used on auth + payment + write endpoints.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    const secs = Math.ceil((b.resetAt - now) / 1000);
    throw new HttpError(429, `Too many attempts. Try again in ${secs} second${secs === 1 ? '' : 's'}.`);
  }

  // Opportunistic cleanup so the map cannot grow forever.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
}

export function clientIp(req: Request) {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local').slice(0, 64);
}
