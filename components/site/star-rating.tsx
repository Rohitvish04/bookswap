'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(!readOnly && 'cursor-pointer', readOnly && 'cursor-default')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={n <= Math.round(value) ? 'fill-secondary text-secondary' : 'fill-transparent text-muted-foreground'}
          />
        </button>
      ))}
    </div>
  );
}
