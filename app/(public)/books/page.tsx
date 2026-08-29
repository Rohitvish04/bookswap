export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { BookX, SlidersHorizontal } from 'lucide-react';
import { prisma } from '@/lib/db';
import { bookQuerySchema } from '@/lib/validation';
import { buildBookWhere } from '@/lib/book-query';
import { publicBookInclude } from '@/lib/book-service';
import { BookCover } from '@/components/site/book-cover';
import { EmptyState } from '@/components/site/empty-state';
import { CONDITION_LABEL, cn } from '@/lib/utils';
import { BrowseFilters } from './browse-filters';

export const metadata: Metadata = { title: 'Browse Books', description: 'Search and filter books available for exchange on BookSwap.' };

export default async function BrowseBooksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = bookQuerySchema.parse(sp);
  const where = buildBookWhere(q);

  const [total, books, categories] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      include: publicBookInclude,
      orderBy: q.sort === 'popular' ? { viewCount: 'desc' } : { createdAt: 'desc' },
      skip: (q.page - 1) * q.perPage,
      take: q.perPage,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        books: {
          where: { status: 'AVAILABLE', available: true, moderation: 'APPROVED' },
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: { id: true, coverUrl: true, title: true },
        },
        _count: { select: { books: { where: { status: 'AVAILABLE', available: true, moderation: 'APPROVED' } } } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / q.perPage));
  const activeCategory = categories.find((c) => c.id === q.category);
  const pageTitle = q.q ? `“${q.q}”` : activeCategory?.name ?? 'Library';
  const categoriesWithBooks = categories.filter((c) => c.books.length > 0);

  return (
    <div className="bg-background">
      {/* editorial header: giant title left, category shelf right */}
      <div className="container grid items-end gap-10 pb-6 pt-12 lg:grid-cols-[1fr_auto]">
        <h1 className="break-words font-serif text-5xl font-bold leading-none tracking-tight md:text-7xl">
          {pageTitle}
        </h1>

        {categoriesWithBooks.length > 0 && (
          <div className="scrollbar-thin -mx-4 flex gap-px overflow-x-auto border border-border bg-border px-0 lg:mx-0 lg:max-w-[560px]">
            {categoriesWithBooks.map((cat) => {
              const isActive = cat.id === q.category;
              const params = new URLSearchParams();
              if (!isActive) params.set('category', cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/books${params.toString() ? `?${params.toString()}` : ''}`}
                  className={cn(
                    'group flex w-32 shrink-0 flex-col bg-card px-4 pb-3 pt-4 transition-colors hover:bg-[#FAF3E9]',
                    isActive && 'bg-[#FAF3E9]',
                  )}
                >
                  <div className="flex h-20 items-end justify-center gap-1">
                    {cat.books.map((b) => (
                      <div key={b.id} className="h-16 w-11 overflow-hidden shadow-sm transition-transform group-hover:-translate-y-0.5">
                        <BookCover src={b.coverUrl} title={b.title} />
                      </div>
                    ))}
                  </div>
                  <span className={cn('mt-3 text-xs font-semibold', isActive && 'underline underline-offset-4')}>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* filter & sort bar */}
      <div className="border-y border-border">
        <div className="container">
          <details className="group py-3" open={!!(q.q || q.category || q.condition || q.language || q.city)}>
            <summary className="flex cursor-pointer list-none items-center justify-between marker:content-none">
              <span className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter &amp; Sort
              </span>
              <span className="text-sm text-muted-foreground">{total} Item{total === 1 ? '' : 's'}</span>
            </summary>
            <div className="pb-2 pt-4">
              <BrowseFilters categories={categories} />
            </div>
          </details>
        </div>
      </div>

      {/* editorial product grid */}
      <div className="container py-10">
        {books.length === 0 ? (
          <EmptyState icon={BookX} title="No books found" description="Try adjusting your filters or search a different title." />
        ) : (
          <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`} className="group flex flex-col bg-card">
                <div className="flex aspect-[5/4] items-center justify-center bg-muted/60 p-8 transition-colors group-hover:bg-[#FAF3E9]">
                  <div className="h-full max-h-52 w-auto overflow-hidden shadow-[0_14px_28px_-10px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-[1.03]">
                    <BookCover src={book.coverUrl} title={book.title} className="!h-full !w-auto" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-5">
                  <h3 className="line-clamp-1 font-serif text-base font-bold">{book.title}</h3>
                  <p className="line-clamp-1 font-serif text-sm italic text-muted-foreground">
                    {book.category?.name ?? 'Uncategorised'}
                  </p>
                  <p className="line-clamp-1 text-sm font-medium">{book.author}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{CONDITION_LABEL[book.condition]}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const params = new URLSearchParams(sp as Record<string, string>);
              params.set('page', String(page));
              return (
                <Link
                  key={page}
                  href={`/books?${params.toString()}`}
                  className={`flex h-9 w-9 items-center justify-center border text-sm ${page === q.page ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-muted'}`}
                >
                  {page}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
