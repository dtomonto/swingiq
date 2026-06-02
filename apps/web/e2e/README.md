# SwingIQ E2E tests (Playwright)

End-to-end tests that drive a real browser against a production build.

To keep the default `npm install` lean, Playwright is **not** a committed
dependency. Set it up once:

```bash
npm i -D @playwright/test     # add the test runner
npm run test:e2e:install      # download the Chromium browser
```

Then run the suite (it builds and starts the app on port 3100 automatically):

```bash
npm run test:e2e
```

## What's covered

- `smoke.spec.ts` — home page, `/sitemap.xml`, `/robots.txt`, `/pricing`, and the
  `/api/capabilities` boolean summary.
- `keyless-auth.spec.ts` — keyless sign-up creates a device-local account and
  routes to onboarding; wrong-password sign-in is rejected.
- `csv-import-diagnosis.spec.ts` — the import → diagnosis journey. The full
  CSV-upload assertion is marked `test.fixme` until the upload control selector
  is confirmed against the live wizard; a sample fixture lives in
  `fixtures/sample-golf.csv`.

These files are excluded from `tsconfig.json`, so a missing `@playwright/test`
never affects `npm run type-check` or `npm run build`.
