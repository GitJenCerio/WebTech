'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Sparkles } from 'lucide-react';
import { formatTime12Hour } from '@/lib/utils';
import {
  DEPOSIT_PER_SLOT,
  MANI_PEDI_EXPRESS_FEE,
  SQUEEZE_IN_FEE,
  formatPeso,
} from '@/lib/constants/policy';

interface SlotConfirmationModalProps {
  isOpen: boolean;
  slotDate: string;
  slotTime: string;
  slotType?: 'regular' | 'with_squeeze_fee' | null;
  linkedSlotTimes?: string[];
  slotCount?: number; // Total slots (1 + linked), for deposit calc: ₱500 per slot
  serviceName?: string;
  onConfirm: () => void;
  onBack: () => void;
}

export default function SlotConfirmationModal({
  isOpen,
  slotDate,
  slotTime,
  slotType,
  linkedSlotTimes = [],
  slotCount: slotCountProp,
  serviceName,
  onConfirm,
  onBack,
}: SlotConfirmationModalProps) {
  if (!isOpen) return null;

  const slotCount = slotCountProp ?? (1 + (linkedSlotTimes?.length || 0));
  const totalDeposit = DEPOSIT_PER_SLOT * slotCount;

  const formattedDate = slotDate
    ? new Date(slotDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const hasSqueezeFee = slotType === 'with_squeeze_fee';
  const isManiPediExpress =
    typeof serviceName === 'string' &&
    serviceName.toLowerCase().includes('mani + pedi express');
  const allSlotTimes = [slotTime, ...linkedSlotTimes].filter(Boolean);
  const toMinutes = (time: string) => {
    const [h, m] = String(time).split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN;
    return h * 60 + m;
  };
  const sortedTimes = [...allSlotTimes].sort((a, b) => toMinutes(a) - toMinutes(b));
  const timeDisplay = (() => {
    if (sortedTimes.length === 0) return '';
    if (sortedTimes.length === 1) return formatTime12Hour(sortedTimes[0]);
    return `${formatTime12Hour(sortedTimes[0])} - ${formatTime12Hour(sortedTimes[sortedTimes.length - 1])}`;
  })();

  return (
    <div className="brand-modal-backdrop z-50">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="brand-modal brand-modal-panel max-w-md"
      >
        <button
          onClick={onBack}
          className="brand-icon-btn absolute top-3 right-3 z-30"
          aria-label="Back"
          type="button"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="brand-modal-scroll brand-modal-body">
          <p className="brand-eyebrow mb-1 pr-9">Review</p>
          <h3 className="font-heading text-xl sm:text-2xl mb-2 pr-9 text-[#1c1917]">Confirm Your Slot</h3>
          <div className="brand-rule w-16 mb-3" aria-hidden />
          <p className="text-sm text-[#78716c] mb-4">
            Please review your selected time slot before proceeding.
          </p>

          <div className="space-y-3">
            {/* Date & Time */}
            <div className="brand-panel-soft p-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#c4b5a0] flex-shrink-0" />
                <div>
                  <p className="brand-eyebrow">Date</p>
                  <p className="brand-numeric text-sm sm:text-base text-[#1c1917]">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#c4b5a0] flex-shrink-0" />
                <div>
                  <p className="brand-eyebrow">Time</p>
                  <p className="brand-numeric text-sm sm:text-base text-[#1c1917] whitespace-nowrap">
                    {timeDisplay}
                  </p>
                </div>
              </div>
              {serviceName && (
                <div className="pt-3 border-t border-[#e7e2db]">
                  <p className="brand-eyebrow">Service</p>
                  <p className="text-sm text-[#1c1917] mt-0.5">{serviceName}</p>
                </div>
              )}
            </div>

            {/* Squeeze Fee Notice */}
            {hasSqueezeFee && (
              <div className="brand-note">
                <p className="text-sm">
                  This is a squeeze-in slot with an additional {formatPeso(SQUEEZE_IN_FEE)} fee.
                </p>
              </div>
            )}
            {isManiPediExpress && (
              <div className="brand-note-strong flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  This is a Mani + Pedi Express service. An additional {formatPeso(MANI_PEDI_EXPRESS_FEE)} fee is
                  charged on top of your total.
                </p>
              </div>
            )}

            {/* Deposit Info */}
            <div className="brand-panel-soft p-3">
              <p className="brand-eyebrow mb-1.5">Deposit</p>
              <p className="brand-numeric text-2xl text-[#1c1917]">{formatPeso(totalDeposit)}</p>
              <p className="text-xs text-[#78716c] mt-1">
                {slotCount} slot{slotCount !== 1 ? 's' : ''} × {formatPeso(DEPOSIT_PER_SLOT)}, due upon booking
              </p>
              <p className="text-xs text-[#78716c] mt-2 pt-2 border-t border-[#e7e2db]">
                Non-refundable, but fully deductible from your total.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="brand-modal-footer space-y-2.5">
          <button
            onClick={onConfirm}
            className="brand-cta w-full active:scale-[0.98] touch-manipulation"
          >
            Proceed to Booking
          </button>
          <button
            onClick={onBack}
            className="brand-cta-outline w-full active:scale-[0.98] touch-manipulation flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Choose Another Slot
          </button>
        </div>
      </motion.div>
    </div>
  );
}
