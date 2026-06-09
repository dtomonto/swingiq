# Performance & Core Web Vitals

_Audit: 2026-06-09 (Sprint 2 of the growth program)._

## TL;DR — the big levers are already pulled

A code-level audit found SwingVantage is **already well-optimized**. There is no
low-hanging CWV fruit to implement; the remaining work is **measurement on a real
deploy** (which needs Lighthouse/PageSpeed against a preview — see below).

| Lever | Status | Evidence |
| --- | --- | --- |
| Web fonts | ✅ optimal | `Inter` via `next/font/google` — self-hosted, no render-blocking `<link>`, no CLS (`app/layout.tsx`) |
| Heavy 3D (`three`) | ✅ code-split | loaded via `next/dynamic` (`components/swinglab/LabExperience.tsx`), not in any route's initial JS |
| Pose model (`@mediapipe/tasks-vision`) | ✅ lazy | type-only import + runtime `import()` + CDN-hosted WASM/model (`lib/pose/pose-detection.ts`) |
| Package imports | ✅ on | `experimental.optimizePackageImports` (next.config) |
| React Compiler | ✅ on | `reactCompiler: true` (memoization without manual `useMemo`/`useCallback`) |
| Raster images | ✅ minimal | only 3 raw `<img>` (video posters/frames); UI is SVG-icon based (lucide), so `next/image` has little to optimize |
| Route protection / `no-store` on `/api/*` | ✅ | global headers in next.config |

## Findings / recommendations

1. **Dead dependency: `framer-motion`.** It is in `apps/web/package.json` but has
   **zero imports** anywhere in `src` (checked all styles: `framer-motion`,
   `motion/react`, `motion`). It is therefore not in any bundle, but it bloats
   `node_modules` + install time and is supply-chain surface. **Remove it** in your
   next `package.json` pass (`npm rm framer-motion -w @swingiq/web`). Left for the
   owner to avoid racing the frequently-churned `package-lock.json`.

2. **Verify the 3 raw `<img>`** (`LibraryBrowser`, `VideoPlayer`,
   `VideoStudioCockpit`) — these are video posters/frames where `next/image` may not
   fit (blob URLs). If any render a static poster from a known URL, switch it to
   `next/image` for automatic responsive/lazy/modern-format delivery.

## Measure before optimizing further (owner-runnable)

I can't measure CWV from here (admin/app routes are behind the Supabase auth wall).
Run these against a **preview deploy** to find real field/lab regressions:

```bash
# Lab CWV (LCP/CLS/INP/TBT) for the key public routes
npx unlighthouse --site https://<preview-url>        # crawls + scores every page
# or single-page:
npx lighthouse https://<preview-url>/ --view

# Bundle composition (wire the analyzer behind an env flag, then):
ANALYZE=1 npm run build -w @swingiq/web               # see per-route JS treemap
```

**Bundle treemap (shipped).** `@next/bundle-analyzer` is wired in `next.config.mjs`
behind `process.env.ANALYZE` as a *conditional dynamic import*, so a normal build
never loads it. Open the treemap with:

```bash
ANALYZE=true npm run build           # macOS/Linux/CI
$env:ANALYZE='true'; npm run build   # Windows PowerShell
# or from apps/web:  npm run analyze
```

**Bundle budget gate (shipped).** `scripts/check-bundle-budget.mjs` runs after the
build in Growth CI (`npm run check:bundle`) and **fails CI** if any App-Router route
ships more first-load JS than its limit in **`apps/web/bundle-budget.json`**. Limits
start generous; capture a baseline with `ANALYZE=true npm run build` and tighten them.
The gate is skip-safe (no build / manifest-format change → it skips rather than
false-fails), and its size math is unit-tested (`scripts/__tests__/check-bundle-budget.test.mjs`).
To intentionally allow a heavier route, raise its entry in `bundle-budget.json` with a note.

## Performance budget (targets)

Track these on the public marketing + key app routes:

| Metric | Target |
| --- | --- |
| LCP (mobile, p75) | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| INP | ≤ 200 ms |
| Route initial JS (gzip) | ≤ ~170 KB for public pages |
| Lighthouse Performance | ≥ 90 (public marketing) |

If a future change regresses these, the most likely causes (given the current
architecture) are: a newly-eager heavy `'use client'` component, an un-split chart/
3D import, or an unoptimized hero image — re-check those first.
