import type { Metadata } from 'next';
import { MessagesClient } from './messages-client';

export const metadata: Metadata = { title: 'Messages' };

export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="mt-1 text-muted-foreground">Conversations open once an exchange request exists between two users.</p>
      <div className="mt-6">
        <MessagesClient />
      </div>
    </div>
  );
}
