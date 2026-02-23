'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/** Skeleton for StatCard loading state */
export function StatCardSkeleton() {
  return (
    <Card className="h-full min-h-[120px] border border-[#e5e5e5] shadow-card bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}
