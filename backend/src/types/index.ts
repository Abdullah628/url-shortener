import { Request } from 'express';

// USER TYPES
export interface User {
  id: string;
  email:  string;
  passwordHash: string;
  urlCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  email:  string;
  urlCount: number;
  createdAt:  Date;
}

export interface CreateUserDto {
  email:  string;
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
  isActive:  boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUrlDto {
  originalUrl: string;
}

export interface UrlResponse {
  id:  string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount:  number;
  createdAt: Date;
}

// AUTH TYPES
export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?:  JwtPayload;
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
  meta?: {
    page?:  number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// PAGINATION TYPES
export interface PaginationParams {
  page:  number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit:  number;
    total: number;
    totalPages: number;
  };
}