'use client';

import React from 'react';
import { Url, Pagination as PaginationType } from '@/types';
import { Card } from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import UrlTableRow from './UrlTableRow';
import { LinkIcon } from 'lucide-react';

interface UrlTableProps {
  urls: Url[];
  pagination:  PaginationType;
  isLoading:  boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function UrlTable({
  urls,
  pagination,
  isLoading,
  error,
  onPageChange,
  onDelete,
}:  UrlTableProps) {
  if (error) {
    return (
      <Card>
        <Alert variant="error">{error}</Alert>
      </Card>
    );
  }

  if (isLoading && urls.length === 0) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No URLs yet</h3>
          <p className="text-gray-600">Create your first shortened URL to get started!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Original URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {urls. map((url) => (
              <UrlTableRow key={url.id} url={url} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination. totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </Card>
  );
}