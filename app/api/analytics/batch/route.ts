import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AnalyticsEvent from '@/lib/models/AnalyticsEvent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set([
  'page_view',
  'book_now_click',
  'booking_started',
  'booking_completed',
]);

const MAX_BATCH = 50;

async function parseBody(request: Request): Promise<{ events?: unknown }> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return request.json();
  }
  // sendBeacon often arrives as text/plain
  const text = await request.text();
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request);
    const rawEvents = Array.isArray(body?.events) ? body.events : [];

    if (rawEvents.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    if (rawEvents.length > MAX_BATCH) {
      return NextResponse.json(
        { error: `Batch too large (max ${MAX_BATCH})` },
        { status: 400 }
      );
    }

    const docs = rawEvents
      .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      .map((e) => {
        const type = String(e.type || '').trim();
        if (!ALLOWED_TYPES.has(type)) return null;
        return {
          type,
          page: typeof e.page === 'string' ? e.page.slice(0, 500) : undefined,
          referrer: typeof e.referrer === 'string' ? e.referrer.slice(0, 500) : undefined,
          bookingId: typeof e.bookingId === 'string' ? e.bookingId.slice(0, 100) : undefined,
          sessionId: typeof e.sessionId === 'string' ? e.sessionId.slice(0, 120) : undefined,
          userAgent: typeof e.userAgent === 'string' ? e.userAgent.slice(0, 400) : undefined,
          timestamp: typeof e.timestamp === 'string' ? e.timestamp : undefined,
        };
      })
      .filter(Boolean);

    if (docs.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    await connectDB();
    await AnalyticsEvent.insertMany(docs, { ordered: false });

    return NextResponse.json({ ok: true, inserted: docs.length });
  } catch (error) {
    console.error('[API Analytics Batch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to store analytics events' },
      { status: 500 }
    );
  }
}
