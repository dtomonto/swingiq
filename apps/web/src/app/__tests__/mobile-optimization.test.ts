// ============================================================
// Regression guards for the app-wide mobile + standard-optimization
// pass. These are source/config invariants (the repo's established
// fs-readback test style, e.g. video/no-heuristic-copy.test.ts) rather
// than component-render tests, because the Jest env here is ts-jest/node
// with no jsdom or testing-library.
// ============================================================

import { readFileSync } from 'fs';
import { join } from 'path';

// apps/web/src/app/__tests__/  →  resolve siblings/ancestors
const APP = (p: string) => join(__dirname, '..', p); // apps/web/src/app/<p>
const SRC = (p: string) => join(__dirname, '..', '..', p); // apps/web/src/<p>
const PUBLIC = (p: string) => join(__dirname, '..', '..', '..', 'public', p); // apps/web/public/<p>
const read = (p: string) => readFileSync(p, 'utf8');

describe('viewport allows pinch-zoom (WCAG 2.1 SC 1.4.4 / 1.4.10)', () => {
  const layout = read(APP('layout.tsx'));
  test('exports a viewport', () => {
    expect(layout).toMatch(/export const viewport/);
  });
  test('does not disable user scaling', () => {
    expect(layout).not.toMatch(/userScalable:\s*false/);
    expect(layout).not.toMatch(/maximumScale:\s*1\b/);
  });
});

describe('global CSS mobile hardening', () => {
  const css = read(APP('globals.css'));
  test('text form controls render >=16px on phones (blocks iOS focus zoom)', () => {
    expect(css).toMatch(/max-width:\s*640px/);
    expect(css).toMatch(/font-size:\s*16px/);
  });
  test('defines a 44x44 tap-target utility (WCAG 2.5.5)', () => {
    expect(css).toMatch(/@utility tap-target/);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/min-width:\s*44px/);
  });
});

describe('DataTable has a mobile card view', () => {
  const dt = read(SRC(join('components', 'admin', 'DataTable.tsx')));
  test('table is hidden below sm and a card list replaces it', () => {
    expect(dt).toMatch(/hidden[^"]*sm:block/); // table wrapper
    expect(dt).toMatch(/sm:hidden/); // card list wrapper
  });
});

describe('PWA manifest is installable', () => {
  const manifest = JSON.parse(read(PUBLIC('manifest.json'))) as {
    name?: string;
    short_name?: string;
    start_url?: string;
    display?: string;
    id?: string;
    scope?: string;
    icons?: Array<{ sizes?: string }>;
    shortcuts?: Array<{ url?: string }>;
  };
  test('has the required installability fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.id).toBe('/');
    expect(manifest.scope).toBe('/');
  });
  test('declares 192px and 512px icons', () => {
    const sizes = (manifest.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });
  test('declares app shortcuts that point to in-app routes', () => {
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect((manifest.shortcuts ?? []).length).toBeGreaterThanOrEqual(1);
    for (const s of manifest.shortcuts ?? []) expect(s.url).toMatch(/^\//);
  });
});

describe('service worker safety invariants', () => {
  const sw = read(PUBLIC('sw.js'));
  test('is versioned and self-updating', () => {
    expect(sw).toMatch(/const VERSION/);
    expect(sw).toMatch(/skipWaiting/);
    expect(sw).toMatch(/clients\.claim/);
  });
  test('never caches API responses', () => {
    expect(sw).toMatch(/startsWith\('\/api\/'\)/);
  });
  test('navigations are network-first with an offline fallback', () => {
    expect(sw).toMatch(/OFFLINE_URL\s*=\s*'\/offline'/);
    expect(sw).toMatch(/mode === 'navigate'/);
  });
});

describe('offline route', () => {
  test('the offline page exists', () => {
    expect(read(APP(join('offline', 'page.tsx')))).toMatch(/offline/i);
  });
  test('middleware serves /offline without auth', () => {
    expect(read(SRC('middleware.ts'))).toMatch(/'\/offline'/);
  });
});
