import { NextResponse } from 'next/server';
import { 
  getBookingById, 
  getBookingByCode,
  confirmBooking, 
  cancelBooking,
  updateBookingPayment,
  markBookingAsCompleted
} from '@/lib/services/bookingService';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]
 * Get booking by ID or booking code
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Try as MongoDB ID first, then as booking code
    let booking = await getBookingById(params.id);
    
    if (!booking) {
      booking = await getBookingByCode(params.id);
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
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'confirm') {
      // Confirm booking (requires deposit or full payment)
      const booking = await confirmBooking(params.id);
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
      const booking = await cancelBooking(params.id, adminOverride);
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

      const booking = await updateBookingPayment(params.id, paidAmount, tipAmount, method);
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
      const booking = await markBookingAsCompleted(params.id);
      return NextResponse.json({
        booking: {
          id: booking._id.toString(),
          bookingCode: booking.bookingCode,
          status: booking.status,
          completedAt: booking.completedAt?.toISOString() || null,
        }
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Supported actions: confirm, cancel, update_payment, mark_completed' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to update booking' 
    }, { status: 400 });
  }
}
