import { describe, it, expect } from 'vitest';
import { slugify, normalizeTitle, formatINR, exchangeCode, initials } from '@/lib/utils';

describe('slugify', () => {
  it('lowercases and dashes words', () => {
    expect(slugify('Atomic Habits')).toBe('atomic-habits');
  });
  it('strips punctuation', () => {
    expect(slugify("Harry Potter & the Philosopher's Stone")).toBe('harry-potter-the-philosopher-s-stone');
  });
  it('trims leading/trailing dashes', () => {
    expect(slugify('  --Weird Title--  ')).toBe('weird-title');
  });
});

describe('normalizeTitle', () => {
  it('treats punctuation/case differences as equal', () => {
    expect(normalizeTitle('Rich Dad, Poor Dad')).toBe(normalizeTitle('rich dad poor dad'));
  });
});

describe('formatINR', () => {
  it('formats paise as rupees', () => {
    expect(formatINR(4900)).toContain('49');
  });
});

describe('exchangeCode', () => {
  it('has the EX- prefix and 6 trailing chars', () => {
    const code = exchangeCode();
    expect(code).toMatch(/^EX-[A-Z0-9]{6}$/);
  });
});

describe('initials', () => {
  it('takes first letters of first two words', () => {
    expect(initials('Rohit Sharma')).toBe('RS');
  });
  it('handles single names', () => {
    expect(initials('Cher')).toBe('C');
  });
});
