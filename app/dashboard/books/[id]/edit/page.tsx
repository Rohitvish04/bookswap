import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { BookForm } from '@/components/dashboard/book-form';

export const metadata: Metadata = { title: 'Edit Book' };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const book = await prisma.book.findUnique({ where: { id }, include: { wantedBy: true } });
  if (!book) notFound();
  if (book.ownerId !== user.id) redirect('/dashboard/books');

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Edit Book</h1>
      <p className="mt-1 text-muted-foreground">Update the details for "{book.title}".</p>
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <BookForm
          bookId={book.id}
          defaultValues={{
            title: book.title,
            author: book.author,
            isbn: book.isbn ?? '',
            description: book.description ?? '',
            categoryId: book.categoryId ?? '',
            language: book.language,
            edition: book.edition ?? '',
            publishYear: book.publishYear,
            condition: book.condition,
            coverUrl: book.coverUrl ?? '',
            available: book.available,
            wantedBooks: book.wantedBy.length ? book.wantedBy.map((w) => ({ title: w.title, author: w.author ?? '' })) : [{ title: '', author: '' }],
          }}
        />
      </div>
    </div>
  );
}
