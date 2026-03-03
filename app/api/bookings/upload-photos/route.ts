import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { verifyPhotoUploadToken } from '@/lib/uploadProofToken';
import { backupBooking } from '@/lib/services/googleSheetsBackup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/upload-photos?token=xxx
 * Validates token and returns booking summary for the upload-photos page.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const { bookingId } = verifyPhotoUploadToken(token);
    await connectDB();
    const booking = await Booking.findById(bookingId)
      .select('bookingCode status clientPhotos service.chosenServices')
      .lean();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking was cancelled' }, { status: 400 });
    }

    const inspiration = booking.clientPhotos?.inspiration ?? [];
    const currentState = booking.clientPhotos?.currentState ?? [];

    const chosenServices = (booking as { service?: { chosenServices?: string[] } })?.service?.chosenServices ?? [];

    return NextResponse.json({
      bookingId: bookingId,
      bookingCode: booking.bookingCode,
      inspirationCount: inspiration.length,
      currentStateCount: currentState.length,
      inspirationFull: inspiration.length >= 3,
      currentStateFull: currentState.length >= 3,
      chosenServices: Array.isArray(chosenServices) ? chosenServices : [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid link';
    if (msg.includes('expired') || msg.includes('Invalid')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings/upload-photos
 * Update chosenServices (specific/add-ons) using the photo upload token.
 * Body: { token: string, chosenServices: string[] }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;
    const chosenServices = body.chosenServices;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    if (!Array.isArray(chosenServices)) {
      return NextResponse.json({ error: 'chosenServices must be an array' }, { status: 400 });
    }

    const { bookingId } = verifyPhotoUploadToken(token);
    await connectDB();

    const existing = await Booking.findById(bookingId).select('status service').lean();
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking was cancelled' }, { status: 400 });
    }

    const validChosenServices = chosenServices.filter((s): s is string => typeof s === 'string');
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: { 'service.chosenServices': validChosenServices } },
      { new: true }
    );
    if (booking?.confirmedAt) {
      backupBooking(booking, 'update').catch((err) =>
        console.error('[upload-photos PATCH] backupBooking failed:', err)
      );
    }

    return NextResponse.json({
      chosenServices: validChosenServices,
      message: 'Services updated',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid link';
    if (msg.includes('expired') || msg.includes('Invalid')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
