import { createHash } from 'crypto';
import { getMetaPixelId } from '@/lib/metaPixel';

const GRAPH_VERSION = 'v21.0';

export type MetaCapiEventName = 'PageView' | 'InitiateCheckout' | 'Schedule';

export type MetaCapiUserData = {
  email?: string | null;
  phone?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type MetaCapiEventInput = {
  eventName: MetaCapiEventName;
  eventId: string;
  eventSourceUrl?: string;
  actionSource?: 'website';
  userData?: MetaCapiUserData;
  customData?: Record<string, unknown>;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashEmail(email?: string | null): string | undefined {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return undefined;
  return sha256(normalized);
}

/** Normalize PH numbers to E.164 digits (63…) then hash. */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = `63${digits.slice(1)}`;
  } else if (digits.startsWith('9') && digits.length === 10) {
    digits = `63${digits}`;
  }
  if (digits.length < 10) return undefined;
  return sha256(digits);
}

export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || undefined;
}

function buildUserData(user?: MetaCapiUserData): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const em = hashEmail(user?.email);
  const ph = hashPhone(user?.phone);
  if (em) data.em = [em];
  if (ph) data.ph = [ph];
  if (user?.clientIpAddress) data.client_ip_address = user.clientIpAddress;
  if (user?.clientUserAgent) data.client_user_agent = user.clientUserAgent;
  if (user?.fbp) data.fbp = user.fbp;
  if (user?.fbc) data.fbc = user.fbc;
  return data;
}

/**
 * Send a Meta Conversions API event. No-ops if the access token is missing.
 * Never throw to callers — ads tracking must not break bookings.
 */
export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<void> {
  const pixelId = getMetaPixelId();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return;

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: input.actionSource || 'website',
        user_data: buildUserData(input.userData),
        ...(input.customData && Object.keys(input.customData).length > 0
          ? { custom_data: input.customData }
          : {}),
      },
    ],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[Meta CAPI] send failed:', res.status, body.slice(0, 400));
    }
  } catch (err) {
    console.error('[Meta CAPI] send error:', err);
  }
}
