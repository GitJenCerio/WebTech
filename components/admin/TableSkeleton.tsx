'use client';

import { Skeleton } from '@/components/ui/Skeleton';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}

/** Skeleton for table loading state - desktop table layout */
export function TableSkeleton({ rows = 5, cols = 5, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-sm">
        {showHeader && (
          <thead>
            <tr className="border-b border-[#f0f0f0]">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-5 py-3 text-left">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-[#f5f5f5]">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-5 py-3.5">
                  <Skeleton className={`h-4 ${colIdx === 0 ? 'w-14' : colIdx === cols - 1 ? 'w-20' : 'w-24'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
