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
  daySlots?: Slot[];
  onSlotClick?: (slot: Slot) => void;
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
  daySlots = [],
  onSlotClick,
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
    if (newView === 'week' || newView === 'day') {
      syncMonthForDate(selectedDate);
    }
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

  const handlePrevPeriod = () => {
    if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 7);
      onDateSelect(newDate);
      syncMonthForDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      onDateSelect(newDate);
      syncMonthForDate(newDate);
    } else {
      handlePrevMonth();
    }
  };

  const handleNextPeriod = () => {
    if (view === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 7);
      onDateSelect(newDate);
      syncMonthForDate(newDate);
    } else if (view === 'day') {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateSelect(newDate);
      syncMonthForDate(newDate);
    } else {
      handleNextMonth();
    }
  };

  const syncMonthForDate = (date: Date) => {
    if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
      const newMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      if (onMonthChange) onMonthChange(newMonth);
      else setInternalMonth(newMonth);
    }
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDaysInWeek = (date: Date) => {
    const start = getWeekStart(date);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
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

  const daysInMonth = getDaysInMonth();
  const daysInWeek = getDaysInWeek(selectedDate);
  const days = view === 'month' ? daysInMonth : view === 'week' ? daysInWeek : [selectedDate];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getHeaderText = () => {
    if (view === 'month') {
      return `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    }
    if (view === 'week') {
      const start = getWeekStart(selectedDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
  };

  // Count slots by date and collect client names for booked/pending
  const slotsByDate = useMemo(() => {
    const map = new Map<string, {
      available: number;
      booked: number;
      completed: number;
      pending: number;
      total: number;
      bookedNames: string[];
      completedNames: string[];
      pendingNames: string[];
    }>();
    slots.forEach((slot) => {
      if (slot.isHidden || !slot.date) return; // Skip hidden or slots without date
      const dateStr = slot.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, { available: 0, booked: 0, completed: 0, pending: 0, total: 0, bookedNames: [], completedNames: [], pendingNames: [] });
      }
      const data = map.get(dateStr)!;
      data.total++;
      const name = (slot as Slot).clientName?.trim() || '';
      if (slot.status === 'available') data.available++;
      else if (slot.status === 'completed' || slot.status === 'COMPLETED') {
        data.completed++;
        if (name) data.completedNames.push(name);
      } else if (slot.status === 'booked' || slot.status === 'confirmed' || slot.status === 'CONFIRMED') {
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
      completed: 0,
      pending: 0,
      total: 0,
      bookedNames: [],
      completedNames: [],
      pendingNames: [],
    };
  };

  return (
    <Card className="mb-4 w-full min-w-0 overflow-hidden h-100 d-flex flex-column rounded-3xl">
      <CardHeader className="pb-0">
        {/* Single toolbar row: Nail Tech, Add Slot, Month/Week/Day on one line from md up */}
        <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-2 mb-3 overflow-x-auto min-w-0">
          {showNailTechFilter && nailTechs.length > 0 && (
            <Select
              value={selectedNailTechId}
              onValueChange={(value) => onNailTechChange?.(value)}
            >
              <SelectTrigger className="h-9 w-[130px] shrink-0 text-xs px-3 rounded-xl">
                <SelectValue placeholder="All Nail Techs" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all" className="text-xs">All Nail Techs</SelectItem>
                {nailTechs.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id} className="text-xs">
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {onAddAvailability && (
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 shrink-0 h-9 text-xs sm:hidden"
              onClick={onAddAvailability}
              style={{
                padding: '0 1rem',
                height: '36px',
                minHeight: '36px',
                borderRadius: '20px',
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
              <i className="bi bi-plus-lg" style={{ fontSize: '0.75rem' }}></i>
              <span className="whitespace-nowrap truncate">Add Slot</span>
            </button>
          )}
          {/* View toggle: Month / Week / Day — same line on tablet/desktop */}
          <div className="d-flex gap-2 align-items-center ms-md-auto flex-shrink-0">
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-1.5 text-xs ${
                view === 'month' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('month')}
              style={{
                borderRadius: '12px',
                padding: '0.375rem 0.75rem',
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
              className={`btn btn-sm d-flex align-items-center gap-1.5 text-xs ${
                view === 'week' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('week')}
              style={{
                borderRadius: '12px',
                padding: '0.375rem 0.75rem',
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
              <i className="bi bi-calendar-week" style={{ fontSize: '0.875rem' }}></i>
              <span>Week</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-1.5 text-xs ${
                view === 'day' 
                  ? 'text-white' 
                  : 'btn-outline-secondary'
              }`}
              onClick={() => handleViewChange('day')}
              style={{
                borderRadius: '12px',
                padding: '0.375rem 0.75rem',
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
              <i className="bi bi-list-ul" style={{ fontSize: '0.875rem' }}></i>
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
            onClick={handlePrevPeriod}
            style={{ minWidth: '36px', minHeight: '36px', padding: '0.25rem' }}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <h6 className="mb-0 text-center" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
            {getHeaderText()}
          </h6>
          <button 
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center" 
            onClick={handleNextPeriod}
            style={{ minWidth: '36px', minHeight: '36px', padding: '0.25rem' }}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        <div className="calendar-grid-wrapper overflow-x-auto overflow-y-hidden mb-2 w-100" style={{ minWidth: 0 }}>
        {view === 'day' ? (
          <div className="w-100 rounded-3 p-4" style={{ background: 'linear-gradient(to bottom, #f8f9fa, #fff)', border: '1px solid #e9ecef' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '1.125rem' }}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h5>
                {isToday(selectedDate) && (
                  <span className="badge bg-dark mt-1" style={{ fontSize: '0.7rem' }}>Today</span>
                )}
              </div>
            </div>
            {(() => {
              const counts = getSlotCounts(selectedDate);
              const slotsForDay = daySlots.length > 0 ? daySlots : slots.filter((s) => s.date === format(selectedDate, 'yyyy-MM-dd') && !s.isHidden);
              const sortedSlots = [...slotsForDay].sort((a, b) => a.time.localeCompare(b.time));
              return (
                <div className="space-y-3">
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#d4edda', color: '#155724', fontSize: '0.8rem' }}>
                      {counts.available} available
                    </span>
                    <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#212529', color: '#fff', fontSize: '0.8rem' }}>
                      {counts.booked} booked
                    </span>
                    <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: '0.8rem' }}>
                      {counts.completed} completed
                    </span>
                    <span className="badge d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#007bff', color: '#fff', fontSize: '0.8rem' }}>
                      {counts.pending} pending
                    </span>
                  </div>
                  {counts.bookedNames.length > 0 && (
                    <div>
                      <div className="text-muted small mb-1">Booked: {counts.bookedNames.join(', ')}</div>
                    </div>
                  )}
                  {counts.completedNames.length > 0 && (
                    <div>
                      <div className="text-muted small mb-1">Completed: {counts.completedNames.join(', ')}</div>
                    </div>
                  )}
                  {counts.pendingNames.length > 0 && (
                    <div>
                      <div className="text-muted small mb-1">Pending: {counts.pendingNames.join(', ')}</div>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="fw-semibold text-muted small mb-2">{sortedSlots.length} slot{sortedSlots.length !== 1 ? 's' : ''} this day</div>
                    <div className="d-flex flex-column gap-1" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {sortedSlots.length === 0 ? (
                        <div className="text-muted small py-2">No slots</div>
                      ) : (
                        sortedSlots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            className="d-flex align-items-center justify-content-between px-3 py-2 rounded-2 border-0 w-100 text-start"
                            style={{
                              background: slot.status === 'available' ? '#d4edda' : slot.status === 'booked' || slot.status === 'confirmed' || slot.status === 'CONFIRMED' ? '#212529' : slot.status === 'completed' || slot.status === 'COMPLETED' ? '#ea580c' : '#cce5ff',
                              color: slot.status === 'available' ? '#155724' : '#fff',
                              fontSize: '0.875rem',
                              cursor: onSlotClick ? 'pointer' : 'default',
                            }}
                            onClick={() => onSlotClick?.(slot)}
                          >
                            <span className="fw-medium">{slot.time}</span>
                            <span className="small opacity-90">
                              {slot.status === 'available' ? 'Available' : (slot.clientName || (slot.status === 'completed' || slot.status === 'COMPLETED' ? 'Completed' : slot.status))}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
        <div className="d-grid grid-calendar w-100" style={{ minWidth: 0 }}>
          {dayNames.map((day) => (
            <div key={day} className="text-center fw-semibold text-muted" style={{ fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', padding: '0.25rem 0' }}>
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            const isCurrentMonth = view !== 'month' || date.getMonth() === currentMonth.getMonth();
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
                    {counts.completed > 0 && (
                      <span 
                        className="slot-count-badge slot-count-completed"
                        style={{ 
                          color: '#fff',
                          backgroundColor: dateSelected ? 'rgba(255,255,255,0.25)' : '#ea580c',
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
                        <span className="d-md-none">{counts.completed}</span>
                        <span className="d-none d-md-inline" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={counts.completedNames?.join(', ') || ''}>
                          {counts.completedNames?.length ? counts.completedNames.join(', ') : counts.completed}
                        </span>
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
        )}
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
