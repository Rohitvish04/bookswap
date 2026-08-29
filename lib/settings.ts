import { prisma } from '@/lib/db';

export type FeeSettings = {
  feeType: 'FIXED' | 'PERCENTAGE';
  feeFixedPaise: number;
  feePercent: number;
  feeMinPaise: number;
  exchangeExpiryDays: number;
};

const DEFAULTS: FeeSettings = {
  feeType: 'FIXED',
  feeFixedPaise: 4900, // ₹49
  feePercent: 5,
  feeMinPaise: 1900, // ₹19 floor for percentage fee
  exchangeExpiryDays: 7,
};

const KEY = 'fee_settings';

export async function getFeeSettings(): Promise<FeeSettings> {
  const row = await prisma.platformSetting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(row.value) };
  } catch {
    return DEFAULTS;
  }
}

export async function setFeeSettings(settings: FeeSettings) {
  await prisma.platformSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}

/** Book exchange value is always ₹0 — only the service fee is charged. */
export function computeFee(settings: FeeSettings): { amount: number; type: 'FIXED' | 'PERCENTAGE' } {
  if (settings.feeType === 'FIXED') return { amount: settings.feeFixedPaise, type: 'FIXED' };
  // Percentage of a nominal book value isn't tracked per-book, so percentage
  // mode applies to the platform's assumed base value (₹500) with a floor.
  const base = 50000; // paise
  const amount = Math.max(settings.feeMinPaise, Math.round((base * settings.feePercent) / 100));
  return { amount, type: 'PERCENTAGE' };
}
