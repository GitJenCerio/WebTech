import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookingId = formData.get('bookingId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!bookingId) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP allowed' }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Delete old proof if exists
    if (booking.payment?.paymentProofPublicId) {
      await deleteImage(booking.payment.paymentProofPublicId).catch(console.error);
    }

    // Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const result: any = await uploadImage(buffer, 'payment_proofs');

    // Save to booking
    booking.payment = {
      ...booking.payment,
      paymentProofUrl: result.secure_url,
      paymentProofPublicId: result.public_id,
    };
    await booking.save();

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Payment proof uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
