# Admin Dashboard How-To Guide — regenerator

Regenerates **`docs/SwingVantage-Admin-Dashboard-Guide.pdf`**: a polished,
illustrated walkthrough of every admin section (a real screenshot + plain-English
how-to per page). Re-run it whenever the admin UI or wording changes.

## In plain English (start here)

The guide is built from one data file plus live screenshots:

```
sections.json        ← all the wording (edit this for text changes)
capture.mjs          ← logs into the admin and screenshots every page
build-pdf.py         ← stitches screenshots + wording into the PDF
.cache/              ← intermediate screenshots (git-ignored)
```

To refresh the guide you (1) capture fresh screenshots, then (2) build the PDF.

## One-time setup

```bash
npm i -D playwright-core                     # browser driver (uses your system Chrome/Edge)
python -m pip install reportlab Pillow       # PDF + image tools
```

`@supabase/supabase-js` is already a project dependency.

## Regenerate

```bash
# 1. Start the app in another terminal:
npm run dev                                  # serves http://localhost:3000

# 2. Capture screenshots (all sections):
npm run docs:admin-guide:capture
#    …or a subset / in small batches if the dev server is busy:
node scripts/admin-guide/capture.mjs 01 02 03 04 05 06

# 3. Build the PDF:
npm run docs:admin-guide:build               # → docs/SwingVantage-Admin-Dashboard-Guide.pdf
```

## How it gets past the admin login

`/admin/*` requires a Supabase session. When `apps/web/.env.local` has Supabase
keys, `capture.mjs` creates a **throwaway confirmed user** with the service-role
key, logs in through the real `/login` form, captures, then **deletes that user**.
If Supabase isn’t configured, the admin is open in dev and login is skipped.

## Notes & gotchas (why the script is the way it is)

- **System browser, not the cached one.** The bundled `ms-playwright` chromium can
  fail to spawn on Windows, so we drive system Chrome/Edge via `executablePath`.
  Override with `CHROME_PATH=...`.
- **Dev-server bloat.** `next dev` can thrash while compiling many admin routes at
  once. If captures start timing out, run `capture.mjs` in small batches (pass
  section numbers) and/or restart `npm run dev`.
- **Cookie banner** is dismissed automatically so it isn’t across every shot.
- **Edit wording** in `sections.json` only — `build-pdf.py` is pure rendering and
  the cover date updates itself on each build.
- Env overrides: `BASE_URL`, `CHROME_PATH` (capture); `ADMIN_GUIDE_SHOTS`,
  `ADMIN_GUIDE_OUT`, `ADMIN_GUIDE_DATE` (build).
