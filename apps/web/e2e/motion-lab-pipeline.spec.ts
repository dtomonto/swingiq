import { test, expect } from '@playwright/test';

// ============================================================
// Motion Lab — real-browser infrastructure guard (L5).
//
// The Motion Lab pipeline depends on browser capabilities that node/jest
// CANNOT exercise and that the production Content-Security-Policy can silently
// break — exactly how #96 happened (CSP refused WebAssembly, so on-device pose
// returned nothing for every clip). The unit suites cover the pure logic
// (tracker, fusion, profiler, frame selection); this guards the DOM/CSP layer
// in a REAL browser, against the LIVE production headers:
//
//   1. WebAssembly.instantiate works  → 'wasm-unsafe-eval' is present
//      (the MediaPipe pose engine cannot start without it — the #96 break).
//   2. Canvas getImageData works      → frame extraction + enhancement can read
//      pixels (not blocked/tainted under the CSP / Cross-Origin-Resource-Policy).
//   3. Same-origin video fetch works  → media-src/connect-src allow swing clips.
//
// Selector-free and codec-independent, so it's a stable CI guard. (The full
// multi-person upload→MediaPipe→tracking flow is best authored in an env where a
// browser can download the model; the logic itself is unit-tested.)
// ============================================================

test.describe('Motion Lab — browser infrastructure', () => {
  test('the production CSP permits WebAssembly, canvas reads, and media fetch', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async () => {
      const out: { wasm: boolean; canvas: boolean; media: boolean; errors: string[] } = {
        wasm: false,
        canvas: false,
        media: false,
        errors: [],
      };

      // 1. WebAssembly.instantiate — the operation the CSP blocked in #96.
      try {
        const emptyModule = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
        await WebAssembly.instantiate(emptyModule);
        out.wasm = true;
      } catch (e) {
        out.errors.push(`wasm: ${e instanceof Error ? e.message : String(e)}`);
      }

      // 2. Canvas getImageData — the pixel read frame extraction/enhancement need.
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('no 2d context');
        ctx.fillStyle = '#3366cc';
        ctx.fillRect(0, 0, 8, 8);
        const data = ctx.getImageData(0, 0, 8, 8).data;
        out.canvas = data.length === 8 * 8 * 4 && data[2] > 100; // blue channel set
      } catch (e) {
        out.errors.push(`canvas: ${e instanceof Error ? e.message : String(e)}`);
      }

      // 3. Same-origin swing-clip fetch (media-src / connect-src).
      try {
        const res = await fetch('/library/film-study-motion-lab.mp4', { method: 'HEAD' });
        out.media = res.ok;
      } catch (e) {
        out.errors.push(`media: ${e instanceof Error ? e.message : String(e)}`);
      }

      return out;
    });

    expect(result.errors, `infrastructure errors: ${result.errors.join('; ')}`).toEqual([]);
    expect(result.wasm, 'WebAssembly.instantiate must work (CSP wasm-unsafe-eval)').toBe(true);
    expect(result.canvas, 'canvas getImageData must work (frame extraction)').toBe(true);
    expect(result.media, 'same-origin swing clip must be fetchable').toBe(true);
  });
});
