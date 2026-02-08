'use client';

import React from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

export type BookingStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW'
  | 'available' 
  | 'booked' 
  | 'completed' 
  | 'cancelled' 
  | 'no-show' 
  | 'disabled';

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

/**
 * StatusBadge Component - Displays booking status
 * Uses standardized Badge component with semantic colors
 * Following DEVELOPMENT_STANDARDS.md color palette
 */
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
    PENDING_PAYMENT: { label: 'Pending Payment', variant: 'pending' },
    CONFIRMED: { label: 'Confirmed', variant: 'confirmed' },
    COMPLETED: { label: 'Completed', variant: 'completed' },
    CANCELLED: { label: 'Cancelled', variant: 'cancelled' },
    NO_SHOW: { label: 'No Show', variant: 'no-show' },
    // Legacy status support
    available: { label: 'Available', variant: 'confirmed' },
    booked: { label: 'Booked', variant: 'pending' },
    completed: { label: 'Completed', variant: 'completed' },
    cancelled: { label: 'Cancelled', variant: 'cancelled' },
    'no-show': { label: 'No Show', variant: 'no-show' },
    disabled: { label: 'Disabled', variant: 'default' },
  };
  
  const config = statusConfig[status];
  
  if (!config) {
    return (
      <Badge variant="default" className={className}>
        {status}
      </Badge>
    );
  }
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
