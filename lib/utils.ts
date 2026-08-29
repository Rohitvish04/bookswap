import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Rupees from paise, formatted for India. */
export function formatINR(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

/** Case/punctuation-insensitive key used to match book titles across users. */
export function normalizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(d: Date | string) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
  ];
  let prev = 1;
  for (const [limit, unit] of steps) {
    if (secs < limit) {
      const n = Math.max(1, Math.floor(secs / prev));
      return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
    }
    prev = limit;
  }
  const years = Math.floor(secs / 31557600);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export const CONDITION_LABEL: Record<string, string> = {
  LIKE_NEW: 'Like New',
  VERY_GOOD: 'Very Good',
  GOOD: 'Good',
  ACCEPTABLE: 'Acceptable',
};

export const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  EXCHANGE_PENDING: 'Exchange Pending',
  EXCHANGED: 'Exchanged',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PAYMENT_PENDING: 'Payment Pending',
  PAID: 'Paid',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  EXPIRED: 'Expired',
};

/** Short human-readable exchange code, e.g. EX-7F3K2Q. */
export function exchangeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `EX-${out}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
