'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ArrowRight, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Do I have to pay for the books I receive?',
    a: 'No. BookSwap is a pure exchange — you give a book, you get a book. You only pay a small, admin-configured service fee to confirm the exchange.',
  },
  {
    q: 'Is my home address visible to other users?',
    a: 'Never. Only your city, state, and an approximate distance (e.g. "2.4 km away") are shown. Your exact address stays private.',
  },
  {
    q: 'What if the other person only wants a different book from me?',
    a: 'You can send a counter-offer proposing a different book from your shelf. Both sides must agree before it becomes final.',
  },
  {
    q: 'How does payment work?',
    a: 'Once both sides accept, the requester pays the configurable service fee via Razorpay. Payment is verified on our server before the exchange is confirmed.',
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-hidden bg-[#FAF3E9] py-24">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

      <div className="container relative grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        {/* sticky intro column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary shadow-sm">
            <MessageCircleQuestion className="h-3 w-3" /> FAQ
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            Questions?
            <br />
            <span className="text-primary">We have answers.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Everything you need to know about swapping books, fees, and staying safe on BookSwap.
          </p>
          <Link
            href="/faq"
            className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            View all FAQs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* accordion */}
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-card transition-colors',
                  isOpen ? 'border-primary/30 shadow-lg' : 'border-black/5 shadow-sm hover:border-primary/20',
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="flex items-center gap-4">
                    <span className={cn('font-serif text-lg font-semibold transition-colors', isOpen ? 'text-primary' : 'text-foreground/20')}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold md:text-base">{f.q}</span>
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                      isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <p className="px-6 pb-5 pl-[4.25rem] text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
