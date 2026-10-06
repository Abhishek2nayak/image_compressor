import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/site';

// Generated at build time rather than shipped as a binary asset, so the image
// always lives on the canonical domain and never goes stale against the brand.
export const alt = `${BRAND} — free online PDF and image tools`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 45%, #fff7ed 100%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, color: '#ef4444', fontWeight: 700 }}>
          {BRAND}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 76,
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.1,
            marginTop: 24,
          }}
        >
          Free PDF &amp; image tools
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#64748b', marginTop: 28 }}>
          Compress · Convert · Merge · Split
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#94a3b8', marginTop: 40 }}>
          No account needed · No watermarks
        </div>
      </div>
    ),
    size,
  );
}
