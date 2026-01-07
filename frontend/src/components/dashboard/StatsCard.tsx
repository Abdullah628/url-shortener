import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?:  string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorClass?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorClass = 'text-primary-600',
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend. isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend. isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500">from last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg bg-gray-100', colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}