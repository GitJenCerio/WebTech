import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { 
  getBookingById, 
  getBookingByCode,
  confirmBooking, 
  cancelBooking,
  updateBookingPayment,
  markBookingAsCompleted,
  markBookingAsNoShow,
  markBookingAsRescheduled,
  rescheduleBookingToSlots
} from '@/lib/services/bookingService';
import { backupBooking } from '@/lib/services/googleSheetsBackup';
import { syncBookingToSheet, syncFinanceToSheet } from '@/lib/services/googleSheetsService';
import Customer from '@/lib/models/Customer';
import NailTech from '@/lib/models/NailTech';
import Settings from '@/lib/models/Settings';
import Slot from '@/lib/models/Slot';
import connectDB from '@/lib/mongodb';
import { sendBookingConfirmedEmail, sendBookingRescheduledEmail } from '@/lib/email';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]
 * Get booking by ID or booking code
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;

    const { id } = await params;
    let booking = await getBookingById(id);
    if (!booking) booking = await getBookingByCode(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (assignedNailTechId && String(booking.nailTechId) !== assignedNailTechId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      booking: {
        id: booking._id.toString(),
        bookingCode: booking.bookingCode,
        customerId: booking.customerId,
        nailTechId: booking.nailTechId,
        slotIds: booking.slotIds,
        service: booking.service,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        pricing: booking.pricing,
        payment: booking.payment,
        completedAt: booking.completedAt?.toISOString() || null,
        confirmedAt: booking.confirmedAt?.toISOString() || null,
        invoice: booking.invoice || null,
        clientNotes: booking.clientNotes || '',
        adminNotes: booking.adminNotes || '',
        clientPhotos: booking.clientPhotos || { inspiration: [], currentState: [] },
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error getting booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get booking' 
    }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update booking (confirm, cancel, update payment)
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const assignedNailTechId = session?.user?.assignedNailTechId;

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (assignedNailTechId) {
      const existing = await getBookingById(id) || await getBookingByCode(id);
      if (!existing || String(existing.nailTechId) !== assignedNailTechId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    function fireSheetsSync(bookingId: string) {
      (async () => {
        try {
          await connectDB();
          const [booking, settings] = await Promise.all([
            getBookingById(bookingId) || getBookingByCode(bookingId),
            Settings.findById('global').lean(),
          ]);
          if (!booking) return;
          const b = booking as any;
          const [cust, tech, slotList] = await Promise.all([
            Customer.findById(b.customerId).lean(),
            NailTech.findById(b.nailTechId).lean(),
            Slot.find({ _id: { $in: b.slotIds || [] } }).sort({ date: 1, time: 1 }).lean(),
          ]);
          const customerName = (cust as { name?: string })?.name ?? 'Unknown';
          const socialMediaName = (cust as { socialMediaName?: string })?.socialMediaName ?? '';
          const nailTechName = (tech as { name?: string })?.name ? `Ms. ${(tech as { name: string }).name}` : '';
          const slots = (slotList as { date?: string; time?: string }[]) ?? [];
          const appointmentDate = slots[0]?.date ?? '';
          const appointmentTimes = slots.map(s => s.time).filter(Boolean) as string[];
          const commissionRate = (settings as { adminCommissionRate?: number })?.adminCommissionRate ?? 10;
          await syncBookingToSheet(b, customerName, socialMediaName, nailTechName, appointmentDate, appointmentTimes);
          await syncFinanceToSheet(b, customerName, socialMediaName, nailTechName, appointmentDate, appointmentTimes, commissionRate);
        } catch (err) {
          console.error('[Sheets] sync failed:', err);
        }
      })();
    }

    if (action === 'confirm') {
      // Confirm booking (requires deposit or full payment)
      const booking = await confirmBooking(id);
      const customer = await Customer.findById(booking.customerId).lean();
      if (customer?.email) {
        sendBookingConfirmedEmail(booking, customer).catch(err =>
          console.error('Failed to send booking confirmed email:', err)
        );
      }
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        }
      });
    }

    if (action === 'cancel') {
      // Cancel booking (admin override available)
      const adminOverride = body.adminOverride === true;
      if (adminOverride && (!reason || !String(reason).trim())) {
        return NextResponse.json({ error: 'Reason is required when cancelling a booking' }, { status: 400 });
      }
      const booking = await cancelBooking(id, adminOverride, reason);
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
        }
      });
    }

    if (action === 'update_payment') {
      // Update payment amounts
      const paidAmount = typeof body.paidAmount === 'number' ? body.paidAmount : 0;
      const tipAmount = typeof body.tipAmount === 'number' ? body.tipAmount : 0;
      const method = body.method; // 'PNB' | 'CASH' | 'GCASH'

      if (paidAmount < 0 || tipAmount < 0) {
        return NextResponse.json({ 
          error: 'Payment amounts must be non-negative' 
        }, { status: 400 });
      }

      const booking = await updateBookingPayment(id, paidAmount, tipAmount, method);
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          paymentStatus: booking.paymentStatus,
          pricing: booking.pricing,
          payment: booking.payment,
        }
      });
    }

    if (action === 'manual_confirm') {
      // Admin bypass: set amount paid (including 0) and confirm without payment proof
      const paidAmount = typeof body.paidAmount === 'number' ? body.paidAmount : 0;
      const tipAmount = typeof body.tipAmount === 'number' ? body.tipAmount : 0;
      if (paidAmount < 0 || tipAmount < 0) {
        return NextResponse.json({ error: 'Payment amounts must be non-negative' }, { status: 400 });
      }
      const booking = await updateBookingPayment(id, paidAmount, tipAmount, body.method);
      const confirmed = await confirmBooking(id, { skipDepositCheck: true });
      if (confirmed.confirmedAt) {
        backupBooking(confirmed, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: confirmed._id.toString(),
          bookingCode: confirmed.bookingCode,
          status: confirmed.status,
          paymentStatus: confirmed.paymentStatus,
          pricing: confirmed.pricing,
          payment: confirmed.payment,
        }
      });
    }

    if (action === 'mark_completed') {
      // Mark booking as completed (admin-only)
      // Optionally accept paidAmount and tipAmount (final totals) to update payment before completing
      const paidAmount = typeof body.paidAmount === 'number' ? body.paidAmount : undefined;
      const tipAmount = typeof body.tipAmount === 'number' ? body.tipAmount : undefined;
      if (paidAmount !== undefined || tipAmount !== undefined) {
        const bookingForUpdate = await getBookingById(id);
        if (bookingForUpdate) {
          const newPaid = paidAmount ?? (bookingForUpdate.pricing?.paidAmount ?? 0);
          const newTip = tipAmount ?? (bookingForUpdate.pricing?.tipAmount ?? 0);
          await updateBookingPayment(id, newPaid, newTip, body.method, { allowCompletedBooking: true });
        }
      }
      const booking = await markBookingAsCompleted(id);
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          completedAt: booking.completedAt?.toISOString() || null,
        }
      });
    }

    if (action === 'reschedule') {
      if (!reason || !String(reason).trim()) {
        return NextResponse.json({ error: 'Reason is required when rescheduling a booking' }, { status: 400 });
      }
      const booking = await markBookingAsRescheduled(id, reason);
      const customer = await Customer.findById(booking.customerId).lean();
      if (customer?.email) {
        sendBookingRescheduledEmail(booking, customer, reason).catch(err =>
          console.error('Failed to send booking rescheduled email:', err)
        );
      }
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          statusReason: booking.statusReason,
        }
      });
    }

    if (action === 'reschedule_to') {
      const newSlotIds = Array.isArray(body.newSlotIds) ? body.newSlotIds.map(String) : [];
      if (newSlotIds.length === 0) {
        return NextResponse.json({ error: 'newSlotIds array is required' }, { status: 400 });
      }
      const booking = await rescheduleBookingToSlots(id, newSlotIds, body.reason);
      const customer = await Customer.findById(booking.customerId).lean();
      if (customer?.email) {
        sendBookingRescheduledEmail(booking, customer, booking.statusReason || undefined).catch(err =>
          console.error('Failed to send booking rescheduled email:', err)
        );
      }
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      const slots = await Slot.find({ _id: { $in: booking.slotIds } }).sort({ date: 1, time: 1 }).lean();
      const appointmentDate = (slots[0] as { date?: string })?.date ?? null;
      const appointmentTimes = (slots as { time?: string }[]).map(s => s.time).filter(Boolean) as string[];
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          slotIds: booking.slotIds,
          appointmentDate,
          appointmentTimes,
        }
      });
    }

    if (action === 'mark_no_show') {
      // Mark booking as no-show (admin-only)
      if (!reason || !String(reason).trim()) {
        return NextResponse.json({ error: 'Reason is required when marking no-show' }, { status: 400 });
      }
      const booking = await markBookingAsNoShow(id, reason);
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
        }
      });
    }

    if (action === 'update_notes') {
      const clientNotes = typeof body.clientNotes === 'string' ? body.clientNotes.trim() : undefined;
      const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : undefined;
      const { default: Booking } = await import('@/lib/models/Booking');
      const { default: connectDB } = await import('@/lib/mongodb');
      await connectDB();
      const booking = await Booking.findById(id);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (clientNotes !== undefined) booking.clientNotes = clientNotes;
      if (adminNotes !== undefined) booking.adminNotes = adminNotes;
      await booking.save();
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
      fireSheetsSync(id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          clientNotes: booking.clientNotes || '',
          adminNotes: booking.adminNotes || '',
        }
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: confirm, cancel, reschedule, reschedule_to, update_payment, manual_confirm, mark_completed, mark_no_show, update_notes' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update booking' 
    }, { status: 400 });
  }
}
