import api from './api';
import Cookies from 'js-cookie';
import { User, ApiResponse, LoginFormData, RegisterFormData } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(data:  Omit<RegisterFormData, 'confirmPassword'>): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
    
    if (response.data.success && response.data.data) {
      const { token } = response.data.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      return response.data.data;
    }
    
    throw new Error('Registration failed');
  },

  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
    
    if (response. data.success && response.data. data) {
      const { token } = response.data.data;
      Cookies.set('token', token, { expires: 7 }); // 7 days
      return response.data.data;
    }
    
    throw new Error('Login failed');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      Cookies.remove('token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error('Failed to get current user');
  },

  getToken(): string | undefined {
    return Cookies.get('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};