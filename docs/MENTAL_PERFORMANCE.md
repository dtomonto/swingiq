# Mental Performance — Emotion & Mistake-Recovery Pillar

> Status: **shipped (Phase 1 + deterministic coach + intelligence seams)** — 2026-06-08.
> Performance coaching only. **Not** medical/clinical mental-health treatment, diagnosis, or therapy.

## What it is

SwingVantage analyzes *mechanics*. Mental Performance trains the *response* — what an athlete does
after a bad shot, a fielding error, a missed return: emotional regulation, on-course/field/court reset
routines, a keyless coach, training plans, and a private reflection journal. Supported sports: golf,
baseball, slow-pitch & fast-pitch softball, tennis, pickleball, padel (+ universal). Built to add more.

## Architecture (mirrors BodySync)

Self-contained, local-first, consent-gated. Never touches the main Zustand store.

```
apps/web/src/lib/mental-performance/
  types.ts        data shapes
  constants.ts    disclaimers, crisis resources, emotional-state + mistake catalogs, defaults
  routines.ts     27 seeded routines (sports[] sharing) + resolvers (routineForContext, getAllSituationParams)
  coach.ts        deterministic keyless coach (buildCoachResponse)
  crisis.ts       safety screen (crisis + medical) — never therapy
  plans.ts        deterministic training-plan templates (7/14/30-day, pre/game/match-day, …)
  journal.ts      pure journal insights
  intelligence.ts CentralIntelligenceOS layer (insights + recommendations, k-anonymity, source SEAM)
  growth.ts       GrowthOS opportunities
  ai.ts           optional AI-rewrite seam (default OFF, passthrough, never touches safety paths)
  store.ts        local-first store, key 'swingiq-mental-performance-v1', doc-synced, consent-gated logs
  useMentalPerformance.ts   React hook
  index.ts        barrel
```

### Routes
- Public (indexable): `/mental-performance` (hub), `/mental-performance/[sport]`, `/mental-performance/[sport]/[situation]` — schema (WebPage/SoftwareApplication/Article/HowTo/FAQ/Breadcrumb).
- In-app (auth): `/mental` (hub + coach + quick-starts), `/mental/journal`, `/mental/plans`.
- Admin: `/admin/mental-performance` (console), nav entry under **Central Intelligence** (`overview` group).

> URL note: the in-app base is `/mental` (the public SEO surface owns `/mental-performance`), mirroring
> `/agi` (app) vs `/athlete-general-intelligence` (marketing). Sport slugs use `SportId` values
> (`softball_slow`, `softball_fast`).

## Data model (local-first state)

`MentalState = { version, settings, profile, logs[], planAssignments[] }`, key
`swingiq-mental-performance-v1`. Mirrored to the account by `lib/db/document-sync.ts` (consent-aware
merge: union logs/plans by id, keep earliest consent, never lose `enabled`/`storeLogs`).

**Privacy / consent:** `settings.enabled` (master opt-in) and `settings.storeLogs` (separate, explicit
consent to STORE journal logs — OFF by default). `saveLog()` enforces `storeLogs` as defense-in-depth.
User-controlled `exportMental()` + `clearAllMentalData()`.

## AI safety rules (enforced)

- The deterministic coach is always complete; **no AI is required**.
- `crisis.ts` screens free text. Crisis/self-harm/harm-to-others → safe referral (988 / Crisis Text
  Line / emergency / international), **no coaching**. Clinical-advice/medication/diagnosis requests →
  professional redirect. Encouraging a therapist is NOT redirected.
- The optional AI seam (`ai.ts`) is OFF by default, keyless-first, and **never** touches crisis/medical
  responses; it falls back to deterministic output on any error.
- The coach never diagnoses, pathologizes normal frustration, encourages suppression, uses shame, or
  suggests unsafe breath-holding.

## CentralIntelligenceOS integration

`intelligence.ts` turns anonymized aggregate signals into mental insights + `IntelligenceRecommendation[]`
(`area: 'mental_performance'`, a new first-class CIOS area). k-anonymity ≥ 5 enforced. Signals come from
the `MentalAggregateSource` **seam** — deterministic seed/sample data this pass (honestly labelled in the
admin console); wire a real privacy-protected backend via `setMentalSource()`. Surfaced in the
`/admin/mental-performance` **Intelligence** tab.

## GrowthOS integration

`growth.ts` `generateMentalOpportunities()` → SEO/AEO/social/internal-link/email/tutorial opportunities
from routine coverage + CIOS insights. Surfaced in the admin console **Growth** tab. Key internal-link
opportunity: analysis/fault → `routineForContext(sport, fault)` → matching reset routine.

## Admin management

`/admin/mental-performance` tabs: Routine Library, Plans, Coach Config (emotional states + mistake
categories), Intelligence (CIOS), Growth (GrowthOS), Safety (disclaimers + crisis resources + lexicon).
Source of truth for content is the lib data files (edit `routines.ts` / `constants.ts` / `plans.ts`).

## Feature flags / env

- `NEXT_PUBLIC_MENTAL_PERFORMANCE` — section kill-switch, **default ON** (content is safe/keyless).
- `MENTAL_AI_ENABLED` — optional AI seam, **default OFF**.
- Registry: `lib/admin/flags.ts` (`mental_performance.enabled`, `mental_performance.ai_enabled`).

## Testing

`lib/mental-performance/__tests__/mental-performance.test.ts` (31 tests): routine integrity, coach
behavior, crisis/medical screening (incl. sport-idiom false-positive guard), plans, journal insights,
CIOS k-anonymity, GrowthOS opportunities, and consent-gated store. Run:
`cd apps/web && npx jest mental-performance --runInBand`.

## Completed follow-ups

- **Real aggregator** — `aggregateMentalSignals(logs, userCount?)` (`intelligence.ts`) computes genuine
  signals from logs (no fabricated completion telemetry). Wire it via `setMentalSource()`. The admin
  console has a **Seed sample / My logs** toggle that runs it on the operator's real logs.
- **CIOS feed merge** — `dashboard.ts` appends `generateMentalRecommendations(getMentalSignals())` to the
  Central Intelligence recommendations (uses the same `dataSource: 'sample'` seam as the rest of that view).
- **`/fix` reset surface** — `MentalResetForFix` maps the diagnosed fault (`useAgentContext`) →
  `routineForContext` → matching routine, rendered under the Fix Stack.
- **Phase-4 script groundwork** — `scripts.ts`: `generateMeditationScript(routine)` (timed narration) +
  `generateRoutineVideoBrief(routine)` (Video Studio brief). Keyless; the existing TTS/Video Studio
  pipeline renders the actual audio/video.
- **Parent/Coach mode** — `coach.ts` reframes guidance for a supporting adult when `mode: 'parent_coach'`
  (still crisis-safe). Pairs with the existing Parent/Coach training plan.
- **Telemetry pipe (Phase 3)** — `telemetry.ts`: anonymized, **opt-in** events (`settings.shareAnonymousInsights`,
  OFF by default) emitted from the coach, routine player, and journal via the existing analytics providers
  (sport + emotion + mistake + routine + effectiveness only — never free text or identity). `eventsToLogs()`
  normalizes a collected event pool back into logs for `aggregateMentalSignals()`, closing the read loop.
  Only remaining infra: a backend that collects the events (PostHog export / a Supabase events table).
- **Phase-4 audio** — the routine player narrates routines on-device via the **Web Speech API**
  (keyless, free, graceful fallback). The admin **Guided Media** tab exposes each routine's generated
  meditation script + Video Studio brief for rendered audio/video hand-off.

## Remaining (intentionally deferred)

- A backend to **collect the anonymized telemetry events** (PostHog query / Supabase table), then
  `setMentalSource(() => aggregateMentalSignals(eventsToLogs(pool)))` — a deployment/infra decision.
- **Rendered** audio/video via the Video Studio + TTS pipeline (briefs/scripts are generated; on-device
  speech already ships).
- **i18n** of the marketing pages — deferred deliberately: the locale-manifest workflow is fragile
  (silent /es+/fr 404s until re-blessed) and concurrent agents churn locale files. English-first for now.
- Full **team** multi-user module (parent/coach guidance ships; shared team dashboards are larger).
