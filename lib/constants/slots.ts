// 30-minute intervals from 7:00 AM to 8:00 PM (20:00)
export const SLOT_TIMES = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00'
] as const;

export type SlotTime = (typeof SLOT_TIMES)[number];

/** Normalize any time string (7:00, 07:00, 7:00 AM, 10:00:00) or Date to HH:mm for slot matching */
export function normalizeSlotTime(time: string | Date | null | undefined): string {
  if (time == null) return '';
  if (time instanceof Date) {
    return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
  }
  const t = String(time).trim();
  if (!t) return '';
  // ISO date (2026-04-03T10:00:00.000Z): extract HH:mm
  if (t.includes('T') && /^\d{4}-\d{2}-\d{2}T/.test(t)) {
    const match = t.match(/T(\d{1,2}):(\d{2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const min = parseInt(match[2] || '0', 10);
      return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  if (t.toUpperCase().includes('AM') || t.toUpperCase().includes('PM')) {
    const match = t.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1] || '0', 10);
      const min = parseInt(match[2] || '0', 10);
      if (match[3]!.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      else if (match[3]!.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }
  const parts = t.split(':');
  const hour = parseInt(parts[0] || '0', 10);
  const min = parseInt(parts[1] || '0', 10);
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function getNextSlotTime(time: string): string | null {
  const normalized = normalizeSlotTime(time);
  const index = SLOT_TIMES.indexOf(normalized as SlotTime);
  if (index === -1 || index === SLOT_TIMES.length - 1) return null;
  return SLOT_TIMES[index + 1];
}

export function getPreviousSlotTime(time: string): string | null {
  const normalized = normalizeSlotTime(time);
  const index = SLOT_TIMES.indexOf(normalized as SlotTime);
  if (index === -1 || index === 0) return null;
  return SLOT_TIMES[index - 1];
}

