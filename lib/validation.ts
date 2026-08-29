import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[a-z]/, 'Include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Include at least one uppercase letter.')
  .regex(/[0-9]/, 'Include at least one number.');

const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.');

const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode.');

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.');

// ------------------------------------------------------------------ auth

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
    email: emailSchema,
    phone,
    password,
    confirmPassword: z.string(),
    addressLine: z.string().trim().min(3, 'House / building is required.').max(160),
    area: z.string().trim().min(2, 'Area is required.').max(120),
    city: z.string().trim().min(2, 'City is required.').max(80),
    state: z.string().trim().min(2, 'State is required.').max(80),
    pincode,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'Reset link is invalid.'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

// ------------------------------------------------------------------ profile & address

export const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: phone.optional().or(z.literal('')),
  bio: z.string().trim().max(500, 'Bio must be under 500 characters.').optional().or(z.literal('')),
  avatarUrl: z.string().trim().max(500).optional().or(z.literal('')),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).default('Home'),
  fullName: z.string().trim().min(2, 'Full name is required.').max(80),
  phone,
  addressLine: z.string().trim().min(3, 'House / building is required.').max(160),
  area: z.string().trim().min(2, 'Area is required.').max(120),
  city: z.string().trim().min(2, 'City is required.').max(80),
  state: z.string().trim().min(2, 'State is required.').max(80),
  pincode,
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const radiusSchema = z.object({
  searchRadiusKm: z.coerce.number().int().refine((v) => [0, 5, 10, 25, 50].includes(v), {
    message: 'Choose 5, 10, 25, 50 km or Anywhere.',
  }),
});

// ------------------------------------------------------------------ books

export const conditionEnum = z.enum(['LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE']);
export const bookStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'EXCHANGE_PENDING',
  'EXCHANGED',
  'INACTIVE',
]);

export const bookSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(160),
  author: z.string().trim().min(2, 'Author is required.').max(120),
  isbn: z
    .string()
    .trim()
    .regex(/^(97(8|9))?\d{9}(\d|X)$/i, 'Enter a valid 10 or 13 digit ISBN.')
    .optional()
    .or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  categoryId: z.string().uuid('Choose a category.').optional().or(z.literal('')),
  language: z.string().trim().min(2).max(40).default('English'),
  edition: z.string().trim().max(60).optional().or(z.literal('')),
  publishYear: z.coerce
    .number()
    .int()
    .min(1450, 'Year looks too early.')
    .max(new Date().getFullYear(), 'Year cannot be in the future.')
    .optional()
    .nullable(),
  condition: conditionEnum,
  coverUrl: z.string().trim().max(500).optional().or(z.literal('')),
  available: z.boolean().default(true),
  wantedBooks: z
    .array(
      z.object({
        title: z.string().trim().min(2, 'Wanted book title is too short.').max(160),
        author: z.string().trim().max(120).optional().or(z.literal('')),
      }),
    )
    .max(10, 'You can list up to 10 wanted books per listing.')
    .default([]),
});

export const bookStatusUpdateSchema = z.object({ status: bookStatusEnum });

export const bookQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().optional(),
  language: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  city: z.string().trim().optional(),
  distance: z.coerce.number().int().min(0).max(2000).optional(),
  availability: z.enum(['all', 'available']).optional(),
  sort: z.enum(['recent', 'nearest', 'match', 'popular']).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
});

// ------------------------------------------------------------------ wishlist

export const wishlistSchema = z.object({
  title: z.string().trim().min(2, 'Title is required.').max(160),
  author: z.string().trim().max(120).optional().or(z.literal('')),
  bookId: z.string().uuid().optional().or(z.literal('')),
});

// ------------------------------------------------------------------ exchange

export const exchangeCreateSchema = z.object({
  requestedBookId: z.string().uuid('Pick a book to request.'),
  offeredBookId: z.string().uuid('Pick one of your books to offer.'),
  message: z.string().trim().max(500).optional().or(z.literal('')),
});

export const counterOfferSchema = z.object({
  bookId: z.string().uuid('Pick a book for the counter offer.'),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

export const exchangeRejectSchema = z.object({
  reason: z.string().trim().max(300).optional().or(z.literal('')),
});

export const deliveryModeSchema = z.object({
  deliveryMode: z.enum(['MEETUP', 'DELIVERY']),
});

// ------------------------------------------------------------------ messaging & reviews

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty.').max(1000),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Give at least 1 star.').max(5),
  comment: z.string().trim().max(600).optional().or(z.literal('')),
});

export const reportSchema = z.object({
  targetUserId: z.string().uuid().optional().or(z.literal('')),
  exchangeId: z.string().uuid().optional().or(z.literal('')),
  reason: z.string().trim().min(3, 'Tell us what went wrong.').max(120),
  detail: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(80),
  email: emailSchema,
  subject: z.string().trim().min(3, 'Subject is required.').max(120),
  body: z.string().trim().min(10, 'Please write at least 10 characters.').max(2000),
});

// ------------------------------------------------------------------ payments

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(3),
  razorpay_payment_id: z.string().min(3),
  razorpay_signature: z.string().min(3),
});

// ------------------------------------------------------------------ admin

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(60),
  isActive: z.boolean().default(true),
});

export const feeSettingsSchema = z
  .object({
    feeType: z.enum(['FIXED', 'PERCENTAGE']),
    feeFixedPaise: z.coerce.number().int().min(0).max(1_000_000),
    feePercent: z.coerce.number().min(0).max(100),
    feeMinPaise: z.coerce.number().int().min(0).max(1_000_000),
    exchangeExpiryDays: z.coerce.number().int().min(1).max(90),
  })
  .refine((d) => d.feeType !== 'PERCENTAGE' || d.feePercent > 0, {
    message: 'Percentage fee must be greater than 0.',
    path: ['feePercent'],
  });

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
});

export const moderationSchema = z.object({
  moderation: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const reportResolveSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
  resolution: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const adminExchangeStatusSchema = z.object({
  status: z.enum(['DISPUTED', 'COMPLETED', 'CANCELLED']),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const geocodeSchema = z.object({
  addressLine: z.string().trim().max(160).optional().or(z.literal('')),
  area: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'City is required to locate you.').max(80),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  pincode: z.string().trim().max(10).optional().or(z.literal('')),
});
