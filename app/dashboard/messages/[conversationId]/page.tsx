import type { Metadata } from 'next';
import { ChatThread } from './chat-thread';

export const metadata: Metadata = { title: 'Conversation' };

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Conversation</h1>
      <ChatThread conversationId={conversationId} />
    </div>
  );
}
