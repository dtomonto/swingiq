// ============================================================
// SwingVantage — Brand asset generator
//
// Renders the SwingVantage social-share image and app icons as real PNG
// files into apps/web/public/ so every reference resolves:
//   - og-default.png  (1200x630)  social share / Open Graph / Twitter
//   - icon-192.png    (192x192)   PWA manifest icon
//   - icon-512.png    (512x512)   PWA manifest icon + JSON-LD Organization logo
//   - apple-icon.png  (180x180)   iOS home-screen icon
//
// Pure code, no design files: the mark is the brand green with the "SV"
// monogram, matching the in-app header badge.
//
// Run:  node scripts/generate-brand-assets.mjs
// Safe to re-run; it overwrites the generated files deterministically.
//
// ── Why the share card is built the way it is ───────────────
// The og-default card is the preview that renders when someone pastes a
// SwingVantage link into iMessage, SMS/MMS, WhatsApp, Messenger, Slack,
// Discord, X, LinkedIn or an email client. Two rules make it render
// reliably *everywhere* rather than just on Facebook's debugger:
//
//  1. NO ALPHA. The card is flattened onto a solid background and written
//     as 24-bit RGB (3 channels, no transparency). WhatsApp and several
//     Android SMS/RCS clients silently drop or blacken PNGs that carry an
//     alpha channel — the single most common "my preview is blank" cause.
//  2. CENTER-WEIGHTED COMPOSITION. The logo, headline, brand promise and
//     URL all sit on the vertical centerline, so clients that center-crop
//     the 1.91:1 card to a square thumbnail (older WhatsApp, some inboxes)
//     still show the brand and the domain instead of clipping them off.
//
// Keep it under ~300 KB (WhatsApp won't fetch larger) — RGB PNG at this
// size lands well under that.
// ============================================================

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public');

// Brand tokens (kept in sync with config/site.ts theme + AppShell badge).
const GREEN = '#1a3a2a'; // deep brand green (icon base)
const GREEN_LIGHT = '#2d5a40'; // icon gradient top
const EMERALD = '#34d399'; // bright accent used on the dark share card
const EMERALD_DK = '#22c55e';
const INK = '#0B0F0C'; // near-black share-card background (matches themeColor)
const INK_2 = '#0e1a12'; // subtle green-tinted black for the gradient
const WHITE = '#ffffff';
const MUTED = 'rgba(255,255,255,0.74)';
// Single-quote the multi-word family names: this string is interpolated into
// a double-quoted SVG attribute, so inner double quotes would break the XML.
const FONT = "Arial, 'Liberation Sans', 'Helvetica Neue', Helvetica, sans-serif";

/** Square app icon. Full-bleed green so it works as a maskable icon. */
function iconSvg(size) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.42);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN_LIGHT}"/>
      <stop offset="100%" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
  <text x="50%" y="50%" dy="0.06em" text-anchor="middle" dominant-baseline="middle"
        font-family="${FONT}" font-size="${fontSize}" font-weight="900" fill="${WHITE}"
        letter-spacing="-2">SV</text>
</svg>`;
}

/**
 * 1200x630 Open Graph / social share card — the link preview for iMessage,
 * SMS, WhatsApp, email, Slack, X, etc. Centered composition so square crops
 * never lose the brand; flattened to opaque RGB at render time (see render()).
 */
function ogSvg() {
  const W = 1200;
  const H = 630;
  const CX = W / 2; // 600 — vertical centerline everything hangs from
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${INK_2}"/>
      <stop offset="100%" stop-color="${INK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${EMERALD}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${EMERALD}"/>
      <stop offset="100%" stop-color="${EMERALD_DK}"/>
    </linearGradient>
  </defs>

  <!-- Solid base + soft brand glow + faint card border -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="28"
        fill="none" stroke="${EMERALD}" stroke-opacity="0.18" stroke-width="2"/>

  <!-- SV badge (centered) -->
  <rect x="${CX - 52}" y="64" width="104" height="104" rx="26" fill="url(#badge)"/>
  <text x="${CX}" y="118" text-anchor="middle" dominant-baseline="middle"
        font-family="${FONT}" font-size="56" font-weight="800" fill="${INK}" letter-spacing="-2">SV</text>

  <!-- Wordmark -->
  <text x="${CX}" y="232" text-anchor="middle"
        font-family="${FONT}" font-size="46" font-weight="800" fill="${WHITE}" letter-spacing="-1">SwingVantage</text>

  <!-- Headline -->
  <text x="${CX}" y="330" text-anchor="middle"
        font-family="${FONT}" font-size="80" font-weight="800" fill="${WHITE}" letter-spacing="-2">Free AI Swing Analysis</text>

  <!-- Sports covered -->
  <text x="${CX}" y="392" text-anchor="middle"
        font-family="${FONT}" font-size="30" font-weight="600" fill="${EMERALD}" letter-spacing="0.5">Golf · Tennis · Pickleball · Padel · Baseball · Softball</text>

  <!-- Divider -->
  <rect x="${CX - 70}" y="430" width="140" height="3" rx="1.5" fill="${EMERALD}" fill-opacity="0.45"/>

  <!-- Brand promise -->
  <text x="${CX}" y="500" text-anchor="middle"
        font-family="${FONT}" font-size="38" font-weight="700" fill="rgba(255,255,255,0.92)">One fix. One plan. One retest.</text>

  <!-- Footer: domain + trust signal (dx gives a reliable gap around the dot;
       plain spaces collapse inconsistently across SVG renderers) -->
  <text x="${CX}" y="566" text-anchor="middle"
        font-family="${FONT}" font-size="26" font-weight="600">
    <tspan fill="${EMERALD}">swingvantage.com</tspan><tspan fill="${MUTED}" dx="20">·</tspan><tspan fill="${MUTED}" dx="20">Free · No account required</tspan>
  </text>
</svg>`;
}

/**
 * Render an SVG to PNG. `flatten` composites onto an opaque background and
 * strips the alpha channel — required for the share card so WhatsApp / SMS
 * clients render it (they choke on transparent PNGs). Icons keep their alpha.
 */
async function render(svg, outFile, label, { flatten = false } = {}) {
  const out = join(PUBLIC_DIR, outFile);
  let pipeline = sharp(Buffer.from(svg));
  if (flatten) pipeline = pipeline.flatten({ background: INK });
  await pipeline.png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ✓ ${outFile}  (${label})`);
}

async function main() {
  console.log(`Generating SwingVantage brand assets into ${PUBLIC_DIR}`);
  await render(iconSvg(512), 'icon-512.png', '512x512 PWA icon + JSON-LD logo');
  await render(iconSvg(192), 'icon-192.png', '192x192 PWA icon');
  await render(iconSvg(180), 'apple-icon.png', '180x180 iOS icon');
  await render(ogSvg(), 'og-default.png', '1200x630 social share', { flatten: true });
  console.log('Done.');
}

main().catch((err) => {
  console.error('Brand asset generation failed:', err);
  process.exit(1);
});
