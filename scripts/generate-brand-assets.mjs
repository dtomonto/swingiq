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
// Pure code, no design files: the mark is the brand green (#1a3a2a)
// with the "SQ" wordmark, matching the in-app header badge.
//
// Run:  node scripts/generate-brand-assets.mjs
// Safe to re-run; it overwrites the generated files deterministically.
// ============================================================

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'apps', 'web', 'public');

// Brand tokens (kept in sync with config/site.ts theme + AppShell badge).
const GREEN = '#1a3a2a';
const GREEN_LIGHT = '#2d5a40';
const WHITE = '#ffffff';
const FONT = 'Arial, Helvetica, sans-serif';

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
        letter-spacing="-2">SQ</text>
</svg>`;
}

/** 1200x630 Open Graph / social share card. */
function ogSvg() {
  const W = 1200;
  const H = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GREEN_LIGHT}"/>
      <stop offset="100%" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- SQ badge -->
  <rect x="96" y="120" width="150" height="150" rx="34" fill="${WHITE}"/>
  <text x="171" y="210" text-anchor="middle" dominant-baseline="middle"
        font-family="${FONT}" font-size="78" font-weight="900" fill="${GREEN}" letter-spacing="-3">SQ</text>
  <!-- Wordmark -->
  <text x="288" y="212" font-family="${FONT}" font-size="92" font-weight="900" fill="${WHITE}" letter-spacing="-2">SwingVantage</text>
  <!-- Tagline -->
  <text x="100" y="360" font-family="${FONT}" font-size="46" font-weight="700" fill="${WHITE}">Free AI Swing Analysis</text>
  <text x="100" y="424" font-family="${FONT}" font-size="40" font-weight="400" fill="rgba(255,255,255,0.88)">Golf · Tennis · Baseball · Softball</text>
  <!-- Footer line -->
  <text x="100" y="540" font-family="${FONT}" font-size="30" font-weight="600" fill="rgba(255,255,255,0.82)">Upload a swing · get your top fault · drills + practice plan</text>
</svg>`;
}

async function render(svg, outFile, label) {
  const out = join(PUBLIC_DIR, outFile);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`  ✓ ${outFile}  (${label})`);
}

async function main() {
  console.log(`Generating SwingVantage brand assets into ${PUBLIC_DIR}`);
  await render(iconSvg(512), 'icon-512.png', '512x512 PWA icon + JSON-LD logo');
  await render(iconSvg(192), 'icon-192.png', '192x192 PWA icon');
  await render(iconSvg(180), 'apple-icon.png', '180x180 iOS icon');
  await render(ogSvg(), 'og-default.png', '1200x630 social share');
  console.log('Done.');
}

main().catch((err) => {
  console.error('Brand asset generation failed:', err);
  process.exit(1);
});
