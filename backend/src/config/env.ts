import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z. string().transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z. string().url(),
  
  // Redis
  REDIS_URL: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z. string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Short URL Configuration
  SHORT_URL_BASE:  z.string().default('http://localhost:3001'),
  SHORT_CODE_LENGTH: z.string().transform(Number).default('7'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_URL_CREATE: z.string().transform(Number).default('10'),
  RATE_LIMIT_REDIRECT:  z.string().transform(Number).default('1000'),
  
  // User Limits
  MAX_URLS_PER_USER: z.string().transform(Number).default('100'),
  
  // Cache Configuration
  CACHE_URL_TTL: z.string().transform(Number).default('86400'), // 24 hours
  CACHE_USER_LIMIT_TTL: z.string().transform(Number).default('3600'), // 1 hour
  
  // Click Processing
  CLICK_BATCH_SIZE: z. string().transform(Number).default('100'),
  CLICK_PROCESS_INTERVAL_MS: z.string().transform(Number).default('5000'),
});

const parsed = envSchema.safeParse(process. env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error. flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;