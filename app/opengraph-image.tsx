import { ImageResponse } from 'next/og';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

export const alt = 'Russian manicure & pedicure in Manila | glammednailsbyjhen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function loadLogoSrc(): Promise<string> {
  // 1. Try fetch from site URL (works in dev + prod)
  try {
    const res = await fetch(`${baseUrl}/logo.png`, { cache: 'no-store' });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return `data:image/png;base64,${b64}`;
    }
  } catch {}
  // 2. Fallback: file read
  try {
    const logoPath = join(process.cwd(), 'public', 'logo.png');
    const logoData = await readFile(logoPath, 'base64');
    return `data:image/png;base64,${logoData}`;
  } catch {}
  return '';
}

export default async function Image() {
  const logoSrc = await loadLogoSrc();
  let heroBgSrc: string;
  try {
    const heroPath = join(process.cwd(), 'public', 'images', 'hero-1.JPG');
    const heroData = await readFile(heroPath, 'base64');
    heroBgSrc = `data:image/jpeg;base64,${heroData}`;
  } catch {
    heroBgSrc = '';
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background: hero image or gradient */}
        {heroBgSrc ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
            }}
          >
            <img
              src={heroBgSrc}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              width={1200}
              height={630}
            />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.55)',
            }}
          />
          </div>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              background: 'linear-gradient(135deg, #f5f3ef 0%, #ebe8e3 100%)',
            }}
          />
        )}

        {/* Center card - matches hero banner frame */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 64px',
            background: 'rgba(255, 255, 255, 0.65)',
            border: '4px solid white',
            borderRadius: 4,
            boxShadow: '0 0 0 3px #000000',
            maxWidth: 880,
          }}
        >
          {/* Logo in header position */}
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              style={{
                width: 560,
                height: 160,
                objectFit: 'contain',
                marginBottom: 20,
              }}
              width={560}
              height={160}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 600,
                color: '#000000',
                fontFamily: 'Georgia, serif',
                marginBottom: 20,
              }}
            >
              glammednailsbyjhen
            </div>
          )}

          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: '#1a1a1a',
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            Precision dry technique. Clean cuticles. Long-lasting results.
          </div>

          <div
            style={{
              display: 'flex',
              padding: '14px 32px',
              background: '#000000',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 20,
              border: '2px solid white',
              boxShadow: '0 0 0 2px #000000',
              borderRadius: 4,
            }}
          >
            Book Now
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 16,
              color: 'rgba(0, 0, 0, 0.85)',
              fontFamily: 'system-ui, sans-serif',
              marginTop: 20,
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
