import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BooksClient } from './books-client';

export const metadata: Metadata = { title: 'My Books' };

export default function MyBooksPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Books</h1>
          <p className="text-muted-foreground">Manage the books you've listed for exchange.</p>
        </div>
        <Button asChild><Link href="/dashboard/books/new"><Plus className="h-4 w-4" /> Add Book</Link></Button>
      </div>
      <BooksClient />
    </div>
  );
}
