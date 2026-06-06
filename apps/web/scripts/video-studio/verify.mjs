import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const p = await ctx.newPage();
await p.goto(BASE + '/tutorial', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);
try {
  await p.getByRole('button', { name: /Adult athlete/i }).click({ timeout: 3000 });
  await p.getByRole('button', { name: /Continue to SwingVantage/i }).click({ timeout: 3000 });
} catch {}
await p.waitForTimeout(800);
await p.getByText('Welcome to SwingVantage', { exact: true }).first().click({ timeout: 5000 });
await p.waitForTimeout(1500);
const v = await p.evaluate(async () => {
  const el = document.querySelector('div[role="dialog"] video');
  if (!el) return { found: false };
  el.muted = false;
  try { await el.play(); } catch {}
  const t0 = el.currentTime;
  const a0 = el.webkitAudioDecodedByteCount || 0;
  await new Promise((r) => setTimeout(r, 2000));
  return {
    found: true,
    src: (el.currentSrc || '').split('/').pop(),
    duration: Math.round(el.duration),
    advanced: +(el.currentTime - t0).toFixed(2),
    audioBytesDecoded: (el.webkitAudioDecodedByteCount || 0) - a0,
    videoBytesDecoded: el.webkitVideoDecodedByteCount || 0,
  };
});
console.log('NARRATED VIDEO CHECK:', JSON.stringify(v, null, 2));
console.log('coming-soon panels:', await p.getByText('Video coming soon').count());
await p.screenshot({ path: 'scripts/video-studio/.work/verify-narrated.png' });
await b.close();
