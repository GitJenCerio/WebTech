'use client';

import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import type { Slot } from '@/lib/types';

const PEARL = '#fffcfa';
const ASH = '#f0ebe4';
const ASH_SOFT = '#f7f6f4';
const BORDER = '#e7e2db';
const CHAMPAGNE = '#c4b5a0';
const INK = '#1c1917';
const MUTED = '#78716c';
const FAINT = '#a8a29e';

/**
 * Slot-count tints. Champagne itself is too light to read at 10px, so the
 * available count uses a deepened champagne that still clears contrast.
 */
const COUNT_AVAILABLE = '#8a7355';
const COUNT_ON_INK_AVAILABLE = 'rgba(255, 252, 250, 0.92)';

interface CalendarGridProps {
  referenceDate: Date;
  slots: Slot[];
  bookings?: Array<{ slotId: string; status: string }>;
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

  const getSlotCounts = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateSlots = slotsByDate.get(dateStr) || [];
    const visibleSlots = dateSlots.filter((slot) => !slot.isHidden);
    
    return {
      available: visibleSlots.filter((slot) => slot.status === 'available').length,
      booked: visibleSlots.filter((slot) => slot.status === 'booked').length,
      pending: visibleSlots.filter((slot) => slot.status === 'pending').length,
      total: visibleSlots.length,
    };
  };

  const getSlotStatus = (date: Date): 'available' | 'booked' | 'blocked' | 'none' => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dateSlots = slotsByDate.get(dateStr) || [];
    const visibleSlots = dateSlots.filter((slot) => !slot.isHidden);
    
    if (visibleSlots.length === 0) {
      return 'none';
    }

    const hasAvailable = visibleSlots.some((slot) => slot.status === 'available');
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
    <div className="brand-panel p-3 sm:p-4 lg:p-6">
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="brand-eyebrow mb-1">Calendar</p>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-heading text-[#1c1917] break-words">
            {format(referenceDate, 'MMMM yyyy')}
          </h2>
          {nailTechName && (
            <p className="text-xs sm:text-sm mt-1 break-words text-[#78716c]">{nailTechName}</p>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2 ml-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 sm:p-2.5 text-xl sm:text-2xl text-[#1c1917] border border-transparent hover:border-[#e7e2db] hover:bg-[#f0ebe4] transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 sm:p-2.5 text-xl sm:text-2xl text-[#1c1917] border border-transparent hover:border-[#e7e2db] hover:bg-[#f0ebe4] transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 min-w-0">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={`${day}-${i}`}
            className="text-center text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-[0.12em] sm:tracking-[0.16em] py-1 sm:py-2 text-[#b5a99a]"
            title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}
          >
            <span className="sm:hidden">{day}</span>
            <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
          </div>
        ))}

        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(date, referenceDate);
          const isToday = isSameDay(date, today);
          const isSelected = dateStr === selectedDate;
          const status = getSlotStatus(date);
          const slotCounts = getSlotCounts(date);
          const isPast = disablePastDates && date < today && !isToday;
          const hasNoSlots = noAvailableSlotsDates.includes(dateStr);

          let bgColorStyle = PEARL;
          let textColorStyle = MUTED;
          let borderColorStyle = BORDER;

          if (!isCurrentMonth) {
            textColorStyle = FAINT;
          } else if (isPast) {
            textColorStyle = FAINT;
            bgColorStyle = ASH_SOFT;
          } else if (status === 'blocked') {
            bgColorStyle = ASH_SOFT;
            textColorStyle = MUTED;
          } else if (status === 'booked') {
            bgColorStyle = ASH;
            textColorStyle = MUTED;
          } else if (hasNoSlots) {
            bgColorStyle = ASH_SOFT;
            textColorStyle = FAINT;
          } else if (status === 'available') {
            bgColorStyle = PEARL;
            textColorStyle = INK;
            borderColorStyle = CHAMPAGNE;
          }

          if (isSelected) {
            borderColorStyle = INK;
            bgColorStyle = INK;
            textColorStyle = PEARL;
          }

          if (isToday && !isSelected) {
            borderColorStyle = INK;
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isPast && disablePastDates}
              className={`
                relative min-w-0 w-full overflow-hidden box-border
                aspect-square border p-0.5 sm:p-1 text-[11px] sm:text-xs lg:text-sm font-medium
                transition-colors touch-manipulation
                ${!isCurrentMonth ? 'opacity-50' : ''}
                ${isPast && disablePastDates ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#1c1917]'}
              `}
              style={{
                backgroundColor: bgColorStyle,
                color: textColorStyle,
                borderColor: borderColorStyle,
              }}
            >
              <span className="flex h-full w-full min-h-0 flex-col items-center justify-center gap-0">
                <span className="brand-numeric leading-none">{format(date, 'd')}</span>
                {status === 'blocked' ? (
                  <span className="mt-0.5 max-w-full truncate px-0.5 text-[7px] sm:text-[9px] leading-none opacity-70">
                    Blocked
                  </span>
                ) : slotCounts.available > 0 && !hasNoSlots ? (
                  <span
                    className="brand-numeric mt-0.5 leading-none text-[8px] sm:text-[10px] lg:text-[11px]"
                    style={{ color: isSelected ? COUNT_ON_INK_AVAILABLE : COUNT_AVAILABLE }}
                  >
                    {slotCounts.available}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
