import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

/** Appends a short suffix if the slug is taken so listings never collide. */
export async function uniqueBookSlug(title: string) {
  const base = slugify(title) || 'book';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.book.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export const publicBookInclude = {
  category: true,
  wantedBy: true,
  owner: {
    select: {
      id: true,
      fullName: true,
      createdAt: true,
      profile: { select: { avatarUrl: true, ratingAvg: true, ratingCount: true } },
      addresses: { where: { isDefault: true }, take: 1, select: { city: true, state: true, latitude: true, longitude: true } },
    },
  },
} satisfies Prisma.BookInclude;
