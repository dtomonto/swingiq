// ============================================================
// Regression guard: the production Content-Security-Policy MUST permit the
// on-device MediaPipe pose engine. Without these sources the engine can't
// load, pose detection silently returns no frames, and the video overlays
// report "No body pose was detected in this clip" for every upload.
//
// The asset origins mirror the defaults in lib/pose/pose-detection.ts:
//   • WASM runtime  → https://cdn.jsdelivr.net  (fetched + loader script)
//   • pose model    → https://storage.googleapis.com  (.task file)
// and WebAssembly.instantiate itself requires 'wasm-unsafe-eval' (it is NOT
// covered by 'unsafe-inline'). If you self-host the assets via
// NEXT_PUBLIC_MEDIAPIPE_*_BASE you may drop the hosts, but 'wasm-unsafe-eval'
// must stay. Keep this in sync with next.config.mjs and docs/security/F6-nonce-csp.md.
// ============================================================

import { readFileSync } from 'fs';
import { join } from 'path';

const CONFIG = readFileSync(
  join(__dirname, '..', '..', '..', '..', 'next.config.mjs'),
  'utf8',
);

/**
 * Pull a single CSP directive's value out of next.config.mjs. Each directive is
 * a one-line double-quoted string literal (e.g. "connect-src 'self' …"); the
 * capture is restricted to a single line so it matches the real directive and
 * never bleeds into surrounding source. (We do NOT strip comments first — a
 * naive `//` comment stripper would eat the `//` inside every https:// URL.)
 */
function directive(name: string): string {
  const m = CONFIG.match(new RegExp(`"${name} ([^"\\n]*)"`));
  if (!m) throw new Error(`CSP directive "${name}" not found in next.config.mjs`);
  return m[1];
}

describe('CSP permits the on-device MediaPipe pose engine', () => {
  test("script-src allows WebAssembly instantiation ('wasm-unsafe-eval')", () => {
    expect(directive('script-src')).toContain("'wasm-unsafe-eval'");
  });

  test('connect-src allows the MediaPipe WASM runtime + pose model hosts', () => {
    const connect = directive('connect-src');
    expect(connect).toContain('https://cdn.jsdelivr.net');
    expect(connect).toContain('https://storage.googleapis.com');
  });
});
