import { NextResponse } from 'next/server';
import { 
  getBookingById, 
  getBookingByCode,
  confirmBooking, 
  cancelBooking,
  updateBookingPayment,
  markBookingAsCompleted,
  markBookingAsNoShow,
  markBookingAsRescheduled
} from '@/lib/services/bookingService';
import { backupBooking } from '@/lib/services/googleSheetsBackup';
import Customer from '@/lib/models/Customer';
import { sendBookingConfirmedEmail, sendBookingRescheduledEmail } from '@/lib/email';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]
 * Get booking by ID or booking code
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Try as MongoDB ID first, then as booking code
    let booking = await getBookingById(id);
    
    if (!booking) {
      booking = await getBookingByCode(id);
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

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

    if (action === 'mark_completed') {
      // Mark booking as completed (admin-only)
      const booking = await markBookingAsCompleted(id);
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch(err =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }
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
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          statusReason: booking.statusReason,
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
      error: 'Invalid action. Supported actions: confirm, cancel, reschedule, update_payment, mark_completed, mark_no_show, update_notes' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update booking' 
    }, { status: 400 });
  }
}
