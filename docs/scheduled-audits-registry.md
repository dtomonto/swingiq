# SwingVantage — Scheduled Audits & Automations Registry

_Last updated: 2026-06-05 · Source of truth for **what automated audits exist, how often they run, and what they do.**_

> **📘 In Plain English (start here).** SwingVantage runs a set of robots on a timer. Each one
> checks (or builds) one part of the product, fixes what's safe to fix, and writes a dated report —
> but **none of them ever push to GitHub or publish anything**. They only make local commits on your
> computer; **you stay the one who reviews and pushes.** This page is the catalog: every scheduled
> job, how often it runs, and what it's for. The separate
> [master-audit-report.md](master-audit-report.md) is different — that's the once-a-month *summary of
> everything they found*, not the schedule.

---

## 1. At a glance

| # | Audit / automation | What it does | How often | Runs at (local) | Writes to | Pushes? |
|---|---|---|---|---|---|---|
| S1 | **SEO / AEO / GEO audit** (`seo-aeo-geo-monthly-audit`) | Fixes safe technical SEO, enhances existing pages, drafts (never publishes) new content | **Monthly** — 1st of month | ~9:07 AM | `docs/audits/seo-aeo-geo/<date>.md` | ❌ local only |
| S7 | **AI features audit** (`ai-features-monthly-audit`) | Audits/improves AI video-vision, AI Coach/agents, prompts, model IDs, fallbacks, AI security & honest capability copy | **Monthly** — 1st of month | ~8:23 AM | `docs/audits/ai-features/<date>.md` | ❌ local only |
| S8 | **Build / CI health audit** (`weekly-github-build-audit`) | Checks GitHub PRs + failing CI/Actions and local type-check/lint/build; fixes safe breakages | **Weekly** — Mondays | ~8:47 AM | `docs/audits/build-health/<date>.md` | ❌ local only |
| S9 | **Engagement / retention audit** (`engagement-features-monthly-audit`) | Audits the "Today's Fix" engagement layer (framing copy, Swing Passport, ethical streaks, comeback flows, coaching tones, challenges, share cards); checks for dark patterns | **Monthly** — 1st of month | ~9:39 AM | `docs/audits/engagement/<date>.md` | ❌ local only |
| C1 | **SEO content production** (`seo-content-production-weekly`) | _Production, not an audit_ — builds the next 2 researched SEO pages from the content calendar | **Weekly** — Wednesdays | ~9:15 AM | New page files under `apps/web` | ❌ local only |
| M | **Master report compiler** (`monthly-master-audit-report`) | Merges every audit above into one executive report + dashboard + JSON | **Monthly** — 1st of month (runs last) | ~11:00 AM | `docs/master-audit-report.md` (+ `.json`, + `audit-action-dashboard.md`) | ❌ local only |

> The monthly jobs are deliberately staggered (8:23 → 9:07 → 9:39, then the compiler at 11:00) so the
> compiler runs **after** the audits it summarizes have finished writing their reports.

---

## 2. Audit details

### S1 — SEO / AEO / GEO audit
- **Task id:** `seo-aeo-geo-monthly-audit` · **cron:** `7 9 1 * *` (1st of each month, ~9:07 AM local)
- **What it does:** Runs the built-in SEO/AEO/GEO checks, fixes safe technical items (metadata,
  schema, sitemap, internal links), enhances existing pages, and **drafts** new content — never
  publishes. Writes a dated report.
- **Report:** `docs/audits/seo-aeo-geo/<YYYY-MM-DD>.md`
- **Push policy:** Local commits only — the owner reviews and pushes.

### S7 — AI features audit
- **Task id:** `ai-features-monthly-audit` · **cron:** `23 8 1 * *` (1st of each month, ~8:23 AM local)
- **What it does:** Audits, fixes, improves and enhances every AI surface — the AI video-vision
  analyzer, the AI Coach/agents, prompt quality, model IDs (prefers the latest Claude), prompt
  caching, error handling/fallbacks, input validation/security, and honest capability copy.
- **Report:** `docs/audits/ai-features/<YYYY-MM-DD>.md`
- **Push policy:** Local commits only — the owner reviews and pushes.

### S8 — Build / CI health audit
- **Task id:** `weekly-github-build-audit` · **cron:** `47 8 * * 1` (every Monday, ~8:47 AM local)
- **What it does:** Audits open/stuck GitHub PRs and failing CI/Actions, plus local type-check, lint
  and build; fixes safe breakages so the tree stays healthy week to week.
- **Report:** `docs/audits/build-health/<YYYY-MM-DD>.md`
- **Push policy:** Local commits only — the owner reviews and pushes.

### S9 — Engagement / retention audit
- **Task id:** `engagement-features-monthly-audit` · **cron:** `39 9 1 * *` (1st of each month, ~9:39 AM local)
- **What it does:** Audits and enhances the "ethical progress" engagement layer — Today's Fix
  returning-user card + `fixFraming` copy, Swing Passport milestones, ethical streaks + comeback
  flows, role coaching tones, challenges, coach-safe share cards, and coaching-language i18n. Actively
  checks for dark patterns/manipulation, honesty/determinism, accessibility, mobile-first and
  translation coverage.
- **Report:** `docs/audits/engagement/<YYYY-MM-DD>.md`
- **Push policy:** Local commits only — the owner reviews and pushes.

### C1 — SEO content production _(production task, not an audit)_
- **Task id:** `seo-content-production-weekly` · **cron:** `15 9 * * 3` (every Wednesday, ~9:15 AM local)
- **What it does:** Builds the next 2 researched SEO pages from the content calendar using the
  quality template. Listed here for completeness — it **produces** content rather than auditing it.
- **Output:** New page files under `apps/web` (drafts/pages, per the content calendar).
- **Push policy:** Local commits only — the owner reviews and pushes.

### M — Master report compiler
- **Task id:** `monthly-master-audit-report` · **cron:** `0 11 1 * *` (1st of each month, ~11:00 AM local)
- **What it does:** Reads the most recent report from every audit above and merges them into ONE
  executive master report, de-duplicated and traceable to sources. Also refreshes the companion
  at-a-glance dashboard and the machine-readable JSON.
- **Writes:** `docs/master-audit-report.md`, `docs/master-audit-report.json`, `docs/audit-action-dashboard.md`
- **Push policy:** Local commits only — the owner reviews and pushes.

---

## 3. Other automations (not on a per-task timer)

These run on a different trigger (CI on push, or a git hook) rather than the scheduled-task timer, but
are part of the same "robots keep the project healthy" picture:

| Automation | Trigger | What it does | Source |
|---|---|---|---|
| **Security CI pipeline** | Every push/PR + weekly (Mon 08:00 UTC) | Gitleaks secret scan, `npm audit` (fails on critical), lint/type-check, custom security scanner | `.github/workflows/security-audit.yml` |
| **Custom security scanner** | Every push (via CI) | Flags public secret vars, unsanitized HTML, `eval`, hardcoded keys | `security-reports/custom-check-results.txt` |
| **Auto-publish updates hook** | On commit with `Update:` / `Dev-Update:` trailer | Creates `/updates` (draft) + `/dev-updates` (live) entries | post-commit git hook (`npm run hooks:install`) |
| **Growth report / plan** | On-demand | Growth surface counts + weekly content/outreach plan | `npm run growth:report` · `npm run growth:plan` |

---

## 4. How this fits with the master report

This registry answers **"what audits exist and how often."** The
[master-audit-report.md](master-audit-report.md) answers **"what did they find this month"** — it is
recompiled on the 1st by the `monthly-master-audit-report` task (M above), which pulls every audit's
latest dated report into one prioritized, executive to-do list. The companion
[audit-action-dashboard.md](audit-action-dashboard.md) is the at-a-glance status board, and
[master-audit-report.json](master-audit-report.json) is the machine-readable mirror.

**Universal rule:** every scheduled job here commits **locally only and never pushes** — the owner
always reviews and pushes manually.
