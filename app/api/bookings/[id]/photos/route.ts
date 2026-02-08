import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { deleteImage, uploadImage } from '@/lib/cloudinary';

const ALLOWED_PHOTO_TYPES = ['inspiration', 'currentState'] as const;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    const booking = await Booking.findById(params.id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    if (!booking.clientPhotos) {
      booking.clientPhotos = { inspiration: [], currentState: [] };
    }

    if (isFormData) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const photoType = formData.get('photoType') as string | null;

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      if (!photoType || !ALLOWED_PHOTO_TYPES.includes(photoType as any)) {
        return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
      }

      const existingCount = booking.clientPhotos[photoType as 'inspiration' | 'currentState']?.length || 0;
      if (existingCount >= 3) {
        return NextResponse.json({ error: `Maximum 3 ${photoType} photos allowed` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result: any = await uploadImage(buffer, `booking_photos/${params.id}/${photoType}`);

      const photo = { url: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
      booking.clientPhotos[photoType as 'inspiration' | 'currentState'].push(photo);
      await booking.save();

      return NextResponse.json({ success: true, message: 'Photo uploaded', photo });
    }

    const { photoType, url, publicId } = await request.json();
    if (!photoType || !ALLOWED_PHOTO_TYPES.includes(photoType as any)) {
      return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
    }
    if (!url || !publicId) {
      return NextResponse.json({ error: 'url and publicId are required' }, { status: 400 });
    }

    const existingCount = booking.clientPhotos[photoType as 'inspiration' | 'currentState']?.length || 0;
    if (existingCount >= 3) {
      return NextResponse.json({ error: `Maximum 3 ${photoType} photos allowed` }, { status: 400 });
    }

    booking.clientPhotos[photoType as 'inspiration' | 'currentState'].push({ url, publicId, uploadedAt: new Date() });
    await booking.save();

    return NextResponse.json({ success: true, message: 'Photo added' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add photo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { publicId, photoType } = await request.json();

    const booking = await Booking.findById(params.id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Remove from booking
    if (!booking.clientPhotos || !booking.clientPhotos[photoType]) {
      return NextResponse.json({ error: 'Photo collection not found' }, { status: 404 });
    }

    booking.clientPhotos[photoType] = booking.clientPhotos[photoType].filter(
      (p: any) => p.publicId !== publicId
    );
    await booking.save();

    // Delete from Cloudinary
    await deleteImage(publicId).catch(console.error);

    return NextResponse.json({ success: true, message: 'Photo removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove photo' }, { status: 500 });
  }
}
