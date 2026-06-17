import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';

/** Slot IDs currently held by a booking (includes all rows in an express pair). */
export async function getSlotIdsHeldByBooking(bookingId: string): Promise<string[]> {
  if (!bookingId?.trim()) return [];

  await connectDB();
  const booking = await Booking.findById(bookingId).select('slotIds expressGroupId').lean();
  if (!booking) return [];

  const members = (booking as { expressGroupId?: string }).expressGroupId
    ? await Booking.find({ expressGroupId: (booking as { expressGroupId: string }).expressGroupId })
        .select('slotIds')
        .lean()
    : [booking];

  const ids = new Set<string>();
  for (const member of members) {
    for (const slotId of (member as { slotIds?: string[] }).slotIds || []) {
      ids.add(String(slotId));
    }
  }
  return [...ids];
}

export function isSlotSelectableForBooking(
  slot: { _id: unknown; status: string },
  heldSlotIds?: Set<string>
): boolean {
  if (slot.status === 'available') return true;
  if (slot.status === 'blocked') return false;
  return Boolean(heldSlotIds?.has(String(slot._id)));
}
