'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar as CalendarIcon, CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface Slot {
  id: string;
  date?: string;
  time: string;
  status: string;
  isHidden?: boolean;
  clientName?: string;
  booking?: {
    id?: string;
    status?: string;
    [key: string]: unknown;
  } | null;
}

interface NailTech {
  id: string;
  name: string;
  role?: string;
}

interface CalendarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  slots?: Slot[];
  currentMonth?: Date;
  onMonthChange?: (month: Date) => void;
  onAddAvailability?: () => void;
  nailTechs?: NailTech[];
  selectedNailTechId?: string;
  onNailTechChange?: (techId: string) => void;
  showNailTechFilter?: boolean;
}

export default function CalendarPanel({
  selectedDate,
  onDateSelect,
  onViewChange,
  slots = [],
  currentMonth: controlledMonth,
  onMonthChange,
  onAddAvailability,
  nailTechs = [],
  selectedNailTechId = 'all',
  onNailTechChange,
  showNailTechFilter = false,
}: CalendarPanelProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
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

  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
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

  // Count slots by date and collect client names for booked/pending
  const slotsByDate = useMemo(() => {
    const map = new Map<string, {
      available: number;
      booked: number;
      pending: number;
      total: number;
      bookedNames: string[];
      pendingNames: string[];
    }>();
    slots.forEach((slot) => {
      if (slot.isHidden || !slot.date) return; // Skip hidden or slots without date
      const dateStr = slot.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, { available: 0, booked: 0, pending: 0, total: 0, bookedNames: [], pendingNames: [] });
      }
      const data = map.get(dateStr)!;
      data.total++;
      const name = (slot as Slot).clientName?.trim() || '';
      if (slot.status === 'available') data.available++;
      else if (slot.status === 'booked' || slot.status === 'confirmed' || slot.status === 'CONFIRMED') {
        data.booked++;
        if (name) data.bookedNames.push(name);
      } else if (slot.status === 'pending' || slot.status === 'PENDING_PAYMENT') {
        data.pending++;
        if (name) data.pendingNames.push(name);
      }
    });
    return map;
  }, [slots]);

  const getSlotCounts = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return slotsByDate.get(dateStr) || {
      available: 0,
      booked: 0,
      pending: 0,
      total: 0,
      bookedNames: [],
      pendingNames: [],
    };
  };

  return (
    <Card className="mb-4 w-full min-w-0 overflow-hidden h-100 d-flex flex-column">
      <CardHeader className="pb-0">
        {/* Single toolbar row: Nail Tech, Add Availability, Month/Week/Day on one line from md up */}
        <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-2 mb-3 overflow-x-auto min-w-0">
          {showNailTechFilter && nailTechs.length > 0 && (
            <Select
              value={selectedNailTechId}
              onValueChange={(value) => onNailTechChange?.(value)}
            >
              <SelectTrigger className="w-full max-w-[180px] sm:max-w-[250px] min-w-0 h-9 shrink-0">
                <SelectValue placeholder="All Nail Techs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nail Techs</SelectItem>
                {nailTechs.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onAddAvailability && (
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 shrink-0 h-9"
              onClick={onAddAvailability}
              style={{
                borderRadius: '16px',
                padding: '0 1rem',
                height: '36px',
                minHeight: '36px',
                fontWeight: 500,
                background: 'linear-gradient(135deg, #495057 0%, #212529 100%)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(33, 37, 41, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(33, 37, 41, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 37, 41, 0.3)';
              }}
            >
              <i className="bi bi-plus-lg" style={{ fontSize: '1rem' }}></i>
              <span className="whitespace-nowrap">Add Availability</span>
            </button>
          )}
          {/* View toggle: Month / Week / Day — same line on tablet/desktop */}
          <div className="d-flex gap-2 align-items-center ms-md-auto flex-shrink-0">
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 ${
                view === 'month' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('month')}
              style={{
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                fontWeight: 500,
                border: view === 'month' ? 'none' : '1px solid #ced4da',
                background: view === 'month' 
                  ? 'linear-gradient(135deg, #495057 0%, #212529 100%)' 
                  : 'transparent',
                boxShadow: view === 'month' ? '0 4px 15px rgba(33, 37, 41, 0.3)' : 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (view !== 'month') {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'month') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <i className="bi bi-calendar3" style={{ fontSize: '1rem' }}></i>
              <span>Month</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 ${
                view === 'week' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('week')}
              style={{
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                fontWeight: 500,
                border: view === 'week' ? 'none' : '1px solid #ced4da',
                background: view === 'week' 
                  ? 'linear-gradient(135deg, #495057 0%, #212529 100%)' 
                  : 'transparent',
                boxShadow: view === 'week' ? '0 4px 15px rgba(33, 37, 41, 0.3)' : 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (view !== 'week') {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'week') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <i className="bi bi-calendar-week" style={{ fontSize: '1rem' }}></i>
              <span>Week</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-2 ${
                view === 'day' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('day')}
              style={{
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                fontWeight: 500,
                border: view === 'day' ? 'none' : '1px solid #ced4da',
                background: view === 'day' 
                  ? 'linear-gradient(135deg, #495057 0%, #212529 100%)' 
                  : 'transparent',
                boxShadow: view === 'day' ? '0 4px 15px rgba(33, 37, 41, 0.3)' : 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (view !== 'day') {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'day') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <i className="bi bi-list-ul" style={{ fontSize: '1rem' }}></i>
              <span>Day</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent 
        className="flex-grow-1 min-h-0 min-w-0 overflow-hidden"
        style={{ 
          padding: 'clamp(0.65rem, 3vw, 1rem) clamp(0.5rem, 3vw, 0.9rem)',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
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

        <div className="calendar-grid-wrapper overflow-x-auto overflow-y-hidden mb-2 w-100" style={{ minWidth: 0 }}>
        <div className="d-grid grid-calendar w-100" style={{ minWidth: 0 }}>
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
                  justifyContent: 'flex-start',
                  padding: 'clamp(0.2rem, 1.4vw, 0.48rem)',
                  minHeight: 'clamp(44px, 11vw, 68px)',
                  lineHeight: '1.2',
                  gap: '2px',
                }}
              >
                <span
                  className="fw-semibold calendar-day-num"
                  style={{
                    fontSize: 'clamp(0.75rem, 2.5vw, 0.95rem)',
                    flexShrink: 0,
                    minHeight: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {date.getDate()}
                </span>
                <div
                  className="calendar-day-badges"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    width: '100%',
                    minHeight: 'clamp(40px, 10vw, 52px)',
                  }}
                >
                {isCurrentMonth && counts.total > 0 && (
                  <>
                    {counts.available > 0 && (
                      <span 
                        className="slot-count-badge slot-count-available"
                        style={{ 
                          color: dateSelected ? '#fff' : '#155724',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.25)' : '#d4edda',
                          padding: '2px 4px',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          borderRadius: '6px',
                          minHeight: '14px',
                        }}
                      >
                        {counts.available}
                      </span>
                    )}
                    {counts.booked > 0 && (
                      <span 
                        className="slot-count-badge slot-count-booked"
                        style={{ 
                          color: '#fff',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.25)' : '#212529',
                          padding: '2px 4px',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          borderRadius: '6px',
                          minHeight: '14px',
                          overflow: 'hidden',
                        }}
                      >
                        <span className="d-md-none">{counts.booked}</span>
                        <span className="d-none d-md-inline" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={counts.bookedNames?.join(', ') || ''}>
                          {counts.bookedNames?.length ? counts.bookedNames.join(', ') : counts.booked}
                        </span>
                      </span>
                    )}
                    {counts.pending > 0 && (
                      <span 
                        className="slot-count-badge slot-count-pending"
                        style={{ 
                          color: '#fff',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.25)' : '#007bff',
                          padding: '2px 4px',
                          fontSize: '0.55rem',
                          fontWeight: 700,
                          lineHeight: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          borderRadius: '6px',
                          minHeight: '14px',
                          overflow: 'hidden',
                        }}
                      >
                        <span className="d-md-none">{counts.pending}</span>
                        <span className="d-none d-md-inline" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={counts.pendingNames?.join(', ') || ''}>
                          {counts.pendingNames?.length ? counts.pendingNames.join(', ') : counts.pending}
                        </span>
                      </span>
                    )}
                  </>
                )}
                </div>
              </button>
            );
          })}
        </div>
        </div>

        <button 
          className="btn btn-sm btn-outline-secondary w-100 flex-shrink-0" 
          onClick={handleToday}
          style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            borderRadius: '16px',
            borderColor: '#ced4da',
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
          }}
        >
          Go to Today
        </button>
      </CardContent>
      
      <style jsx>{`
        @media (max-width: 576px) {
          .calendar-day-badges {
            min-height: 46px;
          }
          .slot-count-badge {
            width: 100% !important;
            min-height: 14px !important;
            border-radius: 6px !important;
            font-size: 0.5rem !important;
            padding: 2px 4px !important;
          }
        }
      `}</style>
    </Card>
  );
}
