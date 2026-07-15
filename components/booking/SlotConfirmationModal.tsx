'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { formatTime12Hour } from '@/lib/utils';

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

const DEPOSIT_PER_SLOT = 500;
const MANI_PEDI_EXPRESS_FEE = 300;

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-[#e4e4e7] max-w-md w-full p-6 sm:p-8 shadow-2xl my-4 max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onBack}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation z-10"
          aria-label="Back"
          type="button"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        <h3 className="text-2xl font-semibold mb-2 pr-10 text-gray-900">Confirm Your Slot</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please review your selected time slot before proceeding.
        </p>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="border border-[#e4e4e7] bg-[#fafafa] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-700 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-base font-semibold text-gray-900">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-700 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Time</p>
                <p className="text-base font-semibold text-gray-900 whitespace-nowrap">
                  {timeDisplay}
                </p>
              </div>
            </div>
            {serviceName && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-700">
                  <strong>Service:</strong> {serviceName}
                </p>
              </div>
            )}
          </div>

          {/* Squeeze Fee Notice */}
          {hasSqueezeFee && (
            <div className="border border-[#e4e4e7] bg-[#fafafa] px-4 py-3">
              <p className="text-sm text-[#52525b] font-medium">
                This is a squeeze-in slot with an additional ₱500 fee.
              </p>
            </div>
          )}
          {isManiPediExpress && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900 font-medium">
                This is a Mani + Pedi Express service. An additional ₱{MANI_PEDI_EXPRESS_FEE} fee will be charged on top of your total.
              </p>
            </div>
          )}

          {/* Deposit Info */}
          <div className="border border-[#e4e4e7] bg-[#fafafa] px-4 py-3 space-y-2 text-left">
            <p className="text-sm text-gray-900 flex items-start gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
              <span><span className="font-medium">₱{totalDeposit.toLocaleString()} deposit</span> is required ({slotCount} slot{slotCount !== 1 ? 's' : ''} × ₱500) upon booking</span>
            </p>
            <p className="text-sm text-gray-900 flex items-start gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-gray-700 flex-shrink-0 mt-0.5" />
              <span>Deposit is <span className="font-medium">non-refundable</span> but consumable</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-300 space-y-3">
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
