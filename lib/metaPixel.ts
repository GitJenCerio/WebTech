const CONSENT_KEY = 'gnbj_cookie_consent';
/** Live Meta Pixel ID. Override with NEXT_PUBLIC_META_PIXEL_ID if needed. */
const DEFAULT_PIXEL_ID = '1078667591326635';
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || DEFAULT_PIXEL_ID;

export type CookieConsentValue = 'accepted' | 'rejected';

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function getMetaPixelId(): string | undefined {
  const id = PIXEL_ID?.trim();
  return id || undefined;
}

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'accepted' || v === 'rejected') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setCookieConsent(value: CookieConsentValue): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent('gnbj-cookie-consent', { detail: value }));
  } catch {
    /* ignore */
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}

export function createMetaEventId(prefix?: string): string {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function metaScheduleEventId(bookingId: string): string {
  return `schedule_${bookingId}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function sendMetaCapiFromBrowser(
  eventName: string,
  eventId: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  fetch('/api/meta/capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
      customData: params && Object.keys(params).length > 0 ? params : undefined,
    }),
  }).catch(() => {
    /* ignore */
  });
}

/** Fire a Meta standard or custom event (no-op without consent / pixel / fbq). */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (!getMetaPixelId()) return;
  const id = eventId || createMetaEventId(eventName.toLowerCase());
  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, params || {}, { eventID: id });
    }
  } catch {
    /* ignore */
  }
  sendMetaCapiFromBrowser(eventName, id, params);
}

export function trackMetaPageView(): void {
  trackMetaEvent('PageView');
}

/** Book CTA / start booking flow */
export function trackMetaInitiateCheckout(source?: string): void {
  trackMetaEvent('InitiateCheckout', source ? { content_name: source } : undefined);
}

/** Successful booking submission — primary ads conversion (event_id matches CAPI). */
export function trackMetaSchedule(bookingId?: string): void {
  const params = bookingId
    ? { content_ids: [bookingId], content_type: 'booking' }
    : undefined;
  const eventId = bookingId ? metaScheduleEventId(bookingId) : undefined;
  trackMetaEvent('Schedule', params, eventId);
}
