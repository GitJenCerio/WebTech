'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/metaPixel';

export default function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) {
      setVisible(false);
      return;
    }
    setVisible(getCookieConsent() === null);
  }, [isAdmin]);

  const choose = useCallback((value: CookieConsentValue) => {
    setCookieConsent(value);
    setVisible(false);
  }, []);

  if (isAdmin || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl border border-[#e7e2db] bg-[#fffcfa] shadow-[0_-8px_32px_rgba(28,25,23,0.08)] p-4 sm:p-5">
        <p className="text-sm text-[#1c1917] leading-relaxed mb-4">
          We use cookies for essential site functions and, if you allow, Meta Pixel to measure
          ads and bookings. See our{' '}
          <Link href="/privacy-policy" className="underline underline-offset-2 text-[#57534e] hover:text-[#1c1917]">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="h-10 px-4 text-xs font-medium uppercase tracking-[0.1em] border border-[#c4b5a0] bg-transparent text-[#1c1917] hover:bg-[#f0ebe4] transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="h-10 px-4 text-xs font-medium uppercase tracking-[0.1em] border border-[#1c1917] bg-[#1c1917] text-[#fffcfa] hover:bg-[#2a2522] transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
