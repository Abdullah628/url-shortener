import { z } from 'zod';

// AUTH VALIDATORS
export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// URL VALIDATORS
export const createUrlSchema = z.object({
  originalUrl: z
    .string()
    .min(10, 'URL is too short')
    .max(2048, 'URL must be less than 2048 characters')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      'Invalid URL format.  URL must start with http:// or https://'
    ),
});

// PAGINATION VALIDATORS
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ?  parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be at least 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

// SHORT CODE VALIDATOR
export const shortCodeSchema = z.object({
  shortCode: z
    . string()
    .min(6, 'Short code must be at least 6 characters')
    .max(8, 'Short code must be at most 8 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Short code must contain only alphanumeric characters'),
});

// URL ID VALIDATOR
export const urlIdSchema = z.object({
  id: z. string().uuid('Invalid URL ID format'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ShortCodeInput = z.infer<typeof shortCodeSchema>;
export type UrlIdInput = z.infer<typeof urlIdSchema>;