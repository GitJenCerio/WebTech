import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { deleteImage, uploadImage } from '@/lib/cloudinary';
import { backupBooking } from '@/lib/services/googleSheetsBackup';
import { verifyPhotoUploadToken } from '@/lib/uploadProofToken';
import { authOptions } from '@/lib/auth-options';

const ALLOWED_PHOTO_TYPES = ['inspiration', 'currentState'] as const;
// Client nail photos: JPEG, PNG, WebP, HEIC (mobile camera support)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per plan

/**
 * Extract token from request - either as header, form field, or JSON body.
 * For multipart, pass the formData if already parsed (to avoid consuming the stream twice).
 */
function getPhotoUploadTokenFromSources(
  request: Request,
  formData?: FormData | null,
  jsonBody?: { token?: string } | null
): string | null {
  const authHeader = request.headers.get('x-photo-upload-token');
  if (authHeader) return authHeader;
  if (formData) {
    const token = formData.get('token') as string | null;
    if (token) return token;
  }
  if (jsonBody?.token) return jsonBody.token;
  return null;
}

/**
 * POST /api/bookings/[id]/photos
 * Add a client photo (inspiration or current state) to a booking.
 * Requires valid photoUploadToken (returned when booking is created, valid 2 hours).
 * Supports multipart (file upload) or JSON (url + publicId from signed Cloudinary upload).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let jsonBody: { token?: string; photoType?: string; url?: string; publicId?: string } | null = null;
  try {
    await connectDB();
    const { id } = await params;

    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let formData: FormData | null = null;
    if (isFormData) {
      formData = await request.formData();
    } else if (contentType.includes('application/json')) {
      jsonBody = await request.json();
    }
    if (contentType.includes('application/json')) {
      jsonBody = await request.json();
    }
    const token = getPhotoUploadTokenFromSources(request, formData, jsonBody);

    if (!token) {
      return NextResponse.json(
        { error: 'Photo upload token required. Use the token from your booking confirmation.' },
        { status: 401 }
      );
    }

    let bookingId: string;
    try {
      const verified = verifyPhotoUploadToken(token);
      bookingId = verified.bookingId;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid or expired token';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    if (bookingId !== id) {
      return NextResponse.json({ error: 'Token does not match this booking' }, { status: 403 });
    }

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!booking.clientPhotos) {
      booking.clientPhotos = { inspiration: [], currentState: [] };
    }

    if (isFormData && formData) {
      const file = formData.get('file') as File | null;
      const photoType = formData.get('photoType') as string | null;

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      if (!photoType || !ALLOWED_PHOTO_TYPES.includes(photoType as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Only JPEG, PNG, WebP, and HEIC images are allowed' },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'File size must be under 10MB' },
          { status: 400 }
        );
      }

      const existingCount = booking.clientPhotos[photoType as 'inspiration' | 'currentState']?.length || 0;
      if (existingCount >= 3) {
        return NextResponse.json({ error: `Maximum 3 ${photoType} photos allowed` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      // Client nail photos: max 2000px width, 75% quality per plan
      const result = await uploadImage(buffer, `booking_photos/${id}/${photoType}`, undefined, {
        maxWidth: 2000,
        quality: '75',
      }) as { secure_url: string; public_id: string };

      const photo = { url: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
      booking.clientPhotos[photoType as 'inspiration' | 'currentState'].push(photo);
      await booking.save();
      if (booking.confirmedAt) {
        backupBooking(booking, 'update').catch((err) =>
          console.error('Failed to backup booking update to Google Sheets:', err)
        );
      }

      return NextResponse.json({ success: true, message: 'Photo uploaded', photo });
    }

    const body = jsonBody ?? (await request.json());
    const { photoType, url, publicId } = body;
    if (!photoType || !ALLOWED_PHOTO_TYPES.includes(photoType)) {
      return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
    }
    if (!url || !publicId) {
      return NextResponse.json({ error: 'url and publicId are required' }, { status: 400 });
    }

    const existingCount = booking.clientPhotos[photoType as 'inspiration' | 'currentState']?.length || 0;
    if (existingCount >= 3) {
      return NextResponse.json({ error: `Maximum 3 ${photoType} photos allowed` }, { status: 400 });
    }

    booking.clientPhotos[photoType as 'inspiration' | 'currentState'].push({
      url,
      publicId,
      uploadedAt: new Date(),
    });
    await booking.save();
    if (booking.confirmedAt) {
      backupBooking(booking, 'update').catch((err) =>
        console.error('Failed to backup booking update to Google Sheets:', err)
      );
    }

    return NextResponse.json({ success: true, message: 'Photo added' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to add photo';
    console.error('[Photos POST]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/bookings/[id]/photos
 * Remove a client photo from a booking.
 * - With valid photoUploadToken: client can remove (within 2-hour window)
 * - With admin session: admin can always remove
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    const isAdmin = !!session?.user;

    const body = await request.json().catch(() => ({}));
    const token =
      (request.headers.get('x-photo-upload-token') as string | null) ?? (body.token ?? null);

    if (!isAdmin && !token) {
      return NextResponse.json(
        { error: 'Authentication required. Use your photo upload token or log in as admin.' },
        { status: 401 }
      );
    }

    if (token && !isAdmin) {
      try {
        const verified = verifyPhotoUploadToken(token);
        if (verified.bookingId !== id) {
          return NextResponse.json({ error: 'Token does not match this booking' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    }

    const { publicId, photoType } = body;

    if (!photoType || !ALLOWED_PHOTO_TYPES.includes(photoType)) {
      return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
    }
    if (!publicId) {
      return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const typedPhotoType = photoType as 'inspiration' | 'currentState';
    if (!booking.clientPhotos?.[typedPhotoType]) {
      return NextResponse.json({ error: 'Photo collection not found' }, { status: 404 });
    }

    booking.clientPhotos[typedPhotoType] = booking.clientPhotos[typedPhotoType].filter(
      (p: { publicId?: string }) => p.publicId !== publicId
    );
    await booking.save();
    if (booking.confirmedAt) {
      backupBooking(booking, 'update').catch((err) =>
        console.error('Failed to backup booking update to Google Sheets:', err)
      );
    }

    await deleteImage(publicId).catch(console.error);

    return NextResponse.json({ success: true, message: 'Photo removed' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to remove photo';
    console.error('[Photos DELETE]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
