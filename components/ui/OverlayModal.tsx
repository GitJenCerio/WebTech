'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from './Utils';

export interface OverlayModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when backdrop or close is clicked */
  onClose: () => void;
  /** Content of the modal panel */
  children: React.ReactNode;
  /** Max width: 'md' (max-w-md) or 'lg' (max-w-2xl) for forms */
  size?: 'md' | 'lg';
  /** Optional close/back button (top-right). If not passed, no button is shown. */
  closeButton?: React.ReactNode;
  /** z-index for the overlay (default 50). Use 60/70 when stacking above other modals. */
  zIndex?: number;
  /** Additional class for the panel */
  className?: string;
}

/**
 * Consistent overlay + panel for all booking-style dialogs.
 * - Backdrop: fixed inset-0, bg-black/60, p-4, centered
 * - Panel: white bg, border-2 border-gray-300, rounded-xl, shadow-2xl, scrollable
 * Use for ClientType, ServiceType, NailTech, SlotConfirm, RecordFound, NoRecordFound, BookingSuccess.
 * BookingFormModal can use size="lg" and keep its own close button.
 */
export function OverlayModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeButton,
  zIndex = 50,
  className,
}: OverlayModalProps) {
  if (!isOpen) return null;

  const sizeClass = size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'relative w-full bg-white border-2 border-gray-400 rounded-xl shadow-2xl my-4 max-h-[90vh] overflow-y-auto',
          sizeClass,
          size === 'lg' && 'max-h-[95vh]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {closeButton != null ? (
          <div className="absolute top-4 right-4 z-10">{closeButton}</div>
        ) : null}
        <div className={closeButton != null ? 'pr-10' : undefined}>{children}</div>
      </motion.div>
    </div>
  );
}
