import connectDB from '../mongodb';
import Booking, { IBooking } from '../models/Booking';
import BookingCounter from '../models/BookingCounter';
import Slot from '../models/Slot';
import Customer from '../models/Customer';
import type { BookingStatus, PaymentStatus, ServiceType } from '../types';

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
 * Validate that all slots are available and belong to the same nail tech
 */
async function validateSlots(slotIds: string[], nailTechId: string): Promise<void> {
  if (!slotIds || slotIds.length === 0) {
    throw new Error('At least one slot is required');
  }

  const slots = await Slot.find({ _id: { $in: slotIds } });
  
  if (slots.length !== slotIds.length) {
    throw new Error('One or more slots not found');
  }

  // Check all slots belong to the same nail tech
  for (const slot of slots) {
    if (slot.nailTechId !== nailTechId) {
      throw new Error('All slots must belong to the same nail tech');
    }
    if (slot.status !== 'available') {
      throw new Error(`Slot ${slot._id} is not available (status: ${slot.status})`);
    }
  }
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

  // Validate and reserve slots atomically
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
      service: input.service,
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

  // Determine payment status
  let paymentStatus: PaymentStatus = 'unpaid';
  if (totalPaid >= totalRequired) {
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
  
  if (totalPaid >= totalRequired && !payment.fullyPaidAt) {
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
 * - Only allowed if deposit or full payment is received
 * - Sets booking status to 'confirmed'
 * - Sets slot statuses to 'confirmed'
 */
export async function confirmBooking(bookingId: string): Promise<IBooking> {
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

  if (booking.status === 'confirmed') {
    return booking; // Already confirmed
  }

  // Check if deposit or full payment is received
  const totalPaid = booking.pricing.paidAmount + booking.pricing.tipAmount;
  if (totalPaid < booking.pricing.depositRequired) {
    throw new Error('Deposit or full payment is required to confirm booking');
  }

  // Confirm booking and slots
  booking.status = 'confirmed';
  if (!booking.confirmedAt) {
    booking.confirmedAt = new Date();
  }
  await booking.save();
  await confirmSlots(booking.slotIds);

  return booking;
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

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled') {
    return booking; // Already cancelled
  }

  // Cannot cancel completed bookings
  if (isBookingCompleted(booking)) {
    throw new Error('Cannot cancel a completed booking');
  }

  // If confirmed, only allow cancellation with admin override
  if (booking.status === 'confirmed' && !adminOverride) {
    throw new Error('Cannot cancel a confirmed booking without admin override');
  }

  // Cancel booking
  booking.status = 'cancelled';
  if (reason) {
    booking.statusReason = reason.trim();
  }
  await booking.save();

  // Release slots if they were pending or confirmed
  const slots = await Slot.find({ _id: { $in: booking.slotIds } });
  for (const slot of slots) {
    if (slot.status === 'pending' || slot.status === 'confirmed') {
      slot.status = 'available';
      await slot.save();
    }
  }

  return booking;
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

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Enforce completion rules
  if (booking.status !== 'confirmed') {
    throw new Error('Can only complete confirmed bookings');
  }

  if (booking.completedAt !== null) {
    throw new Error('Booking is already completed');
  }

  // Set completion timestamp and status
  booking.completedAt = new Date();
  booking.status = 'completed';
  await booking.save();
  await recomputeCustomerStats(booking.customerId);

  return booking;
}

/**
 * Mark booking as no-show (admin-only)
 * - Only allowed when status = confirmed and booking is not completed
 * - Sets status to no_show
 */
export async function markBookingAsNoShow(bookingId: string, reason?: string): Promise<IBooking> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'cancelled' || booking.status === 'no_show') {
    return booking;
  }

  if (isBookingCompleted(booking)) {
    throw new Error('Cannot mark a completed booking as no-show');
  }

  if (booking.status !== 'confirmed') {
    throw new Error('Can only mark confirmed bookings as no-show');
  }

  booking.status = 'no_show';
  if (reason) {
    booking.statusReason = reason.trim();
  }
  await booking.save();

  // Free up pending/confirmed slots when a client no-shows
  await releaseSlots(booking.slotIds);

  return booking;
}

/**
 * Mark booking as rescheduled (admin-only)
 * - Sets current booking as cancelled with a reschedule reason
 * - Releases related slots so new slot can be chosen
 */
export async function markBookingAsRescheduled(bookingId: string, reason: string): Promise<IBooking> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (isBookingCompleted(booking)) {
    throw new Error('Cannot reschedule a completed booking');
  }

  if (booking.status === 'cancelled') {
    return booking;
  }

  const reasonText = reason?.trim();
  if (!reasonText) {
    throw new Error('Reason is required for reschedule');
  }

  booking.status = 'cancelled';
  booking.statusReason = `Rescheduled: ${reasonText}`;
  await booking.save();

  await releaseSlots(booking.slotIds);

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

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
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
