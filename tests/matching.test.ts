import { describe, it, expect } from 'vitest';
import { scoreMatch } from '@/lib/matching';
import type { Book, WantedBook } from '@prisma/client';

function makeBook(overrides: Partial<Book> & { wantedBy?: WantedBook[] }): Book & { wantedBy: WantedBook[] } {
  return {
    id: 'book-1',
    slug: 'book-1',
    ownerId: 'user-1',
    title: 'Untitled',
    author: 'Someone',
    isbn: null,
    description: null,
    categoryId: null,
    language: 'English',
    edition: null,
    publishYear: null,
    condition: 'GOOD',
    coverUrl: null,
    status: 'AVAILABLE',
    moderation: 'APPROVED',
    available: true,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    wantedBy: [],
    ...overrides,
  } as Book & { wantedBy: WantedBook[] };
}

describe('scoreMatch', () => {
  it('scores a direct (mutual) match higher than a one-sided match', () => {
    const theirBookDirect = makeBook({
      id: 'their-1',
      title: 'Rich Dad Poor Dad',
      wantedBy: [{ id: 'w1', bookId: 'their-1', title: 'Atomic Habits', author: null, createdAt: new Date() }],
    });
    const myBook = makeBook({ id: 'my-1', title: 'Atomic Habits' });

    const direct = scoreMatch({ theirBook: theirBookDirect, myBook, distanceKm: 2, maxDistanceKm: 25 });

    const theirBookOneSided = makeBook({ id: 'their-2', title: 'Rich Dad Poor Dad', wantedBy: [] });
    const oneSided = scoreMatch({ theirBook: theirBookOneSided, myBook, distanceKm: 2, maxDistanceKm: 25 });

    expect(direct).not.toBeNull();
    expect(oneSided).not.toBeNull();
    expect(direct!.score).toBeGreaterThan(oneSided!.score);
  });

  it('rejects matches outside the requested radius', () => {
    const theirBook = makeBook({ title: 'Some Book' });
    const myBook = makeBook({ title: 'Other Book' });
    const result = scoreMatch({ theirBook, myBook, distanceKm: 100, maxDistanceKm: 25 });
    expect(result).toBeNull();
  });

  it('allows any distance when maxDistanceKm is 0 (anywhere)', () => {
    const theirBook = makeBook({ title: 'Some Book' });
    const myBook = makeBook({ title: 'Other Book' });
    const result = scoreMatch({ theirBook, myBook, distanceKm: 500, maxDistanceKm: 0 });
    expect(result).not.toBeNull();
  });

  it('rewards better book condition', () => {
    const myBook = makeBook({ title: 'Other Book' });
    const likeNew = scoreMatch({ theirBook: makeBook({ condition: 'LIKE_NEW' }), myBook, distanceKm: 5, maxDistanceKm: 25 });
    const acceptable = scoreMatch({ theirBook: makeBook({ condition: 'ACCEPTABLE' }), myBook, distanceKm: 5, maxDistanceKm: 25 });
    expect(likeNew!.score).toBeGreaterThan(acceptable!.score);
  });

  it('caps score at 100', () => {
    const theirBook = makeBook({
      condition: 'LIKE_NEW',
      categoryId: 'cat-1',
      title: 'X',
      wantedBy: [{ id: 'w', bookId: 'x', title: 'Y', author: null, createdAt: new Date() }],
    });
    const myBook = makeBook({ title: 'Y', categoryId: 'cat-1' });
    const result = scoreMatch({ theirBook, myBook, distanceKm: 0, maxDistanceKm: 0 });
    expect(result!.score).toBeLessThanOrEqual(100);
  });
});
