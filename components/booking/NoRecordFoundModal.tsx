'use client';

import { motion } from 'framer-motion';
import { IoInformationCircleOutline, IoClose } from 'react-icons/io5';

type NoRecordFoundModalProps = {
  open: boolean;
  searchValue: string;
  onClose: () => void;
  onProceedAsNew: () => void;
};

export function NoRecordFoundModal({ 
  open, 
  searchValue, 
  onClose, 
  onProceedAsNew 
}: NoRecordFoundModalProps) {
  if (!open) return null;

  return (
    <div className="brand-modal-backdrop z-[60]">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="brand-modal brand-modal-panel max-w-md"
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="brand-icon-btn absolute top-3 right-3 z-30"
          aria-label="Close"
          type="button"
        >
          <IoClose className="w-5 h-5" />
        </button>

        <div className="brand-modal-scroll brand-modal-body">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 flex-shrink-0 border border-[#c4b5a0] bg-[#f0ebe4] flex items-center justify-center">
              <IoInformationCircleOutline className="w-4 h-4 text-[#1c1917]" />
            </div>
            <div className="flex-1">
              <p className="brand-eyebrow mb-0.5">Account lookup</p>
              <h3 className="font-heading text-xl sm:text-2xl text-[#1c1917] pr-9">
                No Record Found
              </h3>
              <p className="text-sm text-[#78716c] mt-1.5">
                We couldn&apos;t find any booking records for{' '}
                <span className="text-[#1c1917]">{searchValue}</span> in our system.
              </p>
            </div>
          </div>

          <div className="brand-note">
            <p className="text-xs sm:text-sm leading-relaxed">
              You can still proceed with your booking as a{' '}
              <span className="text-[#1c1917]">new client</span>. We&apos;ll create a new record for you when you
              complete the booking form.
            </p>
          </div>
        </div>

        <div className="brand-modal-footer space-y-2.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onProceedAsNew();
            }}
            className="brand-cta w-full active:scale-[0.98] touch-manipulation"
          >
            Book as New Client
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="brand-cta-outline w-full active:scale-[0.98] touch-manipulation"
          >
            Try Different Email/Phone
          </button>
        </div>
      </motion.div>
    </div>
  );
}
