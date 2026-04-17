import { ImageResponse } from 'next/og';

export const alt = 'Russian manicure & pedicure in Manila | glammednailsbyjhen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://www.glammednailsbyjhen.com'
).replace(/\/$/, '');

async function loadImageAsDataUrl(path: string, mime: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return `data:${mime};base64,${b64}`;
    }
  } catch {}
  return '';
}

export default async function Image() {
  const [logoSrc, heroBgSrc] = await Promise.all([
    loadImageAsDataUrl('/logo.png', 'image/png'),
    loadImageAsDataUrl('/images/hero-1.JPG', 'image/jpeg'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          margin: 0,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f3ef 0%, #ebe8e3 100%)',
        }}
      >
        {heroBgSrc ? (
          <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex' }}>
            <img
              src={heroBgSrc}
              alt=""
              style={{ width: 1200, height: 630, objectFit: 'cover' }}
              width={1200}
              height={630}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.6)',
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: 0,
            margin: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {/* Logo - bigger */}
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              style={{
                width: 960,
                height: 280,
                objectFit: 'contain',
              }}
              width={960}
              height={280}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                fontSize: 80,
                fontWeight: 600,
                color: '#000000',
                fontFamily: 'Georgia, serif',
              }}
            >
              glammednailsbyjhen
            </div>
          )}

          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: '#1a1a1a',
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            Precision dry technique. Clean cuticles. Long-lasting results.
          </div>

          <div
            style={{
              display: 'flex',
              padding: '20px 48px',
              background: '#000000',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 32,
              border: '3px solid white',
              boxShadow: '0 0 0 3px #000000',
              borderRadius: 6,
            }}
          >
            Book Now
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 24,
              color: 'rgba(0, 0, 0, 0.85)',
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            Private Home Studio · By Appointment Only
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
