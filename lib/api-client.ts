'use client';

// Reads the readable CSRF cookie and echoes it back as a header (double-submit
// pattern) so cross-site requests can't ride the session cookie.
function csrfToken() {
  const match = document.cookie.match(/(?:^|; )bookswap_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function apiFetch<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? (options.body ? 'POST' : 'GET');
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        'x-csrf-token': csrfToken(),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
    });
    const json = (await res.json().catch(() => ({ ok: false, error: 'Unexpected server response.' }))) as ApiResult<T>;
    return json;
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}
