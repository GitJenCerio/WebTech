const CONSENT_KEY = 'gnbj_cookie_consent';
/** Live Meta Pixel ID. Override with NEXT_PUBLIC_META_PIXEL_ID if needed. */
const DEFAULT_PIXEL_ID = '1078667591326635';
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || DEFAULT_PIXEL_ID;

export type CookieConsentValue = 'accepted' | 'rejected';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
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

/** Fire a Meta standard or custom event (no-op without consent / pixel / fbq). */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (!getMetaPixelId()) return;
  if (typeof window.fbq !== 'function') return;
  try {
    if (params && Object.keys(params).length > 0) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  } catch {
    /* ignore */
  }
}

export function trackMetaPageView(): void {
  trackMetaEvent('PageView');
}

/** Book CTA / start booking flow */
export function trackMetaInitiateCheckout(source?: string): void {
  trackMetaEvent('InitiateCheckout', source ? { content_name: source } : undefined);
}

/** Successful booking submission — primary ads conversion */
export function trackMetaSchedule(bookingId?: string): void {
  trackMetaEvent(
    'Schedule',
    bookingId ? { content_ids: [bookingId], content_type: 'booking' } : undefined
  );
}
