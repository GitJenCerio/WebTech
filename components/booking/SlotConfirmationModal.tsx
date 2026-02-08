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
  serviceName,
  onConfirm,
  onBack,
}: SlotConfirmationModalProps) {
  if (!isOpen) return null;

  const formattedDate = slotDate
    ? new Date(slotDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const hasSqueezeFee = slotType === 'with_squeeze_fee';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-2 border-gray-300 rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-4 max-h-[90vh] overflow-y-auto relative"
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
          <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-4 space-y-3">
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
                <p className="text-base font-semibold text-gray-900">
                  {slotTime ? formatTime12Hour(slotTime) : ''}
                  {linkedSlotTimes.length > 0 && (
                    <span className="text-sm font-normal text-gray-600">
                      {' & '}
                      {linkedSlotTimes.map((t) => formatTime12Hour(t)).join(' & ')}
                    </span>
                  )}
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
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-3">
              <p className="text-sm text-purple-800 font-medium">
                This is a squeeze-in slot with an additional ₱500 fee.
              </p>
            </div>
          )}

          {/* Deposit Info */}
          <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-4 py-3 space-y-2">
            <p className="text-sm text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-700 flex-shrink-0" />
              <strong>₱500 deposit</strong> is required upon booking
            </p>
            <p className="text-sm text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-700 flex-shrink-0" />
              Deposit is <strong>non-refundable</strong> but consumable
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-300 space-y-3">
          <button
            onClick={onConfirm}
            className="w-full px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all touch-manipulation text-sm"
          >
            Proceed to Booking
          </button>
          <button
            onClick={onBack}
            className="w-full px-4 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 active:scale-[0.98] transition-all touch-manipulation text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Choose Another Slot
          </button>
        </div>
      </motion.div>
    </div>
  );
}
