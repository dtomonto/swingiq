# SwingVantage — Video Analysis / Plans / Dashboards System Audit

_Read-only diagnostic audit (4 parallel subsystem investigations), then targeted fixes._
_Date: 2026-06-11._

---

## 1. Executive summary

The brief assumed a server-side pipeline (upload → storage → `analysis_jobs` → async worker →
`analysis_results` → plan → dashboard) and that core systems are broken. **The actual
architecture is different, and most of it works.** Correcting the premise is the single most
important finding, because building the assumed job-queue + new tables would be a *rebuild of a
system this app deliberately does not use.*

What SwingVantage actually is:

- **Analysis is client-side, not a server job queue.** Two real paths:
  1. **Keyless diagnostic engine** (primary): launch-monitor/CSV import → `Shot[]` → deterministic
     `runDiagnosticEngine()` from `@swingiq/core`, run **in the browser**, results stored in the
     Zustand store. No key, no server, no queue.
  2. **AI-vision (optional):** video → MediaPipe pose **in the browser** + sampled frames →
     `POST /api/video-vision-analysis` → external LLM (Claude/GPT/Gemini) → `AIVisualAnalysis`.
     Requires `AI_VISION_PROVIDER` + a provider key; with no key it returns an honest
     `{ configured: false }` (no fake result). The raw video never leaves the device.
- **Persistence is local-first** (Zustand → `localStorage` key `swingiq-store`) **with optional
  Supabase cloud sync** (`sessions`, `shots`, `video_analyses`, `golfer_profiles`, etc. — a real
  relational schema with RLS already exists). There is **no** `analysis_jobs`/`analysis_results`
  queue, and none is needed for this design.

**There is therefore no missing table/queue to build.** The reliability issues users feel are more
likely: (a) AI-vision not configured (needs a provider key — see §8), (b) cloud sync not active in
production so data is device-local, and (c) **failures are silent** — the admin cannot see when an
analysis fails. (c) is the concrete gap fixed in this pass.

### The "≥10 swings as durable history" requirement — already satisfied

| Layer | Cap? | Evidence |
|---|---|---|
| Zustand `sessions` | **none** | `store/slices/sessions.ts:15` prepends, no `.slice`/cap |
| Zustand `video_analyses` | **none** | `store/slices/video.ts:15` prepends, no cap |
| Supabase `sessions`/`shots`/`video_analyses` | **none** | `supabase-relational-schema.sql:175,199,226` — no row limits, RLS per-user |
| History model | **append-only** | new sessions/analyses prepend; never overwrite the latest |

The only cap anywhere is a **separate** convenience cache (`swingiq-video-analyses-v1`, capped at 25
in `lib/video/history.ts:29`) used for the "welcome back / compare" UI and AI context — it is **not**
the canonical record, and 25 > 10 regardless. **A profile can hold unlimited swings as append-only
history.** The real caveat is *durability*: without Supabase sync active, history is device-local and
lost if `localStorage` is cleared (see §6, §9).

---

## 2. Current architecture map

```
            ┌─────────────────────── CLIENT (browser) ───────────────────────┐
 CSV/LM ───▶│ ImportWizard → @swingiq/core parseCSV → Shot[]                  │
            │                         │                                       │
 Video  ───▶│ VideoUpload / RecordAssist → MediaPipe pose (CDN WASM)          │
            │            │             │                                      │
            │            ▼             ▼                                      │
            │   runDiagnosticEngine()  prepareSwing()+frames                  │
            │     (deterministic)         │                                   │
            │            │                ▼                                   │
            │            │     POST /api/video-vision-analysis ──▶ LLM (opt.) │
            │            ▼                │                                    │
            │      Zustand store  ◀───────┘  (sessions, video_analyses,       │
            │   (localStorage: swingiq-store)  training, prioritySnapshots…)  │
            └────────────┬───────────────────────────────────────────────────┘
                         │  optional, if Supabase configured
                         ▼
            Supabase (lib/db/cloud-repo.ts): sessions, shots, video_analyses,
            golfer_profiles, sport_profiles, clubs, training_progress, … (RLS per-user)
```

Admin surfaces read the same `video_analyses`/`sessions` tables (when Supabase is configured):
`/admin/ai-analyses`, `/admin/uploads`, `/admin/users/[id]`, `/admin/system-health`,
`/admin/reliability`.

---

## 3. End-to-end journey map (actual)

**Journey 1 — New user analysis:** sign in → pick sport → import CSV **or** record/upload video →
(CSV) browser diagnostic engine **or** (video) browser pose + optional LLM → result appended to
Zustand `sessions`/`video_analyses` → `/diagnose` + dashboard read it from the store → selecting a
diagnosis sets `training.active_diagnosis_id` → `/training` derives the routine. **Works**, with the
caveats below.

**Journey 2 — Returning dashboard:** `DashboardContent` reads `profile/sessions/training/...` from the
store; computes live stats via `runDiagnosticEngine`/`computeSwingScores`; empty states are good (clear
CTAs). **Works locally**; cross-device requires Supabase sync.

**Journey 3 — Plan flow:** plans are *implicit* — `setActiveDiagnosis()` records an id + `started_at` in
the `training` slice; `/training` renders the routine from `@swingiq/core`; drill steps toggle and persist
to `localStorage`. There is **no separate plan entity**; status is inferred from session timestamps.

**Journey 4 — Admin visibility:** admin can see *completed* analyses (score/issues), per-user
sessions/analyses, integration/config status, and captured upload/auth failures. Admin **cannot** see
analysis failures, provider error rates, processing time, or stuck work (there is no queue).

---

## 4. Exact failure points & root causes

| # | Symptom | Root cause | Severity |
|---|---|---|---|
| F1 | "AI video analysis doesn't work" | AI-vision needs `AI_VISION_PROVIDER` + a provider key; unset → honest "not configured". Keyless CSV diagnosis still works. | High (config, not code) |
| F2 | History "lost" / not on profile across devices | Data is local-first; cross-device/durable history needs Supabase **service-role** sync active. | High |
| F3 | **Admin can't tell if analysis is failing** | `/api/video-vision-analysis` failures only `console.error`; no `video_analysis_failed` ReliabilityOS event, no `logAnalysisFailure()`. Client `run-analysis.ts` throws without reporting. | High (fixed this pass) |
| F4 | Training shows a generic slice routine | Hardcoded `slice_weak_fade` fallback when no diagnosis (`TrainingContent.tsx:55`), labeled "Sample routine" but interactive. | Medium |
| F5 | Plan/streak/tasks lost on logout/other device | `training` + `prioritySnapshots` slices are device-local; not in the cloud projection. | Medium |
| F6 | Dashboard not reactive within a visit | Components read the store once at mount; new diagnosis needs navigation to refresh. | Low |
| F7 | Latent ordering bug | `DashboardContent.tsx:82-83` notes that after a cloud three-way-merge, `sessions[0]` may not be newest. | Low (latent) |

**Not problems (verified):** no production mock/fake data on `/diagnose` or the dashboard (demo data is
isolated to `/demo` + `/design-lab`); no caps on real history; RLS isolates per-user; the AI-vision
disabled state is honest.

---

## 5. Inventory inspected

**Frontend:** `app/(app)/{dashboard,diagnose,training,sessions/import,video,record-assist}`,
`components/{video,record-assist,motion-lab,agents,dashboard}`.
**Engine/libs:** `packages/core/src/diagnostic/engine.ts`, `packages/core/src/video-analysis/visual/*`,
`apps/web/src/lib/{video,pose,motion,motion-lab,record-assist,agents,db,reliability-os}`.
**API routes:** `/api/video-vision-analysis`, `/api/video-analysis`, `/api/import/ocr`, `/api/capabilities`.
**Store:** `apps/web/src/store/{index.ts,types.ts,slices/*}` (key `swingiq-store`).
**DB:** `apps/web/supabase-relational-schema.sql`, `supabase-rls.sql`, `lib/db/{cloud-repo,projection,document-sync}.ts`.
**Admin:** `/admin/{ai-analyses,uploads,users/[id],system-health,reliability,health,integrations,ai-usage,motion-lab,record-assist,practice-plans,command-center,audit-log}`.
**Config:** `lib/capabilities.ts`, `lib/config/integrations.ts`, `lib/ai-budget.ts`.

---

## 6. Environment / config risks

- **AI-vision/coach:** `AI_VISION_PROVIDER` + `ANTHROPIC_API_KEY|OPENAI_API_KEY|GOOGLE_AI_API_KEY`
  (and `AI_PROVIDER` for coach chat). Unset → honest off.
- **Durable per-profile history / cloud sync:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  **and `SUPABASE_SERVICE_ROLE_KEY`** (the latter drives server-side persistence). Without sync, history is
  device-local — the biggest risk to "history stays on the profile".
- **MediaPipe pose:** loads WASM from CDN; on failure pose degrades to empty (analysis still runs).
- **AI budget:** global daily spend cap can pause AI-vision (`lib/ai-budget.ts`) — honest, but looks like a
  "failure" to a user; should be observable (see §11).

## 7. Security / RLS / storage risks

- RLS is correctly per-user (`owner_all` on every table). No broad public access found.
- Provider keys are server-only; the disabled-vision provider never leaks. No raw-response leakage to clients.
- Videos are **never** uploaded (frames only, transiently) — storage-policy risk is N/A by design.

---

## 8. Fixes implemented in this pass

**Analysis-failure observability (F3).** Closes the "admin can't see analysis failures" gap using the
*existing* ReliabilityOS framework (extend, don't rebuild — no new tables, no new event taxonomy):

- Added a `logAnalysisFailure()` capture helper (`lib/reliability-os/capture.ts`) that records a failed
  swing analysis as a `video_processing_failed` operational event (category `video_upload`, default stage
  `ai_vision_analysis`) — reusing the existing type so the reliability engine groups + surfaces it with no
  ripple changes.
- Wired the **client** analysis pipeline (`lib/video/run-analysis.ts`) to fire it on a real error and
  rethrow — the client is where the ReliabilityOS sink lives, so this is where previously-silent failures
  become visible in `/admin/reliability`. Cancellations (`AbortError`) are intentional and are **not**
  logged; the honest "AI not configured" path returns early and is **not** a failure.
- Test: `lib/reliability-os/__tests__/analysis-capture.test.ts` asserts a failed analysis lands in the
  ring buffer with the right type/category/stage and a sanitized message.

Everything is additive; with no failures the behaviour is unchanged.

**Admin failed-analysis visibility (follow-up "c", shipped).** The reliability engine now reports a
dedicated `failedAnalyses24h` (split out of the broad uploads count) and the `/admin/reliability`
dashboard shows a **"Failed analyses 24h"** tile — so analysis breakage is a first-class admin signal.

**Cloud-sync durability hardening (follow-up "b", shipped).** A failed Supabase sync used to flip only a
local `status` (silent), so you couldn't tell if an athlete's swings actually persisted.
`relational-sync-provider.tsx` now reports sync failures (schema-not-migrated / RLS / server) to
ReliabilityOS via `logSyncFailure()` (category `database`, throttled to once per failure episode), and the
dashboard shows a **"Failed data syncs 24h"** tile. This is the observability behind the ≥10-swing
durability guarantee: if history stops persisting, it now shows up. Verified: `trainingRow()` confirms
plan/training state also projects to Supabase, and admin System Health already exposes Supabase auth +
service-role status, so durability is both wired and confirmable.

## 9. Remaining risks (not changed this pass — need their own focused passes)

1. **Cloud-sync confirmation (F2):** verify `SUPABASE_SERVICE_ROLE_KEY` is set in production and that
   `training`/`prioritySnapshots` slices are (or should be) included in the cloud projection so plans/streaks
   survive logout/other-device.
2. **Training "sample routine" (F4):** replace the interactive `slice_weak_fade` fallback with a true empty
   state ("Run a diagnosis to generate your plan").
3. **Dashboard reactivity (F6) + latest-session ordering (F7):** sort by `created_at` defensively after
   cloud merge; consider a store subscription so a new diagnosis refreshes the dashboard in-visit.
4. **Per-user pipeline health view:** an admin "is this user's pipeline healthy?" panel (uploads vs analyses
   vs failures) once F3 events accrue.

## 10. Recommended next build priorities

1. Confirm + harden cloud sync (durability of history/plans). 2. Ship the analysis-failure admin panel on
top of the new events. 3. Empty-state the training fallback. 4. Dashboard in-visit reactivity. None require
new tables.

## 11. Manual QA checklist

- [ ] New user signs up → empty dashboard shows "find your #1 fix" CTA (not blank).
- [ ] Import valid CSV (≥3 shots) → diagnosis appears on `/diagnose` + dashboard.
- [ ] Upload video with **no** AI key → honest "AI analysis not configured" (no fake result).
- [ ] Upload video **with** AI key → `AIVisualAnalysis` renders; appears in `/admin/ai-analyses`.
- [ ] Upload invalid type / oversized / too-short video → clear error, not silent.
- [ ] Add 10+ sessions → all retained, newest-first, none dropped.
- [ ] Force an analysis failure (e.g. malformed frames) → appears in `/admin/reliability` (after F3).
- [ ] Sign out / sign in with Supabase configured → sessions/history restored from cloud.
- [ ] Mobile + desktop upload both work; processing state is shown.
- [ ] Admin: `/admin/system-health` shows AI-vision connected/not; `/admin/users/[id]` shows the user's
      sessions + analyses.
```
