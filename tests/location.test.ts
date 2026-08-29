import { describe, it, expect } from 'vitest';
import { haversineKm, describeDistance, publicLocation } from '@/lib/location';

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(19.076, 72.8777, 19.076, 72.8777)).toBeCloseTo(0, 5);
  });

  it('computes a realistic Mumbai-Pune distance', () => {
    // Mumbai to Pune is roughly 120-150km as the crow flies.
    const km = haversineKm(19.076, 72.8777, 18.5204, 73.8567);
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(170);
  });
});

describe('describeDistance', () => {
  it('never reveals precision beyond a friendly rounding', () => {
    expect(describeDistance(0.4)).toBe('Under 1 km away');
    expect(describeDistance(2.4)).toBe('2.4 km away');
    expect(describeDistance(42)).toBe('42 km away');
  });
  it('handles missing distance gracefully', () => {
    expect(describeDistance(null)).toBe('Distance unknown');
    expect(describeDistance(undefined)).toBe('Distance unknown');
  });
});

describe('publicLocation', () => {
  it('joins city and state without ever including an address', () => {
    expect(publicLocation('Mumbai', 'Maharashtra')).toBe('Mumbai, Maharashtra');
  });
  it('falls back when nothing is set', () => {
    expect(publicLocation(null, null)).toBe('Location not set');
  });
});
