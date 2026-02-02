'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import type { Slot, BlockedDate } from '@/lib/types';

interface CalendarGridProps {
  referenceDate: Date;
  slots: Slot[];
  bookings?: Array<{ slotId: string; status: string }>;
  blockedDates?: BlockedDate[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (date: Date) => void;
  nailTechName?: string;
  noAvailableSlotsDates?: string[];
  disablePastDates?: boolean;
}

export function CalendarGrid({
  referenceDate,
  slots,
  bookings = [],
  blockedDates = [],
  selectedDate,
  onSelectDate,
  onChangeMonth,
  nailTechName,
  noAvailableSlotsDates = [],
  disablePastDates = false,
}: CalendarGridProps) {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((slot) => {
      const date = slot.date;
      if (!map.has(date)) {
        map.set(date, []);
      }
      map.get(date)!.push(slot);
    });
    return map;
  }, [slots]);

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blockedDates.some((block) => {
      if (block.scope === 'single') {
        return block.startDate === dateStr;
      }
      if (block.scope === 'range') {
        return dateStr >= block.startDate && dateStr <= block.endDate;
      }
      if (block.scope === 'month') {
        const blockMonth = block.startDate.substring(0, 7);
        const dateMonth = dateStr.substring(0, 7);
        return blockMonth === dateMonth;
      }
      return false;
    });
  };

  const getSlotStatus = (date: Date): 'available' | 'booked' | 'blocked' | 'none' => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (isDateBlocked(date)) {
      return 'blocked';
    }

    const dateSlots = slotsByDate.get(dateStr) || [];
    if (dateSlots.length === 0) {
      return 'none';
    }

    const hasAvailable = dateSlots.some((slot) => slot.status === 'available');
    if (hasAvailable) {
      return 'available';
    }

    return 'booked';
  };

  const handlePrevMonth = () => {
    const newDate = new Date(referenceDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onChangeMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(referenceDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onChangeMonth(newDate);
  };

  const handleDateClick = (date: Date) => {
    if (disablePastDates) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return;
      }
    }
    onSelectDate(format(date, 'yyyy-MM-dd'));
  };

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white p-4 sm:p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Calendar</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {format(referenceDate, 'MMMM yyyy')}
          </h2>
          {nailTechName && (
            <p className="text-sm text-slate-600 mt-1">{nailTechName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}

        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(date, referenceDate);
          const isToday = isSameDay(date, today);
          const isSelected = dateStr === selectedDate;
          const status = getSlotStatus(date);
          const isPast = disablePastDates && date < today && !isToday;
          const hasNoSlots = noAvailableSlotsDates.includes(dateStr);

          let bgColor = 'bg-white';
          let textColor = 'text-slate-700';
          let borderColor = 'border-slate-200';

          if (!isCurrentMonth) {
            textColor = 'text-slate-300';
          } else if (isPast) {
            textColor = 'text-slate-300';
            bgColor = 'bg-slate-50';
          } else if (status === 'blocked') {
            bgColor = 'bg-red-50';
            textColor = 'text-red-700';
            borderColor = 'border-red-200';
          } else if (status === 'booked') {
            bgColor = 'bg-yellow-50';
            textColor = 'text-yellow-700';
            borderColor = 'border-yellow-200';
          } else if (status === 'available') {
            bgColor = 'bg-green-50';
            textColor = 'text-green-700';
            borderColor = 'border-green-200';
          } else if (hasNoSlots) {
            bgColor = 'bg-slate-50';
            textColor = 'text-slate-400';
          }

          if (isSelected) {
            borderColor = 'border-black border-2';
            bgColor = isCurrentMonth ? 'bg-black text-white' : bgColor;
            textColor = isCurrentMonth && isSelected ? 'text-white' : textColor;
          }

          if (isToday && !isSelected) {
            borderColor = 'border-blue-400 border-2';
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isPast && disablePastDates}
              className={`
                aspect-square rounded-lg border-2 p-1 sm:p-2 text-xs sm:text-sm font-medium
                transition-all hover:scale-105
                ${bgColor} ${textColor} ${borderColor}
                ${!isCurrentMonth ? 'opacity-50' : ''}
                ${isPast && disablePastDates ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{format(date, 'd')}</span>
                {status === 'available' && (
                  <span className="text-[8px] sm:text-[10px] mt-0.5">Available</span>
                )}
                {status === 'booked' && (
                  <span className="text-[8px] sm:text-[10px] mt-0.5">Booked</span>
                )}
                {status === 'blocked' && (
                  <span className="text-[8px] sm:text-[10px] mt-0.5">Blocked</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
