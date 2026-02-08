'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Info } from 'lucide-react';

interface BookingSuccessModalProps {
  isOpen: boolean;
  bookingCode: string;
  uploadWarning?: string | null;
  onClose: () => void;
}

export default function BookingSuccessModal({
  isOpen,
  bookingCode,
  uploadWarning,
  onClose,
}: BookingSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border-2 border-gray-300 rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl my-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-yellow-700" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Your Booking is Pending</h3>
            <p className="text-sm text-gray-600 mt-1">Booking code: <strong>{bookingCode}</strong></p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-4 space-y-3 mb-5">
          <p className="text-sm text-gray-800">
            Please complete your deposit payment to finalize your appointment.
          </p>
          <p className="text-sm text-gray-700 flex items-start gap-2">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Check your email for the link to upload your payment proof.
          </p>
        </div>

        <div className="rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3 mb-5">
          <p className="text-xs sm:text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            We received your booking details successfully.
          </p>
        </div>

        {uploadWarning ? (
          <div className="rounded-lg border-2 border-amber-200 bg-amber-50 px-4 py-3 mb-5">
            <p className="text-xs sm:text-sm text-amber-800">{uploadWarning}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 active:scale-[0.98] transition-all touch-manipulation text-sm"
        >
          Okay, I Understand
        </button>
      </motion.div>
    </div>
  );
}
