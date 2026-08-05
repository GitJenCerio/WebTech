import { normalizeSlotTime } from '@/lib/constants/slots';

/** Slot statuses that occupy time and break a consecutive multi-slot chain */
export const BLOCKING_SLOT_STATUSES = ['pending', 'confirmed', 'booked', 'blocked'] as const;

export type SlotLike = {
  _id?: unknown;
  id?: string;
  date: string;
  time: string;
  status: string;
  nailTechId: string | { toString(): string };
};

function slotId(s: SlotLike): string {
  return String(s.id ?? s._id ?? '');
}

function techId(s: SlotLike): string {
  return String(s.nailTechId);
}

/**
 * True if any occupying slot (pending/confirmed/booked/blocked) exists strictly
 * between timeA and timeB for the same date + nail tech.
 */
export function hasBlockingSlotBetween(
  slots: SlotLike[],
  date: string,
  nailTechId: string,
  timeA: string,
  timeB: string,
  options?: { ignoreSlotIds?: Set<string> }
): boolean {
  const na = normalizeSlotTime(timeA);
  const nb = normalizeSlotTime(timeB);
  if (!na || !nb || na === nb) return false;
  const [lo, hi] = na < nb ? [na, nb] : [nb, na];

  return slots.some((s) => {
    if (options?.ignoreSlotIds?.has(slotId(s))) return false;
    if (String(s.date) !== String(date)) return false;
    if (techId(s) !== String(nailTechId)) return false;
    const nt = normalizeSlotTime(s.time);
    if (!(nt > lo && nt < hi)) return false;
    return (BLOCKING_SLOT_STATUSES as readonly string[]).includes(s.status);
  });
}

/**
 * Build a chain of `count` consecutive available slots starting from `fromSlot`.
 * Consecutive = next available by time for the same date + tech, with no
 * occupying slots in between (missing schedule times may be skipped).
 * Returns [] if the chain cannot be completed.
 */
export function findConsecutiveAvailableSlots<T extends SlotLike>(
  allSlots: T[],
  availableSlots: T[],
  fromSlot: T,
  count: number,
  options?: { ignoreSlotIds?: Set<string>; treatSlotIdsAsAvailable?: Set<string> }
): T[] {
  if (count <= 0) return [];
  if (count === 1) return [fromSlot];

  const treatAsAvailable = options?.treatSlotIdsAsAvailable;
  const isAvailable = (s: T) =>
    s.status === 'available' || Boolean(treatAsAvailable?.has(slotId(s)));

  const date = String(fromSlot.date);
  const tech = techId(fromSlot);

  const sortedAvail = [...availableSlots]
    .filter((s) => String(s.date) === date && techId(s) === tech && isAvailable(s))
    .sort((a, b) => normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time)));

  // Ensure fromSlot is first even if not already in availableSlots
  const result: T[] = [fromSlot];
  let ref = fromSlot;

  for (let i = 1; i < count; i++) {
    const refTime = normalizeSlotTime(ref.time);
    const next = sortedAvail.find((s) => {
      const st = normalizeSlotTime(s.time);
      if (st <= refTime) return false;
      if (slotId(s) && slotId(s) === slotId(ref)) return false;
      return !hasBlockingSlotBetween(allSlots, date, tech, ref.time, s.time, {
        ignoreSlotIds: options?.ignoreSlotIds,
      });
    });
    if (!next) return [];
    result.push(next);
    ref = next;
  }

  return result;
}

/**
 * Assert selected slots are the next consecutive free slots for one tech on one day.
 * Throws if they skip a free slot or jump over another client's booking / blocked time.
 */
export function assertConsecutiveSlots(
  selectedSlots: SlotLike[],
  allSlotsForTechDate: SlotLike[],
  options?: { ignoreSlotIds?: Set<string>; treatSlotIdsAsAvailable?: Set<string> }
): void {
  if (selectedSlots.length <= 1) return;

  const sorted = [...selectedSlots].sort((a, b) =>
    normalizeSlotTime(a.time).localeCompare(normalizeSlotTime(b.time))
  );

  const first = sorted[0];
  const date = String(first.date);
  const tech = techId(first);

  for (const s of sorted) {
    if (String(s.date) !== date) {
      throw new Error('Multi-slot bookings must be on the same date');
    }
    if (techId(s) !== tech) {
      throw new Error('All slots must belong to the same nail tech');
    }
  }

  const treatIds = new Set<string>([
    ...sorted.map(slotId),
    ...(options?.treatSlotIdsAsAvailable ? [...options.treatSlotIdsAsAvailable] : []),
  ]);

  const availablePool = allSlotsForTechDate.filter(
    (s) =>
      String(s.date) === date &&
      techId(s) === tech &&
      (s.status === 'available' || treatIds.has(slotId(s)))
  );

  const chain = findConsecutiveAvailableSlots(
    allSlotsForTechDate,
    availablePool,
    first,
    sorted.length,
    {
      ignoreSlotIds: options?.ignoreSlotIds,
      treatSlotIdsAsAvailable: treatIds,
    }
  );

  if (chain.length !== sorted.length) {
    throw new Error(
      'This service requires consecutive time slots with no other bookings in between. Please select a different starting time.'
    );
  }

  const expectedIds = chain.map(slotId);
  const actualIds = sorted.map(slotId);
  if (expectedIds.some((id, i) => id !== actualIds[i])) {
    throw new Error(
      'This service requires consecutive time slots. You must take the next available slot(s) without skipping free times or bookings in between.'
    );
  }
}
