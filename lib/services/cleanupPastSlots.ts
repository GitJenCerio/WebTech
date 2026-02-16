import connectDB from '@/lib/mongodb';
import Slot from '@/lib/models/Slot';
import Booking from '@/lib/models/Booking';

/** Manila timezone offset (UTC+8) in ms */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Get current date and time in Manila as YYYY-MM-DD and HH:mm (24h).
 */
function getManilaNow(): { date: string; time: string } {
  const now = new Date();
  const manilaMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + MANILA_OFFSET_MS;
  const manila = new Date(manilaMs);
  const date = manila.toISOString().slice(0, 10); // YYYY-MM-DD
  const time = `${String(manila.getHours()).padStart(2, '0')}:${String(manila.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export interface CleanupPastSlotsResult {
  deleted: number;
  slotIds: string[];
  error?: string;
}

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
let lastRunAt = 0;

/**
 * Runs cleanup at most once per 5 minutes. Use this when triggering from API on app refresh.
 * Returns the result of cleanupPastSlots() or { deleted: 0, slotIds: [] } if throttled.
 */
export async function cleanupPastSlotsIfDue(): Promise<CleanupPastSlotsResult> {
  const now = Date.now();
  if (now - lastRunAt < THROTTLE_MS) {
    return { deleted: 0, slotIds: [] };
  }
  lastRunAt = now;
  return cleanupPastSlots();
}

/**
 * Deletes past slots that are not referenced by any booking.
 * "Past" = slot date is before today (Manila), or date is today and slot time has passed.
 * Only slots that do not appear in any booking's slotIds are deleted.
 */
export async function cleanupPastSlots(): Promise<CleanupPastSlotsResult> {
  await connectDB();

  const { date: today, time: nowTime } = getManilaNow();

  // 1) Find all past slots: date < today, or (date === today and time < nowTime)
  const pastSlots = await Slot.find({
    $or: [
      { date: { $lt: today } },
      { date: today, time: { $lt: nowTime } },
    ],
  })
    .select('_id')
    .lean();

  const pastSlotIds = pastSlots.map((s: any) => String(s._id));
  if (pastSlotIds.length === 0) {
    return { deleted: 0, slotIds: [] };
  }

  // 2) Find which of those slot IDs are referenced by any booking (any status)
  const bookingsWithSlots = await Booking.find(
    { slotIds: { $in: pastSlotIds } },
    { slotIds: 1 }
  ).lean();

  const bookedSlotIds = new Set<string>();
  for (const b of bookingsWithSlots) {
    for (const id of (b as any).slotIds || []) {
      bookedSlotIds.add(String(id));
    }
  }

  // 3) Slots to delete = past and not in any booking
  const toDelete = pastSlotIds.filter((id) => !bookedSlotIds.has(id));
  if (toDelete.length === 0) {
    return { deleted: 0, slotIds: [] };
  }

  // 4) Delete in bulk (Mongoose casts string ids to ObjectId for _id)
  const result = await Slot.deleteMany({ _id: { $in: toDelete } });
  const deleted = result.deletedCount ?? 0;

  if (deleted > 0) {
    console.log('[cleanupPastSlots] Deleted', deleted, 'past unbooked slot(s)');
  }

  return { deleted, slotIds: toDelete };
}
