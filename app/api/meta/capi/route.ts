import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, sendMetaCapiEvent, type MetaCapiEventName } from '@/lib/metaConversions';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = ['PageView', 'InitiateCheckout', 'Schedule'] as const;

const bodySchema = z.object({
  eventName: z.enum(ALLOWED_EVENTS),
  eventId: z.string().min(8).max(128),
  eventSourceUrl: z.string().url().max(2000).optional(),
  fbp: z.string().max(256).optional(),
  fbc: z.string().max(512).optional(),
  customData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/meta/capi
 * Browser → server Conversions API (Pixel + CAPI share eventId for dedup).
 */
export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const { eventName, eventId, eventSourceUrl, fbp, fbc, customData } = parsed.data;

    await sendMetaCapiEvent({
      eventName: eventName as MetaCapiEventName,
      eventId,
      eventSourceUrl,
      userData: {
        clientIpAddress: getClientIp(request),
        clientUserAgent: request.headers.get('user-agent'),
        fbp,
        fbc,
      },
      customData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Meta CAPI] route error:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
