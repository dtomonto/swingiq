# PostHog Implementation Audit — SwingVantage

_Audit date: 2026-06-12. Method: full working-tree inspection. No tracking code was
added as part of the audit itself — findings are evidence-based only._

## A. Executive Summary

**PostHog maturity score: 38 / 100**

**Diagnosis.** SwingVantage has an _excellent event-instrumentation foundation_ on top
of a _barely-activated PostHog_. There is a clean centralized analytics abstraction
(`apps/web/src/lib/analytics.ts`), a rich, well-named taxonomy of ~150 events
(`packages/core/src/analytics/events.ts`) wired into ~234 `track()` call sites across 65
files, region-aware consent gating, and a custom server-side "Analytics OS" admin
dashboard that can read PostHog data back. But the actual PostHog integration is
**ingest-only and anonymous**: it loads as the legacy CDN snippet stub (not the npm SDK),
there is **zero identity resolution** (`identify/alias/reset/group` appear nowhere), and
**none** of PostHog's higher-value surfaces — feature flags, experiments, surveys,
session replay, error tracking — are used through PostHog. Roughly 70% of the PostHog
product surface is latent.

**Biggest risks**

1. **No identity stitching.** No `posthog.identify` anywhere → funnels break at signup; an
   anonymous → known user is two different people in PostHog. This is the single biggest
   cap on every funnel.
2. **Session replay is unconfigured, not "off."** The init snippet passes only `api_host`
   (`ConsentGatedAnalytics.tsx`). Replay is therefore controlled server-side in the
   PostHog project UI with **no client masking config**. If anyone enables it, uploads /
   emails / admin tokens / AI prompts record unmasked. High privacy/compliance exposure.
3. **The Analytics OS read layer is dark in production.** `POSTHOG_PERSONAL_API_KEY` /
   `POSTHOG_PROJECT_ID` are unset, so `connectionLevel` resolves to `'ingest'` — the admin
   dashboards render empty.
4. **Events silently drop unless consented + loaded.** `track()` only forwards to
   `window.posthog` if the snippet has loaded (requires `NEXT_PUBLIC_POSTHOG_KEY` + cookie
   consent). Good privacy posture, but a lot of instrumented events never arrive and there
   is no awareness of the loss rate.

**Biggest opportunities**

- Switch to `posthog-js` + a thin React provider; add `identify/reset` at the auth
  boundary → unlocks every cross-session funnel.
- Turn on PostHog feature flags (a _local_ flag store already exists to migrate) → real
  rollouts/kill switches for upload, Gemini, AI coach.
- Replay with a strict masking allow-list scoped to upload/AI/admin surfaces.
- Wire the personal API key → the Analytics OS already built lights up.

**Recommended sequence:** P0 identity + SDK + consent loss-visibility + replay masking →
P1 PostHog flags + error tracking + read-key → P2 funnels/dashboards/surveys + experiments
→ P3 AI observability + warehouse/CDP.

---

## B. PostHog Feature Inventory

| Feature | Status | Evidence | Current behavior | Business value | Risk if left | Action | Pri | Cx |
|---|---|---|---|---|---|---|---|---|
| SDK / core setup | ⚠️ Misconfigured | `ConsentGatedAnalytics.tsx`; no posthog dep in `package.json` | Legacy `array.js` CDN snippet; `init(key,{api_host})` only | Works for capture; misses typed API, flags, replay config, bootstrapping | No flags/replay/identify ergonomics; SSR gaps | Install `posthog-js`, init in a client provider | P0 | M |
| Product analytics (custom events) | ✅ Implemented | `events.ts` (~150 events); 234 `track()` / 65 files | Rich, snake_case, multiplexed | Core decision-grade signal | Underused without identity/funnels | Keep; add identity + funnels | — | — |
| Centralized analytics wrapper | ✅ Implemented | `lib/analytics.ts` `track()` | Multiplexes GA4/Plausible/PostHog/Clarity; dev console fallback | Clean, no scattered raw calls | — | Extend with identity/flag/error | — | — |
| Web analytics | ⚠️ Partial | `posthog/queries.ts`; autocapture default | Read-back via HogQL; SPA `$pageview` on route change unconfirmed | Pageviews/referrers/sources | SPA route views undercounted | Verify/enable history-change pageviews | P1 | L |
| Autocapture | ✅ On (default) | snippet has no `autocapture:false` | DOM clicks/inputs auto-captured | Free interaction data | Noise + sensitive DOM capture | Allow/deny list + `ph-no-capture` | P1 | L |
| Event properties | ✅ Implemented | per-event prop docs in `events.ts` | `sport`, `persona`, `fault_id`…; PII-free by policy | Strong segmentation | — | Typed property schema | P2 | L |
| Identify / alias / reset | ❌ Missing | zero matches in `apps/web/src` | All users anonymous | — | Funnels break at signup; no per-user retention | Add at auth boundary | **P0** | M |
| Cohorts | ❌ Missing (read count) | `client.ts fetchResourceCount('cohorts')` | OS reads count only | Targeting/retention | No behavioral cohorts | Define after identity | P2 | M |
| Groups (org/team) | ❌ Missing | no `posthog.group` | — | B2B/coach-team analytics | Low (B2C now) | Defer | P3 | M |
| Session replay | ⚠️ Misconfigured/unsafe | snippet has no replay config | Off unless toggled in PostHog UI; no masking | Debugging friction | PII/video/token leak if enabled | Configure masking BEFORE enabling | **P0** | M |
| Replay privacy masking | ❌ Missing | no `maskAllInputs`/`mask_text_selector` | None | — | Compliance/trust failure | Strict mask config | **P0** | M |
| Network / console replay capture | ❌ Missing | n/a | None | Error context | n/a | Enable only with redaction | P2 | M |
| Feature flags (PostHog) | ❌ Missing | flags are local zustand `admin/stores/feature-flags.ts`; OS only reads PH flags | Device-local overrides, not server flags | Rollouts/kill switches | No real % rollout/targeting | Adopt PH flags via SDK | **P0/P1** | M |
| Experiments / A-B | ❌ Missing | OS reads `experiments` count only | None | Conversion lift | Decisions by opinion | Build on flags | P2 | M |
| Surveys | ❌ Missing | OS reads `surveys` count only | None | Qual feedback | Blind to "was this helpful?" | Post-analysis survey | P2 | L |
| Error tracking (PostHog) | ❌ Missing (other system) | `instrumentation.ts`, `observability/report.ts` (Sentry-shaped, no-op) | Provider-agnostic reporter + ReliabilityOS | Diagnose failures | PH not correlated to events/replay | Add PH `captureException` sink | P1 | M |
| Source maps | ❌ Missing | no upload step | Minified stacks | — | Unreadable prod errors | Add on error-tracking adopt | P2 | M |
| Logs / tracing | ⚠️ Other system | ReliabilityOS (local) | Operational capture, not PH | — | n/a | Send business events to PH only | P3 | M |
| Data pipelines / warehouse / CDP | ❌ Missing | none | Read-only via personal API | Revenue join, RevOps | No unified profile | Defer until revenue | P3 | H |
| AI observability / prompts / evals | ❌ Missing (other) | `mental-performance/telemetry.ts`, AI spend cap | Tracked outside PH | AI cost/quality | No model/latency/satisfaction in PH | Add `$ai_*` events | P2 | M |
| Revenue analytics | ⚠️ Partial | events `pricing_viewed`,`upgrade_clicked`,`conversion_cta_clicked` | Events exist, no revenue config | Monetization | Can't measure $ funnels | Value props + revenue view | P2 | M |
| Slack / workflow alerts | ❌ Missing | none | — | Ops awareness | Silent failures | PH actions → Slack | P3 | L |
| Admin dashboard instrumentation | ⚠️ Partial | `CentralIntelligenceDashboard.tsx` tracks a few | Sparse | Ops insight | Admin actions unaudited | Standardize `admin_*` (internal-only) | P3 | L |
| Data governance / privacy | ✅ Strong | `consent.ts`, region gating, PII-free taxonomy | Region-aware opt-in/out, masked keys | Trust/compliance | — | Add internal-traffic + test-user exclusion | P1 | L |

---

## C. Existing Event Taxonomy (what actually fires)

Source of truth: `packages/core/src/analytics/events.ts`. All names are `snake_case`,
object-action, **PII-free by explicit policy** (comments forbid video/landmark/biometric/
private data). Decision-grade naming — better than most production apps.

Representative groups (full list in the file):

- **Navigation/onboarding:** `page_view`, `sport_selected`, `profile_started/completed`,
  `input_method_selected`. Fires from `StartHereFlow.tsx` (15 calls), `IntentPicker.tsx`.
- **Upload/analysis:** `video_upload_started/completed/failed`,
  `analysis_started/completed/failed`, `camera_angle_selected`. Fires from
  `VideoUpload.tsx` (5), `useSwingAnalysis.ts` (4).
- **Improvement loop:** `fix_stack_created`, `drill_started/completed`,
  `recommendation_accepted/dismissed`, `retest_completed` (north-star). Fires from
  `drillmatch/*`, `retest/*`.
- **AGI / Motion Lab / RecordAssist:** large dedicated sub-taxonomies with good metadata.
- **Marketing/growth:** `pricing_viewed`, `cta_clicked`, `sample_report_viewed`,
  `email_capture_*`, quiz/tool events.
- **Five-persona + Founding Fathers + Milestones:** standardized `sport`+`persona` props.

**Properties:** safe and useful. **Naming quality:** high; no rename needed.

**The critical defect:** every event is **anonymous**. Without `identify()`, PostHog cannot
connect `video_upload_started` to `account_created` to a returning session next week. The
taxonomy is funnel-ready; the integration is not.

---

## D. Missing Event Taxonomy (gaps to add)

Keep existing names; add identity + these gaps:

- **Identity lifecycle (NEW, critical):** `user_identified` (post-login `identify`),
  `user_signed_up` (alias anon→known), `user_logged_out` (`reset`).
- **AI analysis depth:** `ai_analysis_requested` `{provider, model, sport}`,
  `ai_analysis_succeeded` `{latency_ms, confidence}`, `ai_analysis_failed`
  `{provider, error_code}`, `ai_report_regenerated`, `ai_recommendation_rated`
  `{value: helpful|not}`.
- **AI coach:** `ai_coach_opened`, `ai_coach_question_asked` `{topic}` (no free-text prompt
  body), `ai_coach_answer_rated`.
- **Upload reliability detail:** add `{browser, device_type, file_type, file_size_band,
  duration_band}` to `video_upload_failed`.
- **Activation/retention:** `activation_reached` (first analysis completed),
  `week1_returned`, `retest_loop_closed`.
- **Monetization (if/when ads):** `ad_impression` `{placement, page}`, `ad_clicked`,
  `upgrade_completed` `{tier, value}`.

Conventions: `object_action` snake_case; standard props `sport`, `persona`, `device_type`,
`journey_stage`; **never** prompt bodies, emails, tokens, or media content.

---

## E. Funnel Recommendations (enable after identity lands)

1. **Activation:** `page_view` → `sport_selected` → `video_upload_started` →
   `video_upload_completed` → `analysis_completed` → `priority_fix_viewed`. Breakdown by
   `input_method_selected`.
2. **Improvement loop (north star):** `analysis_completed` → `fix_stack_created` →
   `drill_completed` → `retest_completed`.
3. **Acquisition:** `page_view` (home) → `sample_report_viewed` → `profile_started` →
   `account_created`.
4. **Upload-failure diagnostics:** `video_upload_started` → `video_upload_failed`,
   segmented by `browser`/`device_type`/`file_type`.
5. **AI coach value:** `ai_coach_opened` → `ai_coach_question_asked` →
   `ai_coach_answer_rated=helpful`.
6. **Tutorial → action:** `tutorial_video_complete` → `video_upload_started` →
   `analysis_completed`.

All six are blocked today by missing `identify()`.

---

## F. Dashboard Recommendations

| Dashboard | Key metrics | Core events | Breakdowns |
|---|---|---|---|
| Executive Growth | New/returning, activation rate, loop completions | `account_created`, `analysis_completed`, `retest_completed` | sport, source/UTM |
| Product Activation | % reaching first analysis, time-to-activate | upload→analysis funnel | input_method, device |
| Upload & Analysis Reliability | upload/analysis failure %, latency | `*_failed`, `analysis_completed` | browser, file_type, sport |
| AI Coach Quality | open→ask→helpful %, regenerate rate | `ai_coach_*`, `ai_recommendation_rated` | sport, model |
| Sport-Level Engagement | DAU/sport, loop completion/sport | `sport_page_engaged`, `analysis_completed` | sport, persona |
| Content/Tutorial | impression→play→complete→action | `tutorial_video_*`, `video_studio_*` | placement, page |
| Monetization | CTA→upgrade, ad RPM proxy | `upgrade_*`, `ad_*` | tier, placement |
| Error & Friction | rage clicks, JS errors, failed journeys | `$exception`, `*_failed` | route, device |
| Admin Operations | internal-only action counts | `admin_*` | actor, area |
| Experimentation | exposure→conversion by variant | flag exposure + primary metric | variant |

---

## G. Feature Flag Roadmap

Migrate the existing **local** flag store (`admin/stores/feature-flags.ts`) to PostHog
server flags so rollouts are real (not device-local). Naming: `area-feature` kebab.

| Flag | Targeting | Fallback | Rollout |
|---|---|---|---|
| `upload-flow-v2` | % rollout | old flow | 10→50→100 |
| `gemini-video-analysis` | by sport/cohort | OpenAI path | gated beta |
| `openai-ai-coach` | beta cohort | hide coach | opt-in |
| `sport-dashboard-v2` | per-sport | current | per-sport |
| `premium-analysis-ui` | plan-targeted | standard | by tier |
| `ads-placement` | % + geo | no ads | cautious |
| `admin-dark-mode` (exists) | internal | light | keep |
| `kill-mediapipe-onclient` | global kill | server-only | instant off |

Fallbacks must be safe-by-default (feature OFF) per the keyless-first house rule.

---

## H. Experimentation Roadmap (top picks)

| Test | Hypothesis | Variants | Primary metric | Guardrail | Needs |
|---|---|---|---|---|---|
| Home CTA | "Analyze my swing" > "Get started" | A/B copy | `input_method_selected` | bounce | identity+flags |
| Upload layout | Single-CTA record-first lifts completion | record-first vs choice | `video_upload_completed` | upload_failed | flags |
| AI report format | Summary-first lifts fix adoption | summary vs detail | `fix_stack_created` | time-on-report | flags |
| Sample-report CTA | Sample before signup lifts signup | show/hide | `account_created` | — | flags |
| Onboarding steps | 3-step > 5-step | short/long | `analysis_completed` | profile drop | flags |

Launch criteria: identity live, flag exposure events firing, primary metric instrumented.

---

## I. Session Replay & Privacy Plan (do this BEFORE enabling replay)

Current state: **no client replay config at all** → if replay is toggled in the PostHog
project, it records everything unmasked. Highest-risk item in this audit.

- **Globally:** `maskAllInputs: true`, mask text by default; sample (10–25%) not 100%.
- **Hard-disable replay on:** upload/recording surfaces (`VideoUpload.tsx`, recorder), all
  `/admin/*` (tokens/keys — `KeysManager.tsx`), auth forms (`signup`), AI coach input,
  payment/ad areas.
- **Mask, never capture:** emails, names, the uploaded video element, AI prompt text → add
  `ph-no-capture` class / `mask_text_selector`.
- **Consent:** already gated by `consent.ts` — keep replay strictly behind analytics
  consent.
- **Never** capture network bodies on AI/upload routes (tokens, signed URLs).

---

## J. Error Tracking Plan

Today errors flow to a provider-agnostic, Sentry-shaped, no-op sink
(`observability/report.ts` + `instrumentation.ts` `onRequestError`) and ReliabilityOS —
**not PostHog**. To make failures user-correlated:

- Add a PostHog `captureException` sink alongside the existing reporter (set
  `globalThis.__svCaptureException`), so server (`onRequestError`) + client errors land in
  PH correlated with events, identity, and replay.
- Wrap: React error boundaries, API routes, upload pipeline, AI providers (Gemini/OpenAI —
  tag `{provider, model}`), auth.
- Metadata: `severity`, `route`, `release`/version tag, `environment`. Upload source maps.
- Alert: PostHog action on `$exception` spike → Slack.

---

## K. Implementation Roadmap

**P0 — before growth**

1. **SDK + identity.** Files: new `lib/posthog/provider.tsx`, `lib/analytics.ts`, auth
   callbacks, `layout.tsx`. Install `posthog-js`; `identify(userId,{sport,skill_level,
   plan})` on login, `reset()` on logout, `alias` on signup. Test: anon event → login →
   same person in PH. Acceptance: activation funnel resolves across signup.
2. **Replay safety config** (Section I) — ship masking config so replay is safe-by-default
   even while off.
3. **Consent loss-visibility:** measure how often `track()` drops because PH didn't load.

**P1 — reliable learning**

4. Set `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` → Analytics OS lights up.
5. Migrate local flag store → PostHog flags; add error-tracking sink + source maps.
6. Verify SPA `$pageview` capture; add internal-traffic + test-user exclusion.

**P2 — optimization:** funnels + dashboards (F), surveys, first experiments (H), AI
`$ai_*` events.

**P3 — advanced:** warehouse/CDP, groups for coach-teams, Slack workflows, AI eval
pipeline.

---

## L. Code-Level Recommendations (illustrative)

Extend the existing wrapper — don't scatter raw calls (matches the house rule).

```ts
// lib/analytics.ts — add to the existing module
export function identifyUser(id: string, props?: Props) {
  (window as WindowWithProviders).posthog?.identify?.(id, props);
}
export function resetUser() {
  (window as WindowWithProviders).posthog?.reset?.();
}
export function featureEnabled(key: string, fallback = false): boolean {
  return (window as WindowWithProviders).posthog?.isFeatureEnabled?.(key) ?? fallback;
}
export function captureError(e: unknown, ctx?: Props) {
  (window as WindowWithProviders).posthog?.captureException?.(e, ctx);
}
```

```ts
// posthog-js init — replay safe-by-default
posthog.init(key, {
  api_host: host,
  autocapture: { dom_event_allowlist: ['click', 'submit'] },
  session_recording: { maskAllInputs: true, maskTextSelector: '[data-ph-mask]' },
  disable_session_recording: true, // opt-in per route; never on upload/admin/auth
});
```

No secrets hardcoded — continue reading `NEXT_PUBLIC_POSTHOG_KEY` /
`POSTHOG_PERSONAL_API_KEY` from env/vault.

---

## M. "Build Next" Checklist

1. `npm i posthog-js`; replace the CDN snippet with an env-gated, consent-gated client init
   that ships replay-masking config (off by default).
2. Add `identifyUser/resetUser` to the auth boundary (login/signup/logout) + `alias` on
   signup.
3. Add `featureEnabled()` + migrate `lib/admin/stores/feature-flags` to PostHog flags.
4. Add a PostHog `captureException` sink to `globalThis.__svCaptureException` + source maps.
5. Set `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` to activate the Analytics OS read
   layer.
6. Verify/enable SPA pageview capture; add internal-traffic + test-user exclusion.
7. Add the AI/coach/upload-reliability events from Section D.
8. Build the six funnels (E) and the activation + upload-reliability dashboards (F).
9. Add the post-analysis "was this fix helpful?" survey.
10. Lock replay to the masking/allow-list plan (I) before enabling it anywhere.

---

## N. Progress log

### P0 — shipped (PR #33)

Real `posthog-js` SDK replacing the CDN snippet (replay-safe defaults,
`person_profiles: 'identified_only'`), centralized `identifyUser`/`resetUser`/
`featureEnabled`/`captureError`, and a `PostHogProvider` auth→identity bridge
(`identify(user.id)` on sign-in / `reset()` on sign-out, id-only). Checklist items 1, 2.

### P1 — shipped (this PR)

Code (done):

- **Error tracking sink** — `lib/posthog/browser.ts` now registers
  `window.__svCaptureException` → `posthog.captureException`, so every error reported
  through `lib/observability/report.ts` (client errors + `instrumentation.ts`
  `onRequestError`-forwarded ones) lands in PostHog correlated with events/identity. It
  won't clobber a Sentry sink. (checklist 4, client side)
- **SPA pageviews** — `capture_pageview: 'history_change'` captures App-Router client
  navigations, not just hard loads. (checklist 6)
- **Internal/dev-traffic filtering** — `posthog.register({ environment })` super-property
  so dev/preview events can be excluded in the PostHog UI. (checklist 6)
- **Feature-flag bridge** — `isFlagEnabled()` is now local-first + PostHog-aware: operator
  override (kill-switch) wins → same-key PostHog flag drives rollout → registry default.
  Inert until PostHog flags are created, so zero behavior change today. (checklist 3)

Owner-only (cannot be done in code — require secrets/infra):

- **Activate the Analytics OS read layer** — set `POSTHOG_PERSONAL_API_KEY` +
  `POSTHOG_PROJECT_ID` (server-side, no `NEXT_PUBLIC_` prefix). Wiring already exists
  (`lib/posthog/config.ts` `getReadConfig`); the dashboards stay empty until these are set.
  (checklist 5)
- **Source-map upload** — needs the PostHog CLI + a personal API token in the build
  pipeline; deferred. (checklist 4)
- **Server-side error sink** — `instrumentation.ts` forwards server errors to
  `globalThis.__svCaptureException`, but capturing them in PostHog needs `posthog-node`
  (separate dep). The client sink is live now; server is a follow-up.
- **PostHog UI** — create the flags from §G (the bridge consumes them by key), build the
  §E funnels / §F dashboards, mark internal users, add the §I survey.

### PostHog UI setup — provisioning-as-code

The §G flags, §E funnels, §F dashboards, and the §I survey are scripted in
`apps/web/scripts/posthog-setup.mjs` so the "UI setup" is reproducible, not hand-clicked.

```bash
cd apps/web

# 1. Dry run — prints the exact plan, writes nothing, needs no key:
npm run posthog:setup

# 2. Apply — needs a personal API key (write scope) + the project id:
POSTHOG_PERSONAL_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 npm run posthog:setup -- --apply

# Limit to sections: npm run posthog:setup -- --apply --only=flags,survey,dashboards
```

It is idempotent (skips anything that already exists), ships every flag at **0% rollout**
(OFF until you ramp), and creates the survey as a **draft** (won't show until you launch it
in PostHog). The personal key is read from the env and never logged.
