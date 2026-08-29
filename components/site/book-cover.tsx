import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Book cover with a graceful fallback so listings never show a broken image. */
export function BookCover({ src, title, className }: { src?: string | null; title: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Cover of ${title}`} className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div className={cn('flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/15 to-secondary/15 p-3 text-center', className)}>
      <BookOpen className="h-8 w-8 text-primary/60" />
      <span className="line-clamp-3 text-xs font-medium text-muted-foreground">{title}</span>
    </div>
  );
}
