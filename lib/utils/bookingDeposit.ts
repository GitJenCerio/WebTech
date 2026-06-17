/** Reservation deposit per slot (matches public booking flow and admin UI). */
export const RESERVATION_DEPOSIT_PER_SLOT = 500;

export function resolveReservationDeposit(slotCount: number, provided?: number): number {
  if (typeof provided === 'number' && provided > 0) return provided;
  return RESERVATION_DEPOSIT_PER_SLOT * Math.max(1, slotCount);
}

export function getBookingDepositDue(booking: {
  pricing?: { depositRequired?: number; paidAmount?: number };
  slotIds?: string[];
  service?: { type?: string; expressSegment?: string };
  expressGroupId?: string;
}): number {
  const stored = booking.pricing?.depositRequired;
  if (typeof stored === 'number' && stored > 0) return stored;

  if (booking.service?.expressSegment === 'pedicure') return 0;

  const isExpress =
    Boolean(booking.expressGroupId) ||
    booking.service?.expressSegment === 'manicure' ||
    (booking.service?.type?.includes('Mani + Pedi Express') ?? false);

  if (isExpress) {
    return resolveReservationDeposit(2);
  }

  return resolveReservationDeposit(booking.slotIds?.length ?? 1);
}
