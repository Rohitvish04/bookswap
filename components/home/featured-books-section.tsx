'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, MapPin, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BookCover } from '@/components/site/book-cover';
import { CONDITION_LABEL, cn } from '@/lib/utils';

export type FeaturedBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string | null;
  condition: string;
  city: string | null;
};

export function FeaturedBooksSection({ books }: { books: FeaturedBook[] }) {
  const items = books.slice(0, 4);
  const [active, setActive] = useState(0);

  if (items.length === 0) {
    return (
      <section className="bg-[#FAF3E9] py-24">
        <div className="container text-center text-muted-foreground">No books listed yet — be the first!</div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#FAF3E9] py-24">
      {/* faint grid lines like the reference */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container relative">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary shadow-sm">
              <Library className="h-3 w-3" /> Library
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              Fresh from the
              <br />
              <span className="text-primary">community shelf.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col items-start gap-4 md:items-end md:text-right"
          >
            <p className="max-w-xs text-sm text-muted-foreground">
              Every book here belongs to a real reader near you — ready to trade for something on their list.
            </p>
            <Link
              href="/books"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-md transition-transform hover:scale-[1.03]"
            >
              Explore More
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* expanding card row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="mt-12 flex flex-col gap-4 md:h-[420px] md:flex-row"
        >
          {items.map((book, i) => {
            const isActive = i === active;
            const number = String(i + 1).padStart(2, '0');
            return (
              <motion.div
                key={book.id}
                layout
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                animate={{ flexGrow: isActive ? 2.4 : 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                className={cn(
                  'relative flex min-h-[120px] basis-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/5 shadow-sm transition-shadow',
                  isActive ? 'bg-card shadow-xl' : 'bg-card/60 hover:shadow-md',
                )}
              >
                <Link href={`/books/${book.slug}`} className="flex h-full flex-col p-6 outline-none">
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex h-full flex-col"
                      >
                        {/* stage: tinted backdrop with a standing book mockup */}
                        <div className="relative flex h-40 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-[#FAF3E9] to-secondary/20 md:h-44">
                          <span className="absolute left-5 top-5 h-6 w-6 rounded-full bg-primary/15" />
                          <span className="absolute right-8 top-8 h-3 w-3 rounded-full bg-secondary/30" />
                          <span className="absolute bottom-6 left-9 h-4 w-4 rounded-full bg-secondary/20" />
                          <Badge className="absolute right-3 top-3 border-transparent bg-card/90 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
                            {CONDITION_LABEL[book.condition]}
                          </Badge>
                          <motion.div
                            initial={{ y: 16, rotate: -3 }}
                            animate={{ y: 6, rotate: -3 }}
                            whileHover={{ y: 0, rotate: 0, scale: 1.04 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                            className="h-[85%] w-24 overflow-hidden rounded-md rounded-b-none border border-black/10 border-b-0 bg-card shadow-[0_18px_30px_-12px_rgba(0,0,0,0.35)]"
                          >
                            <BookCover src={book.coverUrl} title={book.title} />
                          </motion.div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          {book.city && (
                            <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {book.city}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 font-serif text-xl font-bold leading-snug">{book.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">by {book.author}</p>
                        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                          <span className="text-xs font-medium text-muted-foreground">Available for exchange</span>
                          <span className="group/cta inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            View book <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex h-full flex-col"
                      >
                        <span className="font-serif text-5xl font-semibold text-foreground/10">{number}.</span>
                        <div className="mt-auto">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary-foreground">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
