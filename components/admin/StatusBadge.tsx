'use client';

import React from 'react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

export type BookingStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW'
  | 'pending'
  | 'confirmed'
  | 'no_show'
  | 'blocked'
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
    PENDING_PAYMENT: { label: 'Pending Payment', variant: 'info' },
    CONFIRMED: { label: 'Confirmed', variant: 'default' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
    NO_SHOW: { label: 'No Show', variant: 'destructive' },
    pending: { label: 'Pending Payment', variant: 'info' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    no_show: { label: 'No Show', variant: 'destructive' },
    blocked: { label: 'Blocked', variant: 'default' },
    // Legacy status support: available=green, pending=blue, confirmed=black
    available: { label: 'Available', variant: 'success' },
    booked: { label: 'Booked', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
    'no-show': { label: 'No Show', variant: 'destructive' },
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
