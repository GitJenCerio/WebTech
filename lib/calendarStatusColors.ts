/** Brand-aligned calendar status colors — distinct and readable */

export const CALENDAR_STATUS = {
  available: { bg: '#a34436', fg: '#fffcfa' }, // darker near-red — open slots
  pending: { bg: '#6b9ec4', fg: '#fffcfa' }, // brighter near-blue — pending payment
  booked: { bg: '#1c1917', fg: '#fffcfa' }, // ink
  confirmed: { bg: '#8a7864', fg: '#fffcfa' }, // darker champagne — brand
  completed: { bg: '#3d5340', fg: '#fffcfa' }, // sage
  hidden: { bg: '#e7e2db', fg: '#78716c' }, // ash
  fallback: { bg: '#f0ebe4', fg: '#1c1917' },
} as const;

export type CalendarStatusKey = keyof typeof CALENDAR_STATUS;

export function getCalendarSlotColors(
  status: string | null | undefined,
  isHidden?: boolean
): { bg: string; fg: string } {
  if (isHidden) return CALENDAR_STATUS.hidden;
  const s = (status || '').toLowerCase();
  if (s === 'available') return CALENDAR_STATUS.available;
  if (s === 'confirmed' || s === 'booked') return CALENDAR_STATUS.confirmed;
  if (s === 'pending' || s === 'pending_payment') return CALENDAR_STATUS.pending;
  if (s === 'completed') return CALENDAR_STATUS.completed;
  return CALENDAR_STATUS.fallback;
}
