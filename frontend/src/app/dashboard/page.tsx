'use client';

import { useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/layout/Navbar';
import StatsCard from '@/components/dashboard/StatsCard';
import UrlForm from '@/components/dashboard/UrlForm';
import UrlTable from '@/components/dashboard/UrlTable';
import { useAuth } from '@/context/AuthContext';
import { useUrls } from '@/hooks/useUrls';
import { Link2, MousePointer, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/utils/helpers';

function DashboardContent() {
  const { user } = useAuth();
  const { urls, pagination, meta, isLoading, error, fetchUrls, createUrl, deleteUrl } = useUrls();

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const totalClicks = urls. reduce((sum, url) => sum + url.clickCount, 0);
  const isLimitReached = (meta?. urlCount ??  0) >= (meta?.urlLimit ?? 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total URLs"
            value={meta?.urlCount ?? 0}
            icon={Link2}
            description={`${meta?.remainingUrls ?? 0} remaining of ${meta?.urlLimit ?? 100}`}
            colorClass="text-primary-600"
          />
          <StatsCard
            title="Total Clicks"
            value={formatNumber(totalClicks)}
            icon={MousePointer}
            description="Across all your links"
            colorClass="text-green-600"
          />
          <StatsCard
            title="Average Clicks"
            value={urls.length > 0 ? formatNumber(Math.round(totalClicks / urls.length)) : 0}
            icon={TrendingUp}
            description="Per shortened URL"
            colorClass="text-blue-600"
          />
        </div>

        {/* URL Form */}
        <div className="mb-8">
          <UrlForm onSubmit={createUrl} isLimitReached={isLimitReached} />
        </div>

        {/* URL Table */}
        <UrlTable
          urls={urls}
          pagination={pagination}
          isLoading={isLoading}
          error={error}
          onPageChange={(page) => fetchUrls(page, pagination.limit)}
          onDelete={deleteUrl}
          onRefresh={() => fetchUrls(pagination.page, pagination.limit)}
        />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}