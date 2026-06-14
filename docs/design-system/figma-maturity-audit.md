# Figma Usage Audit & Design-System Maturity Plan — SwingVantage

_Audit date: 2026-06-14 · Scope: `apps/web` (Next.js 16 / React 19 / Tailwind v4 CSS-first / shadcn-style Radix primitives) · Author: design-systems review._

> **Companion to** [`figma-structured-usage-audit.md`](./figma-structured-usage-audit.md) (2026-06-13). That audit found and fixed the first wave of consumer drift; **this one re-verifies the system end-to-end, quantifies the remaining gaps with current numbers, and lays out the architecture, roadmap, and executable task list** to make Figma the operating system for product quality. It is **not** a redesign — product direction and visual intent are preserved.
>
> **Naming:** the product is **SwingVantage.com**. `SwingAdvantage` appears exactly **once** in the repo (`src/lib/signal-radar/config.ts`, a monitoring config — not branding); there is **no** legacy-alias leakage in the UI. The codebase/packages are named `swingiq`/`@swingiq/*`, and `SwingIQ` still appears in some admin/mock/data files — a code-vs-product naming inconsistency to keep out of UI and the Figma library (see §3.K).

---

## 1. Executive Summary

**Verdict: Partially mature, trending Mature.** Figma is **already wired as more than a visual reference** — there is a token→Figma pipeline, Figma Code Connect mappings, a Figma MCP server, Storybook + `addon-a11y`, Playwright visual snapshots, and an axe a11y gate. The token foundation is **above-market**. What stops it from functioning as a true design *operating system* today is that **the loop is built but not closed**, the **interaction-primitive layer is under-built**, and **governance covers a minority of surfaces**.

**Is Figma an operating system or just a reference?** → **It is a partially-connected operating system.** The "code → Figma" half (tokens, component mappings) is engineered; the "Figma → code" half is **unpublished/manual** (9 of 12 Code Connect node-ids are `TODO-REPLACE`, MCP needs a token, Tokens Studio import is a one-time manual step). So in practice it operates as a **strong reference with automation scaffolding**, not yet a live two-way source of truth.

**Biggest risks**
1. **Interaction-primitive gap (Critical).** `package.json` declares **9 Radix packages**, but only `@radix-ui/react-slot` is imported anywhere in `src` (confirmed: 0 imports of dialog/select/dropdown/tabs/tooltip/toast/progress/label/separator). Modals, selects, dropdowns, tabs, and tooltips are **hand-rolled** (`ConfirmDialog`, `UsageCategoryModal`, `LanguageToggle`, `HealthTabs`, …), and there is **no Input/Select/Checkbox/Radio/Toggle/FormField primitive** — **63 raw `<input>`** and **100 raw `<button>`** across the app. This is the largest accessibility and consistency liability, and it directly breaks one-Figma-component ⇄ one-code-component parity for forms and overlays.
2. **The Figma↔code loop is open (High).** Dev Mode can't show real snippets until Code Connect is published; token round-trip is manual; there is **no visual-regression gate in CI for most themes/routes** (snapshots cover only 3 themes × 3 routes × 2 viewports).
3. **Consumer drift in the long tail (High).** Current counts (first-hand, today): `text-white` in **87 files**, `bg-black` **35**, neutral palette (`slate/gray/zinc/neutral/stone`) **27**, raw rainbow colors **46**, raw hex in `.tsx` **38** — concentrated in `swinglab` (11), `motion-lab` (5), `video`, `agents`, `admin`. These bypass the theme system and break contrast on the 7 non-default themes (especially light **Coach Mode**, where admin renders).

**Biggest opportunities**
- **Adopt the Radix deps you already pay for** to ship accessible `Dialog/Select/Dropdown/Tabs/Tooltip/Toast/Input` primitives → instantly closes the form/overlay parity gap and removes hand-rolled ARIA risk.
- **Close the Figma loop**: publish Code Connect node-ids, add Chromatic (or expand Playwright) as a CI gate, and document the round-trip so designers' Figma changes flow to code predictably.
- **Tokenize the two real scale gaps**: a **type scale** (771 arbitrary `text-[Npx]`, mostly `text-[11px]`/`[10px]`) and **section-rhythm spacing** — the only token categories not yet systematized.

**Highest-leverage fixes (do these first)**
1. Build `Input/Select/Dialog/Tooltip/Tabs/Toast` on the installed Radix deps; migrate the highest-traffic forms/modals. _(Critical)_
2. Tokenize `ScoreRing`/`ProgressTimeline` grade colors and the type scale; broaden the theme-safety ESLint rule to `admin`/`video`/`swinglab`. _(High)_
3. Publish Figma Code Connect + add a CI visual-regression gate across all 9 themes for key routes. _(High)_

---

## 2. Current-State Assessment

| Dimension | Maturity | Evidence (confirmed) |
|---|---|---|
| **Design tokens** | **Mature** | `globals.css` (1,608 lines): two-axis `data-theme` (9) × `data-sport` (7), full semantic set per theme, semantic component-surface vocabulary derived from AA-tested base pairs, `document`/`stage` special surfaces, text-safe accents, z-index tokens. |
| **Theming** | **Mature** | 9 theme blocks, 8-tier resolution (`lib/theme-lab/resolve.ts`), `ThemeApplicator` sets `data-theme` + `.dark`; nested Coach-Mode admin re-binds `--color-*`. AA enforced by 3 Jest suites. |
| **Responsive / layout** | **Mature** | Mobile-first; `tap-target` (44px), 16px iOS input guard, `env(safe-area-inset-*)`, `viewportFit:'cover'`; 100% of spacing/radius on-scale; role-based nested layouts. No shared `<Container>` (intentional, per-section max-width). |
| **Accessibility (enforced)** | **Mature** | `:focus-visible` global default, reduced-motion + print global, axe gate (`e2e/a11y.spec.ts`), `eslint-plugin-jsx-a11y`, contrast tests. |
| **Accessibility (adoption)** | **Partial** | `Button` still uses `focus:ring` not `focus-visible`; `outline-none` in 64 files (some unpaired); **no skip-link**; hand-rolled modals/dropdowns ship custom ARIA instead of Radix. |
| **Components (tokens-level)** | **Mature** | `Button` (cva, 5×3 + loading + `asChild`), `Card` (tints/elevated/glow), `Badge` (8 tones), `EmptyState`/`ErrorRecoveryCard`/`LoadingSkeleton`. |
| **Components (interaction primitives)** | **Underdeveloped** | No `Input/Select/Checkbox/Radio/Toggle/FormField`; no `Dialog/Popover/Dropdown/Tabs/Tooltip/Toast` primitive; 9 Radix deps unused; 63 raw `<input>`, 100 raw `<button>`; `AlertCard`/`SectionCard` reinvent `Card`. |
| **Visual polish** | **Mature** | Per-theme art direction (gradients/shadows/glow/textures), themed motion, liquid-glass nav, glow data-viz. |
| **Figma documentation** | **Strong** | `docs/design-tokens.md`, `DESIGN_V2.md`, `figma-mcp-setup.md`, `connector-os/figma-mcp.md`, `design-system/README.md`, `CODE_CONNECT.md`, prior audit. |
| **Figma-to-code workflow** | **Partial** | Code Connect (3/12 published), MCP (needs token), Tokens Studio export + drift guard (`tokens:check`), `figma-tokens-sync.mjs`. Loop not closed. |
| **QA / governance** | **Partial** | Playwright a11y + visual (3 themes/3 routes), Storybook (opt-in, 20 stories, no admin/form), ESLint raw-color rule (scoped dirs), theme-safety Jest guard (limited files). No Chromatic. |

**Confirmed vs assumption:** everything above is confirmed from files. **Assumption (clearly marked):** the *contents* of the live Figma file cannot be inspected from code (MCP requires `FIGMA_ACCESS_TOKEN`), so claims about what exists *inside Figma* are inferred from `figma.config.json`, the `*.figma.tsx` mappings, and `swingvantage.tokens.json`.

---

## 3. Findings by Category

Each finding: **What works · What's weak · Why it matters · Improvement · Figma action · Code action · Priority · Complexity · Impact.**

### 3.A Design Tokens
- **Works:** Two-axis semantic system; every theme redefines the same vars (layout never changes); component-surface tokens (`--nav-*`, `--drawer-*`, `--bottom-nav-*`, `--card-*`, `--modal-*`, `--input-*`, `--button-*`, `--chip-*`, status) derive from AA-tested base pairs → **contrast-safe by construction**; `--surface-document` (always-light report) and `--surface-stage` (always-dark viewer); text-safe `--link`/`--*-text`/`--sport-accent-text`. Exported to Tokens-Studio JSON with a `tokens:check` drift gate.
- **Weak:** (1) **No base primitive ramp** — themes set semantic HSL directly; only `brand-50..950` and `golf-*` hex primitives exist. (2) **No type scale** — 771 arbitrary `text-[Npx]` (508× `text-[11px]`, 236× `text-[10px]`). (3) **No section-rhythm spacing tokens** (`py-12/14/16/20` ad-hoc). (4) Component-level hex in JS bypasses tokens (`ScoreRing`/`ProgressTimeline` `getScoreColor`, `AdminShell` gradient).
- **Why it matters:** Type/space are the only categories a designer can't change in one place; the JS hex spots are invisible to the theme system and the `tokens:check`/contrast gates.
- **Improvement:** Add a **base layer** (semantic-feeding color ramp + `--text-*` type scale + `--space-section-*`) without over-abstracting (the team's own rule: "one flat schema, not a labyrinth").
- **Figma action:** Model **Variables** in 3 collections — `primitive/*` (ramp, type, space), `semantic/*` (the existing names), `component/*`; bind type/space as number variables.
- **Code action:** Add `--text-xs..3xl`/`--leading-*` and `--space-section-*` to `@theme`; map `getScoreColor`→`success-text/warning-text/error-text`; extend `build-tokens.mjs` `THEME_IDS`/extraction to include type/space.
- **Priority:** High · **Complexity:** Medium · **Impact:** High (kills the last scale gaps; unlocks a clean Figma Variables model).

### 3.B Figma-to-Code Workflow
- **Works:** `figma.config.json` + 12 `*.figma.tsx` mappings; `.mcp.json` Figma MCP; `swingvantage.tokens.json` (2,031 lines) generated by `scripts/design-tokens/build-tokens.mjs` with `tokens:check`; `figma-tokens-sync.mjs` non-destructive drift check.
- **Weak:** **Loop not closed** — 9/12 Code Connect node-ids are `node-id=TODO-REPLACE` (needs a Figma Org/Enterprise Dev seat to publish); MCP needs `FIGMA_ACCESS_TOKEN`; Tokens Studio import is a manual one-time step; no automated "Figma changed → PR" path.
- **Why it matters:** Dev Mode can't surface real code; designers' token edits don't flow back predictably; the "source of truth" is asymmetric (code → Figma only).
- **Improvement:** Publish Code Connect; document + lightly automate the Figma→code reconciliation; gate token drift in CI.
- **Figma action:** Acquire a Dev seat; fill node-ids; import `swingvantage.tokens.json` into Tokens Studio and wire `$themes`.
- **Code action:** Run `figma:publish`; add `tokens:check` to the required CI checks; schedule `figma:tokens -- --check` as an advisory job.
- **Priority:** High · **Complexity:** Medium (Small in code; the Figma seat is the dependency) · **Impact:** High.

### 3.C Component System
- **Works:** `Button`/`Card`/`Badge`/`EmptyState`/`ErrorRecoveryCard`/`LoadingSkeleton`/`MetricCard`/`DrillCard`/`FixCard`/`SportChip`/`TrustBadge` are real, prop-driven, mostly Figma-mapped; `Button` uses cva + `asChild`.
- **Weak (Critical):** **No form primitives** (`Input/Select/Checkbox/Radio/Toggle/FormField`) → 63 raw `<input>`, validation/focus re-implemented per file. **No overlay primitives** (`Dialog/Popover/Dropdown/Tabs/Tooltip/Toast`) → hand-rolled modals (`ConfirmDialog`, `UsageCategoryModal`, `VideoModal`, …) and dropdowns (`LanguageToggle`) ship custom ARIA/keyboard. **9 Radix deps unused.** `AlertCard`/`SectionCard` reinvent `Card`; `Breadcrumbs` duplicated (admin + seo); 100 raw `<button>`.
- **Why it matters:** Accessibility regressions (focus trap, ESC, ARIA) are now per-component instead of inherited from Radix; one Figma "Input"/"Dialog" can't map to one code component; this is where premium polish and a11y most visibly slip.
- **Improvement:** Build the missing primitives **on the installed Radix deps**; migrate highest-traffic call-sites; fold `AlertCard`/`SectionCard` into `Card` variants.
- **Figma action:** Author `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `Dialog`, `Popover`, `DropdownMenu`, `Tabs`, `Tooltip`, `Toast` components with property names matching code (`variant`/`size`/`tone`/`state`).
- **Code action:** `components/ui/{Input,Select,Checkbox,RadioGroup,Switch,Dialog,Popover,DropdownMenu,Tabs,Tooltip,Toast,Field}.tsx` wrapping Radix; codemod raw `<input>`/modals; Storybook + `*.figma.tsx` for each.
- **Priority:** **Critical** · **Complexity:** Large · **Impact:** Very High.

### 3.D Layout & Responsive
- **Works:** Mobile-first; `tap-target` 44px; 16px input guard; safe-area; role-based nested layouts (`(marketing)`/`(auth)`/`(app)`/`admin`); 100% on-scale spacing; consistent `mx-auto max-w-*`.
- **Weak:** No shared `Section`/`Container` primitive in `ui` (the prior audit added marketing `Section`/`SectionHeading` but they're marketing-scoped); section vertical rhythm not tokenized; ultra-wide (`xl`/`2xl`) barely targeted.
- **Why it matters:** Section rhythm drifts (`py-12/14/16/20`); each page re-picks max-width.
- **Improvement:** Promote `Section`/`Container` to `ui` with a `size` prop bound to `--space-section-*`.
- **Figma action:** Auto-layout `Section`/`Container` frames with the same size tokens.
- **Code action:** Generalize the marketing `Section` into `ui/Section.tsx`; adopt in app/admin shells.
- **Priority:** Medium · **Complexity:** Medium · **Impact:** Medium.

### 3.E Theme System
- **Works:** 9 themes incl. flag-gated `coach-night` + seasonal `christmas-swing-lab`; sport identity isolated by regex test (`sport-identity-tokens.test.ts` forbids semantic-token leak); 8-tier resolution with explicit-user-choice protection; nested-theme admin re-bind; all pairs AA-tested.
- **Weak:** A few components bypass the system (`ScoreRing`/`ProgressTimeline` grade hex, `AdminShell` gradient hex, canvas viewers); the static **theme-safety guard covers only a subset of files**, so the long tail (admin/video/swinglab) regresses without a CI signal.
- **Why it matters:** On light Coach Mode (where admin renders) and the dark themes, bypassed colors fail contrast.
- **Improvement:** Tokenize the stragglers; broaden the ESLint raw-color rule + Jest guard to all consumer dirs.
- **Figma action:** Each `theme/<id>` = a Tokens Studio set wired in `$themes`; document the data-theme × data-sport composition.
- **Code action:** `getScoreColor`→tokens; `AdminShell` gradient→`--gradient-primary` (or annotate as logotype); extend `theme-safety.test.ts` `GUARDED_FILES` + ESLint `files` globs.
- **Priority:** High · **Complexity:** Medium · **Impact:** High.

### 3.F Accessibility & UX Quality
- **Works:** Global `:focus-visible`, reduced-motion, print; axe CI gate on 6 public pages (blocks serious/critical); `jsx-a11y` recommended set; 1,106 `aria-*`/`role`, 579 landmark elements, 186 `htmlFor` bindings; 44px targets; AA contrast enforced across all themes.
- **Weak:** `Button` uses `focus:ring` (fires on mouse); `outline-none` in 64 files (some unpaired with a visible focus style); **no skip-to-content link**; only 13 `alt`/`next/image` (app is video-heavy — lower risk, but marketing/blog images need auditing); `prefers-reduced-motion`/`motion-reduce` in only ~9 files (relies mostly on the global rule); 7 `jsx-a11y` rules downgraded to `warn`.
- **Why it matters:** Hand-rolled overlays + unpaired `outline-none` are the most likely real keyboard/SR failures; a skip-link is a quick WCAG 2.4.1 win.
- **Improvement:** Adopt Radix primitives (inherits focus management); migrate `Button` to `focus-visible`; add a skip-link; audit `outline-none`.
- **Figma action:** Model focus/hover/disabled/error as explicit interaction states on every interactive component; add an a11y annotation layer.
- **Code action:** `Button` `focus:`→`focus-visible:`; add `SkipLink` in `app/layout.tsx`; lint rule to flag `outline-none` without a `focus-visible` sibling; promote the 7 `warn` rules to `error` after cleanup.
- **Priority:** High · **Complexity:** Medium · **Impact:** High.

### 3.G Premium Product Polish
- **Works:** Per-theme art direction, glow data-viz (`ScoreRing glow`), liquid-glass nav, themed motion, document/stage surfaces — genuinely premium and differentiated per sport.
- **Weak:** Polish is uneven where primitives are missing (forms look generic; hand-rolled modals lack the spring/scale motion Radix+tokens would give); data-viz is thin (one `DispersionChart`); admin uses 771 micro `text-[11px]` labels (dense, not always premium).
- **Why it matters:** Forms and overlays are high-trust conversion surfaces (signup, upload, paywall) — generic inputs undercut the "premium AI platform" promise.
- **Improvement:** Premium primitives + a small data-viz kit + a tokenized type scale lift the weakest surfaces without a redesign.
- **Figma action:** Define the form/overlay components and a chart spec (axis, series = sport viz tokens, empty/loading).
- **Code action:** Build primitives (3.C); add `ui/Chart*` wrappers using `--sport-viz-*`/`--chart-*`.
- **Priority:** Medium · **Complexity:** Medium · **Impact:** High (trust/conversion).

### 3.H Figma Documentation
- **Works:** Unusually strong for an app this stage — token interchange, MCP setup, Code Connect, design-system README, DESIGN_V2, two audits.
- **Weak:** Docs describe the *pipeline* but there's no single **"Figma library map"** (which page holds what), no **component-state matrix**, no **release/handoff checklist tied to Figma**, no **UX-writing standard**.
- **Improvement:** Add the missing governance docs (see §5/§8).
- **Figma action:** Create the 00–11 page structure (§5) and a README frame on page 00.
- **Code action:** Link each `*.figma.tsx` to its Figma page; keep `CODE_CONNECT.md` as the index.
- **Priority:** Medium · **Complexity:** Small · **Impact:** Medium.

### 3.I QA / Governance
- **Works:** axe gate, Playwright visual snapshots, ESLint raw-color rule, theme-safety + contrast + sport-identity Jest suites, `tokens:check`.
- **Weak:** Visual snapshots cover **3 themes × 3 routes × 2 viewports** (6 themes, most routes uncovered); Storybook is **opt-in** (not in CI) with **0 admin/form stories**; **no Chromatic**; theme-safety guard covers a subset of files; `tokens:check` not confirmed in the required CI set.
- **Why it matters:** Regressions outside the snapshotted routes/themes land with no signal — exactly where the drift lives.
- **Improvement:** Expand visual coverage to all 9 themes for key routes; make Storybook build a CI step; add Chromatic or Playwright-Storybook; require `tokens:check`.
- **Figma action:** A QA/Handoff page (§5, page 11) with a per-release checklist and the approved-screens baseline.
- **Code action:** Parametrize `e2e/visual` over all 9 themes; add `build-storybook` to CI; add Chromatic workflow (token-gated, non-blocking until funded).
- **Priority:** High · **Complexity:** Medium · **Impact:** High.

### 3.J Component Duplication (specific)
- `AlertCard`/`SectionCard` (admin) reinvent `Card`; ~26–131 inline `rounded-* border bg-card` card divs; `Breadcrumbs` duplicated; modal pattern duplicated 4+ times. **Improvement:** consolidate into `Card` variants + one `Dialog`. **Priority:** Medium · **Complexity:** Medium · **Impact:** Medium.

### 3.K Naming Consistency (prompt-requested)
- **Confirmed:** `SwingAdvantage` → 1 non-UI reference; **no alias leakage**. Product name is consistently SwingVantage in UI. **But** repo/packages are `swingiq`/`@swingiq/*` and `SwingIQ` appears in admin/mock/data files (`data/devUpdates.ts`, `lib/growth/mock-data.ts`, admin growth pages). **Improvement:** confirm none render publicly; keep the Figma library named SwingVantage; optionally codemod internal `SwingIQ`→`SwingVantage` strings. **Priority:** Low · **Complexity:** Small · **Impact:** Low (brand hygiene).

---

## 4. Design-System Gap Analysis Table

| Area | Current Gap | Business Impact | UX Impact | Technical Impact | Recommended Action | Priority |
|---|---|---|---|---|---|---|
| **Form primitives** | No `Input/Select/Checkbox/Radio/Toggle/Field`; 63 raw `<input>` | Lower conversion on signup/upload/paywall; trust hit | Inconsistent fields, error UX, focus | Validation/ARIA re-done per file; no Figma parity | Build on installed Radix; codemod call-sites | **Critical** |
| **Overlay primitives** | No `Dialog/Popover/Dropdown/Tabs/Tooltip/Toast`; 9 Radix deps unused | Support load from broken modals; a11y/legal risk | Keyboard traps, ESC/focus bugs | Hand-rolled ARIA fragility | Wrap Radix; replace `ConfirmDialog`/`LanguageToggle`/`HealthTabs` | **Critical** |
| **Figma loop closure** | 9/12 Code Connect unpublished; MCP token; manual token round-trip | Slow handoff; designer/dev drift | Spec ≠ shipped over time | Dev Mode shows no code | Dev seat + `figma:publish`; require `tokens:check`; Tokens Studio import | **High** |
| **Type scale** | 771 arbitrary `text-[Npx]` | — | Inconsistent text rhythm | No central type control | Add `--text-*`/`--leading-*`; lint arbitrary text | **High** |
| **Consumer color drift** | `text-white` 87, `bg-black` 35, neutral 27, rainbow 46, hex 38 | — | Contrast breaks on 7 themes (esp. Coach Mode admin) | Unguarded long tail | Broaden ESLint + Jest guard to admin/video/swinglab; tokenize | **High** |
| **Grade-band hex** | `ScoreRing`/`ProgressTimeline` `getScoreColor` hardcoded hex | — | Off-theme score colors on dark/club themes | Bypasses existing `*-text` tokens | Map to `success/warning/error-text` | **High** |
| **Visual-regression coverage** | 3 themes × 3 routes only; no Chromatic | Regressions reach prod | Silent visual breaks | No CI signal off-path | Parametrize over 9 themes; add Chromatic | **High** |
| **Focus/keyboard a11y** | `Button` `focus:ring`; `outline-none` ×64; no skip-link | Legal/ADA exposure | Keyboard users lose focus cues | Per-component a11y | `focus-visible`; SkipLink; lint `outline-none` | **High** |
| **Storybook coverage** | Opt-in; 20 stories; 0 admin/form | Slower onboarding/handoff | — | No component workbench in CI | `build-storybook` in CI; add admin/form/primitive stories | **Medium** |
| **Section/layout primitive** | No `ui/Section`/`Container`; rhythm not tokenized | — | Inconsistent spacing | Repeated max-width/padding | Promote `Section` to `ui`; `--space-section-*` | **Medium** |
| **Card duplication** | `AlertCard`/`SectionCard` reinvent `Card`; inline card divs | — | Inconsistent padding/elevation | Maintenance cost | Fold into `Card` variants | **Medium** |
| **Docs/governance** | No library map, state matrix, handoff checklist, UX-writing std | — | — | Drift risk over time | Add governance docs + 00–11 Figma pages | **Medium** |
| **Naming** | `swingiq`/`SwingIQ` internal vs SwingVantage product | Minor brand hygiene | — | Cosmetic | Keep out of UI/Figma; optional codemod | **Low** |

---

## 5. Recommended Figma Architecture

Single library file, pages **00–11**. (Assumption: a comparable structure may already exist in the live file; this is the target to reconcile against.)

| Page | Purpose | Required contents | Supports engineering | Supports QA | Prevents drift |
|---|---|---|---|---|---|
| **00 Cover / Product Principles** | One-glance north star | "One fix. One plan. One retest.", brand voice, the 6/7 sports, design tenets, library README + changelog | Onboarding context | Review rubric | Shared intent |
| **01 Foundations** | Raw visual language | Color ramps, type scale (matches `--text-*`), spacing/radius/shadow/elevation, motion (durations/eases = `--sport-duration/ease`), z-index | Mirrors `@theme` primitives | Spot-check scale adherence | One source for scales |
| **02 Tokens** | Variables source of truth | `primitive/*`, `semantic/*` (the `globals.css` names), `component/*`, `theme/<id>` sets, `sport/<id>` sets, `$themes` wiring (import `swingvantage.tokens.json`) | 1:1 with CSS var names | Token-diff vs `tokens:check` | Kills hardcoding |
| **03 Components** | The library | Every `ui` primitive + the new `Input/Select/Dialog/Tabs/Tooltip/Toast`, with `variant`/`size`/`tone`/`state` props matching cva | Code Connect targets | State matrix to test | One component ⇄ one code component |
| **04 Patterns** | Composed blocks | `Section`/`SectionHeading`, grids, FAQ, CTA bands, trust chips, forms, empty/loading/error | Layout primitives | Pattern parity | Stops section copy-paste |
| **05 Public Website** | Marketing surfaces | Home, sport landings, pricing, sample report, trust | Page handoff | Visual baseline | Cross-sport consistency |
| **06 App Dashboard** | Authenticated app | Dashboard, Today, profile, skill tree, upload, sport selector | App handoff | Density review | App ≡ marketing language |
| **07 Reports** | The deliverable | Report (`--surface-document`), fix/drill cards, before/after, score ring, timeline | Report parity | Print/light review | Report stays print-true |
| **08 Admin** | Internal OS | Coach-Mode shell, data table, decision cards, controls, badges | Admin handoff | Coach-Mode contrast | Admin uses tokens |
| **09 Themes** | Theme matrix | Each component × 9 themes; data-theme × data-sport grid; seasonal | Theme QA reference | Per-theme contrast | Theme parity |
| **10 Mobile** | Touch surfaces | Bottom nav, drawer, liquid-glass, safe-area, 44px targets, PWA | Mobile handoff | Touch/safe-area review | Mobile-first parity |
| **11 QA / Handoff** | Governance | Per-release checklist, a11y annotations, approved-screen baselines, Dev-Mode notes | Release gate | The QA workflow (§8) | Prevents ship-without-review |

---

## 6. Recommended Token System

Build **on what exists** (semantic/component/theme/sport/state are already strong). Add the missing **base** layer and **type/space** scales. Keep it flat — the team's own rule.

```
1. BASE (primitive)        — raw, theme-independent
   color.brand.50..950, color.golf.*            (exists)
   color.neutral.50..950                         (ADD: feed semantic neutrals)
   text.size.xs..3xl, text.leading.tight..loose  (ADD: type scale)
   space.1..24, space.section.sm|md|lg            (ADD: section rhythm)
   radius.sm..3xl, radius.button, radius.card     (exists via --*-radius)
   shadow.card, shadow.elevated                   (exists)
   z.floating-dock|panel|nudge                    (exists)

2. SEMANTIC                 — role-based, theme-swappable  (EXISTS, keep names)
   background, foreground, card, popover, primary, secondary, muted,
   accent, accent-secondary, border, input, ring, chart-1..5,
   link, link-hover, success|warning|error(+ -foreground, + -text),
   surface-document(+fg/+accent), surface-stage(+panel/+fg/+muted)

3. COMPONENT               — derived from semantic  (EXISTS, keep)
   nav-*, drawer-*, bottom-nav-*, card-*, modal-*, popover-*, tooltip-*,
   toast-*, table-*, input-*, button-*, chip-*
   ADD: input.border.focus, button.radius (alias), field.error.border

4. THEME                   — one set enabled at a time  (EXISTS: 9)
   theme/standard | dark-performance | coach-mode | coach-night |
   heritage-club | field-court | arcade-practice | bird-print |
   christmas-swing-lab

5. SPORT                   — identity overlay  (EXISTS: 7)
   sport/golf | tennis | baseball | softball_slow | softball_fast |
   pickleball | padel  → sport-accent(+fg/+text), sport-secondary,
   sport-wash, sport-pattern, sport-viz-1..3, sport-duration/ease

6. STATE                   — interaction  (PARTIAL — formalize per component)
   default | hover | active | focus(-visible) | disabled | loading |
   selected | error | success | warning | info
```

**Naming convention:** bare CSS var name = Tokens Studio key (already 1:1). Component tokens read `area-role-state` (`input-border-focus`, `button-disabled-bg`). Figma variable path mirrors the layer (`semantic/primary`, `component/input.border.focus`, `theme/dark-performance/card`).

**Mapping**
| Layer | Figma Variables | Tokens Studio | CSS vars | Tailwind v4 | shadcn/ui | React |
|---|---|---|---|---|---|---|
| Base | `primitive/*` collection | `primitives` set | `@theme` `--color-*`, `--text-*`, `--space-*` | utilities | — | — |
| Semantic | `semantic/*` | `theme/<id>` sets | `[data-theme]` `--*` | `bg-primary` etc. | tokens | tokens |
| Component | `component/*` | derived | `:root` `--nav-*` … | `bg-nav` etc. | primitive internals | cva classes |
| Theme | mode/`$themes` | `$themes` | `[data-theme=…]` | `data-theme` | — | `ThemeApplicator` |
| Sport | `sport/*` | `sport/<id>` | `[data-sport=…]` | `bg-sport-accent` | — | `SportContext` |
| State | component states | — | utilities | `focus-visible:` etc. | variant props | cva variants |

---

## 7. Recommended Component Library

(★ = exists · ➕ = build · ⟳ = consolidate)

- **Foundation:** ★`Button` (add `xl` marketing size; `focus-visible`) · ★`Card` (⟳ absorb `AlertCard`/`SectionCard`; add `padding` variant) · ★`Badge` (one shared tone map) · ➕`Input` · ➕`Textarea` · ➕`Select` · ➕`Checkbox` · ➕`RadioGroup` · ➕`Switch` · ➕`Field/FormField` (label+error+hint) · ➕`Tabs` · ➕`Tooltip` · ➕`Dialog` · ➕`Popover` · ➕`DropdownMenu` · ➕`Toast` · ➕`Accordion` · ➕`SkipLink` · ⟳`Breadcrumbs` (one). _Variants/states:_ `variant`/`size`/`tone` × `default/hover/active/focus-visible/disabled/loading/error`.
- **Marketing:** ★`MarketingHero`/`SportAnalysisHero` · ★`MarketingCTA`/`CtaLink` · ★`TrustChips`/`TrustBadge` · ★`Section`/`SectionHeading`/`FAQSection`/`HowItWorksGrid`/`MetricsGrid`/`BenefitGrid`/`IndexGrid` · ➕`Testimonials` · ➕`PricingTable`. _States:_ responsive stack, with/without media.
- **App:** ★`AppShell`/`Sidebar`/`FloatingDock` · ★`SportSelector`/`SportShell`/`SportChip` · ★dashboard panels · ➕`ui/Section`/`Container` · ➕`UploadDropzone` (states: idle/drag/uploading/error/success) · ➕`SkillTreeNode`.
- **Report:** ★`FixCard`/`DrillCard`/`BeforeAfter`/`ScoreRing`(⟳ tokens)/`ProgressTimeline`(⟳ tokens)/`ShareableReportCard`. _States:_ paper/theme, confidence levels, print.
- **Dashboard:** ★`MetricCard`/`PriorityPanel`/`DashboardPlayerCard`/`RetestNudge` · ➕`StatTile`. _States:_ good/warning/danger/neutral, trend up/down, empty.
- **Admin:** ★`DataTable`/`DecisionCard`/`ConfirmDialog`(⟳→`Dialog`)/`StatusBadge`/`AdminShell`. _States:_ loading/empty/error/`NotConnected`.
- **Sport-specific:** sport heroes/landings/chips/data series driven by `sport/*` tokens (no per-sport components — one set, token-swapped).
- **Data-viz:** ★`DispersionChart` · ➕`Chart` primitives (line/bar/radar) using `--chart-*`/`--sport-viz-*`; axis/grid/tooltip/empty/loading states.
- **Feedback/state:** ★`EmptyState`/`ErrorRecoveryCard`/`LoadingSkeleton`(+`Skeleton`/`CardSkeleton`) · ➕`Toast`/`InlineAlert`.

---

## 8. Figma-to-Code Workflow

1. **Design in Figma** — compose from page 03/04 components bound to page 02 Variables; no detached styles.
2. **Token validation** — values come from Variables only; run Tokens Studio export; `npm run tokens:check` must be clean.
3. **Component review** — every new component has `variant/size/tone/state` props matching cva; one Figma component ⇄ one `*.figma.tsx`.
4. **Responsive review** — verify mobile/tablet/desktop + 44px targets + safe-area on page 10.
5. **Accessibility review** — focus/hover/disabled/error states present; contrast AA; a11y annotations on page 11.
6. **Code implementation** — build/extend `components/ui`; reuse tokens; never hardcode; Radix under the hood.
7. **Storybook review** — story per variant/state; `addon-a11y` panel clean; `build-storybook` green in CI.
8. **Visual regression** — Chromatic (or Playwright `e2e/visual`) across all 9 themes for changed surfaces.
9. **QA against Figma** — Dev Mode diff (post-publish) of shipped vs approved; checklist on page 11.
10. **Production release** — required CI green (type-check, lint incl. raw-color rule, Jest theme suites, `tokens:check`, axe, visual).

**Governance rules**
- **New component:** Figma component + Variables + `*.figma.tsx` + Storybook story + a11y states **before** broad adoption.
- **New theme:** add `[data-theme]` block → `tokens:build` → `theme-contrast.test.ts` must pass → add to visual matrix + `THEME_IDS`.
- **New sport:** one `[data-sport]` block → `sport-identity-tokens.test.ts` (no semantic leak) → add to `SPORT_IDS`.
- **Dashboard/report change:** baseline-aware (these are snapshot-covered); update baselines intentionally.
- **Mobile change:** verify safe-area + 44px + bottom-nav/drawer tokens.
- **Admin change:** must pass under **Coach Mode (light)**; no raw palette colors (ESLint).

---

## 9. Prioritized Roadmap

**Phase 1 — Stabilize the system (foundation hardening)**
- _Objective:_ remove the last token gaps and contain drift before scaling.
- _Tasks:_ add `--text-*`/`--leading-*` + `--space-section-*`; tokenize `getScoreColor` (ScoreRing/ProgressTimeline) + `AdminShell` gradient; broaden ESLint raw-color rule + `theme-safety` guard to `admin`/`video`/`swinglab`; `Button` `focus-visible`; add `SkipLink`; require `tokens:check` in CI.
- _Owners:_ FE + design-systems. _Complexity:_ Medium. _Impact:_ High. _Deps:_ none. _Order:_ first.

**Phase 2 — Standardize core components (the critical gap)**
- _Objective:_ close the interaction-primitive hole.
- _Tasks:_ build `Input/Textarea/Select/Checkbox/RadioGroup/Switch/Field` + `Dialog/Popover/DropdownMenu/Tabs/Tooltip/Toast/Accordion` on installed Radix; migrate top forms (auth, upload, recruiting) + modals (`ConfirmDialog`→`Dialog`, `LanguageToggle`→`DropdownMenu`, `HealthTabs`→`Tabs`); fold `AlertCard`/`SectionCard` into `Card`; unify `Breadcrumbs`; Storybook + `*.figma.tsx` for each.
- _Owners:_ FE (lead), design (Figma authoring), a11y review. _Complexity:_ Large. _Impact:_ Very High. _Deps:_ Phase 1 tokens. _Order:_ second (highest ROI).

**Phase 3 — Premium polish**
- _Objective:_ lift the weakest high-trust surfaces.
- _Tasks:_ premium form/overlay motion (tokens); `ui/Section`/`Container`; `Chart` primitives (`--chart-*`/`--sport-viz-*`); empty/loading/error parity on dashboard/today/profile/upload; AI-credibility cues (confidence, data-source labels) as components.
- _Owners:_ FE + design. _Complexity:_ Medium. _Impact:_ High. _Deps:_ Phase 2. _Order:_ third.

**Phase 4 — Scale Figma across product areas**
- _Objective:_ full parity across admin, reports, sports, mobile, seasonal.
- _Tasks:_ author pages 05–10; per-sport landing parity; mobile system (bottom nav/drawer/liquid-glass/PWA) in Figma; seasonal theme workflow; finish all `*.figma.tsx` node-ids.
- _Owners:_ design (lead) + FE. _Complexity:_ Large. _Impact:_ High. _Deps:_ Phases 2–3 + **Figma Dev seat**. _Order:_ fourth.

**Phase 5 — Governance & QA**
- _Objective:_ make quality automatic.
- _Tasks:_ governance docs + page 11 checklist; `build-storybook` in CI + admin/form stories; Chromatic (or expand Playwright to 9 themes); promote 7 `jsx-a11y` warns to errors; per-theme Lighthouse/axe; design-review gate on PRs touching `components/ui`.
- _Owners:_ design-systems + platform. _Complexity:_ Medium. _Impact:_ High (compounding). _Deps:_ Phases 1–4. _Order:_ last, but start Storybook-in-CI early.

---

## 10. Specific Codebase Tasks for Claude Code

Format: **Task · Files/areas · Change · Acceptance · Priority · Complexity · Risk.**

1. **Build form primitives on Radix**
   - Files: `components/ui/{Input,Textarea,Select,Checkbox,RadioGroup,Switch,Field}.tsx`; deps `@radix-ui/react-{select,label}` (installed).
   - Change: cva-styled wrappers using `--input-*` tokens; `Field` composes label/hint/error with `htmlFor`/`aria-describedby`.
   - Acceptance: Storybook story per variant/state; `addon-a11y` clean; replaces ≥1 real form (e.g. `LoginForm`) with no visual change on default theme; `*.figma.tsx` added.
   - Priority: Critical · Complexity: Large · Risk: Medium (broad call-sites — migrate incrementally).

2. **Build overlay primitives on Radix**
   - Files: `components/ui/{Dialog,Popover,DropdownMenu,Tabs,Tooltip,Toast,Accordion}.tsx`; deps `@radix-ui/react-{dialog,dropdown-menu,tabs,tooltip,toast}` (installed).
   - Change: wrap Radix with `--modal-*`/`--popover-*`/`--tooltip-*`/`--toast-*` tokens + themed motion; migrate `ConfirmDialog`→`Dialog`, `LanguageToggle`→`DropdownMenu`, `HealthTabs`→`Tabs`.
   - Acceptance: keyboard (ESC/focus-trap/arrow) verified; axe clean; default-theme visuals unchanged; stories + `*.figma.tsx`.
   - Priority: Critical · Complexity: Large · Risk: Medium.

3. **Tokenize grade-band colors**
   - Files: `components/ui/ScoreRing.tsx`, `components/ui/ProgressTimeline.tsx`.
   - Change: replace `getScoreColor` hex with `hsl(var(--success-text|--warning-text|--error-text))` (mirror `lib/utils.ts scoreToColor`).
   - Acceptance: renders correctly across 9 themes (visual snapshot); `theme-contrast`/`theme-safety` green.
   - Priority: High · Complexity: Small · Risk: Low (note: snapshot-covered routes → update baselines intentionally).

4. **Add type & section-spacing tokens**
   - Files: `app/globals.css` (`@theme`), `scripts/design-tokens/build-tokens.mjs`.
   - Change: `--text-xs..3xl`, `--leading-*`, `--space-section-sm|md|lg`; export in token JSON.
   - Acceptance: `tokens:check` green; a lint/grep shows no *new* `text-[Npx]`; docs updated.
   - Priority: High · Complexity: Medium · Risk: Low.

5. **Broaden theme-safety enforcement**
   - Files: `eslint.config.mjs` (raw-color `files` globs), `src/lib/theme/__tests__/theme-safety.test.ts` (`GUARDED_FILES`).
   - Change: extend to `components/admin`, `components/video`, `components/swinglab`; allow-list documented fixed-context scrims.
   - Acceptance: `eslint .` + `jest src/lib/theme` green after migrating offenders; current counts (`text-white` 87 etc.) trend down.
   - Priority: High · Complexity: Medium · Risk: Medium (will surface real violations — fix or allow-list).

6. **Accessibility: focus-visible + skip-link + outline-none audit**
   - Files: `components/ui/Button.tsx`, `app/layout.tsx`, new `components/ui/SkipLink.tsx`, `eslint.config.mjs`.
   - Change: `focus:`→`focus-visible:` in Button; add `SkipLink` to main; lint flagging `outline-none` without a `focus-visible` sibling.
   - Acceptance: keyboard focus visible app-wide; axe "bypass blocks" satisfied; lint passes.
   - Priority: High · Complexity: Medium · Risk: Low.

7. **Promote `Section`/`Container` to `ui` + consolidate cards**
   - Files: `components/ui/Section.tsx`, `components/ui/Container.tsx`; `components/admin/{AlertCard,SectionCard}.tsx`→`Card` variants.
   - Change: generalize marketing `Section`; add `Card` `padding` variant; replace admin reinventions.
   - Acceptance: no visual change (snapshots); fewer inline card divs.
   - Priority: Medium · Complexity: Medium · Risk: Low.

8. **Expand visual regression + Storybook in CI**
   - Files: `e2e/visual/redesign-visual.spec.ts`, `.github/workflows/*`, `apps/web/package.json`.
   - Change: parametrize snapshots over all 9 `THEME_IDS` for home/pricing/diagnose/dashboard; add `build-storybook` CI step; (optional) Chromatic token-gated.
   - Acceptance: CI runs visual across 9 themes; Storybook builds in CI; new baselines committed intentionally.
   - Priority: High · Complexity: Medium · Risk: Low.

9. **Close the Figma loop**
   - Files: `components/ui/*.figma.tsx`, `CODE_CONNECT.md`, CI config for `tokens:check`.
   - Change: fill node-ids + `figma:publish` (needs Dev seat); add `tokens:check` to required checks; document Tokens Studio import.
   - Acceptance: `figma connect parse` clean; `tokens:check` required; Dev Mode shows snippets.
   - Priority: High · Complexity: Medium (Small in code) · Risk: Low. _Dependency: Figma Org/Enterprise Dev seat._

10. **Naming hygiene (optional)**
   - Files: `data/devUpdates.ts`, `lib/growth/mock-data.ts`, admin growth pages.
   - Change: confirm no public render of `SwingIQ`; optional codemod internal strings → SwingVantage.
   - Acceptance: no `SwingIQ` in user-facing output; tests green.
   - Priority: Low · Complexity: Small · Risk: Low.

---

## 11. Final Recommendation

SwingVantage does **not** need a redesign or a new design system — it has a genuinely strong one. The single highest-leverage move is to **stop hand-rolling forms and overlays and adopt the 9 Radix dependencies already in `package.json`** behind a proper `ui` primitive set. That one initiative closes the biggest accessibility, consistency, and Figma-parity gap at once, and it's the prerequisite for Dev-Mode-accurate handoff.

In parallel, **close the Figma loop** (publish Code Connect, require `tokens:check`, expand visual regression to all 9 themes) so the pipeline that's been built actually runs two-way, and **tokenize the last two scales** (type, section spacing) plus the stray grade-band/admin hex so 100% of the visual language is theme-controlled.

Do those three things and Figma stops being an impressive-but-asymmetric reference and becomes the **operating system** for SwingVantage's quality: every component designed once, tokenized once, tested once, and shipped with provable contrast across 9 themes and 7 sports. The foundation is already here — this is about **closing the loop and finishing the primitive layer**, not starting over.

---

_Token source of truth remains `apps/web/src/app/globals.css`. See `docs/design-tokens.md`, `docs/design-system/figma-structured-usage-audit.md`, and `apps/web/src/components/ui/CODE_CONNECT.md`._
