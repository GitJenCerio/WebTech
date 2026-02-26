import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  if (!techId) return 'bg-slate-100 text-slate-700 border-slate-300';
  
  // Extended color palette with highly vibrant, saturated colors for maximum visibility
  const colors = [
    'bg-blue-500 text-white border-blue-700 shadow-lg shadow-blue-500/50',
    'bg-purple-500 text-white border-purple-700 shadow-lg shadow-purple-500/50',
    'bg-pink-500 text-white border-pink-700 shadow-lg shadow-pink-500/50',
    'bg-indigo-500 text-white border-indigo-700 shadow-lg shadow-indigo-500/50',
    'bg-teal-500 text-white border-teal-700 shadow-lg shadow-teal-500/50',
    'bg-amber-500 text-white border-amber-700 shadow-lg shadow-amber-500/50',
    'bg-rose-500 text-white border-rose-700 shadow-lg shadow-rose-500/50',
    'bg-cyan-500 text-white border-cyan-700 shadow-lg shadow-cyan-500/50',
    'bg-emerald-500 text-white border-emerald-700 shadow-lg shadow-emerald-500/50',
    'bg-violet-500 text-white border-violet-700 shadow-lg shadow-violet-500/50',
    'bg-fuchsia-500 text-white border-fuchsia-700 shadow-lg shadow-fuchsia-500/50',
    'bg-orange-500 text-white border-orange-700 shadow-lg shadow-orange-500/50',
    'bg-lime-500 text-slate-900 border-lime-700 shadow-lg shadow-lime-500/50',
    'bg-sky-500 text-white border-sky-700 shadow-lg shadow-sky-500/50',
    'bg-yellow-500 text-slate-900 border-yellow-700 shadow-lg shadow-yellow-500/50',
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



