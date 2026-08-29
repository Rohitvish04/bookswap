import 'server-only';
import { cookies, headers } from 'next/headers';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type { Role, User } from '@prisma/client';

export const SESSION_COOKIE = 'bookswap_session';
export const CSRF_COOKIE = 'bookswap_csrf';
const SESSION_DAYS = 30;

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Constant-time compare for the double-submit CSRF token. */
export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  const h = await headers();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: h.get('user-agent')?.slice(0, 250) ?? null,
      ip: (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || null,
    },
  });

  const jar = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: expiresAt,
  });
  // Double-submit CSRF token: readable by JS, echoed back in a header.
  jar.set(CSRF_COOKIE, newToken(16), {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

export type SessionUser = Pick<
  User,
  'id' | 'fullName' | 'email' | 'role' | 'status' | 'emailVerifiedAt' | 'searchRadiusKm' | 'phone' | 'createdAt'
>;

/** Current user or null. Safe to call from server components and route handlers. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          emailVerifiedAt: true,
          searchRadiusKm: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.status !== 'ACTIVE') return null;
  return session.user;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'You must be signed in to do that.');
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) throw new HttpError(403, 'You do not have access to this resource.');
  return user;
}

export const requireAdmin = () => requireRole('ADMIN');
