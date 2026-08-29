import { prisma } from '@/lib/db';
import { ok, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();

    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      include: {
        exchange: { select: { id: true, code: true, status: true, offeredBook: true, requestedBook: true, requesterId: true, responderId: true } },
        participants: { include: { user: { select: { id: true, fullName: true, profile: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const mine = c.participants.find((p) => p.userId === user.id);
        const unread = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: user.id },
            createdAt: mine?.lastReadAt ? { gt: mine.lastReadAt } : undefined,
          },
        });
        const other = c.participants.find((p) => p.userId !== user.id)?.user;
        return { ...c, otherUser: other, unread };
      }),
    );

    return ok(withUnread);
  } catch (err) {
    return handleError(err);
  }
}
