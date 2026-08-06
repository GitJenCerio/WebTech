'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  getCookieConsent,
  getMetaPixelId,
  trackMetaPageView,
  type CookieConsentValue,
} from '@/lib/metaPixel';

export default function MetaPixel() {
  const pathname = usePathname();
  const pixelId = getMetaPixelId();
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const skipNextPageView = useRef(true);

  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    setConsent(getCookieConsent());
    const onConsent = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentValue>).detail;
      setConsent(detail);
      if (detail === 'accepted') skipNextPageView.current = true;
    };
    window.addEventListener('gnbj-cookie-consent', onConsent);
    return () => window.removeEventListener('gnbj-cookie-consent', onConsent);
  }, []);

  const enabled = !isAdmin && consent === 'accepted' && !!pixelId;

  useEffect(() => {
    if (!enabled || !scriptReady) return;
    if (skipNextPageView.current) {
      skipNextPageView.current = false;
      return;
    }
    trackMetaPageView();
  }, [enabled, scriptReady, pathname]);

  if (!enabled || !pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
