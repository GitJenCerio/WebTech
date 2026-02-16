import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="admin-page-header w-full max-w-full overflow-x-hidden flex flex-col gap-3 border-b border-border/60 pb-4 sm:pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-2xl truncate">{title}</h1>
        {description && <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>}
        {children}
      </div>
      {actions ? <div className={cn('w-full max-w-full overflow-x-hidden flex flex-wrap items-center gap-2 sm:gap-3 mt-2 lg:mt-0 lg:w-auto')}>{actions}</div> : null}
    </div>
  );
}
