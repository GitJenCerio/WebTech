/**
 * Single source of truth for the client-facing policy amounts and windows quoted
 * across the booking flow, the FAQ, and the studio policies page.
 */

import { RESERVATION_DEPOSIT_PER_SLOT } from '@/lib/utils/bookingDeposit';

export const DEPOSIT_PER_SLOT = RESERVATION_DEPOSIT_PER_SLOT;

export const RESCHEDULE_FEE = 200;
export const RESCHEDULE_NOTICE_DAYS = 3;

export const LATE_ARRIVAL_GRACE_MINUTES = 15;
export const LATE_ARRIVAL_FEE = 200;
export const LATE_ARRIVAL_CANCEL_MINUTES = 30;

export const SQUEEZE_IN_FEE = 500;
export const MANI_PEDI_EXPRESS_FEE = 300;

export const PROOF_OF_PAYMENT_WINDOW_HOURS = 48;

export const STUDIO_ADDRESS = '1046 San Diego St. Sampaloc Manila';

/** Formats a peso amount with thousands separators, e.g. 1500 -> "₱1,500". */
export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}
