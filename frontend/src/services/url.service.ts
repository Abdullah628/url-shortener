import api from './api';
import { ApiResponse, Url, UrlListResponse, CreateUrlFormData, Pagination } from '@/types';

export const urlService = {
  async createUrl(data: CreateUrlFormData): Promise<Url> {
    const response = await api.post<ApiResponse<Url>>('/api/urls', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to create short URL');
  },

  async getUrls(page: number = 1, limit: number = 10): Promise<UrlListResponse> {
    const response = await api.get<ApiResponse<UrlListResponse>>('/api/urls', {
      params: { page, limit },
    });
    
    if (response.data. success && response.data.data) {
      return response.data. data;
    }
    
    throw new Error('Failed to fetch URLs');
  },

  async getUrl(id: string): Promise<Url> {
    const response = await api.get<ApiResponse<Url>>(`/api/urls/${id}`);
    
    if (response.data. success && response.data.data) {
      return response.data. data;
    }
    
    throw new Error('Failed to fetch URL');
  },

  async deleteUrl(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/urls/${id}`);
    
    if (!response.data.success) {
      throw new Error('Failed to delete URL');
    }
  },

  async getPoolStats(): Promise<{ total: number; used: number; available: number }> {
    const response = await api.get<ApiResponse<{ pool: { total: number; used:  number; available: number } }>>(
      '/api/urls/stats/pool'
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data. pool;
    }
    
    throw new Error('Failed to fetch pool stats');
  },
};