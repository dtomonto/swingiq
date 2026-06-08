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
| ✅ Coach Mix learning engine | `/admin/coach-mix`, `lib/central-intelligence/coach-mix` | Ethical coaching-influence layer; learns principles, biases drills/explanations; admin-gated. |
| ✅ Feature Education generator | `/admin/feature-education` | Auto-detects shipped features → drafts tutorials/manuals/FAQs, quality-scored, review-gated. |
| ✅ Social generator | `/admin/social` | Blog → platform-native social posts; keyless-first + optional AI. |
| ✅ Video Studio | `/admin/video-studio` | Video-gap detection → briefs → generation; spend off by default. |
| ✅ Growth agents | `/admin/growth-agents`, `lib/agents/*` | 7 deterministic growth agents + coordinator. |
| ✅ Analytics OS | `/admin/analytics`, `/api/admin/analytics-os` | PostHog control center; read key stays server-side. |

---

## Partial

| Tool | Where | Gap |
|---|---|---|
| 🟡 AI analysis review | `/admin/ai-analyses` | Has a review queue; could add an explicit AI quality/consistency/safety-language auditor. |
| 🟡 Documentation status | `/admin/feature-education` | Covers learning content; no standalone doc-coverage board. |
| 🟡 Drill/Practice editing | `/admin/drills` | Inventory is read-only; in-UI drill/practice-plan create/edit is a planned follow-up. |

---

## Recommended next (priority order)

1. ⬜ **Practice Plan Management** (`/admin/practice-plans`) — surface the
   practice-planner agent's plan templates (warmup, drills, pressure test,
   progression) as a browsable inventory like the Drill Library. *Required
   data: the practice-planner workflow + drill catalogs.*
2. ⬜ **QA / Testing board** (`/admin/qa`) — in-app test-scenario checklist per
   sport/feature, regression list, theme-contrast results.
3. ⬜ **Theme / Accessibility auditor** (`/admin/accessibility`) — surface the
   existing CI a11y/contrast checks in-app.
4. ⬜ **In-UI drill/practice editing** — promote the read-only Drill Library to
   create/edit backed by the local-first + optional-Supabase-mirror pattern.
5. ⬜ **AI analysis quality auditor** — extend `/admin/ai-analyses` with
   hallucination/consistency/safety-language/clarity scoring. *Required data:
   analysis outputs (needs AI vision connected).*
4. ⬜ **Accessibility/contrast auditor** (`/admin/accessibility`) — surface the
   existing CI a11y/contrast checks in-app. *Required data: CI artifacts.*
5. ⬜ **Copilot AI adapter** — wire a budget-capped model behind the existing
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
