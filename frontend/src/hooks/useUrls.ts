'use client';

import { useState, useCallback } from 'react';
import { Url, UrlListResponse, UrlMeta, Pagination, CreateUrlFormData } from '@/types';
import { urlService } from '@/services/url.service';
import { useAuth } from '@/context/AuthContext';
import { PAGINATION_DEFAULTS } from '@/utils/constants';

interface UseUrlsReturn {
  urls: Url[];
  pagination: Pagination;
  meta: UrlMeta | null;
  isLoading: boolean;
  error: string | null;
  fetchUrls: (page?:  number, limit?: number) => Promise<void>;
  createUrl: (data: CreateUrlFormData) => Promise<Url>;
  deleteUrl: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUrls(): UseUrlsReturn {
  const { refreshUser } = useAuth();
  const [urls, setUrls] = useState<Url[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: PAGINATION_DEFAULTS.page,
    limit: PAGINATION_DEFAULTS.limit,
    total: 0,
    totalPages: 0,
  });
  const [meta, setMeta] = useState<UrlMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUrls = useCallback(async (
    page: number = PAGINATION_DEFAULTS.page, 
    limit: number = PAGINATION_DEFAULTS.limit
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await urlService.getUrls(page, limit);
      setUrls(response.urls);
      setPagination(response.pagination);
      setMeta(response.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch URLs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUrl = useCallback(async (data:  CreateUrlFormData): Promise<Url> => {
    setError(null);
    
    try {
      const url = await urlService.createUrl(data);
      // Refresh the list and user data
      await fetchUrls(pagination.page, pagination.limit);
      await refreshUser();
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message :  'Failed to create URL';
      setError(message);
      throw err;
    }
  }, [fetchUrls, pagination. page, pagination.limit, refreshUser]);

  const deleteUrl = useCallback(async (id: string) => {
    setError(null);
    
    try {
      await urlService.deleteUrl(id);
      // Refresh the list and user data
      await fetchUrls(pagination.page, pagination.limit);
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete URL';
      setError(message);
      throw err;
    }
  }, [fetchUrls, pagination.page, pagination.limit, refreshUser]);

  const refresh = useCallback(async () => {
    await fetchUrls(pagination.page, pagination.limit);
  }, [fetchUrls, pagination. page, pagination.limit]);

  return {
    urls,
    pagination,
    meta,
    isLoading,
    error,
    fetchUrls,
    createUrl,
    deleteUrl,
    refresh,
  };
}