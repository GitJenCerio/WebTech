import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  className?: string;
  children: React.ReactNode;
}

export function PageShell({ className, children }: PageShellProps) {
  return (
    <div className={cn('admin-page min-h-screen w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8', className)}>
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 sm:gap-6 md:gap-7">{children}</div>
    </div>
  );
}
