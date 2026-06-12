# SwingVantage — Architecture Audit (AI-Native Master Plan, Phase 0)

> Status snapshot: 2026-06-12. Produced by codebase-verified audit (read-only) against the
> 10-phase "AI-native sports improvement platform" master brief. Every claim below was
> checked against actual files — paths are given so the next agent can extend, not rebuild.
>
> **Headline:** SwingVantage is already ~85–90% of the master brief. The brief's posture
> ("audit first, most features are 80–95% built") is correct. This is an **extend-and-wire**
> program, not a greenfield build. The real net-new work is a short, high-leverage list (§3).

---

## 1. Current stack (verified)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js ^16** (App Router) + **React 19.2** | route groups `(marketing)`, `(auth)`, `(app)`, `/admin`, `/[lang]` i18n; 89 API route handlers |
| Styling | **Tailwind v4.3** + Radix/shadcn patterns | `@theme` token arch, `data-sport`/`data-theme` identity layers, 7-theme engine |
| Monorepo | **Turborepo + npm workspaces** | `apps/web` (app), `packages/core` (`@swingiq/core`, framework-free domain logic), `server` (SQL + helpers), `scripts`, `docs` |
| Auth | **Supabase** (optional) | keyless-first: browser-local IndexedDB fallback when no Supabase keys; API routes fail-closed |
| Database | **Postgres / Supabase** | 19 loose `supabase*.sql` files (no formal migrations dir/versioning) |
| Storage | **Device-local** (videos never leave the browser) + Supabase Storage for non-video | core privacy stance |
| State | **Zustand** (14 slices) + cloud sync via `lib/db` | local-first everywhere |
| Deploy | **Vercel** | `vercel.json` 2 crons (research quarterly, social daily); Vercel Analytics + Speed Insights |
| Env/secrets | `.env.example` (450+ lines), `lib/capabilities.ts` single source of truth, AES-256-GCM secrets vault (`/admin/integrations`) | placeholders treated as "not configured" |

CI gates (`.github/workflows/`): `test.yml` (Jest 1300+ · Playwright 13 journeys), `security-audit.yml`
(gitleaks · npm audit · eslint · tsc · RLS gate · custom security), `growth-ci.yml`
(type-check · lint · build · bundle budget · growth/honesty audit · dep audit), `update-visual-baselines.yml`.

---

## 2. Phase-by-phase status

Legend: ✅ complete · 🟡 partial · ❌ missing.

### Phase 1 — AI Operating Foundation → **✅ ~95%**
Lives in `apps/web/src/lib/ai/ai-ops/`.
- ✅ **Provider registry** — `registry.ts`, `types.ts`, `model-config.ts` (Gemini video / OpenAI coach / MediaPipe measurement / Anthropic narrative; env-keyed models with default+fallback+cost tiers, timeouts, max tokens).
- ✅ **Model routing** — `effective-routing.ts` + `routing-store.ts` + `task-registry.ts`: env → code → durable admin override (Upstash) → provider-health resolution; per-task overrides; confidence/human-review thresholds; feature-flag gates.
- 🟡 **Prompt registry** — `prompts.ts` holds **seed prompts only** (`GEMINI_INTAKE_PROMPT_V1`, `OPENAI_COACH_PROMPT_V1`, `CLAUDE_NARRATIVE_PROMPT_V1`, hardcoded `version`). No DB-backed versioning, no status lifecycle (draft/active/deprecated/archived), no approval/change-summary workflow, no admin surface. **(Gap G1.)**
- ✅ **Model run logging** — `call-log.ts` (`AiCallRecord`, Upstash + in-memory ring) + `ProviderTrace` in `schemas.ts` (provider/model/promptVersion/tokens/cost/latency/status/error/retry/redacted payloads).
- ✅ **Cost & token tracking** — `lib/ai-budget.ts` (daily fleet cap + override), `lib/ai/user-ai.ts` (per-user cap), `/admin/ai-usage`. 🟡 token-level + per-sport aggregation recorded per-call but not rolled up in dashboard.

### Phase 2 — Video Analysis OS → **🟡 ~70%**
- ✅ **Upload flow** — `lib/video/clip-store.ts` (IndexedDB), `prepare-swing.ts` (speculative frame+pose), `run-analysis.ts` (pipeline), `history.ts`. Failures → ReliabilityOS.
- ❌ **Analysis job lifecycle** — there is **no `analysis_jobs` entity** with status states. Analysis is **synchronous per-upload** with an in-memory progress sink (`preparing→extracting→measuring→inspecting→building→plan→done`). No queued / needs_human_review / rerun_requested persistence, no admin job monitor over real jobs. **(Gap G3 — the single biggest structural gap.)**
- 🟡 **Video quality gate** — quality is assessed **inside** the AI vision result (`packages/core/.../visual/schema.ts` `VideoQualityCheck`), not as a **pre-flight** gate. Marginal videos still spend AI budget before being told to re-record. **(Gap G4.)**
- ✅ **Pose/kinematic layer** — `lib/pose/pose-detection.ts` + `pose-metrics.ts` (MediaPipe lite/full/heavy, GPU→CPU fallback, camera-agnostic proxies); Motion Lab 3D kinematics. Golf path notably does **not** use real pose (heuristic + AI vision only).
- ✅ **Sport-specific modes** — `packages/core/src/sports/{tennis,pickleball,padel,baseball,softball-slow,softball-fast}/analysis.ts` + golf diagnostic. Tennis/pickleball/padel handled as continuous/rally (duration heuristics + pose over full clip), but **no explicit continuous-vs-discrete phase model** and no rally segmentation.
- ✅ **Diagnosis schema (golf)** — `packages/core/src/diagnostic/{engine,rules,data-quality}.ts`: 35+ rules, confidence calibrated by sample-size × dispersion × completeness, supporting data, retest protocol. Real, structured, honest.
- ✅ **One Fix / One Plan / One Retest** — `buildSessionInsight` (golf) + AI vision result schema (non-golf).

### Phase 3 — Retest & Closed-Loop Learning → **🟡 ~75%**
- ✅ **Retest entities** — `lib/retest/{types,engine,targets,targets.golf,store,useRetests,next-action}.ts`.
- ✅ **Before/After comparison** — `components/ui/BeforeAfter.tsx` + `engine.ts` `compareAnalyses` (conservative, refuses improvement claim on mismatched conditions).
- 🟡 **Drill effectiveness tracking** — completion counts + tutorial analytics exist, but **no drill-level effectiveness ranking** or cross-drill comparison for the same fault (events emitted, not aggregated). **(Gap G7.)**
- ✅ **Profile updating** — `lib/video/profile-sync.ts` + `lib/agi/{progress,commitment,outcome}.ts` (capability deltas, commitment-based progression, Supabase `video_analyses.analysis` jsonb).

### Phase 4 — Admin Command Center → **🟡 ~80% (21/25 modules exist or partial)**
69 admin sections live under `apps/web/src/app/admin/`. Of the brief's 25 target modules:
- ✅ **Full (10):** AI Provider Control (`/admin/ai-provider`), Drill Library Manager (`/admin/drills` + `/manage`), User Feedback Inbox (`/admin/feedback`), SEO/AEO/GEO (`/admin/seo`), Theme Lab (`/admin/theme-lab`), Feature Flags (`/admin/feature-flags`), Quality Evaluation (`/admin/ai-quality`), Admin Audit Logs (`/admin/audit-log`), NL Company Query Assistant (`/admin/copilot`, read-only), Founder Daily Briefing (`/admin/command-center`).
- 🟡 **Partial (11):** Model Routing Rules (folded into ai-provider), Video Analysis Job Monitor (`/admin/uploads` = metadata only, no job queue), Upload Health Monitor (inside `/admin/health`), Error/Incident Center (`/admin/audits`+`/admin/decisions`), User Journey Analytics (PostHog/Clarity, no dedicated map), Sport Flow Performance (Command Center only), Tutorial Video Manager (`/admin/library`+`/admin/video-studio`), Human Review Queue (`/admin/approvals`), Experiment Console (`/admin/growth/experiments`), Cost & Token (`/admin/ai-usage`), Privacy & Data Controls (`/admin/legal`).
- ❌ **Missing (4):** **Prompt Registry**, **Prompt Testing Lab**, **Retest Performance Dashboard**, **Release Console**. **(Gaps G1, G2, G5, G6.)**
- **Auth/RBAC:** `lib/admin/rbac.ts` — 10 roles, ~25–48 permissions; route guard (`admin/layout.tsx`: `ADMIN_SECRET` header XOR allowlisted email) + `contextCan()` server enforcement.
- **Audit log:** `lib/admin/stores/audit-log.ts` — **client localStorage only**, 500-entry ring; no server `admin_audit_log` table yet. **(Gap G8.)**

### Phase 5 — Content & Tutorial OS → **🟡 ~70%**
- ✅ Tutorial videos (`lib/tutorial/videos.ts` + raw shards, captions/journey-stage/coming-soon), drill catalog (`lib/drills/catalog.ts`), feature-education seed (`data/feature-education-seed.json`).
- 🟡/❌ No explicit `content_versions` history, `content_tags` system, `content_performance` aggregation, or `content_reviews` queue. Analytics emitted (`lib/tutorial/analytics.ts`) but not rolled up; no outcome-based ranking. **(Gaps G7 overlaps.)**

### Phase 6 — Product Intelligence / Queryable Company → **✅ ~85%**
- ✅ PostHog (real SDK, identity, SPA pageviews, flag bridge, consent-gated) — `lib/posthog/*`, `components/analytics/*`.
- ✅ Typed event catalog — `packages/core/src/analytics/events.ts` + `docs/analytics-events.md`; core funnel (upload→analysis→#1 fix→account) fully wired; many peripheral events partial.
- ✅ NL query assistant (read-only) — `/admin/copilot` (`lib/admin/copilot/{snapshot,engine}.ts`).
- 🟡 Metrics layer — 4 cross-sport funnels defined (`lib/posthog/dashboard.ts`); **no sport-specific metric sets**.

### Phase 7 — Trust / Safety / Privacy → **✅ ~90%**
- ✅ Consent — `lib/consent.ts` (geo-aware opt-in/opt-out, per-provider registry, 26 tests) + cookie banner.
- ✅ Video privacy — device-local by design; metadata-only server records; admin can't download video.
- ✅ Medical/biomechanics guardrails — `lib/agents/guardrails.ts` (pain/injury/medical-claim/youth detectors with severity).
- ✅ RBAC (above) + RLS — `supabase-rls.sql` (+ satellite schemas) `auth.uid() = user_id`.
- 🟡 Sensitive-data redaction in error context (caller-discipline only, no auto-scrub); no build/release tag on errors; admin video-metadata-access not audit-logged. **(Gap G8/G10.)**

### Phase 8 — Growth Loops → **✅ ~85%**
Sport landing pages, problem pages, sample reports, shareable reports (`/player`), SEO console, Founding-Fathers cohort, SignalRadar all present (see memory index). Mostly polish/wiring, not net-new.

### Phase 9 — Software Factory → **🟡 ~80%**
- ✅ PR workflow + branch protection (6 required checks), Jest 1300+, Playwright 13 journeys, security/growth gates, Storybook v10, feature flags.
- 🟡/❌ No Chromatic CI, no Lighthouse CI (bundle-budget ≈ perf gate), axe only ad-hoc in Playwright, **no root CHANGELOG / rollback runbook** (`docs/rollback-plan.md` absent). **(Gap G9.)**

### Phase 10 — Polish/UX → ongoing (Design V2 program in flight, see memory).

---

## 3. The real gap list (net-new, prioritized)

Ordered by leverage × independence. Each is small, testable, behind a flag where risky.

| ID | Gap | Why it matters | Rough size | Depends on |
|---|---|---|---|---|
| **G3** | **Analysis Job entity + lifecycle + admin Job Monitor** | The brief's spine: traceable, retryable, human-review-routable analyses. Today analysis is fire-and-forget. Unlocks G5, real upload-health, needs_human_review queue. | L | migration (job store; local-first first, Supabase opt-in) |
| **G1** | **Prompt Registry** (DB/store-backed versioning + status lifecycle + `/admin/prompts`) | "Every AI output references a prompt version" is the brief's traceability promise; today versions are hardcoded. Reuses `routing-store` Upstash+memory pattern. | M | none (extend ai-ops) |
| **G2** | **Prompt Testing Lab** (`/admin/prompts/test`) | Run active vs draft prompt over saved inputs; regression confidence before activate. | M | G1 |
| **G4** | **Pre-flight Video Quality Gate** | Stop spending AI budget on un-analyzable clips; give the user a fast re-record nudge. Promote existing `VideoQualityCheck` fields to a cheap pre-check. | M | none |
| **G5** | **Retest Performance Dashboard** (`/admin/retests`) | Make "One retest" measurable for the operator (starts/completions/before-after/improvement by sport/issue/drill). | S–M | G7 data; reuses `lib/retest` |
| **G7** | **Drill/content effectiveness aggregation** | Rank drills & tutorials by *outcome*, not views — the closed-loop learning promise. | M | event roll-up store |
| **G8** | **Server-side audit log persistence** (`admin_audit_log` mirror) + admin video-access logging | Tamper-evident, cross-device admin accountability. | S | migration |
| **G6** | **Release Console** (`/admin/releases`) + `docs/rollback-plan.md` | Release health, rollback button, AI changelog draft. Some pieces exist in `/admin/updates`. | M | G9 docs |
| **G9** | Rollback runbook + (optional) Lighthouse/axe/Chromatic CI | Software-factory completeness. | S–M | none |
| **G10** | Error-context PII auto-scrub + build/release tagging; sport-specific metrics | Observability hardening. | S | none |

**Recommended first move: G3 (Analysis Job lifecycle).** It is the structural keystone the brief
keeps returning to (job monitor, upload health, human-review queue, retest dashboard all hang off it),
and it's currently the largest genuine hole. Build it local-first (Zustand store + optional Supabase
table) to honor the keyless-first rule, behind a `analysis_jobs.enabled` flag.

---

## 4. Risks & operating constraints

- **Concurrency** — multiple agents share this checkout (`CLAUDE.md` §1–2). All net-new work goes in a
  worktree (`npm run wt create <task>`); stage explicit pathspecs; never `git add -A`.
- **Keyless-first** — every new module must work with no keys (local-first store + honest "not
  configured" state) and stay OFF until a key/flag is set (`lib/capabilities.ts`).
- **Never fabricate data** — all new metrics/dashboards carry honest `DataSource` labels.
- **Admin = admin-only + noindex** — new admin surfaces inherit the RBAC guard + `contextCan()`.
- **Migrations are loose SQL** — add `supabase-analysis-jobs.sql` etc.; owner applies manually
  (document in the module's setup entry).
- **Don't duplicate** — `/admin/uploads`, `/admin/ai-provider`, `lib/retest`, `lib/ai/ai-ops`,
  `lib/tutorial/analytics` already exist; extend them.

---

## 5. Recommended implementation sequence

1. **G3** Analysis Job lifecycle (store + status machine + `/admin/uploads` upgraded to a real Job Monitor with retry / rerun-with-provider / send-to-human-review). *Keystone.*
2. **G1 + G2** Prompt Registry + Testing Lab (`/admin/prompts`), wire `promptVersionId` through `ProviderTrace`.
3. **G4** Pre-flight Video Quality Gate (budget-saver, UX win).
4. **G7 → G5** Effectiveness aggregation, then Retest Performance Dashboard on top of it.
5. **G8** Server audit-log mirror + admin access logging.
6. **G6 + G9 + G10** Release Console, rollback runbook, observability hardening.

Each step ships independently, leaves the app green (tsc + Jest + the relevant Playwright journey),
and updates its doc under `/docs/` (`ai-operating-system.md`, `video-analysis-pipeline.md`,
`prompt-registry.md`, `retest-system.md`, `admin-command-center.md`, `rollback-plan.md`).

---

*This document is the Phase 0 deliverable. It supersedes assumptions in the master brief that these
systems are missing — most are present and only need extension/wiring per §3.*
