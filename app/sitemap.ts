export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const staticRoutes = ['', '/books', '/about', '/how-it-works', '/contact', '/faq', '/terms', '/privacy', '/login', '/register'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const books = await prisma.book.findMany({
    where: { status: 'AVAILABLE', moderation: 'APPROVED' },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });

  const bookRoutes = books.map((b) => ({ url: `${base}/books/${b.slug}`, lastModified: b.updatedAt }));

  return [...staticRoutes, ...bookRoutes];
}
