import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { deleteImage } from '@/lib/cloudinary';

export interface CleanupClientPhotosResult {
  bookingsProcessed: number;
  photosDeleted: number;
  error?: string;
}

const DAYS_AFTER_COMPLETION = 30;

/**
 * Delete client nail photos (inspiration + current state) from bookings that were
 * completed more than 30 days ago. Per plan: client photos auto-deleted 30 days after completion.
 * Payment proofs are retained indefinitely.
 */
export async function cleanupClientPhotos(): Promise<CleanupClientPhotosResult> {
  await connectDB();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_AFTER_COMPLETION);

  const bookings = await Booking.find({
    completedAt: { $ne: null, $lt: cutoff },
    $or: [
      { 'clientPhotos.inspiration.0': { $exists: true } },
      { 'clientPhotos.currentState.0': { $exists: true } },
    ],
  })
    .select('clientPhotos')
    .lean();

  let photosDeleted = 0;

  for (const b of bookings) {
    const booking = b as {
      _id: unknown;
      clientPhotos?: {
        inspiration?: Array<{ publicId?: string }>;
        currentState?: Array<{ publicId?: string }>;
      };
    };

    if (!booking.clientPhotos) continue;

    const toDelete: string[] = [];
    for (const p of booking.clientPhotos.inspiration ?? []) {
      if (p.publicId) toDelete.push(p.publicId);
    }
    for (const p of booking.clientPhotos.currentState ?? []) {
      if (p.publicId) toDelete.push(p.publicId);
    }

    if (toDelete.length === 0) continue;

    for (const publicId of toDelete) {
      try {
        await deleteImage(publicId);
        photosDeleted++;
      } catch (err) {
        console.error('[cleanupClientPhotos] Failed to delete', publicId, err);
      }
    }

    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        'clientPhotos.inspiration': [],
        'clientPhotos.currentState': [],
      },
    });
  }

  if (photosDeleted > 0 || bookings.length > 0) {
    console.log(
      '[cleanupClientPhotos] Processed',
      bookings.length,
      'booking(s), deleted',
      photosDeleted,
      'photo(s)'
    );
  }

  return {
    bookingsProcessed: bookings.length,
    photosDeleted,
  };
}
