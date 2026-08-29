'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, BookMarked, Heart, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const floatCard = {
  hidden: { opacity: 0, y: 30, rotate: 0 },
  show: (rotate: number) => ({
    opacity: 1,
    y: 0,
    rotate,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  }),
};

function DecorCard({
  rotate,
  className,
  label,
  title,
  icon: Icon,
  delay,
}: {
  rotate: number;
  className: string;
  label: string;
  title: string;
  icon: typeof BookMarked;
  delay: number;
}) {
  return (
    <motion.div
      custom={rotate}
      initial="hidden"
      animate="show"
      variants={floatCard}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      whileHover={{ rotate: 0, scale: 1.04 }}
      className={`absolute hidden h-44 w-32 rounded-2xl border border-black/5 p-4 shadow-lg lg:flex lg:flex-col lg:justify-between ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex h-full flex-col justify-between"
      >
        <Icon className="h-6 w-6 opacity-70" strokeWidth={1.5} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-60">{label}</p>
          <p className="font-serif text-base font-medium leading-tight">{title}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HeroSection({ feeLabel }: { feeLabel: string }) {
  return (
    <section className="relative overflow-hidden bg-[#FAF3E9]">
      {/* soften the hand-off into the next section instead of a hard color seam */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-card" />
      <div className="container relative py-24 md:py-32">
        {/* decorative flanking cards */}
        <DecorCard
          rotate={-10}
          className="left-2 top-10 bg-gradient-to-br from-secondary/30 to-secondary/10 text-secondary-foreground xl:left-12"
          label="Collection"
          title="My Bookshelf"
          icon={BookMarked}
          delay={0.15}
        />
        <DecorCard
          rotate={-4}
          className="left-24 top-40 bg-card text-foreground xl:left-40"
          label="Wishlist"
          title="Reading List"
          icon={Heart}
          delay={0.3}
        />
        <DecorCard
          rotate={9}
          className="right-24 top-8 bg-rose-100 text-rose-900 xl:right-40"
          label="Discover"
          title="New Match, 98%"
          icon={Sparkles}
          delay={0.2}
        />
        <DecorCard
          rotate={5}
          className="right-2 top-44 bg-primary/10 text-primary xl:right-12"
          label="Nearby"
          title="2.4 km away"
          icon={MapPin}
          delay={0.35}
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Your next great read is one swap away.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="max-w-md text-base text-muted-foreground md:text-lg"
          >
            No buying, no selling, no shipping bills — swap the books you've finished with readers
            in your own city. Books are always free; you pay only a {feeLabel} service fee per exchange.
          </motion.p>

          <motion.form
            action="/books"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="flex w-full max-w-md items-center rounded-full border border-border bg-card p-1.5 shadow-sm"
          >
            <Search className="ml-3 h-4.5 w-4.5 shrink-0 text-muted-foreground" />
            <input
              name="q"
              placeholder="Search by title, author, or ISBN..."
              className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none"
            />
            <Button type="submit" className="shrink-0 rounded-full">Search</Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-4 text-sm"
          >
            <Link href="/register" className="font-medium text-primary hover:underline">Create your free account</Link>
            <span className="text-border">·</span>
            <Link href="/how-it-works" className="font-medium text-muted-foreground hover:text-foreground">See how it works</Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
