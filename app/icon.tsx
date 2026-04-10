import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
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
            width: 420,
            height: 420,
            borderRadius: 120,
            background: '#111111',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 170,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: 4,
          }}
        >
          GJ
        </div>
      </div>
    ),
    size
  );
}

