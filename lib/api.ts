import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type output } from 'zod';
import { Prisma } from '@prisma/client';
import { HttpError } from '@/lib/auth';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Single place where every thrown error becomes a clean JSON response. */
export function handleError(err: unknown) {
  if (err instanceof HttpError) return fail(err.message, err.status);

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || '_';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail(err.issues[0]?.message ?? 'Invalid input.', 422, { fieldErrors });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return fail('That record already exists.', 409);
    if (err.code === 'P2025') return fail('Record not found.', 404);
    if (err.code === 'P2003') return fail('Related record is missing or in use.', 409);
  }

  console.error('[api]', err);
  return fail('Something went wrong on our side. Please try again.', 500);
}

/** Parse + validate a JSON body. Throws ZodError which handleError formats. */
export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
  return schema.parse(json);
}

export function parseQuery<S extends ZodTypeAny>(req: Request, schema: S): output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}
