import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

interface ToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children?: React.ReactNode; // right side actions/filters
}

export function Toolbar({ searchPlaceholder = 'Search...', searchValue, onSearchChange, children }: ToolbarProps) {
  return (
    <div className="w-full max-w-full overflow-x-hidden flex flex-col gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-white to-gray-50/30 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md md:flex-row md:items-center md:justify-between">
      <div className="w-full min-w-0 md:max-w-sm">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-10 w-full border-border/60"
        />
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2 min-w-0">{children}</div> : null}
    </div>
  );
}
