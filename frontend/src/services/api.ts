import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from '@/utils/constants';
import { ApiResponse, ApiError } from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config:  InternalAxiosRequestConfig) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error:  AxiosError<ApiResponse>) => {
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      Cookies.remove('token');
      // Only redirect if we're in the browser and not already on auth pages
      if (typeof window !== 'undefined') {
        const isAuthPage = window.location.pathname.includes('/login') || 
                          window.location.pathname.includes('/register');
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }

    // Extract error message
    const apiError:  ApiError = error.response?.data?.error || {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };

    return Promise.reject(apiError);
  }
);

export default api;