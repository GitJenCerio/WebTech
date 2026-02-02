'use client';

import React, { useState } from 'react';

interface CalendarPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onViewChange?: (view: 'month' | 'week') => void;
}

export default function CalendarPanel({
  selectedDate,
  onDateSelect,
  onViewChange,
}: CalendarPanelProps) {
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(today);
  };

  const days = getDaysInMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
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
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={handlePrevMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <h6 className="mb-0">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h6>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleNextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>

        <div className="d-grid grid-calendar mb-3">
          {dayNames.map((day) => (
            <div key={day} className="text-center fw-semibold small text-muted">
              {day}
            </div>
          ))}
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const dateToday = isToday(date);
            const dateSelected = isSelected(date);

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
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <button className="btn btn-sm btn-outline-secondary w-100" onClick={handleToday}>
          Go to Today
        </button>
      </div>
    </div>
  );
}
