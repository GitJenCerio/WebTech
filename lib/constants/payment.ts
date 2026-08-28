/**
 * Payment channels quoted to clients. Referenced by both the pending-booking
 * email and the in-app pending modal, so the two can never drift apart.
 *
 * The QR images are configurable because they encode account details that
 * change. Set the NEXT_PUBLIC_ names — they are the only ones inlined into the
 * browser bundle. The unprefixed names stay supported so existing server-side
 * configuration keeps working for the email.
 */

const GCASH_QR_FALLBACK = 'https://i.imgur.com/kxV0B0P.jpeg';
const PNB_QR_FALLBACK = 'https://i.imgur.com/5MR7dcR.jpeg';

export const PAYMENT_QR_GCASH =
  process.env.NEXT_PUBLIC_PAYMENT_QR_GCASH_URL || process.env.PAYMENT_QR_GCASH_URL || GCASH_QR_FALLBACK;

export const PAYMENT_QR_PNB =
  process.env.NEXT_PUBLIC_PAYMENT_QR_PNB_URL || process.env.PAYMENT_QR_PNB_URL || PNB_QR_FALLBACK;

export interface PaymentChannel {
  id: string;
  label: string;
  qrUrl: string;
}

export const PAYMENT_CHANNELS: PaymentChannel[] = [
  { id: 'gcash', label: 'GCash', qrUrl: PAYMENT_QR_GCASH },
  { id: 'pnb', label: 'PNB Debit Savings', qrUrl: PAYMENT_QR_PNB },
];

/** Channel names as a sentence, e.g. "GCash or PNB Debit Savings". */
export const PAYMENT_CHANNELS_SENTENCE = PAYMENT_CHANNELS.map((c) => c.label).join(' or ');

export const PAYMENT_TRANSFER_NOTE = 'Transfer fees may apply.';
