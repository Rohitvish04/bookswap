'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookMarked, PlusCircle, Search, Repeat, History,
  Heart, MessageSquare, Bell, User, MapPin, Settings, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/books', label: 'My Books', icon: BookMarked },
  { href: '/dashboard/books/new', label: 'Add Book', icon: PlusCircle },
  { href: '/dashboard/discover', label: 'Discover Books', icon: Search },
  { href: '/dashboard/exchanges/requests', label: 'Exchange Requests', icon: Repeat },
  { href: '/dashboard/exchanges', label: 'My Exchanges', icon: History, exact: true },
  { href: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/address', label: 'Address & Location', icon: MapPin },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="h-4.5 w-4.5" />
        </span>
        BookSwap
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

export function MobileDashboardNav() {
  const pathname = usePathname();
  return (
    <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
              active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
