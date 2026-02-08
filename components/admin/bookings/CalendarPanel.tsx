'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface Slot {
  id: string;
  date: string;
  time: string;
  status: string;
  isHidden?: boolean;
}

interface CalendarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week') => void;
  slots?: Slot[];
  currentMonth?: Date;
  onMonthChange?: (month: Date) => void;
}

export default function CalendarPanel({
  selectedDate,
  onDateSelect,
  onViewChange,
  slots = [],
  currentMonth: controlledMonth,
  onMonthChange,
}: CalendarPanelProps) {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [internalMonth, setInternalMonth] = useState(new Date());
  
  // Use controlled month if provided, otherwise use internal state
  const currentMonth = controlledMonth || internalMonth;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -i));
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleViewChange = (newView: 'month' | 'week') => {
    setView(newView);
    onViewChange?.(newView);
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (onMonthChange) {
      onMonthChange(todayMonth);
    } else {
      setInternalMonth(todayMonth);
    }
    onDateSelect(today);
  };

  const days = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Count slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, { available: number; booked: number; pending: number; total: number }>();
    slots.forEach((slot) => {
      if (slot.isHidden) return; // Skip hidden slots
      const dateStr = slot.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, { available: 0, booked: 0, pending: 0, total: 0 });
      }
      const counts = map.get(dateStr)!;
      counts.total++;
      if (slot.status === 'available') counts.available++;
      else if (slot.status === 'booked' || slot.status === 'confirmed') counts.booked++;
      else if (slot.status === 'pending') counts.pending++;
    });
    return map;
  }, [slots]);

  const getSlotCounts = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slotsByDate.get(dateStr) || { available: 0, booked: 0, pending: 0, total: 0 };
  };

  return (
    <div className="card mb-4 w-100" style={{ minWidth: 0, overflow: 'hidden' }}>
      <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
        <h5 className="mb-0">Select Date</h5>
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn btn-sm ${view === 'month' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => handleViewChange('month')}
          >
            Month
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'week' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => handleViewChange('week')}
          >
            Week
          </button>
        </div>
      </div>
      <div className="card-body" style={{ padding: 'clamp(0.65rem, 3vw, 1rem) clamp(0.5rem, 3vw, 0.9rem)' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" 
            onClick={handlePrevMonth}
            style={{ minWidth: '36px', minHeight: '36px', padding: '0.25rem' }}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <h6 className="mb-0 text-center" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h6>
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" 
            onClick={handleNextMonth}
            style={{ minWidth: '36px', minHeight: '36px', padding: '0.25rem' }}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        <div className="d-grid grid-calendar mb-2 w-100" style={{ minWidth: 0 }}>
          {dayNames.map((day) => (
            <div key={day} className="text-center fw-semibold text-muted" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', padding: '0.25rem 0' }}>
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const dateToday = isToday(date);
            const dateSelected = isSelected(date);
            const counts = getSlotCounts(date);

            return (
              <button
                key={index}
                className={`btn btn-sm calendar-day ${
                  !isCurrentMonth ? 'text-muted' : ''
                } ${dateToday ? 'border border-dark' : ''} ${
                  dateSelected ? 'bg-dark text-white' : ''
                }`}
                onClick={() => isCurrentMonth && onDateSelect(date)}
                disabled={!isCurrentMonth}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(0.2rem, 1.4vw, 0.48rem)',
                  minHeight: 'clamp(44px, 11vw, 68px)',
                  lineHeight: '1.2',
                  gap: '3px'
                }}
              >
                <span className="fw-semibold" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)' }}>{date.getDate()}</span>
                {isCurrentMonth && counts.total > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    flexWrap: 'wrap',
                    gap: 'clamp(2px, 0.5vw, 4px)', 
                    justifyContent: 'center',
                    maxWidth: '100%'
                  }}>
                    {counts.available > 0 && (
                      <span 
                        className="slot-count-badge"
                        style={{ 
                          color: dateSelected ? '#fff' : '#155724',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.2)' : '#d4edda',
                          padding: 'clamp(1px, 0.3vw, 2px) clamp(4px, 1vw, 6px)',
                          borderRadius: 'clamp(8px, 2vw, 10px)',
                          fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
                          fontWeight: 700,
                          lineHeight: 1,
                          minWidth: 'clamp(16px, 4vw, 20px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: dateSelected ? 'none' : '1px solid #c3e6cb'
                        }}
                      >
                        {counts.available}
                      </span>
                    )}
                    {counts.booked > 0 && (
                      <span 
                        className="slot-count-badge"
                        style={{ 
                          color: dateSelected ? '#fff' : '#fff',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.2)' : '#212529',
                          padding: 'clamp(1px, 0.3vw, 2px) clamp(4px, 1vw, 6px)',
                          borderRadius: 'clamp(8px, 2vw, 10px)',
                          fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
                          fontWeight: 700,
                          lineHeight: 1,
                          minWidth: 'clamp(16px, 4vw, 20px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: dateSelected ? 'none' : '1px solid #495057'
                        }}
                      >
                        {counts.booked}
                      </span>
                    )}
                    {counts.pending > 0 && (
                      <span 
                        className="slot-count-badge"
                        style={{ 
                          color: dateSelected ? '#fff' : '#fff',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.2)' : '#007bff',
                          padding: 'clamp(1px, 0.3vw, 2px) clamp(4px, 1vw, 6px)',
                          borderRadius: 'clamp(8px, 2vw, 10px)',
                          fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)',
                          fontWeight: 700,
                          lineHeight: 1,
                          minWidth: 'clamp(16px, 4vw, 20px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: dateSelected ? 'none' : '1px solid #0056b3'
                        }}
                      >
                        {counts.pending}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button 
          className="btn btn-sm btn-outline-secondary w-100" 
          onClick={handleToday}
          style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
        >
          Go to Today
        </button>
      </div>
      
      <style jsx>{`
        @media (max-width: 576px) {
          .slot-count-badge {
            border-radius: 50% !important;
            width: clamp(18px, 5vw, 22px) !important;
            height: clamp(18px, 5vw, 22px) !important;
            min-width: clamp(18px, 5vw, 22px) !important;
            padding: 0 !important;
            aspect-ratio: 1 / 1;
          }
        }
        
        @media (min-width: 577px) and (max-width: 991px) {
          .slot-count-badge {
            border-radius: 6px !important;
            padding: 2px 5px !important;
          }
        }
        
        @media (min-width: 992px) {
          .slot-count-badge {
            border-radius: 8px !important;
            padding: 2px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
