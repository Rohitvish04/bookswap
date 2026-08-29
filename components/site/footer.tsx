import Link from 'next/link';
import { BookOpen } from 'lucide-react';

const columns = [
  {
    title: 'Platform',
    links: [
      { href: '/books', label: 'Browse Books' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/register', label: 'Create Account' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms & Conditions' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            BookSwap
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A community-driven book exchange platform. Trade the books you've read for the ones you
            want, near you — zero commission, no middlemen.
          </p>
          <p className="mt-3 text-xs font-medium text-success">Save books · Save paper · Save trees 🌱</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BookSwap. All rights reserved.
      </div>
    </footer>
  );
}
