import { NextResponse } from 'next/server';
import { cleanupPastSlots } from '@/lib/services/cleanupPastSlots';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: clean past slots that have no booking.
 * Call with GET and optional x-cron-secret header (CRON_SECRET) for auth.
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
    const result = await cleanupPastSlots();
    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      slotIds: result.slotIds,
    });
  } catch (error: any) {
    console.error('[Cron cleanup-slots] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup past slots' },
      { status: 500 }
    );
  }
}
