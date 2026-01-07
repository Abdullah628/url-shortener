import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { TooManyRequestsError } from '../utils/errors';
import { env } from '../config/env';
import { AuthRequest } from '../types';

export type RateLimitType = 'api' | 'createUrl' | 'auth' | 'redirect';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message:  string;
  keyGenerator: (req:  Request) => string;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  api: {
    windowMs: env. RATE_LIMIT_WINDOW_MS,
    maxRequests:  env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests. Please try again later.',
    keyGenerator: (req) => `api: ${getClientIdentifier(req)}`,
  },
  createUrl: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env. RATE_LIMIT_URL_CREATE,
    message: 'Too many URLs created. Please slow down.',
    keyGenerator: (req) => {
      const authReq = req as AuthRequest;
      return `createUrl:${authReq.user?. userId || getClientIdentifier(req)}`;
    },
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message:  'Too many authentication attempts. Please try again later.',
    keyGenerator: (req) => `auth:${getClientIdentifier(req)}`,
  },
  redirect: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_REDIRECT,
    message: 'Too many requests. Please slow down.',
    keyGenerator: (req) => `redirect:${getClientIdentifier(req)}`,
  },
};

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return req.ip || req.socket. remoteAddress || 'unknown';
}

export function rateLimit(type: RateLimitType) {
  const config = RATE_LIMIT_CONFIGS[type];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = config.keyGenerator(req);
      const result = await cacheService.checkRateLimit(
        key,
        config.maxRequests,
        config.windowMs
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config. maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result. resetTime);

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil((result.resetTime * 1000 - Date.now()) / 1000));
        throw new TooManyRequestsError(config.message);
      }

      next();
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        throw error;
      }
      // If Redis fails, allow the request (fail open)
      console.error('Rate limiting error:', error);
      next();
    }
  };
}