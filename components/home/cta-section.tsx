'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Repeat, Heart, Sparkles } from 'lucide-react';

const floatingIcons = [
  { icon: BookOpen, className: 'left-[8%] top-[18%]', delay: 0, duration: 5 },
  { icon: Repeat, className: 'right-[10%] top-[22%]', delay: 0.8, duration: 6 },
  { icon: Heart, className: 'left-[16%] bottom-[20%]', delay: 0.4, duration: 5.5 },
  { icon: Sparkles, className: 'right-[16%] bottom-[24%]', delay: 1.2, duration: 6.5 },
];

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#111014] py-24 text-white md:py-32">
      {/* brand glows on the dark stage */}
      <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />

      {/* floating book-world icons */}
      {floatingIcons.map(({ icon: Icon, className, delay, duration }, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + delay * 0.3, type: 'spring', stiffness: 180, damping: 14 }}
          className={`absolute hidden md:block ${className}`}
        >
          <motion.span
            animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
            transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 backdrop-blur"
          >
            <Icon className="h-5 w-5" />
          </motion.span>
        </motion.span>
      ))}

      <div className="container relative flex flex-col items-center gap-7 text-center">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary"
        >
          <Sparkles className="h-3 w-3" /> Join the community
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
          className="max-w-2xl font-serif text-4xl font-bold leading-tight md:text-5xl"
        >
          Ready to give your books
          <br />
          <span className="text-secondary">a second life?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
          className="max-w-md text-white/60"
        >
          Join readers across India exchanging books, discovering new stories, and saving money.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.55, delay: 0.24, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-secondary-foreground shadow-lg shadow-secondary/25"
            >
              Create your free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.span>
          <Link href="/books" className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline">
            or browse the library first
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
