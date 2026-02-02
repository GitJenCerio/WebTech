import React from 'react';

export type BadgeVariant = 'available' | 'booked' | 'disabled' | 'pending' | 'confirmed' | 'cancelled' | 'shipped' | 'in-progress' | 'vip' | 'regular';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  available: 'bg-success text-white',
  booked: 'bg-dark text-white',
  disabled: 'bg-secondary text-dark',
  pending: 'bg-warning text-dark',
  confirmed: 'bg-dark text-white',
  cancelled: 'bg-danger text-white',
  shipped: 'bg-dark text-white',
  'in-progress': 'bg-secondary text-dark',
  vip: 'bg-dark text-white',
  regular: 'bg-secondary text-dark',
};

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
