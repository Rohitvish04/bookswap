'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, MapPin, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Benefit = {
  number: string;
  icon: LucideIcon;
  tile: string;
  title: string;
  description: string;
  offset: string;
};

const benefits: Benefit[] = [
  {
    number: '01',
    icon: ShieldCheck,
    tile: 'bg-primary',
    title: 'Safe by Design',
    description: 'Your exact address is never shown publicly — other readers only see an approximate distance.',
    offset: 'md:mt-0',
  },
  {
    number: '02',
    icon: Sparkles,
    tile: 'bg-secondary',
    title: 'Smart Matching',
    description: 'A scoring engine finds the best possible trade for both sides, not just any trade.',
    offset: 'md:mt-14',
  },
  {
    number: '03',
    icon: MapPin,
    tile: 'bg-success',
    title: 'Readers Near You',
    description: 'Filter matches by 5, 10, 25, 50 km — or search anywhere across India.',
    offset: 'md:mt-0',
  },
  {
    number: '04',
    icon: Users,
    tile: 'bg-foreground',
    title: 'Community Trust',
    description: 'Ratings and reviews after every completed exchange keep the community honest.',
    offset: 'md:mt-14',
  },
];

export function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-[#FAF3E9] py-24 md:py-32">
      {/* soft brand-tinted glows to match the hero */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-secondary">Why Choose Us</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Why Readers Choose BookSwap</h2>
        </motion.div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-12 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {benefits.map((b, i) => (
            <motion.div
              key={b.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              className={cn('group', b.offset)}
            >
              <div className="flex items-start justify-between">
                <motion.span
                  whileHover={{ rotate: -6, scale: 1.08 }}
                  className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md transition-shadow group-hover:shadow-lg', b.tile)}
                >
                  <b.icon className="h-5 w-5" />
                </motion.span>
                <span className="text-sm font-medium text-muted-foreground">{b.number}</span>
              </div>
              <h3 className="mt-6 text-sm font-bold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
