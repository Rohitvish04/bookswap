'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Menu, X, Bell, LogOut, LayoutDashboard, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, initials } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import type { SessionUser } from '@/lib/auth';

// How It Works and FAQ live as sections on the homepage — the nav scrolls to
// them SPA-style (smooth scroll via globals.css) instead of loading new pages.
const links = [
  { href: '/books', label: 'Browse Books' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#about', label: 'About' },
  { href: '/#faq', label: 'FAQ' },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    apiFetch<{ count: number }>('/api/notifications/unread-count').then((res) => {
      if (res.ok) setUnread(res.data.count);
    });
  }, [user, pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    const res = await apiFetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      toast.success('Signed out.');
      router.push('/');
      router.refresh();
    }
  }

  const isActive = (href: string) =>
    href.startsWith('/#') ? false : href === '/books' ? pathname.startsWith('/books') : pathname === href;

  return (
    <motion.header
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={cn(
        'sticky top-0 z-40 bg-background/85 backdrop-blur transition-shadow',
        scrolled ? 'shadow-[0_8px_30px_-18px_rgba(0,0,0,0.3)]' : 'border-b border-transparent',
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.05 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <BookOpen className="h-4.5 w-4.5" />
          </motion.span>
          BookSwap
        </Link>

        {/* pill nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                isActive(l.href)
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-[#FAF3E9] hover:text-foreground',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/dashboard/notifications" className="relative rounded-full p-2 hover:bg-muted">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pr-1">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-shadow hover:ring-primary/40">
                      <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><Shield className="h-4 w-4" /> Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button asChild className="group rounded-full">
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.span>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="border-t border-border bg-background px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium">
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium">Dashboard</Link>
                {user.role === 'ADMIN' && <Link href="/admin" className="text-sm font-medium">Admin Panel</Link>}
                <button onClick={handleLogout} className="text-left text-sm font-medium text-destructive">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium">Log in</Link>
                <Link href="/register" className="text-sm font-medium text-primary">Get Started</Link>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
