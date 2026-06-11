# Design V2 — token axes, components, and the redesign flag

This is the engineering reference for the **Design V2** redesign of `apps/web`.
It documents the two token axes the redesign introduces, the component variants
and new primitives, the feature flag, and how to ramp it to GA.

The redesign is **additive and reversible**: every visual treatment mounts
behind the `NEXT_PUBLIC_DESIGN_V2` flag, and with the flag OFF the app renders
byte-for-byte as it did before. Nothing here is live until the Phase 8 flip.

---

## 1. Two orthogonal token axes

The token system has two independent axes, both set on the **root element**
(`<html>`) and resolved through Tailwind v4 `@theme` utilities. Layout never
changes between them — only the "emotional layer" (color/mood/identity) does.

| Axis | Attribute | Owns | Never touches |
|---|---|---|---|
| **Theme** (mood) | `data-theme` (8 themes) | surfaces, semantics, radius, shadow, glow, heading font | sport identity |
| **Sport** (identity) | `data-sport` (7 sports) | `--sport-accent` (+`-foreground`/`-text`), `--sport-secondary`, `--sport-wash`, `--sport-pattern`, `--sport-viz-1..3`, `--sport-duration`/`--sport-ease` | `--primary`, `--background`, `--card`, status colors |

`data-theme` is applied to `<html>` by `ThemeApplicator`; `data-sport` is applied
to `<html>` by `SportContext` (an effect on `activeSport`). The two compose:
`<html data-theme="dark-performance" data-sport="tennis">`.

**Inheritance rules (binding):** sport tokens appear ONLY in identity zones —
sport chips/heroes, sport-landing accents, per-sport data series, active-sport
nav. Buttons, CTAs, and status colors are always SwingVantage (theme tokens) in
every sport. New sport = one `[data-sport]` block in `globals.css`; nothing else.

### The "document" surface (third, special surface)

The AI report and the Learn articles render as **light paper in every theme**
(sunlight-proof, print-true), via a per-theme surface trio:

- `--surface-document` / `--surface-document-foreground` / `--surface-document-accent`

mapped to the Tailwind utilities `bg-document` / `text-document-fg` /
`text-document-accent`. On the light paper you must use **document ink** — the
theme `text-foreground` is near-white on the dark default theme and vanishes on
the sheet. The same applies to the theme `--link` accent; use
`--document-accent` (or `--sport-accent-text` in identity zones) instead.

---

## 2. ⚠️ Tailwind v4 `@theme` is root-computed — keep `data-*` on `<html>`

Tailwind v4 emits `@theme` `--color-*` variables to `:root` and resolves them
there. A **nested** `[data-theme]` / `[data-sport]` override (e.g. on `<body>`
or a mid-tree wrapper) does **NOT** re-resolve those utilities — so
`bg-sport-accent` / `text-foreground` on a descendant would keep the root value.

Consequences for this codebase:

- `data-theme` and `data-sport` live on `<html>` (= `:root`), so the
  `@theme` utilities (`bg-document`, `bg-sport-accent`, `text-foreground`, …)
  resolve correctly. **Do not move them to `<body>` or a wrapper.**
- When you DO need a nested `data-sport` (e.g. a sport-landing hero that must
  show its page's sport regardless of the visitor's active sport), use **inline
  `var()` styles** — `style={{ backgroundImage: 'var(--sport-wash)' }}`,
  `hsl(var(--sport-accent))` — which resolve down the cascade on the element,
  unlike the root-computed `@theme` utilities. The `SportChip`,
  `ProgressTimeline`, and the sport-landing/homepage hero washes all do this.
- If a nested `data-theme` scope is unavoidable (e.g. the admin Coach Mode
  wrapper), **rebind** the needed `--color-*` inside that block in `globals.css`.

Risk-register corollary: keep sport classes **static strings** (no
`bg-sport-${id}` template literals) so Tailwind's purge never drops them.

---

## 3. Component variants & new primitives (`components/ui/`)

Existing primitives gained opt-in variants (default path unchanged):

- **Button** — gradient primary, press (`translateY`), brightness hover *(pre-existing)*.
- **Badge** — `critical` / `high` / `medium` ringed variants *(pre-existing)*.
- **ScoreRing** — `glow` prop *(pre-existing)*.
- **MetricCard** — status tints *(pre-existing)*.
- **Card** — `tint` (`primary`/`warning`/`success`/`error`/`muted`), `elevated`,
  `glow` props; `glow` layers on the surface shadow. Plus an `Eyebrow` export.

New components (ported from the design-system reference):

- **SportChip** — sport identity chip (inline `var()` accent, purge-safe). `sportAccentVar()` maps a `SportId` → `--sport-<id>`.
- **FixCard** — the one priority fix on the document surface with a confidence label. Max one per screen.
- **DrillCard** — drill prescription with a 44px done-toggle; `onPaper` switches to document ink.
- **ProgressTimeline** — retest score line; trend uses the active sport accent.
- **BeforeAfter** — colorblind-safe delta chip (shape + arrow + color).
- **TrustBadge** — small trust-signal chip (app-original).

Every variant/new component has Storybook stories.

---

## 4. The feature flag

`NEXT_PUBLIC_DESIGN_V2` gates every visual treatment. Resolution
(`src/lib/design-v2.ts`), highest precedence first:

1. Per-request cookie `sv_design_v2=1|0` — cohort testing + the staged rollout.
2. Build/runtime env `NEXT_PUBLIC_DESIGN_V2=1`.
3. Default **OFF**.

- **Client components:** `useDesignV2()` (`src/lib/design-v2-client.ts`) — SSR-safe
  (first render = env, identical server+client; upgrades to apply the cookie
  after mount).
- **Server components (esp. SEO pages):** call `designV2EnabledFromEnv()`
  directly — pure, no hook, keeps the component server-rendered (no client JS).
  The cookie override does not apply to these; that's intentional (SEO pages
  ramp per-deploy, not per-browser).

**Guardrail:** the honesty copy is locked. Confidence labels, "what this can't
know", and privacy/consent lines may move but never disappear — enforced by
`scripts/check-honesty-copy.mjs` (wired into `npm run ci`).

---

## 5. Flagged surfaces (what changes when ON)

| Surface | Treatment |
|---|---|
| `/diagnose` report | FixCard "report is paper" hero + first-move DrillCards + gradient retest CTA |
| Video upload | capture/drop zone reads as a light document sheet (sunlight-proof) |
| Dashboard | "one next action" glow banner (sole glow) + sport-accent session marker |
| Sport landing heroes | full `--sport-wash` + `--sport-pattern` identity (all sports + `[lang]` mirrors) |
| Homepage sport cards | per-sport wash/pattern identity |
| Learn articles | document-surface masthead (+ body, see component) |

---

## 6. QA gates

Run before landing any flagged change (all stay green with the flag OFF):

- `npm run ci` (type-check + naming + `check:honesty` + security)
- `npm test` (incl. `theme-contrast`, `sport-identity-tokens`, `design-v2`)
- `npm run seo:validate` (SEO + sitemap coverage) for marketing changes
- `npm run test:e2e:visual` — Playwright visual regression
  (`e2e/visual/redesign-visual.spec.ts`): 6 routes × {standard, dark-performance,
  coach-mode} × 375/1280. Baselines are generated once in the keyless build env
  via `npm run test:e2e:visual:update`, then committed.

---

## 7. Ramping to GA (Phase 8)

The redesign is feature-complete behind the flag. To ship it:

1. **Generate + commit visual baselines** with the flag ON, in the keyless build
   env (so the ON path is the regression reference).
2. **Cohort ramp** via the `sv_design_v2` cookie (or per-deploy
   `NEXT_PUBLIC_DESIGN_V2`): 10% → 50% → 100%, watching analytics events,
   Lighthouse (perf ≥ 85, LCP < 2.5s, CLS < 0.1), and error rates between steps.
3. **Clean up** — remove the `useDesignV2()` / `designV2EnabledFromEnv()`
   branches (the ON treatment becomes the only treatment), re-baseline the
   visual suite, tag `design-v2/ga`, and update this doc.

### Known follow-ups (deferred)

- Full-body document re-ink of the report (beyond the FixCard hero) and the Learn
  article body — large, contrast-sensitive; do with the visual baselines as a net.
- `@axe-core/playwright` route checks + Lighthouse CI (`@lhci/cli`) — both add
  dev-dependencies; install with owner sign-off.
