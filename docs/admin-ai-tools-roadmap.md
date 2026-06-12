# Admin AI Tools — Roadmap

Status of the AI-flavored tools in the admin operating system. The house style is
**keyless-first**: tools are deterministic and compose real data by default, with
an optional, env-gated, clearly-labeled model layer (AI spend off by default).

Legend: ✅ implemented · 🟡 partial · ⬜ recommended (not built)

---

## Implemented

| Tool | Where | Notes |
|---|---|---|
| ✅ **Admin Copilot** | `/admin/copilot`, `lib/admin/copilot/*`, `/api/admin/copilot` | Read-only founder assistant. Deterministic engine grounds answers in platform metrics, system health, smart alerts, the Action Center inbox and feature-education coverage. Optional AI seam (`ADMIN_COPILOT_AI=1`), off by default. |
| ✅ **AI Agent Registry** | `/admin/agents`, `lib/admin/agent-registry.ts` | Unified, honest inventory of ~30 real agents across 4 families with runtime/control/safety metadata + live AI-provider annotation + inspect deep-links. |
| ✅ **Data Quality auditor** | `/admin/data-quality`, `lib/admin/data-quality/*` | Keyless deterministic checks over the SEO content registry (dup slugs/titles/meta/keywords, length, thin content, slug↔sport mismatch, missing CTA); shows passing checks too. |
| ✅ **Drill Library** | `/admin/drills`, `lib/admin/drill-library/*` | Read-only unified drill inventory across the content + DrillMatch catalogs, with coverage stats and cross-catalog duplicate detection. |
| ✅ **Practice Plans** | `/admin/practice-plans`, `lib/admin/practice-plans/*` | Previews the real practice-planner across sports × skill levels (+ youth variant) — deterministic sample plans for review. |
| ✅ **QA & Testing** | `/admin/qa`, `lib/admin/qa/*` | Generated manual-QA checklist (P0/P1/P2) derived from the admin sections, agent registry and sports + cross-cutting a11y/mobile/theme/SEO checks. |
| ✅ **Theme & Accessibility** | `/admin/accessibility`, `lib/admin/accessibility/*` | Live WCAG contrast audit over the theme registry; grades text/background pairs AA/AAA and flags failures (the white-on-white guard). |
| ✅ Coach Mix learning engine | `/admin/coach-mix`, `lib/central-intelligence/coach-mix` | Ethical coaching-influence layer; learns principles, biases drills/explanations; admin-gated. |
| ✅ Feature Education generator | `/admin/feature-education` | Auto-detects shipped features → drafts tutorials/manuals/FAQs, quality-scored, review-gated. |
| ✅ Social generator | `/admin/social` | Blog → platform-native social posts; keyless-first + optional AI. |
| ✅ Video Studio | `/admin/video-studio` | Video-gap detection → briefs → generation; spend off by default. |
| ✅ Growth agents | `/admin/growth-agents`, `lib/agents/*` | 7 deterministic growth agents + coordinator. |
| ✅ Analytics OS | `/admin/analytics`, `/api/admin/analytics-os` | PostHog control center; read key stays server-side. |
| ✅ **AI Usage & Billing** | `/admin/ai-usage`, `lib/ai-budget.ts` | Tracks paid AI spend by feature and by UTC day (exact call counts + upper-bound cost estimates), shows the kill-switch cap status, and links straight to each provider's billing console to top up capacity without leaving the dashboard. Metering auto-captures via the existing `recordAiSpend` calls; off only in the fully-keyless case. |
| ✅ **AI Feature Controls** | `/admin/ai-provider` (top section), `lib/ai/ai-features.ts`, `/api/admin/ai/features` | Durable on/off switch per ATHLETE-FACING AI feature (video analysis, AI coach, photo OCR, journey/recruiting narrative) + a master "turn all off / on". Each user AI route honors it (serves its keyless fallback when off). Admin AI tools are gated separately and stay on. Baseline from `AI_USER_FEATURES_DEFAULT`; per-feature overrides persist fleet-wide (Upstash). |
| ✅ **AI Provider Control Center** | `/admin/ai-provider`, `lib/ai/ai-ops/*` | The strategic routing + observability surface over the AI-Operations layer: per-task provider/model (durable admin overrides), provider health, and sanitized recent-call history. Backs the **AIO-4 orchestrator** (`orchestrator`/`normalize`/`bridge`) that turns frame-vision into normalized evidence → structured *one fix / one plan / one retest* coach report on the live `/api/video-vision-analysis` path. Coach synthesis is opt-in (`ENABLE_AIO_COACH_SYNTHESIS`) + budget-gated; off → a deterministic vision-derived report at no extra cost. |

---

## Partial

| Tool | Where | Gap |
|---|---|---|
| 🟡 AI analysis review | `/admin/ai-analyses` | Has a review queue; could add an explicit AI quality/consistency/safety-language auditor. |
| 🟡 Documentation status | `/admin/feature-education` | Covers learning content; no standalone doc-coverage board. |
| 🟡 Drill/Practice editing | `/admin/drills` | Inventory is read-only; in-UI drill/practice-plan create/edit is a planned follow-up. |

---

All seven originally-identified admin gaps are now shipped (see Implemented).
Remaining are deeper follow-ups on top of those foundations:

1. 🟡 **AI output quality auditor** (`/admin/ai-quality`) — keyless deterministic
   scorer over the product's coaching/AI outputs for safety language, honesty
   (no overpromising), confidence calibration, clarity and actionability. *In
   progress — keyless-first, no AI vision required to score.*
2. ⬜ **In-UI drill/practice editing** — promote the read-only Drill Library &
   Practice Plans to create/edit, backed by the local-first + optional-Supabase-
   mirror pattern, with review/approval gates.
3. ⬜ **Copilot AI adapter** — wire a budget-capped model behind the existing
   `ai-seam.ts` once a provider key is allocated; keep the deterministic engine
   as the always-on default and label AI answers.

---

## Risks & guardrails

- **AI spend** — every model-backed tool must respect the global budget
  kill-switch (`lib/ai-budget.ts`) and default OFF.
- **Privacy** — tools operate on aggregates; never surface PII without an
  explicit, permissioned support context. Aggregated learning is product
  improvement, **not** surveillance; user data is never sold.
- **Safety** — AI output is suggestion, not execution. No publish/email/delete
  without explicit admin confirmation; label AI-generated content.
- **Honesty** — degrade to clear "connect this / not enough data" states; never
  fabricate numbers or integrations.

---

## Expected founder/business value

- **Copilot**: turns a 90-page dashboard into a question box — the fastest way
  for a non-technical founder to know what to do next.
- **Agent Registry + Data Quality**: operational confidence and clean scaling.
- **Analysis/Accessibility auditors**: protect the core product promise and
  trust as volume grows.
