// ============================================================
// SwingVantage — shared Open Graph card renderer (next/og / Satori)
// ------------------------------------------------------------
// One branded 1200×630 card design, reused by every /api/og/* route. Satori
// rules: inline styles only, explicit `display:flex` on every multi-child node,
// no external fetches (uses the bundled default font). Keep this the single
// source of truth so every share card looks identical.
// ============================================================

import type { ReactElement } from 'react';

export const OG_SIZE = { width: 1200, height: 630 } as const;

const BG = '#0b1220';
const ACCENT = '#22c55e';

export interface OgCardInput {
  /** Small accent line above the title (e.g. the group or sport). */
  eyebrow?: string;
  /** The headline. */
  title: string;
  /** One-line supporting text under the title. */
  subtitle?: string;
}

function clamp(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/**
 * Site-relative URL for the generic OG card route, for
 * `buildMetadata({ ogImage: ogCardUrl({ ... }) })`. Params are URL-encoded.
 */
export function ogCardUrl(input: OgCardInput): string {
  const p = new URLSearchParams();
  p.set('title', input.title);
  if (input.eyebrow) p.set('eyebrow', input.eyebrow);
  if (input.subtitle) p.set('subtitle', input.subtitle);
  return `/api/og/card?${p.toString()}`;
}

/** Build the card element for `new ImageResponse(renderOgCard(...), OG_SIZE)`. */
export function renderOgCard({ eyebrow, title, subtitle }: OgCardInput): ReactElement {
  return (
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
      {/* Brand row */}
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

      {/* Title block */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {eyebrow ? (
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 600, color: ACCENT, marginBottom: 18 }}>
            {clamp(eyebrow, 60)}
          </div>
        ) : null}
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: '#ffffff' }}>
          {clamp(title, 70)}
        </div>
        {subtitle ? (
          <div style={{ display: 'flex', fontSize: 30, color: '#9ca3af', marginTop: 26, maxWidth: 1040, lineHeight: 1.35 }}>
            {clamp(subtitle, 140)}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 26, color: '#9ca3af' }}>Free · No account required · All 7 sports</div>
        <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: ACCENT }}>swingvantage.com</div>
      </div>
    </div>
  );
}
