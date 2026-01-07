// ============================================
// USER TYPES
// ============================================
export interface User {
  id:  string;
  email: string;
  urlCount: number;
  createdAt: string;
}

export interface AuthState {
  user:  User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// URL TYPES
// ============================================
export interface Url {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface UrlListResponse {
  urls: Url[];
  pagination:  Pagination;
  meta: UrlMeta;
}

export interface UrlMeta {
  urlCount: number;
  urlLimit:  number;
  remainingUrls: number;
}

// ============================================
// PAGINATION TYPES
// ============================================
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field:  string;
  message: string;
}

// ============================================
// FORM TYPES
// ============================================
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword:  string;
}

export interface CreateUrlFormData {
  originalUrl: string;
}

// ============================================
// TOAST TYPES
// ============================================
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?:  number;
}