import { prisma } from '@/lib/db';
import type { NotificationType } from '@prisma/client';

/** One place that creates a notification row. Never throws — best-effort side effect. */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  try {
    await prisma.notification.create({ data: { userId, type, title, body, link } });
  } catch (err) {
    console.error('[notify] failed', err);
  }
}
