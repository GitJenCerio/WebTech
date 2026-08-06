import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { normalizeSlotTime } from "@/lib/constants/slots";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts 24-hour time format (HH:mm) to 12-hour format with AM/PM
 * Safely handles input that might already be in 12-hour format
 * @param time24 - Time in 24-hour format (e.g., "14:30", "09:00") or already 12-hour (e.g., "2:30 PM")
 * @returns Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTime12Hour(time24: string | number | null | undefined): string {
  if (time24 == null || time24 === '') return '';
  const s = String(time24).trim();
  if (!s) return '';
  // Firebase Timestamp: convert to Date and format
  if (typeof time24 === 'object' && typeof (time24 as { toDate?: () => Date }).toDate === 'function') {
    const d = (time24 as { toDate: () => Date }).toDate();
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  if (s.toUpperCase().includes('AM') || s.toUpperCase().includes('PM')) return s;
  const parts = s.split(':');
  const hours = parts[0] || '0';
  const minutes = parts[1] ?? '0';
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return s;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const mins = String(minutes).padStart(2, '0');
  return `${hour12}:${mins} ${ampm}`;
}

/**
 * Parses time string (24h or 12h) to minutes since midnight for sorting
 */
function parseTimeToMinutes(time: string): number {
  if (!time) return 0;
  const upper = time.toUpperCase();
  if (upper.includes('AM') || upper.includes('PM')) {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let [, h, m, period] = match;
    let hour = parseInt(h, 10);
    const min = parseInt(m || '0', 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    else if (period === 'AM' && hour === 12) hour = 0;
    return hour * 60 + min;
  }
  const [h, m] = time.split(':');
  const hour = parseInt(h || '0', 10);
  const min = parseInt(m || '0', 10);
  return hour * 60 + min;
}

/**
 * Sorts an array of time strings chronologically (earliest first)
 * Handles both 24-hour (HH:mm) and 12-hour (h:mm AM/PM) formats
 */
export function sortTimesChronologically(times: string[]): string[] {
  return [...times].sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
}

/**
 * Sorts slots chronologically, keeping slots from the same booking (multi-slot) adjacent.
 * E.g. a Mani+Pedi with 10:00 and 10:30 will appear together even if other slots exist at 10:00.
 */
export function sortSlotsWithPairedBookings<T extends { id: string; time: string; booking?: { id?: string } | null }>(
  slots: T[]
): T[] {
  const norm = (t: string) => normalizeSlotTime(t);

  const bookingMinTime = new Map<string, string>();
  for (const s of slots) {
    const bid = s.booking?.id;
    if (bid) {
      const nt = norm(s.time);
      const existing = bookingMinTime.get(bid);
      if (!existing || nt < existing) bookingMinTime.set(bid, nt);
    }
  }

  return [...slots].sort((a, b) => {
    const aGroupKey = a.booking?.id ? (bookingMinTime.get(a.booking.id) ?? norm(a.time)) : norm(a.time);
    const bGroupKey = b.booking?.id ? (bookingMinTime.get(b.booking.id) ?? norm(b.time)) : norm(b.time);
    if (aGroupKey !== bGroupKey) return aGroupKey.localeCompare(bGroupKey);
    const cmp = norm(a.time).localeCompare(norm(b.time));
    if (cmp !== 0) return cmp;
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Formats nail tech name with "Ms." prefix
 * @param name - Name without prefix (e.g., "Jhen")
 * @returns Formatted name with "Ms." prefix (e.g., "Ms. Jhen")
 */
export function formatNailTechName(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();
  // Remove "Ms." prefix if already present (case insensitive)
  const normalized = trimmed.toLowerCase().startsWith('ms.') 
    ? trimmed.substring(3).trim() 
    : trimmed;
  return `Ms. ${normalized}`;
}

/**
 * Gets the color classes for a nail tech based on their sorted position
 * This ensures consistent color assignment - same nail tech always gets same color
 * Colors are assigned based on sorted order (by name) for stability
 * @param techId - The nail tech's ID
 * @param allTechIds - Optional array of all nail tech IDs sorted by name (for consistent color assignment)
 * @returns Tailwind CSS classes for background, text, and border colors
 */
export function getNailTechColorClasses(techId: string | null | undefined, allTechIds?: string[]): string {
  if (!techId) return 'bg-[#f7f6f4] text-[#78716c] border-[#e7e2db]';
  
  // Brand-warm but distinct hues (champagne, clay, sage, mauve, olive, slate, caramel, cocoa)
  const colors = [
    'bg-[#efe6d8] text-[#5c4a32] border-[#c4b5a0]',
    'bg-[#f0e0dc] text-[#7a3f38] border-[#d4a89e]',
    'bg-[#e4ebe3] text-[#3d5340] border-[#a8b89e]',
    'bg-[#ebe3ef] text-[#5c3d5a] border-[#c4a8c0]',
    'bg-[#ebe6d2] text-[#6b5a2e] border-[#c4b878]',
    'bg-[#e3e8ec] text-[#3d4a54] border-[#9aadb8]',
    'bg-[#f0e4d4] text-[#6b4528] border-[#d4b090]',
    'bg-[#e8ddd8] text-[#5a3830] border-[#c4a090]',
  ];
  
  // If we have the sorted list of all tech IDs, use position-based assignment for stability
  if (allTechIds && allTechIds.length > 0) {
    const index = allTechIds.indexOf(techId);
    if (index >= 0) {
      return colors[index % colors.length];
    }
  }
  
  // Fallback: use hash function if sorted list not provided (for backward compatibility)
  let hash = 5381;
  for (let i = 0; i < techId.length; i++) {
    hash = ((hash << 5) + hash) + techId.charCodeAt(i);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}



