import { NextResponse } from 'next/server';
import { cleanupClientPhotos } from '@/lib/services/cleanupClientPhotos';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: delete client nail photos 30+ days after booking completion.
 * Call with GET and optional x-cron-secret header (CRON_SECRET) for auth.
 * Schedule: e.g. daily via Vercel Cron or external scheduler.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const headerSecret = request.headers.get('x-cron-secret');
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await cleanupClientPhotos();
    return NextResponse.json({
      ok: true,
      bookingsProcessed: result.bookingsProcessed,
      photosDeleted: result.photosDeleted,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to cleanup photos';
    console.error('[Cron cleanup-photos] Error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
