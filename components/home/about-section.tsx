'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, HeartHandshake, Leaf } from 'lucide-react';

const values = [
  { icon: BookOpen, label: 'Books deserve a second life' },
  { icon: Users, label: 'Community over commerce' },
  { icon: HeartHandshake, label: 'Trust & safety first' },
  { icon: Leaf, label: 'Save books, save paper, save trees' },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-card py-24">
      <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-secondary">About BookSwap</p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-4xl">
            A trade economy for readers,
            <br />
            <span className="text-primary">not another marketplace.</span>
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              BookSwap started with a simple frustration: shelves full of books we'd already read,
              and wishlists full of books we hadn't. Instead of buying more, we built a platform
              where readers trade directly with each other — a book for a book, with zero commission
              and no middlemen.
            </p>
            <p>
              Your finished books are your currency. Every swap keeps a great story in circulation,
              saves someone money, and spares the paper for a brand-new copy.
            </p>
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          {values.map((v, i) => (
            <motion.div
              key={v.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-[#FAF3E9] p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-snug">{v.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
