import { describe, it, expect } from 'vitest';
import { computeFee } from '@/lib/settings';

describe('computeFee', () => {
  it('uses the fixed amount directly in FIXED mode', () => {
    const fee = computeFee({ feeType: 'FIXED', feeFixedPaise: 4900, feePercent: 5, feeMinPaise: 1900, exchangeExpiryDays: 7 });
    expect(fee).toEqual({ amount: 4900, type: 'FIXED' });
  });

  it('computes a percentage of the nominal base value', () => {
    const fee = computeFee({ feeType: 'PERCENTAGE', feeFixedPaise: 4900, feePercent: 10, feeMinPaise: 1900, exchangeExpiryDays: 7 });
    // 10% of the ₹500 nominal base = ₹50 = 5000 paise, above the floor.
    expect(fee.amount).toBe(5000);
    expect(fee.type).toBe('PERCENTAGE');
  });

  it('never charges less than the configured minimum', () => {
    const fee = computeFee({ feeType: 'PERCENTAGE', feeFixedPaise: 4900, feePercent: 0.1, feeMinPaise: 1900, exchangeExpiryDays: 7 });
    expect(fee.amount).toBe(1900);
  });
});
