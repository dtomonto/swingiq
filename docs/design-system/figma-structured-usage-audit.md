# Figma-Structured Usage Audit — SwingVantage

_Audit date: 2026-06-13 · Scope: `apps/web` (Next.js 16 / React 19 / Tailwind v4 / shadcn-style primitives)_

This audit evaluates whether the SwingVantage codebase supports a **structured
Figma-to-code workflow** — centralized tokens, prop-driven reusable components,
theme safety, accessibility, and design-system handoff readiness — and lands the
highest-value, lowest-risk fixes. It is **not** a redesign; product direction and
visual intent are preserved.

---

## A. Executive summary

### Summary score: **Strong** (architecture) · _Functional but fragmented at the consumer edge_

SwingVantage has a genuinely **strong, above-market design-system foundation** —
materially better than most production apps:

- **Semantic, two-axis token system** in `src/app/globals.css`: `data-theme`
  (mood/surfaces/semantics) × `data-sport` (identity accent). Every theme
  redefines the _same_ semantic variables, so layout and components never change
  between themes — only the "emotional layer" does.
- **8 themes** (+ a flag-gated `coach-night`) and **7 sports**, every token pair
  **hand-tuned for WCAG AA** and **enforced** by `theme-contrast.test.ts`,
  `theme-safety.test.ts`, and `sport-identity-tokens.test.ts`.
- **Token → Figma pipeline already built**: `scripts/design-tokens/build-tokens.mjs`
  extracts DTCG/Tokens-Studio JSON from `globals.css` with a CI drift guard
  (`tokens:check`). **Figma Code Connect** mappings exist for 12 primitives,
  **Storybook + `addon-a11y`** is wired, **Playwright visual snapshots**
  (`e2e/visual`) exist, and `design-lab/` hosts in-app component previews.
- **Text-safe accent tokens** (`--link`, `--success-text`, `--warning-text`,
  `--error-text`, `--sport-accent-text`) solve the classic "fill color used as
  text fails AA" trap, and an **always-light `--surface-document`** keeps reports
  print-true on dark themes.

The system is **not** "needs a rebuild." The real gap is **consumer drift**: a
strong core that a meaningful minority of components and pages **bypass**, plus a
few handoff items that need Figma-side access to finish. Specifically:

1. **Token bypass in non-guarded components** — `text-white` appears in 87 files,
   `bg-black` in 36, `text-slate-*` in 19, `text-gray-*` in 15, plus ~109
   hardcoded hex values in component `.tsx`. The `theme-safety.test.ts` guard
   only strictly polices **6 shell files** + one app-wide _white-on-light_ shape,
   so the long tail (Motion-Lab viewers, video player, admin GrowthOS badges) is
   unguarded and **breaks contrast on the 7 non-default themes**.
2. **Section/markup duplication on ~50 marketing pages** — "How it works",
   metrics grid, FAQ `<dl>`, benefit cards, index grids, CTA bands, and the
   container wrapper are copy-pasted across sport landing pages instead of mapping
   to a handful of Figma-parity layout components.
3. **Figma handoff is 90% wired but unfinished** — 12 Code Connect mappings are
   scaffolded with `node-id=TODO-REPLACE` (needs a Figma Dev seat to publish).

**Bottom line:** the foundation is Strong; the work is **routing the stragglers
through the system that already exists**, not building a new one.

---

## B. Findings table

| # | Area | Severity | Issue | Why it matters | Code location | Figma / design-system implication | Recommended fix |
|---|------|----------|-------|----------------|---------------|-----------------------------------|-----------------|
| 1 | Tokens / theme safety | **High** | Motion-Lab viewers hardcode near-black canvases (`bg-[#060a12]`, `bg-[#0b1220]`) + `text-slate-*` + `border-white/10` | Renders as dark holes / invisible text on the 4 light themes; these are user-facing (sessions, drills, sport pages) | `components/motion-lab/Motion3DViewer.tsx`, `VideoOverlayLab.tsx`, `MotionAvatarViewer.tsx`, `MotionResultsDashboard.tsx`, `ImplementPathCard.tsx` | No "stage/viewer" surface token exists (the dark twin of `--surface-document`) | Add `--surface-stage` / `--surface-stage-foreground`; replace hex + slate with `bg-stage`/`text-stage-foreground` (spec in backlog) |
| 2 | Tokens / theme safety | **High** → _fixed_ | Admin GrowthOS badges used raw `text-green-400 / amber-400 / gray-400 …` | Admin renders in **Coach Mode (light)**; `gray-400` text on `gray-400/10` is near-invisible there | `lib/growth/labels.ts` | Honesty/priority/status badges should be a tokenized Figma "Badge/status" set | **Done** — mapped to `success-text / warning-text / error-text / link / accent-secondary / muted` |
| 3 | Tokens / utilities | **Medium** → _fixed_ | `scoreToColor()` returned raw `text-green-600 … text-red-600` | Shared score util; muddy/low-contrast on dark + club palettes | `lib/utils.ts` | Score color is a semantic state, not a raw hue | **Done** — collapsed to `success-text / warning-text / error-text` (mirrors `scoreToBgColor`) |
| 4 | Component system | **High** → _partially fixed_ | `Button` was `<button>`-only (no link support) so every "link styled as a button" CTA is hand-rolled | A Figma "Button" can't map to one code component; CTA markup duplicated across header, hero, CTA bands, footer | `components/ui/Button.tsx` + ~6 marketing files | One Figma Button ↔ one code component (button **or** link) | **Done** — refactored to `cva`, exported `buttonVariants`, added `asChild` (Radix Slot). Marketing-CTA migration remains backlog |
| 5 | Component system | **Medium** → _partially fixed_ | Trust-chip reassurance row inlined verbatim in 2 heroes | Drift risk; not a Figma component | `LocalizedHome.tsx`, `SportAnalysisHero.tsx` | Maps to a Figma "Trust Chips" component | **Done** — extracted `TrustChips`, migrated both sites |
| 6 | Layout architecture | **Medium** | Section scaffolding duplicated on sport landing pages: "How it works" (6×), metrics grid (3×), FAQ `<dl>` (6×), benefit cards (4×), index grid (3×), `max-w-… mx-auto px-4 py-14` container (~41×) | High maintenance cost; visual drift (py-14 vs 16 vs 20; some `h2` uppercase, some not) | `app/(marketing)/*-swing-analysis/page.tsx`, `tools`, `challenges`, `sample-report`, `LocalizedHowItWorks` | These are textbook Figma **layout components** (auto-layout frames) | Extract `Section`, `SectionHeading`, `HowItWorksGrid`, `MetricsGrid`, `FAQSection`, `BenefitGrid`, `IndexGrid` (backlog, Phase 2) |
| 7 | Component system | **Medium** | `Card` primitive exists but most cards are inline `<div className="rounded-theme border border-border bg-card p-6 shadow-theme">` (~26×) | Inconsistent padding/radius; bypasses the variant API (tint/elevated/glow) | `LocalizedHome.tsx` and most marketing pages | Card variants exist in code but aren't the default building block | Adopt `<Card>` in marketing surfaces; add `padding` variant |
| 8 | Tokens | **Medium** | ~109 hardcoded hex in component `.tsx` (excl. SVG data-URIs) | Opaque to the theme system | `motion-lab/*`, `demo/LiveKinematicPanel.tsx` (`#ff4d4d`), `admin/AdminShell.tsx` (logo gradient) | These should be tokens or documented fixed-context exceptions | Tokenize the recurring ones; annotate intentional brand marks |
| 9 | Component system | **Medium** | `Button` uses `rounded-lg` while `Card` uses `rounded-theme` | Buttons don't inherit a theme's radius personality | `components/ui/Button.tsx` | Figma needs a `radius/button` token | Add a `--button-radius` token (kept `rounded-lg` for now to avoid a global visual shift) |
| 10 | Accessibility | **Low** | `Button` uses `focus:ring-*` (fires on mouse) rather than `focus-visible:` | Slightly less premium; global `:focus-visible` already covers keyboard | `components/ui/Button.tsx` | Focus state should be a single Figma interaction state | Migrate ring to `focus-visible:` (low risk, deferred) |
| 11 | Theme safety (process) | **High** | The static guard strictly covers only 6 files; the long tail is unguarded | Regressions land outside the 6 files with no CI signal | `lib/theme/__tests__/theme-safety.test.ts` | A design system needs broad enforcement, not spot checks | **Partly done** — added `lib/growth/labels.ts` + `lib/utils.ts` to the guard; broaden incrementally + add an ESLint rule (backlog) |
| 12 | Figma handoff | **Medium** | 12 Code Connect mappings still carry `node-id=TODO-REPLACE` | Dev Mode can't show the real snippet until published | `components/ui/*.figma.tsx`, `CODE_CONNECT.md` | Blocks the "Dev Mode → code" half of the loop | Needs a Figma **Org/Enterprise Dev seat**; out of code scope — tracked |
| 13 | Tokens / dark-assumption | **Low/Medium** | Public `swinglab` + in-app `lab` pages hardcode `from-slate-950 … to-[#070b16]` | Likely intentional cinematic dark hero, but un-themeable | `app/(marketing)/swinglab/page.tsx`, `app/(app)/lab/page.tsx` | If intentional, formalize as a token; if not, theme it | Confirm intent; either add `--surface-stage` or annotate as deliberate art direction |
| 14 | Tokens | **N/A (correct as-is)** | Transactional email HTML hardcodes hex | **Not a bug** — email clients strip CSS variables; hardcoding is required | `lib/agents/dispatch/send-email.ts` | Email is a separate "channel theme" | Leave as-is; document as an intentional exception |
| 15 | Resilience | **Low** | `global-error.tsx` hardcodes hex | Defensible (renders when the themed tree may be broken), but locked to one mode | `app/global-error.tsx` | Error surface is theme-independent by design | Optional: `prefers-color-scheme` media query; low priority |

---

## C. Component inventory

### Existing reusable primitives (`components/ui/`) — strong, mostly Figma-mapped
`Button`, `Badge`, `Card` (+`CardHeader/Body/Title/Eyebrow`), `BeforeAfter`,
`DrillCard`, `EmptyState`, `FixCard`, `MetricCard`, `ProgressTimeline`,
`ScoreRing`, `SportChip`, `TrustBadge`, `LoadingSkeleton`, `ErrorRecoveryCard`,
`CookieBanner`, `PWAInstallBanner`, `UsageCategoryModal`, `FloatingCoach`.
→ **13 Storybook stories**, **12 Figma Code Connect mappings** already present.

### Shared marketing/layout components (good reuse already)
`MarketingHero`, `SportAnalysisHero`, `MarketingCTA`, `MarketingHeader`,
`PublicFooter`, `AppShell`, `Sidebar`, `FloatingDock`, `FeatureHighlights`,
`AudienceLanding`, **`TrustChips`** _(new, this audit)_.

### Duplicated patterns to convert into components (Phase 2)
| Pattern | Reuse | Proposed component |
|---|---|---|
| "How it works" numbered 3/4-col grid | 6× | `HowItWorksGrid` |
| FAQ `<dl>` list | 6× | `FAQSection` |
| Benefit cards (icon + title + desc) | 4× | `BenefitGrid` |
| Metrics 2-col card grid | 3× | `MetricsGrid` |
| Index list grid (tools/challenges) | 3× | `IndexGrid` |
| Section container `max-w-… mx-auto px-4 py-…` | ~41× | `Section` + `SectionHeading` |
| Inverse CTA band on `bg-primary` | 4×+ | adopt `MarketingCTA` everywhere |
| Marketing CTA link (rounded-xl, bold, arrow) | many | `CtaLink` (or `Button asChild` + a marketing size) |

### Missing components
`Section`/`Container`, `SectionHeading`, `FAQSection`, `HowItWorksGrid`,
`MetricsGrid`, `BenefitGrid`, `IndexGrid`, `CtaLink`, a tokenized media/viewer
**`Stage`** surface for Motion-Lab.

### Components needing variants
`Button` (add a marketing/`xl` size + `--button-radius`), `Card` (a `padding`
variant so inline `p-6` cards converge), `Badge` (a shared status-tone variant so
GrowthOS labels and `priorityToColor` use one source).

### Components needing accessibility states
`Button` (`focus-visible` instead of `focus`), Motion-Lab viewer controls
(visible focus on icon buttons), FAQ `<details>` (it's keyboard-OK; ensure a
visible focus ring on `<summary>`).

### Components needing theme-safe tokens
`Motion3DViewer`, `VideoOverlayLab`, `MotionAvatarViewer`, `MotionResultsDashboard`,
`SwingVideoPlayer`, `VideoRecorder` overlays, `AdminShell` logo, GrowthOS badges
(**fixed**), `LiveKinematicPanel` (`#ff4d4d`).

---

## D. Token audit

### What's centralized and excellent
- **Color**: full semantic set per theme (background/foreground/card/popover/
  primary/secondary/muted/accent/destructive/success/warning/error/border/input/
  ring/chart-1..5) + text-safe `link`/`*-text` + per-sport accents + component-
  surface vocabulary (nav/drawer/bottom-nav/card/modal/input/button/chip/status).
- **Radius**: `--card-radius` (`rounded-theme`). **Shadow**: `--shadow-card` /
  `--shadow-elevated` (`shadow-theme*`). **Motion**: themed keyframes + per-sport
  `--sport-duration`/`--sport-ease`, all reduced-motion-tamed. **Z-index**:
  `--z-floating-*` tokens. **Gradients/textures**: per-theme.

### Gaps / opportunities
| Token area | Gap | Recommendation |
|---|---|---|
| **Stage/viewer surface** | No always-dark media surface (the dark twin of `--surface-document`) | Add `--surface-stage` + `--surface-stage-foreground` (+ `--surface-stage-muted`) and `bg-stage`/`text-stage-foreground` utilities |
| **Button radius** | Buttons use `rounded-lg`, not a token | Add `--button-radius` (default `0.5rem`) → `rounded-button` |
| **Status "info" text** | `--link` doubles as info; no dedicated info-text | Optional `--info-text` for clarity (low priority) |
| **Spacing scale** | Section rhythm is ad-hoc (`py-14/16/20`) | Add semantic section-spacing tokens or a `Section` `size` prop |
| **Typography scale** | Heading sizes are inline (`text-3xl sm:text-4xl` repeated) | Encode an H1/H2/H3 scale in `SectionHeading` |
| **Hardcoded hex (~109)** | Mostly Motion-Lab + a few brand marks | Tokenize recurring ones; annotate intentional logotype/brand exceptions |
| **Raw neutral/rainbow** | `text-white` 87 files, `bg-black` 36, `text-slate-*` 19, `text-gray-*` 15 | Triage: legitimate fixed-context (scrims/overlays) vs theme-breaking; convert the latter |

---

## E. Figma-to-code architecture plan

- **Token architecture** — Keep `globals.css` as the single source of truth;
  `build-tokens.mjs` exports DTCG/Tokens-Studio JSON; `tokens:check` guards drift.
  Add `--surface-stage` + `--button-radius` and re-run `tokens:build`. In Figma,
  model each `theme/<id>` as a Tokens-Studio set, `sport/<id>` as identity sets.
- **Component architecture** — Primitives in `components/ui` (prop-driven, `cva`
  variants, `asChild` where an element can be a link). Composite layout components
  (`Section`, grids) wrap primitives. One Figma component ⇄ one code component,
  enforced by a `*.figma.tsx` mapping.
- **Layout primitives** — `Section` (max-width + responsive padding + optional
  `bg`), `SectionHeading` (eyebrow + H2 + subtitle, alignment variant), grid
  components for the repeated section shapes. Mobile-first stacking, no absolute
  hacks.
- **Naming conventions** — Variants/sizes mirror Figma property names exactly
  (`variant`, `size`, `tone`); token keys stay the bare CSS var name so JSON ⇄ CSS
  is 1:1 (already true).
- **Variant strategy** — Prefer a small set of orthogonal props (`variant` ×
  `size` × `tone`) over variant explosion. Status tones come from ONE map
  (`Badge`) reused by GrowthOS + `priorityToColor`.
- **Theme strategy** — All color flows through semantic tokens; **no** component
  reaches for a raw palette color. Enforce with the broadened `theme-safety` guard
  + an ESLint rule. Media/viewer chrome uses `--surface-stage`, reports use
  `--surface-document`.
- **Responsive strategy** — Tokens + `Section` own breakpoints; components stay
  fluid. iOS 16px-input + 44px tap-target safeguards already in `globals.css`.
- **Accessibility strategy** — `focus-visible` everywhere, AA enforced by
  `theme-contrast.test.ts`, reduced-motion + print already global; Storybook
  `addon-a11y` for component-level checks.
- **Visual QA strategy** — Playwright `e2e/visual` snapshots per theme; Storybook
  previews; `design-lab/` routes; a design QA checklist (below).

---

## Code changes completed (this audit)

All changes are additive or token-substituting; **default-theme visuals are
preserved**. Typecheck, lint, theme/marketing/growth Jest suites (636 tests), and
`tokens:check` all pass.

| File | Change | Risk |
|---|---|---|
| `src/lib/utils.ts` | `scoreToColor()` → `text-success-text / warning-text / error-text` (was raw `green/blue/yellow/orange/red-600`; fn had 0 call sites) | None |
| `src/lib/growth/labels.ts` | All honesty/priority/status/scale badges → semantic tokens (`success-text`, `warning-text`, `error-text`, `link`, `accent-secondary`, `muted`) | Admin-only color refresh; fixes Coach-Mode contrast |
| `src/components/ui/Button.tsx` | Refactored to `cva`; **exported `buttonVariants`**; added **`asChild`** via Radix Slot (already a dep). Default render is byte-identical | Low — variant→class map preserved verbatim |
| `src/components/ui/Button.stories.tsx` | Added an `AsLink` story (link-as-button) | None |
| `src/components/marketing/TrustChips.tsx` | **New** primitive (default chips + `align` prop); maps to a Figma "Trust Chips" component | None |
| `src/components/marketing/LocalizedHome.tsx` | Hero chip row → `<TrustChips />`; dropped now-unused icon imports | None (identical markup) |
| `src/components/marketing/SportAnalysisHero.tsx` | Centered chip row → `<TrustChips … align="center" />` | None (identical markup) |
| `src/lib/theme/__tests__/theme-safety.test.ts` | Added `lib/growth/labels.ts` + `lib/utils.ts` to the strict token-purity guard | None — locks in the fixes |

---

## Remaining backlog (prioritized)

### 🔴 Critical (theme-breaking, user-facing)
1. **`--surface-stage` token + Motion-Lab migration.** Add an always-dark media
   surface (the dark twin of `--surface-document`):
   ```css
   --surface-stage: 222 47% 5%;            /* ~#070b16 */
   --surface-stage-foreground: 210 20% 92%;
   --surface-stage-muted: 215 16% 65%;
   ```
   Map to `bg-stage` / `text-stage-foreground` in `@theme`, then replace
   `bg-[#060a12]`, `bg-[#0b1220]`, `border-white/10`, and `text-slate-*` in
   `Motion3DViewer`, `VideoOverlayLab`, `MotionAvatarViewer`,
   `MotionResultsDashboard`, `ImplementPathCard`. Update Playwright snapshots.
2. **`SwingVideoPlayer` / `VideoRecorder` controls** → `bg-stage` + token text;
   keep `bg-black/NN` scrims (those are intentional and AA-paired with white).

### 🟠 High (structure + enforcement)
3. **ESLint guard for raw colors** — a `no-restricted-syntax`/className rule that
   flags `text-gray-*`/`text-slate-*`/raw rainbow + bare hex in `.tsx`, with an
   allowlist for documented fixed-context. Pairs with the broadened jest guard.
4. **Broaden `theme-safety` `GUARDED_FILES`** to the cleaned components above as
   they're fixed, so regressions can't return.
5. **Marketing CTA + layout primitives** — `Section`, `SectionHeading`,
   `FAQSection`, `HowItWorksGrid`, `BenefitGrid`, `MetricsGrid`, `IndexGrid`,
   `CtaLink`; migrate the ~50 marketing pages. Highest DRY/Figma-parity payoff.

### 🟡 Medium
6. **Adopt `<Card>`** as the default surface in marketing (replace ~26 inline
   `bg-card` divs); add a `padding` variant.
7. **`--button-radius` token** + `rounded-button`; switch `Button` off `rounded-lg`.
8. **Unify status tones** — one `Badge` tone map reused by GrowthOS labels and
   `priorityToColor`.
9. **`AdminShell` logo gradient** + `LiveKinematicPanel` `#ff4d4d` → tokens.

### 🟢 Nice-to-have
10. **Finish Figma Code Connect** — replace `node-id=TODO-REPLACE` (needs a Figma
    Org/Enterprise Dev seat), then `figma:publish`.
11. `Button` `focus` → `focus-visible`.
12. `swinglab`/`lab` dark heroes → confirm intent; tokenize or annotate.
13. Storybook stories for `Section`, `FAQSection`, `TrustChips`, the grids.
14. `prefers-color-scheme` on `global-error.tsx`.

---

## QA checklist (design-system)

Run before landing a UI change:

- [ ] **Typecheck** — `npx tsc --noEmit` (apps/web)
- [ ] **Lint** — `npx eslint .`
- [ ] **Theme safety** — `jest src/lib/theme` (contrast + token-purity + sport identity)
- [ ] **Token drift** — `npm run tokens:check`
- [ ] **Component tests** — `jest <area> --runInBand --cacheDirectory ./.jest-cache-<area>`
- [ ] **Visual** — `npm run test:e2e:visual` (update snapshots intentionally only)
- [ ] **Storybook a11y** — `npm run storybook`, check the a11y panel
- [ ] **Cross-theme** — spot-check Standard, Dark Performance, Coach Mode (light
      admin), Heritage, Arcade in `design-lab/` or via `data-theme`
- [ ] **States** — empty / loading / error / disabled
- [ ] **Mobile** — 360–414px width; 44px tap targets; no iOS input zoom
- [ ] **No raw colors** — no new `text-gray-*` / `text-slate-*` / bare hex unless a
      documented fixed-context exception

---

## Implementation roadmap

- **Phase 1 — Audit-safe cleanup _(done this pass)_** — `scoreToColor` + GrowthOS
  badges tokenized; `Button` link-enabled; `TrustChips` extracted; guard broadened.
  No visual redesign.
- **Phase 2 — Component normalization** — `Section`/`SectionHeading` + the grid
  components; migrate marketing pages; adopt `<Card>`; `CtaLink`/marketing button
  size.
- **Phase 3 — Theme-safe design system** — `--surface-stage`; migrate Motion-Lab +
  video chrome; ESLint raw-color rule; broaden `GUARDED_FILES` app-wide.
- **Phase 4 — Figma parity layer** — finish Code Connect node-ids + publish;
  Storybook stories for new components; this doc + a design QA checklist (done).
- **Phase 5 — Production hardening** — per-theme Lighthouse/axe runs; expand
  Playwright visual snapshots across themes; cross-browser/mobile validation.

---

_Generated as part of the Figma-structured usage audit. Source of truth for tokens
remains `apps/web/src/app/globals.css`; see `docs/design-tokens.md` and
`apps/web/src/components/ui/CODE_CONNECT.md`._
