import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { generateSignature } from '@/lib/cloudinary';
import { handleApiError, NotFoundError } from '@/lib/apiError';

const generateSignatureSchema = z.object({
  bookingId: z.string().min(1, 'bookingId is required'),
  photoType: z.enum(['inspiration', 'currentState']),
});

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const parsed = generateSignatureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { bookingId, photoType } = parsed.data;

    const typedPhotoType = photoType as 'inspiration' | 'currentState';

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

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
  } catch (error) {
    return handleApiError(error, request);
  }
}
