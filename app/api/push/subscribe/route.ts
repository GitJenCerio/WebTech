import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/lib/models/PushSubscription';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/subscribe
 * Save a push subscription for the current user
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
  }

  await connectDB();

  await PushSubscription.findOneAndUpdate(
    { userId: session.user.id, endpoint },
    { userId: session.user.id, endpoint, keys },
    { upsert: true, new: true }
  );

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/push/subscribe
 * Remove a push subscription for the current user
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint } = body;

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  }

  await connectDB();
  await PushSubscription.deleteOne({ userId: session.user.id, endpoint });

  return NextResponse.json({ success: true });
}
