import { NextResponse, type NextRequest } from 'next/server';

const CSRF_COOKIE = 'bookswap_csrf';

/** Edge runtime has no `node:crypto` — use the Web Crypto API instead. */
function randomToken(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit CSRF check for every mutating API request: the cookie value
 * (readable, set here on first visit and refreshed at login) must match the
 * header the client echoes back. A cross-site form post can carry the
 * cookie automatically but can't read it to set the header, so forged
 * requests are rejected here before any route handler runs.
 */
export function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith('/api/');
  const isWebhook = req.nextUrl.pathname.startsWith('/api/payments/webhook');

  if (isApi && !isWebhook && !SAFE_METHODS.has(req.method)) {
    const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
    const headerToken = req.headers.get('x-csrf-token');
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing CSRF token. Please refresh and try again.' }, { status: 403 });
    }
  }

  const res = NextResponse.next();
  // Issue the token on first visit (any request) so it exists before the user's first form submit.
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    res.cookies.set(CSRF_COOKIE, randomToken(), {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads/).*)'],
};
