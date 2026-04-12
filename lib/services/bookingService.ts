import { randomUUID } from 'crypto';
import connectDB from '../mongodb';
import Booking, { IBooking } from '../models/Booking';
import BookingCounter from '../models/BookingCounter';
import Slot from '../models/Slot';
import Customer from '../models/Customer';
import NailTech from '../models/NailTech';
import type { BookingStatus, PaymentStatus, ServiceType } from '../types';
import { hasAnyRealInvoice } from '../utils/bookingInvoice';

/**
 * Get Manila-local date key in YYYYMMDD format
 */
function getManilaDateKey(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return formatted.replace(/-/g, '');
}

/**
 * Generate a unique booking code in format GN-YYYYMMDDNNN
 * Uses an atomic per-day counter to avoid race conditions.
 */
async function generateBookingCode(): Promise<string> {
  const dateKey = getManilaDateKey();

  const counter = await BookingCounter.findOneAndUpdate(
    { dateKey },
    {
      $inc: { seq: 1 },
      $setOnInsert: { dateKey },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  const sequence = counter?.seq ?? 1;
  const sequencePadded = String(sequence).padStart(3, '0');
  return `GN-${dateKey}${sequencePadded}`;
}

/**
 * Validate that all slots are available and belong to the same nail tech.
 * When nailTechId is provided, slots must match it. When omitted (reschedule case),
 * slots can be from any nail tech but must all belong to the same one.
 * Returns the nail tech ID of the slots.
 */
async function validateSlots(slotIds: string[], nailTechId?: string): Promise<string> {
  if (!slotIds || slotIds.length === 0) {
    throw new Error('At least one slot is required');
  }

  const slots = await Slot.find({ _id: { $in: slotIds } });

  if (slots.length !== slotIds.length) {
    throw new Error('One or more slots not found');
  }

  const firstTechId = String(slots[0].nailTechId);

  for (const slot of slots) {
    const slotTechId = String(slot.nailTechId);
    if (slotTechId !== firstTechId) {
      throw new Error('All slots must belong to the same nail tech');
    }
    if (slot.status !== 'available') {
      throw new Error(`Slot ${slot._id} is not available (status: ${slot.status})`);
    }
    if (nailTechId != null && slotTechId !== String(nailTechId)) {
      throw new Error('All slots must belong to the specified nail tech');
    }
  }

  return firstTechId;
}

function validateTechSupportsLocation(
  tech: { serviceAvailability?: string } | null,
  location: 'homebased_studio' | 'home_service'
) {
  if (!tech) throw new Error('Nail tech not found');
  const avail = String(tech.serviceAvailability || '');
  if (location === 'homebased_studio') {
    if (avail === 'Home service only') throw new Error('Selected nail tech is not available for studio bookings');
  } else {
    if (avail === 'Studio only') throw new Error('Selected nail tech is not available for home service bookings');
  }
}

async function validateSimultaneousSlots(params: {
  slotIds: string[];
  primaryNailTechId: string;
  secondaryNailTechId: string;
  location: 'homebased_studio' | 'home_service';
}): Promise<void> {
  const { slotIds, primaryNailTechId, secondaryNailTechId, location } = params;
  if (!Array.isArray(slotIds) || slotIds.length !== 2) {
    throw new Error('Simultaneous Mani+Pedi requires exactly 2 slots');
  }
  if (!primaryNailTechId || !secondaryNailTechId) {
    throw new Error('Simultaneous Mani+Pedi requires two nail techs');
  }
  if (String(primaryNailTechId) === String(secondaryNailTechId)) {
    throw new Error('Please select two different nail techs for simultaneous Mani+Pedi');
  }

  const slots = await Slot.find({ _id: { $in: slotIds } });
  if (slots.length !== slotIds.length) throw new Error('One or more slots not found');

  const slotA = slots.find((s) => String(s.nailTechId) === String(primaryNailTechId));
  const slotB = slots.find((s) => String(s.nailTechId) === String(secondaryNailTechId));
  if (!slotA || !slotB) {
    throw new Error('Slots must belong to the selected nail techs');
  }
  if (slotA.isHidden || slotB.isHidden) throw new Error('One or more slots are not available for booking');
  if (slotA.status !== 'available') throw new Error(`Slot ${slotA._id} is not available (status: ${slotA.status})`);
  if (slotB.status !== 'available') throw new Error(`Slot ${slotB._id} is not available (status: ${slotB.status})`);
  if (String(slotA.date) !== String(slotB.date) || String(slotA.time) !== String(slotB.time)) {
    throw new Error('Simultaneous Mani+Pedi requires the same date and time for both slots');
  }

  // Simultaneous Mani+Pedi: all techs are allowed regardless of serviceAvailability or location.
}

/**
 * Reserve slots by setting their status to 'pending'
 */
async function reserveSlots(slotIds: string[]): Promise<void> {
  await Slot.updateMany(
    { _id: { $in: slotIds } },
    { $set: { status: 'pending' } }
  );
}

/**
 * Release slots by setting their status back to 'available'
 */
async function releaseSlots(slotIds: string[]): Promise<void> {
  await Slot.updateMany(
    { _id: { $in: slotIds } },
    { $set: { status: 'available' } }
  );
}

/**
 * Confirm slots by setting their status to 'confirmed'
 */
async function confirmSlots(slotIds: string[]): Promise<void> {
  await Slot.updateMany(
    { _id: { $in: slotIds } },
    { $set: { status: 'confirmed' } }
  );
}

function sortExpressGroupMembers(members: IBooking[]): IBooking[] {
  return [...members].sort((a, b) => {
    const sa = a.service?.expressSegment === 'manicure' ? 0 : a.service?.expressSegment === 'pedicure' ? 1 : 0;
    const sb = b.service?.expressSegment === 'manicure' ? 0 : b.service?.expressSegment === 'pedicure' ? 1 : 0;
    return sa - sb;
  });
}

/** Sum of deposit requirements across paired express bookings (full deposit is kept on the manicure row). */
function expressGroupDepositMet(members: IBooking[]): boolean {
  const sumDep = members.reduce((s, b) => s + (b.pricing?.depositRequired ?? 0), 0);
  const sumPaid = members.reduce(
    (s, b) => s + (b.pricing?.paidAmount ?? 0) + (b.pricing?.tipAmount ?? 0),
    0
  );
  return sumPaid >= sumDep;
}

/**
 * Mani + Pedi Express: two booking documents (separate codes/invoices), same `expressGroupId`.
 * Full session deposit sits on the manicure (primary) row; pedicure row has depositRequired 0.
 */
async function createSimultaneousExpressPair(input: CreateBookingInput): Promise<IBooking> {
  if (!input.service.secondaryNailTechId) {
    throw new Error('secondaryNailTechId is required for simultaneous Mani+Pedi');
  }
  await validateSimultaneousSlots({
    slotIds: input.slotIds,
    primaryNailTechId: input.nailTechId,
    secondaryNailTechId: input.service.secondaryNailTechId,
    location: input.service.location,
  });
  await reserveSlots(input.slotIds);

  const expressGroupId = randomUUID();
  const total = input.pricing.total;
  const deposit = input.pricing.depositRequired;
  const half1 = Math.floor(total / 2);
  const half2 = total - half1;

  const baseService = {
    type: 'Mani + Pedi Express' as ServiceType,
    location: input.service.location,
    clientType: input.service.clientType,
    chosenServices:
      (input.service.chosenServices?.length ?? 0) > 0 ? input.service.chosenServices : undefined,
    address: input.service.address,
  };

  const bookingCodePrimary = await generateBookingCode();
  const bookingCodeSecondary = await generateBookingCode();

  const primary = new Booking({
    bookingCode: bookingCodePrimary,
    customerId: input.customerId,
    nailTechId: input.nailTechId,
    slotIds: [input.slotIds[0]],
    service: {
      ...baseService,
      expressSegment: 'manicure',
    },
    expressGroupId,
    status: 'pending',
    paymentStatus: 'unpaid',
    clientNotes: input.clientNotes || '',
    adminNotes: input.adminNotes || '',
    pricing: {
      total: half1,
      depositRequired: deposit,
      paidAmount: 0,
      tipAmount: 0,
    },
    payment: {},
    completedAt: null,
  });

  const secondary = new Booking({
    bookingCode: bookingCodeSecondary,
    customerId: input.customerId,
    nailTechId: input.service.secondaryNailTechId,
    slotIds: [input.slotIds[1]],
    service: {
      ...baseService,
      expressSegment: 'pedicure',
    },
    expressGroupId,
    status: 'pending',
    paymentStatus: 'unpaid',
    clientNotes: input.clientNotes || '',
    adminNotes: input.adminNotes || '',
    pricing: {
      total: half2,
      depositRequired: 0,
      paidAmount: 0,
      tipAmount: 0,
    },
    payment: {},
    completedAt: null,
  });

  try {
    await primary.save();
    await secondary.save();
    await recomputeCustomerStats(input.customerId);
    return primary;
  } catch (error) {
    await releaseSlots(input.slotIds);
    throw error;
  }
}

export async function recomputeCustomerStats(customerId: string): Promise<void> {
  await connectDB();
  const bookings = await Booking.find({ customerId }).lean();

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b: any) => b.completedAt).length;

  let totalSpent = 0;
  let totalTips = 0;
  let totalDiscounts = 0;
  let lastVisit: Date | null = null;

  for (const booking of bookings) {
    if (!booking.completedAt) continue;
    const pricing = booking.pricing || {};
    const tipAmount = pricing.tipAmount || 0;
    const totalAmount = pricing.total || 0;
    const discountAmount = pricing.discountAmount || 0;

    totalSpent += totalAmount + tipAmount;
    totalTips += tipAmount;
    totalDiscounts += discountAmount;

    const completedAt = new Date(booking.completedAt);
    if (!lastVisit || completedAt > lastVisit) {
      lastVisit = completedAt;
    }
  }

  const clientType = totalBookings > 1 ? 'REPEAT' : 'NEW';

  await Customer.findByIdAndUpdate(
    customerId,
    {
      totalBookings,
      completedBookings,
      totalSpent,
      totalTips,
      totalDiscounts,
      lastVisit,
      clientType,
    },
    { new: false }
  );
}

export interface CreateBookingInput {
  slotIds: string[];
  customerId: string;
  nailTechId: string;
  service: {
    type: ServiceType;
    location: 'homebased_studio' | 'home_service';
    clientType: 'new' | 'repeat';
    chosenServices?: string[];
    address?: string;
    mode?: 'single_tech' | 'simultaneous_two_techs';
    secondaryNailTechId?: string;
    secondaryServiceType?: 'Manicure' | 'Pedicure';
  };
  pricing: {
    total: number;
    depositRequired: number;
  };
  clientNotes?: string;
  adminNotes?: string;
}

/**
 * Create a new booking
 * - Validates slots are available
 * - Reserves slots (sets status to 'pending')
 * - Creates booking with status 'pending'
 */
export async function createBooking(input: CreateBookingInput): Promise<IBooking> {
  await connectDB();

  // Validate required fields
  if (!input.slotIds || input.slotIds.length === 0) {
    throw new Error('At least one slot is required');
  }
  if (!input.customerId) {
    throw new Error('Customer ID is required');
  }
  if (!input.nailTechId) {
    throw new Error('Nail tech ID is required');
  }
  if (!input.service?.type || !input.service?.location || !input.service?.clientType) {
    throw new Error('Service information is required (type, location, clientType)');
  }
  if (typeof input.pricing?.total !== 'number' || input.pricing.total < 0) {
    throw new Error('Valid total price is required');
  }
  if (typeof input.pricing?.depositRequired !== 'number' || input.pricing.depositRequired < 0) {
    throw new Error('Valid deposit required amount is required');
  }

  // Validate customer exists
  const customer = await Customer.findById(input.customerId);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Simultaneous Mani + Pedi Express → two booking documents (grouped by expressGroupId)
  if (input.service?.mode === 'simultaneous_two_techs') {
    return createSimultaneousExpressPair(input);
  }

  await validateSlots(input.slotIds, input.nailTechId);
  await reserveSlots(input.slotIds);

  try {
    // Generate unique booking code
    const bookingCode = await generateBookingCode();

    // Create booking
    const booking = new Booking({
      bookingCode,
      customerId: input.customerId,
      nailTechId: input.nailTechId,
      slotIds: input.slotIds,
      service: {
        ...input.service,
        chosenServices: (input.service.chosenServices?.length ?? 0) > 0 ? input.service.chosenServices : undefined,
      },
      status: 'pending',
      paymentStatus: 'unpaid',
      clientNotes: input.clientNotes || '',
      adminNotes: input.adminNotes || '',
      pricing: {
        total: input.pricing.total,
        depositRequired: input.pricing.depositRequired,
        paidAmount: 0,
        tipAmount: 0,
      },
      payment: {},
      completedAt: null, // Default to null
    });

    await booking.save();
    await recomputeCustomerStats(input.customerId);
    return booking;
  } catch (error: any) {
    // If booking creation fails, release the slots
    await releaseSlots(input.slotIds);
    throw error;
  }
}

/**
 * Check if booking is completed (read-only helper)
 */
function isBookingCompleted(booking: IBooking): boolean {
  return booking.status === 'completed' || (booking.status === 'confirmed' && booking.completedAt !== null);
}

/**
 * Validate that booking can be edited (not completed)
 */
function validateBookingEditable(booking: IBooking, operation: string): void {
  if (isBookingCompleted(booking)) {
    throw new Error(`Cannot ${operation} a completed booking`);
  }
}

/**
 * Update payment for a booking
 * Updates paymentStatus and payment timestamps based on amounts paid
 */
export async function updateBookingPayment(
  bookingId: string,
  paidAmount: number,
  tipAmount: number = 0,
  method?: 'PNB' | 'CASH' | 'GCASH',
  options?: { allowCompletedBooking?: boolean }
): Promise<IBooking> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Cannot update payment for a cancelled booking');
  }

  if (!options?.allowCompletedBooking) {
    validateBookingEditable(booking, 'update payment for');
  }

  const totalPaid = paidAmount + tipAmount;
  const totalRequired = booking.pricing.total + booking.pricing.depositRequired;
  const hasInvoice = hasAnyRealInvoice(booking);

  // Determine payment status
  // If no invoice yet and deposit is paid → partial (never 'paid' until invoice exists and is fully paid)
  let paymentStatus: PaymentStatus = 'unpaid';
  if (!hasInvoice) {
    paymentStatus = totalPaid > 0 ? 'partial' : 'unpaid';
  } else if (totalPaid >= totalRequired) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  // Update payment timestamps
  const now = new Date();
  const payment: IBooking['payment'] = { ...booking.payment };
  
  if (paidAmount >= booking.pricing.depositRequired && !payment.depositPaidAt) {
    payment.depositPaidAt = now;
  }
  
  // Only set fullyPaidAt when we have an invoice and full amount is paid
  if (hasInvoice && totalPaid >= totalRequired && !payment.fullyPaidAt) {
    payment.fullyPaidAt = now;
  }
  
  if (method) {
    payment.method = method;
  }

  // Update booking
  booking.pricing.paidAmount = paidAmount;
  booking.pricing.tipAmount = tipAmount;
  booking.paymentStatus = paymentStatus;
  booking.payment = payment;

  await booking.save();
  if (booking.completedAt) {
    await recomputeCustomerStats(booking.customerId);
  }
  return booking;
}

/**
 * Confirm a booking
 * - Only allowed if deposit or full payment is received (unless skipDepositCheck)
 * - Sets booking status to 'confirmed'
 * - Sets slot statuses to 'confirmed'
 */
export async function confirmBooking(
  bookingId: string,
  options?: { skipDepositCheck?: boolean }
): Promise<IBooking> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Cannot confirm a cancelled booking');
  }

  if (isBookingCompleted(booking)) {
    throw new Error('Cannot confirm a completed booking');
  }

  const members = booking.expressGroupId
    ? await Booking.find({ expressGroupId: booking.expressGroupId })
    : [booking];

  const allAlreadyConfirmed =
    members.length > 0 && members.every((m) => m.status === 'confirmed');
  if (allAlreadyConfirmed) {
    return (await Booking.findById(bookingId)) || booking;
  }

  // Check if deposit or full payment is received (skip when admin manually confirms)
  if (!options?.skipDepositCheck) {
    if (booking.expressGroupId) {
      if (!expressGroupDepositMet(members as IBooking[])) {
        throw new Error('Deposit or full payment is required to confirm booking');
      }
    } else {
      const totalPaid = booking.pricing.paidAmount + booking.pricing.tipAmount;
      if (totalPaid < booking.pricing.depositRequired) {
        throw new Error('Deposit or full payment is required to confirm booking');
      }
    }
  }

  const now = new Date();
  for (const m of members) {
    if (m.status === 'cancelled') {
      throw new Error('Cannot confirm a cancelled booking');
    }
    if (isBookingCompleted(m as IBooking)) {
      throw new Error('Cannot confirm a completed booking');
    }
    if (m.status === 'confirmed') continue;
    m.status = 'confirmed';
    if (!m.confirmedAt) {
      m.confirmedAt = now;
    }
    await m.save();
    await confirmSlots(m.slotIds);
  }

  return (await Booking.findById(bookingId)) || booking;
}

/**
 * Cancel a booking
 * - Sets booking status to 'cancelled'
 * - Releases slots (sets status back to 'available')
 * - Only allowed if booking is not already confirmed (or admin override)
 */
export async function cancelBooking(
  bookingId: string,
  adminOverride: boolean = false,
  reason?: string
): Promise<IBooking> {
  await connectDB();

  const anchor = await Booking.findById(bookingId);
  if (!anchor) {
    throw new Error('Booking not found');
  }

  const groupIds = anchor.expressGroupId
    ? (await Booking.find({ expressGroupId: anchor.expressGroupId }).select('_id')).map((d) =>
        d._id.toString()
      )
    : [anchor._id.toString()];

  let lastReturned: IBooking = anchor;

  for (const id of groupIds) {
    const booking = await Booking.findById(id);
    if (!booking) continue;

    if (booking.status === 'cancelled') {
      lastReturned = booking;
      continue;
    }

    if (isBookingCompleted(booking)) {
      throw new Error('Cannot cancel a completed booking');
    }

    if (booking.status === 'confirmed' && !adminOverride) {
      throw new Error('Cannot cancel a confirmed booking without admin override');
    }

    booking.status = 'cancelled';
    if (reason) {
      booking.statusReason = reason.trim();
    }
    await booking.save();

    const slots = await Slot.find({ _id: { $in: booking.slotIds } });
    for (const slot of slots) {
      if (slot.status === 'pending' || slot.status === 'confirmed') {
        slot.status = 'available';
        await slot.save();
      }
    }

    if (id === bookingId) {
      lastReturned = booking;
    }
  }

  return (await Booking.findById(bookingId)) || lastReturned;
}

/**
 * Mark booking as completed (admin-only)
 * - Only allowed when: status = 'confirmed' AND completedAt = null
 * - Sets completedAt to current server time
 * - Sets status to 'completed'
 * - Does NOT modify payment fields
 * - Locks slotIds and service data from further edits
 */
export async function markBookingAsCompleted(bookingId: string): Promise<IBooking> {
  await connectDB();

  const anchor = await Booking.findById(bookingId);
  if (!anchor) {
    throw new Error('Booking not found');
  }

  const members = anchor.expressGroupId
    ? await Booking.find({ expressGroupId: anchor.expressGroupId })
    : [anchor];

  for (const booking of members) {
    if (booking.status !== 'confirmed') {
      throw new Error('Can only complete confirmed bookings');
    }
    if (booking.completedAt !== null) {
      throw new Error('Booking is already completed');
    }
  }

  const now = new Date();
  const customerId = members[0].customerId;
  for (const booking of members) {
    booking.completedAt = now;
    booking.status = 'completed';
    await booking.save();
  }
  await recomputeCustomerStats(customerId);

  return (await Booking.findById(bookingId)) || anchor;
}

/**
 * Mark booking as no-show (admin-only)
 * - Only allowed when status = confirmed and booking is not completed
 * - Sets status to no_show
 */
export async function markBookingAsNoShow(bookingId: string, reason?: string): Promise<IBooking> {
  await connectDB();

  const anchor = await Booking.findById(bookingId);
  if (!anchor) {
    throw new Error('Booking not found');
  }

  const members = anchor.expressGroupId
    ? await Booking.find({ expressGroupId: anchor.expressGroupId })
    : [anchor];

  for (const booking of members) {
    if (booking.status === 'cancelled' || booking.status === 'no_show') {
      continue;
    }
    if (isBookingCompleted(booking)) {
      throw new Error('Cannot mark a completed booking as no-show');
    }
    if (booking.status !== 'confirmed') {
      throw new Error('Can only mark confirmed bookings as no-show');
    }
  }

  for (const booking of members) {
    if (booking.status === 'cancelled' || booking.status === 'no_show') continue;
    booking.status = 'no_show';
    if (reason) {
      booking.statusReason = reason.trim();
    }
    await booking.save();
    await releaseSlots(booking.slotIds);
  }

  return (await Booking.findById(bookingId)) || anchor;
}

/**
 * Mark booking as rescheduled (admin-only)
 * - Sets current booking as cancelled with a reschedule reason
 * - Releases related slots so new slot can be chosen
 */
export async function markBookingAsRescheduled(bookingId: string, reason: string): Promise<IBooking> {
  await connectDB();

  const anchor = await Booking.findById(bookingId);
  if (!anchor) {
    throw new Error('Booking not found');
  }

  const reasonText = reason?.trim();
  if (!reasonText) {
    throw new Error('Reason is required for reschedule');
  }

  const members = anchor.expressGroupId
    ? await Booking.find({ expressGroupId: anchor.expressGroupId })
    : [anchor];

  for (const booking of members) {
    if (isBookingCompleted(booking)) {
      throw new Error('Cannot reschedule a completed booking');
    }
  }

  for (const booking of members) {
    if (booking.status === 'cancelled') continue;
    booking.status = 'cancelled';
    booking.statusReason = `Rescheduled: ${reasonText}`;
    await booking.save();
    await releaseSlots(booking.slotIds);
  }

  return (await Booking.findById(bookingId)) || anchor;
}

/**
 * Reschedule paired express bookings (two docs) to two new simultaneous slots.
 */
async function rescheduleExpressPairToSlots(
  anchor: IBooking,
  newSlotIds: string[],
  reason?: string
): Promise<IBooking> {
  validateBookingEditable(anchor, 'reschedule');
  if (anchor.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled booking');
  }

  const members = sortExpressGroupMembers(
    (await Booking.find({ expressGroupId: anchor.expressGroupId })) as IBooking[]
  );
  if (members.length !== 2) {
    throw new Error('Express booking group is incomplete');
  }

  const primary = members.find((m) => m.service?.expressSegment === 'manicure') || members[0];
  const secondary = members.find((m) => m.service?.expressSegment === 'pedicure') || members[1];

  await validateSimultaneousSlots({
    slotIds: newSlotIds,
    primaryNailTechId: String(primary.nailTechId),
    secondaryNailTechId: String(secondary.nailTechId),
    location: (primary.service?.location as 'homebased_studio' | 'home_service') || 'homebased_studio',
  });

  const oldSlotIds = members.flatMap((m) => [...(m.slotIds || [])]);
  await releaseSlots(oldSlotIds);
  try {
    await reserveSlots(newSlotIds);
  } catch (err) {
    await reserveSlots(oldSlotIds);
    throw err;
  }

  const foundSlots = await Slot.find({ _id: { $in: newSlotIds } });
  if (foundSlots.length !== 2) {
    await releaseSlots(newSlotIds);
    await reserveSlots(oldSlotIds);
    throw new Error('One or more slots not found');
  }

  const ps = foundSlots.find((s) => String(s.nailTechId) === String(primary.nailTechId));
  const ss = foundSlots.find((s) => String(s.nailTechId) === String(secondary.nailTechId));
  if (!ps || !ss) {
    await releaseSlots(newSlotIds);
    await reserveSlots(oldSlotIds);
    throw new Error('Each new slot must match the manicure and pedicure nail techs');
  }

  primary.slotIds = [String(ps._id)];
  secondary.slotIds = [String(ss._id)];

  const reasonText = reason != null && String(reason).trim() ? `Rescheduled: ${String(reason).trim()}` : undefined;

  for (const m of [primary, secondary]) {
    if (reasonText) m.statusReason = reasonText;
    await m.save();
    if (m.status === 'confirmed') {
      await confirmSlots(m.slotIds);
    }
  }

  return (await Booking.findById(anchor._id)) as IBooking;
}

/**
 * Reschedule a booking to new slots (admin)
 * - Validates new slots (same nail tech, available)
 * - Releases current slots, reserves new slots
 * - Updates booking.slotIds and optional statusReason
 * - If booking was confirmed, confirms the new slots
 */
export async function rescheduleBookingToSlots(
  bookingId: string,
  newSlotIds: string[],
  reason?: string,
  secondaryNailTechId?: string
): Promise<IBooking> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  validateBookingEditable(booking, 'reschedule');
  if (booking.status === 'cancelled') {
    throw new Error('Cannot reschedule a cancelled booking');
  }

  if (!newSlotIds || newSlotIds.length === 0) {
    throw new Error('At least one new slot is required');
  }

  if (booking.expressGroupId) {
    if (newSlotIds.length !== 2) {
      throw new Error('Mani + Pedi Express requires exactly 2 new slots (one per tech)');
    }
    return rescheduleExpressPairToSlots(booking, newSlotIds, reason);
  }

  let newNailTechId: string;

  if (secondaryNailTechId) {
    // Simultaneous two-tech mode (Mani + Pedi Express)
    // newSlotIds = [primarySlotId, secondarySlotId]
    // derive primary nail tech from first slot
    const primarySlot = await Slot.findById(newSlotIds[0]);
    if (!primarySlot) throw new Error('Primary slot not found');
    newNailTechId = String(primarySlot.nailTechId);

    await validateSimultaneousSlots({
      slotIds: newSlotIds,
      primaryNailTechId: newNailTechId,
      secondaryNailTechId,
      location: (booking.service?.location as 'homebased_studio' | 'home_service') || 'homebased_studio',
    });
  } else {
    // Single-tech mode: all slots must belong to same nail tech
    newNailTechId = await validateSlots(newSlotIds);
  }

  const oldSlotIds = [...(booking.slotIds || [])];
  await releaseSlots(oldSlotIds);
  try {
    await reserveSlots(newSlotIds);
  } catch (err) {
    await reserveSlots(oldSlotIds);
    throw err;
  }

  booking.slotIds = newSlotIds;
  booking.nailTechId = newNailTechId;

  // Update secondary nail tech and mode on service
  if (secondaryNailTechId) {
    booking.service = {
      ...booking.service,
      mode: 'simultaneous_two_techs',
      secondaryNailTechId,
    };
  } else if (booking.service?.mode === 'simultaneous_two_techs') {
    // Switched away from simultaneous — clear secondary tech
    booking.service = {
      ...booking.service,
      mode: 'single_tech',
      secondaryNailTechId: undefined,
    };
  }

  if (reason != null && String(reason).trim()) {
    booking.statusReason = `Rescheduled: ${String(reason).trim()}`;
  }
  await booking.save();

  if (booking.status === 'confirmed') {
    await confirmSlots(newSlotIds);
  }

  return booking;
}

/**
 * Update booking service (admin)
 * - Updates service type, optionally location and chosenServices
 * - When new service needs MORE slots than current, throws (use reschedule instead)
 * - When new service needs FEWER slots, keeps first N slots and releases the rest
 */
export async function updateBookingService(
  bookingId: string,
  service: {
    type: string;
    location?: 'homebased_studio' | 'home_service';
    clientType?: 'new' | 'repeat';
    chosenServices?: string[];
    secondaryNailTechId?: string;
    newSlotIds?: string[];
  }
): Promise<IBooking> {
  await connectDB();

  const { getRequiredSlotCountForService } = await import('../serviceSlotCount');

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  validateBookingEditable(booking, 'update service');
  if (booking.status === 'cancelled') {
    throw new Error('Cannot update a cancelled booking');
  }

  const isSimultaneous = service.type.toLowerCase().includes('express') || service.type.toLowerCase().includes('simultaneous');

  if (isSimultaneous) {
    // Simultaneous Mani+Pedi Express: requires 2 slots from 2 different techs at same time
    if (!service.secondaryNailTechId) {
      throw new Error('secondaryNailTechId is required for Mani + Pedi Express');
    }
    if (!service.newSlotIds || service.newSlotIds.length !== 2) {
      throw new Error('Exactly 2 slot IDs are required for Mani + Pedi Express');
    }

    const primarySlot = await Slot.findById(service.newSlotIds[0]);
    if (!primarySlot) throw new Error('Primary slot not found');
    const primaryNailTechId = String(primarySlot.nailTechId);

    await validateSimultaneousSlots({
      slotIds: service.newSlotIds,
      primaryNailTechId,
      secondaryNailTechId: service.secondaryNailTechId,
      location: service.location || (booking.service?.location as 'homebased_studio' | 'home_service') || 'homebased_studio',
    });

    // Release old slots and reserve new ones
    const oldSlotIds = [...(booking.slotIds || [])];
    await releaseSlots(oldSlotIds);
    try {
      await reserveSlots(service.newSlotIds);
    } catch (err) {
      await reserveSlots(oldSlotIds);
      throw err;
    }

    booking.slotIds = service.newSlotIds;
    booking.nailTechId = primaryNailTechId;
    booking.service = {
      ...booking.service,
      type: service.type as ServiceType,
      mode: 'simultaneous_two_techs',
      secondaryNailTechId: service.secondaryNailTechId,
      ...(service.location && { location: service.location }),
      ...(service.clientType && { clientType: service.clientType }),
      ...(service.chosenServices !== undefined && { chosenServices: service.chosenServices }),
    };

    if (booking.status === 'confirmed') {
      await confirmSlots(service.newSlotIds);
    }
  } else {
    // Standard single-tech service change
    const currentSlotCount = (booking.slotIds || []).length;
    const requiredSlots = getRequiredSlotCountForService(service.type, service.location || booking.service?.location);

    if (requiredSlots > currentSlotCount) {
      throw new Error(
        `New service requires ${requiredSlots} slot(s) but booking has ${currentSlotCount}. Please reschedule to select more slots.`
      );
    }

    if (booking.service) {
      (booking.service as { type: string }).type = service.type;
      if (service.location) booking.service.location = service.location;
      if (service.clientType) booking.service.clientType = service.clientType;
      if (service.chosenServices !== undefined) booking.service.chosenServices = service.chosenServices;
      // Clear simultaneous mode if switching away from Express
      booking.service.mode = 'single_tech';
      booking.service.secondaryNailTechId = undefined;
    }

    // If new service needs fewer slots, release the extras
    if (requiredSlots < currentSlotCount && booking.slotIds && booking.slotIds.length > requiredSlots) {
      const keepIds = booking.slotIds.slice(0, requiredSlots);
      const releaseIds = booking.slotIds.slice(requiredSlots);
      await releaseSlots(releaseIds);
      booking.slotIds = keepIds;
    }
  }

  await booking.save();

  return booking;
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string): Promise<IBooking | null> {
  await connectDB();
  return await Booking.findById(bookingId);
}

/**
 * Get booking by booking code
 */
export async function getBookingByCode(bookingCode: string): Promise<IBooking | null> {
  await connectDB();
  return await Booking.findOne({ bookingCode });
}

/**
 * List bookings with filters
 */
export interface ListBookingsFilters {
  customerId?: string;
  nailTechId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export async function listBookings(filters: ListBookingsFilters = {}): Promise<IBooking[]> {
  await connectDB();

  const query: any = {};

  if (filters.customerId) {
    query.customerId = filters.customerId;
  }

  if (filters.nailTechId) {
    query.nailTechId = filters.nailTechId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentStatus) {
    query.paymentStatus = filters.paymentStatus;
  }

  // Filter by appointment date (slot date), not createdAt/updatedAt
  if (filters.startDate || filters.endDate) {
    const toDateStr = (d: Date) => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
      const y = parts.find((p) => p.type === 'year')?.value ?? '';
      const m = parts.find((p) => p.type === 'month')?.value ?? '';
      const day = parts.find((p) => p.type === 'day')?.value ?? '';
      return `${y}-${m}-${day}`;
    };
    const startStr = filters.startDate ? toDateStr(filters.startDate) : null;
    const endStr = filters.endDate ? toDateStr(filters.endDate) : null;
    const slotDateQuery: { date?: { $gte?: string; $lte?: string } } = {};
    if (startStr) slotDateQuery.date = { ...slotDateQuery.date, $gte: startStr };
    if (endStr) slotDateQuery.date = { ...slotDateQuery.date, $lte: endStr };
    const slotsInRange = await Slot.find(slotDateQuery).select('_id').lean();
    const slotIdsInRange = slotsInRange.map((s) => String(s._id));
    if (slotIdsInRange.length > 0) {
      query.slotIds = { $in: slotIdsInRange };
    } else {
      query.slotIds = { $in: [] };
    }
  }

  let queryBuilder = Booking.find(query).sort({ createdAt: -1 });

  if (filters.limit) {
    queryBuilder = queryBuilder.limit(filters.limit);
  }

  return await queryBuilder.exec();
}

/**
 * Get bookings by slot IDs (to check for conflicts)
 */
export async function getBookingsBySlotIds(slotIds: string[]): Promise<IBooking[]> {
  await connectDB();
  return await Booking.find({
    slotIds: { $in: slotIds },
    status: { $in: ['pending', 'confirmed'] }, // Only active bookings
  });
}
