'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Check, Clock3, Mail, Upload } from 'lucide-react';
import { PAYMENT_CHANNELS, PAYMENT_TRANSFER_NOTE } from '@/lib/constants/payment';
import { PROOF_OF_PAYMENT_WINDOW_HOURS, formatPeso } from '@/lib/constants/policy';

interface BookingSuccessModalProps {
  isOpen: boolean;
  bookingCode: string;
  /** Deposit due for the booking just created. Omit to hide the amount. */
  depositAmount?: number | null;
  /** Tokenised upload-proof URL from the booking response, if it was issued. */
  uploadProofLink?: string | null;
  uploadWarning?: string | null;
  onClose: () => void;
}

export default function BookingSuccessModal({
  isOpen,
  bookingCode,
  depositAmount,
  uploadProofLink,
  uploadWarning,
  onClose,
}: BookingSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="brand-modal-backdrop z-[70]">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="brand-modal brand-modal-panel max-w-md"
      >
        <div className="brand-modal-scroll brand-modal-body">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 border border-[#c4b5a0] bg-[#f0ebe4] flex items-center justify-center flex-shrink-0">
              <Clock3 className="w-4 h-4 text-[#1c1917]" />
            </div>
            <div>
              <p className="brand-eyebrow mb-0.5">Awaiting deposit</p>
              <h3 className="font-heading text-xl sm:text-2xl text-[#1c1917]">Your Booking is Pending</h3>
            </div>
          </div>

          <div className="brand-panel-soft p-3 mb-3 flex items-start justify-between gap-3">
            {/* Codes are combined for simultaneous bookings, so this can wrap. */}
            <div className="min-w-0">
              <p className="brand-eyebrow">Booking code</p>
              <p className="brand-numeric text-lg text-[#1c1917] mt-1 break-words">{bookingCode}</p>
            </div>
            {depositAmount ? (
              <div className="text-right flex-shrink-0">
                <p className="brand-eyebrow">Deposit due</p>
                <p className="brand-numeric text-lg text-[#1c1917] mt-1">{formatPeso(depositAmount)}</p>
              </div>
            ) : null}
          </div>

          <div className="brand-note-strong mb-3">
            <p className="brand-eyebrow mb-1.5">Pay within {PROOF_OF_PAYMENT_WINDOW_HOURS} hours</p>
            <p className="text-xs sm:text-sm">
              Your slot is released automatically if we do not receive your proof of payment in time. The deposit is
              non-refundable but fully deductible from your total.
            </p>
          </div>

          {/* Repeated from the pending email so a client who never receives it
              can still pay straight after booking. */}
          <div className="brand-panel-soft p-3 mb-3">
            <p className="brand-eyebrow mb-2.5">Scan to pay via InstaPay</p>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_CHANNELS.map((channel) => (
                <div key={channel.id}>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#3d342c] mb-1.5">{channel.label}</p>
                  <a
                    href={channel.qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-[#e7e2db] bg-[#fffcfa] p-1 transition-colors hover:border-[#c4b5a0]"
                    title={`Open ${channel.label} QR code`}
                  >
                    {/* Plain img: the QR host is env-configurable, so it cannot
                        be pinned in next.config remotePatterns. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={channel.qrUrl}
                      alt={`${channel.label} payment QR code`}
                      width={180}
                      height={180}
                      className="w-full h-auto"
                    />
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#78716c] mt-2.5">
              {PAYMENT_TRANSFER_NOTE} Tap a QR code to open it full size.
            </p>
          </div>

          <div className="space-y-2.5 mb-3 text-sm text-[#57534e]">
            <p className="flex items-start gap-2.5">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
              <span>We received your booking details successfully.</span>
            </p>
            <p className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#c4b5a0]" />
              <span>
                {uploadProofLink
                  ? 'We also emailed you these payment details and your upload link, in case you want to pay later.'
                  : 'Check your email for the link to upload your payment proof — your slot is confirmed once the deposit is verified.'}
              </span>
            </p>
          </div>

          {uploadWarning ? (
            <div className="brand-note-error mb-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm">{uploadWarning}</p>
            </div>
          ) : null}

          <div className="brand-note">
            <p className="brand-eyebrow mb-1.5">Before your appointment</p>
            <p className="text-xs sm:text-sm">
              Please avoid lotion or oils beforehand. A dry manicure works best on clean, dry nails and gives better
              retention. You can moisturize after your service.
            </p>
          </div>
        </div>

        <div className="brand-modal-footer space-y-2.5">
          {uploadProofLink ? (
            <a
              href={uploadProofLink}
              className="brand-cta w-full gap-2 active:scale-[0.98] touch-manipulation"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Proof of Payment
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`w-full active:scale-[0.98] touch-manipulation ${
              uploadProofLink ? 'brand-cta-outline' : 'brand-cta'
            }`}
          >
            {uploadProofLink ? 'I’ll Pay Later' : 'Okay, I Understand'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
