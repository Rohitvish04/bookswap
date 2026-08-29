import type { Metadata } from 'next';
import { UsersClient } from './users-client';

export const metadata: Metadata = { title: 'Manage Users' };

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-muted-foreground">Search, review, and manage BookSwap accounts.</p>
      <div className="mt-6">
        <UsersClient />
      </div>
    </div>
  );
}
