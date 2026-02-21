import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { generateSignature } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { bookingId, photoType } = await request.json();

    if (!bookingId || !photoType) {
      return NextResponse.json({ error: 'bookingId and photoType required' }, { status: 400 });
    }

    const validPhotoTypes = ['inspiration', 'currentState'] as const;
    if (!validPhotoTypes.includes(photoType as typeof validPhotoTypes[number])) {
      return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
    }

    const typedPhotoType = photoType as 'inspiration' | 'currentState';

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Check photo limit (max 3 per type)
    const existing = booking.clientPhotos?.[typedPhotoType]?.length || 0;
    if (existing >= 3) {
      return NextResponse.json({ error: 'Maximum 3 photos allowed per type' }, { status: 400 });
    }

    const folder = typedPhotoType === 'inspiration' ? 'nail_inspo' : 'nail_current';
    const { signature, timestamp } = generateSignature({
      folder: `${folder}/${bookingId}`,
      upload_preset: 'nail_photos',
    });

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: `${folder}/${bookingId}`,
      uploadPreset: 'nail_photos',
      expiresIn: 900,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate signature' }, { status: 500 });
  }
}
