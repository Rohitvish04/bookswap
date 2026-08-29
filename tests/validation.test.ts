import { describe, it, expect } from 'vitest';
import { registerSchema, bookSchema, exchangeCreateSchema, feeSettingsSchema, addressSchema } from '@/lib/validation';

const validRegister = {
  fullName: 'Rohit Sharma',
  email: 'rohit@example.com',
  phone: '9876543210',
  password: 'Passw0rd',
  confirmPassword: 'Passw0rd',
  addressLine: '12 Book Lane',
  area: 'Andheri',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

describe('registerSchema', () => {
  it('accepts a fully valid registration', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'Different1' });
    expect(result.success).toBe(false);
  });

  it('rejects a weak password missing a number', () => {
    const result = registerSchema.safeParse({ ...validRegister, password: 'NoNumbers', confirmPassword: 'NoNumbers' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid Indian phone number', () => {
    const result = registerSchema.safeParse({ ...validRegister, phone: '12345' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid pincode', () => {
    const result = registerSchema.safeParse({ ...validRegister, pincode: '12' });
    expect(result.success).toBe(false);
  });
});

describe('addressSchema', () => {
  it('defaults isDefault to false and label to Home', () => {
    const result = addressSchema.parse({
      fullName: 'Rohit Sharma', phone: '9876543210', addressLine: '12 Book Lane',
      area: 'Andheri', city: 'Mumbai', state: 'Maharashtra', pincode: '400001',
    });
    expect(result.isDefault).toBe(false);
    expect(result.label).toBe('Home');
  });
});

describe('bookSchema', () => {
  const base = { title: 'Atomic Habits', author: 'James Clear', condition: 'GOOD' as const, language: 'English', available: true };

  it('accepts a minimal valid book', () => {
    expect(bookSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an invalid ISBN when provided', () => {
    expect(bookSchema.safeParse({ ...base, isbn: 'not-an-isbn' }).success).toBe(false);
  });

  it('accepts a valid 13-digit ISBN', () => {
    expect(bookSchema.safeParse({ ...base, isbn: '9780735211292' }).success).toBe(true);
  });

  it('rejects more than 10 wanted books', () => {
    const wantedBooks = Array.from({ length: 11 }, (_, i) => ({ title: `Book ${i}` }));
    expect(bookSchema.safeParse({ ...base, wantedBooks }).success).toBe(false);
  });
});

describe('exchangeCreateSchema', () => {
  it('requires both a requested and offered book id as UUIDs', () => {
    const result = exchangeCreateSchema.safeParse({ requestedBookId: 'not-a-uuid', offeredBookId: 'also-not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('feeSettingsSchema', () => {
  it('requires a positive percentage when feeType is PERCENTAGE', () => {
    const result = feeSettingsSchema.safeParse({ feeType: 'PERCENTAGE', feeFixedPaise: 0, feePercent: 0, feeMinPaise: 0, exchangeExpiryDays: 7 });
    expect(result.success).toBe(false);
  });

  it('allows zero percentage when feeType is FIXED', () => {
    const result = feeSettingsSchema.safeParse({ feeType: 'FIXED', feeFixedPaise: 4900, feePercent: 0, feeMinPaise: 0, exchangeExpiryDays: 7 });
    expect(result.success).toBe(true);
  });
});
