import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { verifyUploadProofToken } from '@/lib/uploadProofToken';
import { backupBooking } from '@/lib/services/googleSheetsBackup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/upload-proof?token=xxx
 * Returns booking summary for the upload-proof page (no sensitive data).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    const { bookingId } = verifyUploadProofToken(token);
    await connectDB();
    const booking = await Booking.findById(bookingId).select('bookingCode pricing status payment').lean();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking was cancelled' }, { status: 400 });
    }
    return NextResponse.json({
      bookingCode: booking.bookingCode,
      depositRequired: booking.pricing?.depositRequired ?? 0,
      status: booking.status,
      hasProof: !!booking.payment?.paymentProofUrl,
    });
  } catch (error: any) {
    if (error.message === 'Invalid token' || error.message === 'Link has expired' || error.message === 'Invalid token format') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Invalid link' }, { status: 500 });
  }
}

/**
 * POST /api/bookings/upload-proof
 * Upload proof of downpayment using the token from the email link.
 * Body: FormData with `token` and `file`.
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const token = formData.get('token') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!token) return NextResponse.json({ error: 'Invalid or missing link. Use the link from your confirmation email.' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    const { bookingId } = verifyUploadProofToken(token);

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking was cancelled' }, { status: 400 });
    }

    if (booking.payment?.paymentProofPublicId) {
      await deleteImage(booking.payment.paymentProofPublicId).catch(console.error);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result: any = await uploadImage(buffer, 'payment_proofs');

    booking.payment = {
      ...booking.payment,
      paymentProofUrl: result.secure_url,
      paymentProofPublicId: result.public_id,
    };
    await booking.save();
    backupBooking(booking, 'update').catch(err =>
      console.error('Failed to backup booking update to Google Sheets:', err)
    );

    return NextResponse.json({
      url: result.secure_url,
      message: 'Proof of payment uploaded successfully. We will confirm your booking once verified.',
    });
  } catch (error: any) {
    if (error.message === 'Invalid token' || error.message === 'Link has expired' || error.message === 'Invalid token format') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Upload proof error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
