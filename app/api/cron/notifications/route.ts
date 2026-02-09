import { NextResponse } from 'next/server';
import { runNotificationSweep } from '@/lib/services/notificationService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const headerSecret = request.headers.get('x-cron-secret');
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runNotificationSweep();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Notification cron error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run notifications' }, { status: 500 });
  }
}
