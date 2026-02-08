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
    
    if (isDateBlocked(date)) {
      return 'blocked';
    }

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
    <div className="rounded-xl border-2 bg-white p-3 sm:p-4 lg:p-6 shadow-sm" style={{ borderColor: '#212529', fontFamily: "'Lato', sans-serif" }}>
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider mb-1" style={{ color: '#6c757d', fontFamily: "'Lato', sans-serif" }}>Calendar</p>
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold break-words" style={{ color: '#212529', fontFamily: "'Playfair Display', serif" }}>
            {format(referenceDate, 'MMMM yyyy')}
          </h2>
          {nailTechName && (
            <p className="text-xs sm:text-sm mt-1 break-words" style={{ color: '#495057', fontFamily: "'Lato', sans-serif" }}>{nailTechName}</p>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2 ml-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-2 sm:p-2.5 text-xl sm:text-2xl font-bold transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: '#212529', fontFamily: "'Lato', sans-serif" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-2 sm:p-2.5 text-xl sm:text-2xl font-bold transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: '#212529', fontFamily: "'Lato', sans-serif" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2" style={{ color: '#495057', fontFamily: "'Lato', sans-serif" }}>
            {day}
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

          let bgColorStyle = '#ffffff';
          let textColorStyle = '#495057';
          let borderColorStyle = '#dee2e6';

          if (!isCurrentMonth) {
            textColorStyle = '#adb5bd';
          } else if (isPast) {
            textColorStyle = '#adb5bd';
            bgColorStyle = '#f8f9fa';
          } else if (status === 'blocked') {
            bgColorStyle = '#f8d7da';
            textColorStyle = '#721c24';
            borderColorStyle = '#f5c6cb';
          } else if (status === 'booked') {
            bgColorStyle = '#fff3cd';
            textColorStyle = '#856404';
            borderColorStyle = '#ffeaa7';
          } else if (status === 'available') {
            bgColorStyle = '#d4edda';
            textColorStyle = '#155724';
            borderColorStyle = '#c3e6cb';
          } else if (hasNoSlots) {
            bgColorStyle = '#f8f9fa';
            textColorStyle = '#6c757d';
          }

          if (isSelected) {
            borderColorStyle = '#212529';
            bgColorStyle = isCurrentMonth ? '#212529' : bgColorStyle;
            textColorStyle = isCurrentMonth && isSelected ? '#ffffff' : textColorStyle;
          }

          if (isToday && !isSelected) {
            borderColorStyle = '#495057';
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isPast && disablePastDates}
              className={`
                aspect-square rounded-lg border-2 p-2 sm:p-2.5 text-[11px] sm:text-xs lg:text-sm font-medium
                transition-all active:scale-95 touch-manipulation
                min-h-[44px] sm:min-h-[48px]
                ${!isCurrentMonth ? 'opacity-50' : ''}
                ${isPast && disablePastDates ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
              `}
              style={{
                backgroundColor: bgColorStyle,
                color: textColorStyle,
                borderColor: borderColorStyle,
                fontFamily: "'Lato', sans-serif"
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-0.5">
                <span className="font-semibold">{format(date, 'd')}</span>
                {status === 'blocked' ? (
                  <span className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight">Blocked</span>
                ) : slotCounts.total > 0 ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {slotCounts.available > 0 && (
                      <span className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight font-semibold" style={{ color: isSelected ? '#ffffff' : '#28a745' }}>
                        {slotCounts.available}
                      </span>
                    )}
                    {slotCounts.booked > 0 && (
                      <span className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight font-semibold" style={{ color: isSelected ? '#ffffff' : '#212529' }}>
                        {slotCounts.booked}
                      </span>
                    )}
                    {slotCounts.pending > 0 && (
                      <span className="text-[8px] sm:text-[9px] lg:text-[10px] leading-tight font-semibold" style={{ color: isSelected ? '#ffffff' : '#007bff' }}>
                        {slotCounts.pending}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
