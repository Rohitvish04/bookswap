import type { Metadata } from 'next';
import { BooksAdminClient } from './books-admin-client';

export const metadata: Metadata = { title: 'Manage Books' };

export default function AdminBooksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Books</h1>
      <p className="mt-1 text-muted-foreground">Moderate listings across the platform.</p>
      <div className="mt-6">
        <BooksAdminClient />
      </div>
    </div>
  );
}
