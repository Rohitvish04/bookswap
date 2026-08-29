import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gradient-hero flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-5 w-5" />
        </span>
        BookSwap
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}
