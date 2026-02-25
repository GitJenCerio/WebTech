'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/components/ui/Utils';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  compact?: boolean;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  placeholder = 'Pick dates',
  className,
  align = 'start',
  compact = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const fromDate = dateFrom ? new Date(dateFrom) : undefined;
  const toDate = dateTo ? new Date(dateTo) : undefined;
  const range: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate || fromDate }
    : undefined;

  const handleSelect = (r: DateRange | undefined) => {
    if (!r?.from) {
      onDateFromChange('');
      onDateToChange('');
      return;
    }
    onDateFromChange(format(r.from, 'yyyy-MM-dd'));
    if (r.to) {
      onDateToChange(format(r.to, 'yyyy-MM-dd'));
    } else {
      onDateToChange(format(r.from, 'yyyy-MM-dd'));
    }
    if (r.from && r.to) {
      setOpen(false);
    }
  };

  const displayText =
    dateFrom && dateTo
      ? `${format(new Date(dateFrom), 'MMM d, yyyy')} – ${format(new Date(dateTo), 'MMM d, yyyy')}`
      : dateFrom
        ? format(new Date(dateFrom), 'MMM d, yyyy')
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 w-full min-w-[120px] rounded-xl border border-[#e5e5e5] bg-[#f9f9f9] text-[#1a1a1a] transition-all',
            'hover:border-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]',
            compact ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="truncate">{displayText}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="admin-date-picker-popover w-auto p-0 rounded-2xl border-[#e5e5e5] shadow-lg bg-white"
      >
        <Calendar
          mode="range"
          defaultMonth={fromDate || toDate || new Date()}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={1}
          showOutsideDays={false}
          navLayout="around"
        />
      </PopoverContent>
    </Popover>
  );
}
