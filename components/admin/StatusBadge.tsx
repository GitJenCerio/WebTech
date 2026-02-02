import React from 'react';

export type BookingStatus = 'available' | 'booked' | 'completed' | 'cancelled' | 'no-show' | 'disabled';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig: Record<BookingStatus, { label: string; class: string }> = {
  available: { label: 'Available', class: 'bg-success text-white' },
  booked: { label: 'Booked', class: 'bg-dark text-white' },
  completed: { label: 'Completed', class: 'bg-secondary text-dark' },
  cancelled: { label: 'Cancelled', class: 'bg-danger text-white' },
  'no-show': { label: 'No Show', class: 'bg-warning text-dark' },
  disabled: { label: 'Disabled', class: 'bg-light text-dark border' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  if (!config) {
    // Fallback for unknown status
    return (
      <span className={`badge bg-secondary text-dark ${className}`}>
        {status}
      </span>
    );
  }
  
  return (
    <span className={`badge ${config.class} ${className}`}>
      {config.label}
    </span>
  );
}
