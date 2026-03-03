import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { createPhotoUploadLinkToken } from '@/lib/uploadProofToken';

export const dynamic = 'force-dynamic';

/**
 * POST /api/bookings/[id]/generate-photo-upload-link
 * Admin only. Generates a link for the client to upload inspiration and current nails photos.
 * Link is valid for 14 days.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignedNailTechId = (session.user as { assignedNailTechId?: string }).assignedNailTechId;
    const canManageAllTechs = (session.user as { canManageAllTechs?: boolean }).canManageAllTechs ?? false;
    if (!canManageAllTechs && assignedNailTechId) {
      const { id } = await params;
      await connectDB();
      const booking = await Booking.findById(id).select('nailTechId').lean();
      if (!booking || String(booking.nailTechId) !== assignedNailTechId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const { id } = await params;
    await connectDB();
    const booking = await Booking.findById(id).select('status').lean();
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot generate link for cancelled booking' }, { status: 400 });
    }

    const token = createPhotoUploadLinkToken(id);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl.replace(/\/$/, '')}/booking/upload-photos?token=${encodeURIComponent(token)}`;

    // Store link on booking so it shows in booking details (no need to regenerate)
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await Booking.findByIdAndUpdate(id, {
      clientPhotoUploadUrl: url,
      clientPhotoUploadExpiresAt: expiresAt,
    });

    return NextResponse.json({ token, url, expiresAt: expiresAt.toISOString() });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate link';
    console.error('[generate-photo-upload-link]', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
