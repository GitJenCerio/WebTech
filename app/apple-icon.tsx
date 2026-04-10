import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 42,
            background: '#111111',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 62,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: 2,
          }}
        >
          GJ
        </div>
      </div>
    ),
    size
  );
}

