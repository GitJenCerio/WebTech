import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendPushToAll } from '@/lib/services/pushNotificationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/test
 * Send a test push notification to all subscribed devices (dev/admin only)
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await sendPushToAll({
    title: 'Test Notification',
    body: 'Push notifications are working!',
    tag: 'test',
    requireInteraction: true,
    data: { url: '/admin/bookings' },
  });

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: results.length });
}
