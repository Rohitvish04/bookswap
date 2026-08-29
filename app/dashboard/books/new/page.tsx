import type { Metadata } from 'next';
import { BookForm } from '@/components/dashboard/book-form';

export const metadata: Metadata = { title: 'Add Book' };

export default function NewBookPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Add a Book</h1>
      <p className="mt-1 text-muted-foreground">List a book you own and tell us what you'd like in return.</p>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <BookForm />
      </div>
    </div>
  );
}
