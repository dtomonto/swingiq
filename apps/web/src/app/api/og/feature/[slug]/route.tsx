import { ImageResponse } from 'next/og';
import { getFeature } from '@/content/features';

// Per-feature social share card (1200×630), served at a stable URL so it can be
// referenced from buildMetadata({ ogImage }). Rendered by Satori (next/og):
// inline styles only, explicit flex on every multi-child node, no external
// fetches. Public (added to middleware PUBLIC_PREFIXES) so social crawlers can
// fetch it without a session.

const BG = '#0b1220';
const ACCENT = '#22c55e';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = getFeature(slug);
  const name = feature?.name ?? 'SwingVantage';
  const group = feature?.group ?? 'AI Swing Analysis';
  const summaryRaw = feature?.summary ?? 'Free AI swing analysis for every sport.';
  const summary = summaryRaw.length > 140 ? summaryRaw.slice(0, 137) + '…' : summaryRaw;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: BG,
          padding: '72px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: ACCENT,
              color: BG,
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            SV
          </div>
          <div style={{ display: 'flex', marginLeft: 20, fontSize: 30, fontWeight: 700, color: '#e5e7eb' }}>
            SwingVantage
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, color: ACCENT, marginBottom: 18 }}>{group}</div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: '#ffffff' }}>{name}</div>
          <div style={{ display: 'flex', fontSize: 30, color: '#9ca3af', marginTop: 26, maxWidth: 1000, lineHeight: 1.35 }}>
            {summary}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#9ca3af' }}>Free · No account required · All 7 sports</div>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: ACCENT }}>swingvantage.com/features</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
