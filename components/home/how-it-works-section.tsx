'use client';

import { motion } from 'framer-motion';
import { BookMarked, Sparkles, Repeat, HandCoins, ChevronDown, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  accent: {
    text: string;
    badge: string;
    cardTint: string;
    dot: string;
  };
};

const steps: Step[] = [
  {
    number: '01',
    icon: BookMarked,
    title: 'List Your Books',
    description: "Add books you own with a cover photo, condition, and description. Tell us which titles you're hoping to find in return.",
    bullets: ['2-minute listing', 'No shipping required', 'List as many as you like'],
    accent: { text: 'text-sky-600', badge: 'bg-sky-500', cardTint: 'bg-sky-50', dot: 'bg-sky-200' },
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'We Find Your Matches',
    description: 'Our matching engine instantly scans nearby readers for books you want — direct swaps, one-sided offers, and multi-book trades.',
    bullets: ['Smart match scoring', 'Distance-aware', 'Updated in real time'],
    accent: { text: 'text-fuchsia-600', badge: 'bg-fuchsia-500', cardTint: 'bg-fuchsia-50', dot: 'bg-fuchsia-200' },
  },
  {
    number: '03',
    icon: Repeat,
    title: 'Request the Exchange',
    description: 'Send a request offering one of your books in return. Message the other reader and agree on a handover.',
    bullets: ['One-click request', 'Built-in messaging', 'Counter-offers supported'],
    accent: { text: 'text-emerald-600', badge: 'bg-emerald-500', cardTint: 'bg-emerald-50', dot: 'bg-emerald-200' },
  },
  {
    number: '04',
    icon: HandCoins,
    title: 'Pay the Fee and Meet Up',
    description: 'Pay a small, transparent service fee to confirm the swap, then meet nearby or arrange delivery to complete it.',
    bullets: ['Secure Razorpay checkout', 'Meet nearby or deliver', 'Rate each other after'],
    accent: { text: 'text-orange-600', badge: 'bg-orange-500', cardTint: 'bg-orange-50', dot: 'bg-orange-200' },
  },
];

function StepCard({ step, reverse }: { step: Step; reverse: boolean }) {
  const Icon = step.icon;

  return (
    <div className={cn('grid items-center gap-10 md:grid-cols-2', reverse && 'md:[&>*:first-child]:order-2')}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 30 : -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className={cn('font-serif text-5xl font-semibold', step.accent.text)}>{step.number}</div>
        <div className="mt-3 flex items-center gap-3">
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', step.accent.badge)}>
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        <ul className="mt-4 space-y-2">
          {step.bullets.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground">
              <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', step.accent.cardTint)}>
                <Check className={cn('h-2.5 w-2.5', step.accent.text)} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: reverse ? -30 : 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        className={cn('relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-lg', step.accent.cardTint)}
      >
        <span className={cn('absolute right-6 top-6 h-8 w-8 rounded-full opacity-70', step.accent.dot)} />
        <span className={cn('absolute bottom-8 left-8 h-12 w-12 rounded-full opacity-50', step.accent.dot)} />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className={cn('flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-md')}
        >
          <Icon className={cn('h-10 w-10', step.accent.text)} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24">
      {/* soft blurred gradient blobs */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-fuchsia-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> Simple Process
          </span>
          <h2 className="mt-4 text-3xl font-bold md:text-4xl">How BookSwap Works</h2>
          <p className="mt-3 text-muted-foreground">From listing your first book to a completed exchange, in four simple steps.</p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl space-y-4">
          {steps.map((step, i) => (
            <div key={step.number}>
              <StepCard step={step} reverse={i % 2 === 1} />
              {i < steps.length - 1 && (
                <div className="flex justify-center py-6">
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
                  </motion.div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
