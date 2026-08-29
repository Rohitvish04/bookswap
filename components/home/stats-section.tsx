'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { BookMarked, Users, Repeat, MapPin, type LucideIcon } from 'lucide-react';

type Stat = { label: string; icon: LucideIcon };

const stats: Stat[] = [
  { label: 'Books listed', icon: BookMarked },
  { label: 'Active readers', icon: Users },
  { label: 'Completed exchanges', icon: Repeat },
  { label: 'Cities covered', icon: MapPin },
];

export function StatsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section className="border-b border-border bg-card">
      <div ref={containerRef} className="container grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className="group relative text-center sm:border-l sm:border-border sm:first:border-l-0"
          >
            <motion.div
              initial={{ scale: 0, rotate: -8 }}
              animate={inView ? { scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            >
              <s.icon className="h-5 w-5" />
            </motion.div>
            <div className="text-sm font-medium text-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
