export const API_URL = process.env. NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const SHORT_URL_BASE = process.env.NEXT_PUBLIC_SHORT_URL_BASE || 'http://localhost:3001';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
} as const;

export const URL_LIMIT = 100;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
} as const;