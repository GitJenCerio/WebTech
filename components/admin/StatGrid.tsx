import React from 'react';
import { cn } from '@/lib/utils';

interface StatGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatGrid({ children, className }: StatGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}
