import { Request } from 'express';

// USER TYPES
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  urlCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  urlCount: number;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// URL TYPES
export interface Url {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUrlDto {
  originalUrl: string;
}

export interface UrlResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface UrlListResponse {
  urls: UrlResponse[];
  pagination: PaginationMeta;
  meta: {
    urlCount: number;
    urlLimit: number;
    remainingUrls: number;
  };
}

// CACHE TYPES
export interface CachedUrl {
  originalUrl: string;
  urlId: string;
  isActive: boolean;
}

// CLICK TYPES
export interface ClickData {
  urlId: string;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
  deviceType: string;
  timestamp: number;
}

// SHORT CODE POOL TYPES
export interface ShortCodePoolStats {
  total: number;
  used: number;
  available: number;
}

// AUTH TYPES
export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API RESPONSE TYPES
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

// PAGINATION TYPES
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// RATE LIMIT TYPES
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// METRICS TYPES
export interface MetricsData {
  httpRequestsTotal: number;
  urlsCreated: number;
  redirectsServed: number;
  cacheHits: number;
  cacheMisses: number;
}