# Feature Education Engine (FEE)

## In Plain English (start here)

Every time you ship a feature, this system makes sure that feature gets **taught** —
automatically. It watches what you build (your pages, admin tools, APIs and commits),
keeps a master list of every feature (the **Feature Registry**), and for each one it can
draft the whole learning kit: a **tutorial**, a **how-to guide**, a **manual**, an **FAQ**,
a **troubleshooting guide**, an **onboarding walkthrough**, **in-app help**, a **video
script**, a **release note**, **internal support notes**, a **public SEO help article**, and
a **staff academy lesson** — whichever ones that feature actually needs.

Nothing goes live on its own. You review the drafts in the admin dashboard
(**Admin → Content → Feature Education**), where each draft is **quality-scored** and
**security-scanned**. You approve what's good and publish it. The video scripts flow straight
into the Video Studio; release notes give you a ready-to-paste `Update:` line.

It's **deterministic and key-free** by default (no AI bill), **honest** (it never invents a
screen or setting — every draft is grounded in your real code), and it **flags drift** when the
product changes but the docs don't.

You don't have to do anything special: a git hook refreshes the registry on every commit. Just
open the dashboard now and then, generate packages for the features that need them, and approve.

---

## What it does (mapped to the brief)

| Capability | Where |
|---|---|
| Feature change detection (commits + routes + nav + APIs) | `scripts/scan-features.mjs`, `lib/feature-education/detection.ts` |
| Feature Registry (source of truth) | `lib/feature-education/types.ts` (`FeatureRecord`), snapshot `apps/web/src/data/feature-registry.json` |
| Documentation generation (12 written asset types) | `lib/feature-education/generators/*` |
| Video tutorial scripts/storyboards | `generators/videoBrief.ts` → reuses **Video Studio** `buildBrief` |
| Content quality scoring (13 dimensions) | `lib/feature-education/quality.ts` |
| Security / privacy scanning + redaction | `lib/feature-education/security.ts` |
| Documentation drift detection | `lib/feature-education/drift.ts` |
| Content gap dashboard | `lib/feature-education/coverage.ts` + `/admin/feature-education` |
| Publishing workflow + versioning + audit | `lib/feature-education/workflow.ts`, `repo.ts` |
| Release-note automation | `generators/publishing.ts` (+ emits an `Update:` trailer for the existing `/updates` pipeline) |
| In-app help integration | `components/feature-education/FeatureHelp.tsx` + `GET /api/feature-education/help` |
| Admin review dashboard | `/admin/feature-education` (overview, registry, gaps, drift) and `/admin/feature-education/[id]` |
| Reusable, versioned AI prompts | `lib/feature-education/prompts.ts` |
| Anti-hallucination | every asset carries `groundedIn` evidence; ungrounded/low-confidence → `needsHumanReview` |

---

## Architecture

```
lib/feature-education/
  types.ts        FeatureRecord, EducationAsset, versions, quality, security, drift, gaps + Zod
  repo.ts         persistence: in-memory (snapshot-seeded) OR Supabase (feature_education_*)
  detection.ts    classify changed paths → group → FeatureRecord (pure, deterministic)
  coverage.ts     which assets a feature warrants + gaps + coverage matrix
  quality.ts      13-dimension deterministic scorer (reuses Video Studio brand vetting)
  security.ts     secret/PII/internal-URL/admin-only scanner + redaction
  drift.ts        removed / changed / stale detection + proposed action
  workflow.ts     status machine + version snapshots + audit + publish targets
  prompts.ts      modular, versioned templates (deterministic skeleton + LLM contract)
  generators/     one generator per asset type + package orchestrator + LLM seam
  server/         data.ts (aggregation), guards.ts (admin/cron auth, reused from Video Studio)
app/api/feature-education/   scan · registry · feature/[id] · generate · review · publish · drift · gaps · help
app/admin/feature-education/  dashboard + per-feature detail
scripts/scan-features.mjs     git + filesystem scanner (runs in the post-commit hook)
```

**Reuse, not rebuild:** video generation is the existing **Video Studio**; release notes ride
the existing `Update:`/`Dev-Update:` → `/updates` pipeline; the admin shell, nav, components,
auth guard and repo shape all match the rest of the dashboard.

---

## How features are detected ("as they're pushed")

1. **On every commit**, the post-commit hook runs `scripts/scan-features.mjs`, which:
   - walks `apps/web/src/app` for real routes + API endpoints,
   - reads recent commits for what changed (with provenance) and honors a `Feature:` trailer,
   - writes the registry snapshot and commits **only** `feature-registry.json` (explicit
     pathspec — never `-A`; never pushes).
2. **In the dashboard**, **Scan now** re-detects from the live app map (Video Studio surfaces +
   admin nav) and recomputes coverage + drift.

### Declare a feature explicitly (optional)

Add a trailer to any commit — it's registered with high confidence:

```
feat(motion-lab): 3D capture for all sports

Feature: Motion Lab
Feature-Category: new-feature
Feature-Audience: new-user, returning-user
Feature-Routes: /motion-lab
Feature-Owner: dana
Feature-Status: active
```

Auto-detection covers everything else; low-confidence guesses are flagged **needs human
review** rather than trusted.

---

## Daily use

1. Open **Admin → Content → Feature Education**.
2. Work the **Gaps** tab (ranked by impact) or pick a feature from the **Registry**.
3. On a feature, click **Generate package** → drafts appear, each quality-scored + security-scanned.
4. Review a draft, then **Approve** → **Publish**.
   - Video scripts publish into the **Video Studio** pipeline.
   - Release notes show a ready-to-paste `Update:` trailer for `/updates`.
   - In-app help becomes queryable by route for `<FeatureHelp/>`.
5. Watch the **Drift** tab after big changes; the git hook keeps the registry fresh.

Drop in-app help anywhere: `<FeatureHelp route="/motion-lab" />` (renders nothing until help is
published for that route — safe to place proactively).

---

## Setup

- **Nothing required to start.** Runs key-free; the registry reads from the committed snapshot
  and drafts live in memory (the dashboard says so honestly).
- **Persist durably (optional):** apply `apps/web/supabase-feature-education.sql` in Supabase
  (SQL Editor → paste → Run). The repo auto-detects the service-role key and switches to durable
  storage.
- **Auto-refresh on push (optional):** `npm run hooks:install` (adds the registry refresh to the
  existing post-commit hook). Or run `npm run features:scan` manually.
- **Scheduled drift audit (optional):** `POST /api/feature-education/drift` with `CRON_SECRET`.

## Adding an LLM enhancer (optional)

Generation is deterministic by default. `enhanceAsset()` in `generators/index.ts` is a safe
no-op seam. To add polish, wire a provider behind it: it **must** preserve meaning, keep the
`groundedIn` evidence, honor `prompts.ts` `BRAND_CONTRACT`, and re-run quality + security before
returning. Respect the project's AI spend cap.

## Tests

`npm --workspace @swingiq/web run test -- src/lib/feature-education` — 57 tests across detection,
coverage/gaps, generators (incl. anti-hallucination), quality thresholds, security redaction,
drift, workflow, and the repo.

## Safety / guarantees

- **Honest:** no fabricated screens/settings; ungrounded drafts are flagged for review.
- **Safe to publish:** secrets/PII/internal-URLs/admin-only content are caught and block public
  publishing; the brand vetter blocks "guarantee"/medical/"never leaves your device" claims.
- **Reviewable + reversible:** every change snapshots a version; the audit log records who did
  what; nothing is public without explicit approval.
