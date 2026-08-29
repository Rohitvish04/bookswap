'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn, initials } from '@/lib/utils';

type Testimonial = {
  name: string;
  city: string;
  quote: string;
  tone: string;
  offset: string;
};

const testimonials: Testimonial[] = [
  {
    name: 'Ananya R.',
    city: 'Pune',
    quote: 'Traded 3 books in my first week. So much better than letting them collect dust on my shelf.',
    tone: 'bg-primary/10 text-primary',
    offset: 'md:mt-10',
  },
  {
    name: 'Rohit S.',
    city: 'Bengaluru',
    quote: 'The distance filter is great — met someone 2 km away for a coffee-shop swap the same weekend.',
    tone: 'bg-secondary/20 text-secondary-foreground',
    offset: 'md:mt-0',
  },
  {
    name: 'Meera K.',
    city: 'Delhi',
    quote: "Loved that I didn't have to pay for the book itself, just a tiny service fee. Brilliant idea.",
    tone: 'bg-success/15 text-success',
    offset: 'md:mt-10',
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-card py-24">
      {/* oversized ghost quote mark */}
      <Quote className="pointer-events-none absolute -top-6 left-1/2 h-48 w-48 -translate-x-1/2 text-muted/60" strokeWidth={1} />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-secondary">Testimonials</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Loved by Readers</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">Real swaps, real readers, from cities across India.</p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 32, rotate: i % 2 === 0 ? -1.5 : 1.5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' }}
              whileHover={{ y: -8, rotate: i % 2 === 0 ? -1 : 1 }}
              className={cn(
                'relative flex flex-col rounded-2xl border border-border bg-[#FAF3E9] p-7 shadow-sm transition-shadow hover:shadow-xl',
                t.offset,
              )}
            >
              <Quote className="absolute right-6 top-6 h-6 w-6 text-secondary/40" />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 + 0.3 + s * 0.06, type: 'spring', stiffness: 260, damping: 15 }}
                  >
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                  </motion.span>
                ))}
              </div>
              <blockquote className="mt-4 font-serif text-lg leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 pt-6">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold', t.tone)}>
                  {initials(t.name)}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.city}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
