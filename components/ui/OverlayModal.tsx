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
 * - Backdrop: `brand-modal-backdrop` (ink wash, centered, dvh-capped)
 * - Panel: `brand-modal brand-modal-panel` (pearl surface, silver border, flex column)
 * Children are expected to be a `brand-modal-scroll brand-modal-body` region
 * followed by an optional `brand-modal-footer`, which keeps the action row
 * visible no matter how tall the content is. The close button floats over the
 * shell, so headers need their own right clearance (`pr-9`).
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
      className="brand-modal-backdrop"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      {/* Click-to-dismiss layer. The wash itself lives on brand-modal-backdrop. */}
      <div className="fixed inset-0" aria-hidden onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn('brand-modal brand-modal-panel', sizeClass, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sits on the shell, not the scroll region, so it stays put. */}
        {closeButton != null ? (
          <div className="absolute top-3 right-3 z-30">{closeButton}</div>
        ) : null}
        {children}
      </motion.div>
    </div>
  );
}
