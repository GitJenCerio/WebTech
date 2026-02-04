import { NextResponse } from 'next/server';
import { createBooking, listBookings, type CreateBookingInput } from '@/lib/services/bookingService';
import type { BookingStatus, PaymentStatus } from '@/lib/types';

// Mark this route as dynamic to prevent static analysis during build
export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      slotIds, 
      customerId, 
      nailTechId, 
      service, 
      pricing 
    } = body;

    // Validate required fields
    if (!slotIds || !Array.isArray(slotIds) || slotIds.length === 0) {
      return NextResponse.json({ error: 'At least one slot ID is required' }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    if (!nailTechId) {
      return NextResponse.json({ error: 'Nail tech ID is required' }, { status: 400 });
    }

    if (!service || !service.type || !service.location || !service.clientType) {
      return NextResponse.json({ 
        error: 'Service information is required (type, location, clientType)' 
      }, { status: 400 });
    }

    if (!pricing || typeof pricing.total !== 'number' || typeof pricing.depositRequired !== 'number') {
      return NextResponse.json({ 
        error: 'Pricing information is required (total, depositRequired)' 
      }, { status: 400 });
    }

    const input: CreateBookingInput = {
      slotIds,
      customerId,
      nailTechId,
      service: {
        type: service.type,
        location: service.location,
        clientType: service.clientType,
      },
      pricing: {
        total: pricing.total,
        depositRequired: pricing.depositRequired,
      },
    };

    const booking = await createBooking(input);
    
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create booking' 
    }, { status: 400 });
  }
}

/**
 * GET /api/bookings
 * List bookings with optional filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: {
      customerId?: string;
      nailTechId?: string;
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {};

    if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId')!;
    }

    if (searchParams.get('nailTechId')) {
      filters.nailTechId = searchParams.get('nailTechId')!;
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as BookingStatus;
    }

    if (searchParams.get('paymentStatus')) {
      filters.paymentStatus = searchParams.get('paymentStatus') as PaymentStatus;
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!);
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!);
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!, 10);
    }

    const bookings = await listBookings(filters);

    return NextResponse.json({
      bookings: bookings.map(booking => ({
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
      }))
    });
  } catch (error: any) {
    console.error('Error listing bookings:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to list bookings' 
    }, { status: 500 });
  }
}
