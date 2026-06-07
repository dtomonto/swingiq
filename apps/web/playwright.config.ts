// ============================================================
// SwingVantage — Playwright E2E configuration
//
// One-time setup (not installed by default to keep the main install
// lean):
//   npm i -D @playwright/test
//   npm run test:e2e:install   # downloads the Chromium browser
// Then run:
//   npm run test:e2e
//
// These files are excluded from the app's tsconfig so a missing
// @playwright/test never affects `npm run type-check` or the build.
// ============================================================

import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ? Number(process.env.E2E_PORT) : 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    // E2E runs keyless (no Supabase env in CI). In a production build the auth
    // middleware fails CLOSED on protected app routes (e.g. /dashboard) when
    // Supabase is absent, redirecting to /login. Opt into anonymous app access
    // so tests can exercise the authenticated surface (the dock, etc.).
    // See apps/web/src/middleware.ts and e2e/floating-help-overlap.spec.ts.
    env: { ALLOW_ANONYMOUS_APP: '1' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
