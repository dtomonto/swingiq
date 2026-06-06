# BodySync — Health-Performance Intelligence

## In Plain English (start here)

**BodySync** makes SwingVantage understand the athlete *behind* the swing. Each
day a user can do a 30-second check-in — how they slept, their energy,
soreness, pain, stress — and (later) connect a watch or ring. SwingVantage
turns that into a **readiness score and a Green/Yellow/Orange/Red light**, then
**changes the day's coaching**: push speed and power on a fresh day, ease into
light technical work on a tired one, and skip drills that load a sore shoulder.
It explains *why* in plain English and never makes a medical claim.

It works **today with zero devices** — manual check-ins are the foundation. It's
**privacy-first**: nothing is sold, every category is opt-in, and the user can
export or erase everything in one tap. Their BodySync data **syncs to their
account** across devices automatically.

The dashboard lives at **`/bodysync`** ("Performance Pulse").

### Nothing to run for Phase 1
Phase 1 needs **no database setup** — BodySync rides the document-sync mirror I
already ship (`user_documents`). When you're ready for real device data at
scale, apply `apps/web/supabase-bodysync-schema.sql` (Phase 2 target).

---

## Architecture

```
  Daily check-in + (future) device samples
                 │  normalize
                 ▼
        ┌──────────────────────┐
        │  Scoring engine       │  recovery · training-load · readiness ·
        │  (lib/bodysync)       │  performance-opportunity · injury-risk → zone
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐      ┌───────────────────────┐
        │  Coaching modifier    │      │  Insight / correlation │
        │  (sport-specific)     │      │  generator             │
        └──────────┬───────────┘      └──────────┬────────────┘
                   ▼                              ▼
         Performance Pulse dashboard (/bodysync) + readiness in coaching
```

- **Self-contained, local-first store** (`lib/bodysync/store.ts`, key
  `swingiq-bodysync-v1`) — never touches the main Zustand store, syncs to the
  account through the document mirror (`lib/db/documentSync.ts`).
- **Pure engines** (`scoring.ts`, `coaching.ts`, `insights.ts`) — deterministic,
  conservative, confidence-scored, fully unit-tested. No medical claims.
- **Connector framework** (`providers/registry.ts`) — every provider's realistic
  web-first path is encoded; new providers drop in without touching the core.

### Key files
- `lib/bodysync/types.ts` — the vendor-neutral data model.
- `lib/bodysync/scoring.ts` — readiness/recovery/load/opportunity + injury risk.
- `lib/bodysync/coaching.ts` — health-aware, sport-specific recommendation.
- `lib/bodysync/insights.ts` — correlation/pattern generation.
- `lib/bodysync/providers/registry.ts` — provider catalog + adapter interface.
- `lib/bodysync/store.ts` (pure) + `useBodySync.ts` (React hook).
- `components/bodysync/*` + `app/(app)/bodysync/page.tsx` — the UI.
- `apps/web/supabase-bodysync-schema.sql` — Phase-2 relational tables.

## How readiness scoring works (conservative + honest)

Each score is **0–100, higher = better** (Training-Load is "more load
accumulated"). Every score returns signed **contributors** (so the UI explains
itself), a list of **missing inputs**, and a **confidence** (low/moderate/high)
driven by how much objective data was available. With only a couple of
subjective answers, confidence is `low` and scores stay near neutral — we never
fake precision.

- **Recovery** = sleep vs baseline + sleep quality + soreness + (HRV/resting-HR
  vs baseline when a device is connected) − illness/alcohol/travel.
- **Training Load** = recent practice intensity + hard-day count + acute spike
  (+ device exercise minutes/load when present).
- **Readiness** = 0.55·Recovery + energy + (−)stress + (−)pain − high-load drag.
- **Performance Opportunity** = readiness + sleep quality + low soreness +
  positive 2-day trend − load-spike cap.
- **Zone**: red if readiness < 35 / elevated injury risk / pain ≥ 4 / illness;
  orange if < 50 / watch risk / pain = 3; yellow if < 70; else green.

## Apple Health & each provider (the honest web path)

HealthKit has **no browser API** — never assume direct web access. The registry
encodes the correct path:

| Provider | Path |
| --- | --- |
| Apple Health / Watch | iOS **companion app** / **Shortcuts** automation / **Health export** import |
| Google Fit | server-side **OAuth** (Fitness REST) |
| Android Health Connect | **companion app** aggregation |
| Garmin / WHOOP / Oura / Fitbit / Polar | server-side **OAuth** partner APIs |
| Samsung Health | Android **Health Connect** / companion |

Until each one's credentials/app exist it shows **"Coming soon"** — keyless-first,
like Stripe/ads/AI elsewhere in SwingVantage. Manual entry works today.

## How to add a new wearable provider

1. Add a `ProviderDescriptor` to `PROVIDER_CATALOG` in `providers/registry.ts`
   (id, name, method, categories, `howItConnects`, `requiresCredentials`).
2. Implement a `HealthProviderAdapter` (`isConfigured`, optional `getAuthUrl`,
   and `normalize(raw) → HealthMetricSample[]`) and `registerAdapter(it)`.
3. Add server OAuth routes + token storage (Phase 2) — the adapter's `normalize`
   is the ONLY place that knows the vendor's payload shape.
4. Nothing in scoring, coaching, or UI changes — they consume normalized samples.

## Permissions & privacy

- Consent is explicit (`HealthConsentGate`) and category-granular
  (`user_health_permissions`); ingestion must check the category before use.
- **Wellness is the only default-on category**; everything else is opt-in.
- Users can disconnect any provider, **export** their data (JSON), and **erase
  everything** (`clearAllHealthData`) — all from `/bodysync`.
- The non-medical disclaimer (`NON_MEDICAL_DISCLAIMER`) appears wherever health
  context is shown.

### What is stored / not stored
- **Stored:** the user's own check-ins, normalized daily summaries, derived
  scores, connection status, granular permissions, and (Phase 2) sync audit logs.
- **Not stored:** raw device payloads. `health_metric_events.raw_ref` is a
  *pointer* only and stays null unless a provider genuinely requires it. No
  health data is sold or used for ad targeting.

## Apple Health import (shipped — the honest web path)

HealthKit has no web API, so we use the user's own export. `Health app → your
photo → Export All Health Data`, unzip, upload `export.xml`. `lib/bodysync/import/appleHealth.ts`
scans it (no full DOM of a huge file), rolls each metric up to **one value per
day** (sums steps/sleep, medians vitals), and `importDailySummaries()` stores
only those summaries, learns objective **baselines** (median resting HR / HRV /
sleep), and marks the provider connected. Readiness then uses real HRV /
resting-HR / sleep-vs-baseline — not just the subjective check-in.

## Phases
- **P1 (shipped):** manual wellness + scoring + health-aware coaching + insights
  + dashboard + consent/privacy + connector framework + account sync + tests.
- **P2 (in progress):** ✅ Apple Health export-import + objective data into
  scoring + readiness surfaced on the Dashboard and AI Coach (the coach's
  answers now adapt to readiness). Next: Health Connect + wiring the relational
  schema for server-side ingestion.
- **P3:** wearable OAuth adapters (Garmin/WHOOP/Oura/Fitbit/Polar).
- **P4:** correlation engine over real device history.
- **P5:** premium modules — Best Time to Train, Tournament Readiness, Burnout
  Prevention, Return-to-Play progression, Parent/Coach view.
