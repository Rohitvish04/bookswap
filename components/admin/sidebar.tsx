'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BookMarked, Repeat, CreditCard, Tags,
  Flag, Star, Bell, Percent, Settings, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/books', label: 'Books', icon: BookMarked },
  { href: '/admin/exchanges', label: 'Exchanges', icon: Repeat },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/fees', label: 'Fees', icon: Percent },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Shield className="h-4.5 w-4.5" /></span>
        Admin Panel
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
