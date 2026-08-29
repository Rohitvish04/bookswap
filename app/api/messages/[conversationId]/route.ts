import { prisma } from '@/lib/db';
import { ok, handleError, parseBody } from '@/lib/api';
import { requireUser, HttpError } from '@/lib/auth';
import { messageSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { notify } from '@/lib/notify';

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new HttpError(403, 'You do not have access to this conversation.');
  return participant;
}

export async function GET(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await requireUser();
    const { conversationId } = await params;
    await assertParticipant(conversationId, user.id);

    const [messages] = await Promise.all([
      prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } }),
      prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: user.id } },
        data: { lastReadAt: new Date() },
      }),
      prisma.message.updateMany({
        where: { conversationId, senderId: { not: user.id }, readAt: null },
        data: { readAt: new Date() },
      }),
    ]);

    return ok(messages);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await requireUser();
    rateLimit(`message:${user.id}`, 60, 60_000);
    const { conversationId } = await params;
    await assertParticipant(conversationId, user.id);
    const { body } = await parseBody(req, messageSchema);

    const message = await prisma.message.create({ data: { conversationId, senderId: user.id, body } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const other = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId: { not: user.id } } });
    if (other) {
      await notify(other.userId, 'NEW_MESSAGE', 'New message', `${user.fullName} sent you a message.`, `/dashboard/messages/${conversationId}`);
    }

    return ok(message, 201);
  } catch (err) {
    return handleError(err);
  }
}
