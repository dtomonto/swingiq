# PublishingOS

> The operating layer that turns admin decisions into safe, live product changes —
> without manually running the project, editing files, committing and pushing.

PublishingOS replaces the old dead-end (_"View-only here. Publishing edits a
versioned data file, which the production filesystem can't write…"_) with a
durable, validated, observable, production-safe publishing workflow:

```
Draft → Review → Validated → Scheduled / Published → Live → Archived / Rolled-back
```

Admin surface: **`/admin/publishing`** (Overview · Publish Queue · Publishable
Areas Audit · Activity). Nav: _Overview → PublishingOS_ (gated by `content.publish`).

---

## 1. Architecture decision — Hybrid, with a durable publish-state override

The deployed runtime (Vercel) has a **read-only / ephemeral filesystem**, so the
previous model — `writeFileSync` into a versioned data file — can only work in
local dev. PublishingOS does **not** hack around that. It uses the durable store
already proven in this codebase.

| Layer | Where it lives | Why |
|---|---|---|
| **Content source-of-truth** | Git-tracked registries / data files (unchanged) | Editorial originals stay reviewable in source control. |
| **Publish _state_ (draft↔live)** | Durable DB override (`publishing_records`) | A toggle persists with **no filesystem write** — works on read-only hosts. |
| **New source files / generated pages** | Git commit / PR (deploy-backed) | Things that must live in source control publish via a PR job. |

This is the **hybrid** model from the brief. The same pattern as
`lib/growth/repository.ts` (`growth_records`): a single JSONB table keyed by
`kind`, written via the **service-role** admin client (bypasses RLS, only
reachable behind `requireAdmin()`), with a **graceful in-memory fallback** when
Supabase is not configured — so the whole flow is **keyless-first** and never
hard-fails.

### Publish modes the admin sees
| Mode | Meaning | Surfaces |
|---|---|---|
| **Instant** | Durable DB override; live immediately + route revalidated. | updates, dev-updates, SEO/blog publish-state, flags, announcements, roadmap. |
| **Requires deploy** | Git commit/PR + deploy. | brand-new SEO pages, milestone pages, trust/legal copy, structural sport config. |
| **Hybrid** | Some fields instant, structure deploy-backed. | SEO pages, sport config. |

The admin never sees engineering complexity — only: _Instant · Requires deploy ·
Queued · Deploying · Live · Failed · Rollback available_.

---

## 2. How the blocker is fixed (publish flow today)

`POST /api/admin/updates` (re-asserts admin + `content.publish`):

1. **Local dev** (writable FS) → writes the versioned data file (a git diff you
   commit & push). `mode: "file"`.
2. **Production** (read-only FS) → instead of a `409` dead-end, calls
   `recordPublishDecision()` which:
   - classifies **risk** (`lib/publishing/risk.ts`),
   - enforces the **status state machine** (`transitions.ts`),
   - writes a durable **override** + immutable **audit event** (`store.ts`),
   - returns `mode: "instant-db"`, `persistent: <bool>`.
   - the route then `revalidatePath()`s the affected public route.

Public read path (`/updates`) consumes the override via
`getEffectivePublicUpdates()` — **additive & reversible**: with no override
(keyless default, or nothing toggled) it returns exactly the previous output.

---

## 3. Data model (`lib/publishing/types.ts`)

- **PublishableEntity** — the versioned record (status, mode, risk, validation,
  deployment, affected routes/cache tags, version/previousVersionId).
- **PublishEvent** — immutable audit-trail entry (from→to status, actor, version).
- **PublishValidationResult** — checklist of `ValidationCheck`s + errors/warnings
  + advisory quality score.
- **PublishJob** — deploy-backed pipeline record (branch, commitSha, prUrl,
  deploymentStatus, retryCount).
- **PublishOverride** — the durable publish-state row public reads honour.

### Module map
| File | Responsibility | Purity |
|---|---|---|
| `types.ts` | Shared model | pure |
| `transitions.ts` | Status state machine | pure |
| `risk.ts` | Risk classification + confirmation depth | pure |
| `validation.ts` | Generic validation gate | pure |
| `entity-registry.ts` | Publishable Areas catalog | pure |
| `overrides.ts` | Public-read merge helpers | pure |
| `store.ts` | Durable persistence (Supabase + memory) | **server-only** |
| `service.ts` | `recordPublishDecision`, events | **server-only** |
| `admin-data.server.ts` | Dashboard aggregator | **server-only** |
| `public-updates.server.ts` | Override-aware `/updates` read | **server-only** |

---

## 4. Risk classification

| Level | Confirmation | Examples |
|---|---|---|
| **low** | one-click | updates, dev-updates, announcements, roadmap |
| **medium** | preview + affected routes | SEO/blog, homepage modules, nav, library videos |
| **high** | explicit confirm + validation + rollback plan | sport config, milestones, **feature flags**, **trust copy** |
| **critical** | **blocked from instant** — engineering/deploy review | auth/billing/secrets; destructive removals of high-stakes surfaces |

Destructive actions (`unpublish`/`rollback`/`archive`) on high-stakes surfaces
escalate one notch (e.g. unpublishing a feature flag → **critical** → blocked).

---

## 5. Validation

Generic gate (`validateEntity`): required title, URL-safe + non-colliding slug,
no placeholder/secret leakage, valid structured-data JSON, indexable-metadata
presence, thin-content minimum for rank-intended pages. Surfaces layer extra
checks (e.g. updates reuse `lib/updates/validation.ts` FAQ/internal-link depth).

---

## 6. Environment variables

PublishingOS instant publishing needs **no new keys** beyond the Supabase
service role already used by GrowthOS:

| Variable | Purpose | Required for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Durable instant publishing |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only write key (bypasses RLS) | Durable instant publishing |
| `ALLOW_UPDATES_WRITE=1` | Opt-in file writes on a writable self-host | Optional |

Deploy-backed publishing (Phase: PR jobs) will additionally use — all
**server-only**, none exposed to the browser bundle:

| Variable | Purpose |
|---|---|
| `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_INSTALLATION_ID` | GitHub App auth |
| `GITHUB_OWNER` / `GITHUB_REPO` / `GITHUB_DEFAULT_BRANCH` / `GITHUB_PUBLISH_BRANCH_PREFIX` | Target repo/branch |
| `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` | Deploy status polling |
| `PUBLISHINGOS_WEBHOOK_SECRET` / `PUBLISHINGOS_REVALIDATION_SECRET` | Webhook/revalidation auth |

**Enable durable publishing:** run `apps/web/supabase-publishing.sql` once in the
Supabase SQL editor, then ensure `SUPABASE_SERVICE_ROLE_KEY` is set. Until then,
PublishingOS still works (in-process, per-session) — the Overview banner says so.

---

## 7. Adding a new publishable entity type

1. Add a member to `PublishEntityType` (`types.ts`).
2. Add a baseline to `BASE_RISK` (`risk.ts`).
3. Add a registry row to `PUBLISHABLE_AREAS` (`entity-registry.ts`) with an
   honest `source` label and `recommendedAction`.
4. (If it has its own depth) pass `extraChecks` to `validateEntity`.
5. Wire its public read path through `applyOverrides(items, overrides, isBasePublished)`.

No schema migration is needed — the JSONB store is generic.

---

## 8. Security checklist

- ✅ All writes re-assert `requireAdmin()` + `content.publish` server-side.
- ✅ Service-role key is **server-only**; never imported by client code.
- ✅ RLS enabled with **no** public policies on `publishing_records`.
- ✅ No GitHub/deploy tokens stored in the DB.
- ✅ Drafts/review/failed never render publicly (`isPubliclyVisible`).
- ✅ Risk-gated confirmation; critical actions blocked from instant.
- ✅ Every state change recorded in an immutable audit event.
- ✅ Validation blocks secret/credential leakage into public content.

## 9. Testing checklist

`npx jest src/lib/publishing --runInBand --cacheDirectory ./.jest-cache-pub`
covers: state machine, risk (incl. escalation), validation, override merge
(additive no-op), registry integrity, and the service (durable publish,
unpublish, critical-block, high-risk-ack, audit feed). **37 tests; no real
secrets; the store runs memory-backed in tests.**

## 10. Known limitations / next steps

- **Public-read wiring** is live for `/updates`; `/dev-updates`, `/blog`,
  `/learn`, milestones and homepage modules are **db-ready** but not yet merged
  into their public read paths (tracked in the Publishable Areas Audit).
- **Deploy-backed PR jobs** (`PublishJob`) are modelled but the GitHub-App
  executor is a documented stub — instant (DB) publishing is fully live.
- **Scheduling** (`scheduledFor`) is modelled; the cron executor is not yet wired.
- The in-memory fallback is **per server process** — configure Supabase for true
  durability across serverless invocations.

---

## 11. Design workflow — Stitch ideation

PublishingOS UI directions were explored with Google Stitch
(`stitch.withgoogle.com`) as **rapid concept exploration only** — outputs are
normalized to the existing dark admin design system (shadcn/Tailwind tokens),
accessibility-reviewed, and QA'd before shipping. Three directions are
implemented and **switchable live** in `/admin/publishing` so the real data can
be compared under each: **A · Mission Control** (cyan), **B · Calm Enterprise**
(indigo — the **default**), **C · Sport-Tech** (magenta)
(`components/admin/publishing/directions.ts`). The operator's choice persists
device-locally (`lib/admin/publishing-prefs.ts`) and the switcher lives in a
sticky header so it is reachable at any scroll position.

**Colour rule:** the status palette — emerald = live/published, amber =
high-risk, red = critical, sky = info, violet = deploy-backed — is **reserved
for status**. Every direction's brand accent sits OUTSIDE that palette so the
accent never reads as a status. (C originally used emerald, which collided with
"live"; it was re-skinned to magenta.)

### Stitch prompt pack
Each prompt was run against the four visual moods (premium dark command center /
clean enterprise SaaS / sport-tech performance dashboard / calm editorial suite).

1. **PublishingOS Command Center** — _"A premium SaaS admin command center for
   managing live product publishing. Top: environment status (Local file-backed /
   Durable DB / Ephemeral). A stat ribbon: Live, Drafts, High-risk, Published,
   Failed, Areas. Below: a Publish Queue table and a Recent Activity feed. Calm,
   dense, status-led; one obvious primary action per row."_
2. **Publishable Areas Audit** — _"A dashboard map of every admin-controlled
   product area: columns Area, Entity Type, Current Source, Publish Mode, Risk,
   Live Connection, Last Published, Owner, Recommended Action. Filters for
   Live-connected / Draft-only / File-backed / Mock-backed / Needs-integration /
   High-risk / Ready."_
3. **Publish Detail** — _"Single-item workflow: content summary, before/after
   diff, validation checklist, SEO preview, affected routes, risk explanation,
   version history, audit trail, one primary action + confirmation state."_
4. **SEO Publishing Flow** — _"Metadata editor with H1/title/meta preview,
   canonical preview, schema JSON validation, internal-link checklist, sitemap
   inclusion, index/noindex control, content-quality score, thin/duplicate
   warning, preview URL."_
5. **Sport Configuration Flow** — _"Sport selector, config editor, before/after
   diff, affected modules + landing pages, coaching-config preview, risk
   confirmation, rollback target."_
6. **Rollback Flow** — _"Previous versions list, compare current vs selected,
   impact summary, confirmation modal with rollback reason, audit log entry,
   revalidation status."_

---

## 12. Design workflow — Figma handoff spec

Treat Figma as the **source of truth** for the design system; the production UI
maps cleanly to shadcn/ui + Tailwind. Recreate (or import) this structure:

**Pages:** `00 Cover / Intent` · `01 Tokens` · `02 Admin Components` ·
`03 PublishingOS Screens` · `04 Flows` · `05 States & Edge Cases` ·
`06 Responsive` · `07 Dev Handoff` · `08 QA Checklist`.

**Tokens (map to existing Tailwind/CSS vars):**
- Status: `published=emerald-400`, `draft=gray-400`, `scheduled=sky-400`,
  `failed=red-400`, `rolled_back=amber-400`, `archived=gray-600`.
- Risk: `low=gray`, `medium=sky`, `high=amber`, `critical=red`.
- Mode: `instant=emerald`, `deploy_backed=violet`, `hybrid=sky`.
- Radius `lg/xl/2xl`; spacing 4-pt; the three direction skins encode density &
  accent (`directions.ts`).

**Components:** Admin shell · Page header · Stat tile · Status badge · Risk badge
· Publish-mode badge · Validation checklist · Deployment timeline · Before/after
diff · Publish queue row · Draft card · Version-history row · Audit-log row ·
Empty/Error/Permission-denied states · Confirmation modal · Rollback modal · SEO
preview card · Sitemap/indexing card · Affected-routes list · Entity-type
selector.

**Interaction states to prototype:** idle · loading · validating · validation-
failed · ready · publishing · queued · deploying · live · failed · rolled-back ·
archived · unauthorized · stale-version-conflict.

**Design QA rules (Part 13):** one obvious primary action per screen · every
risky action explains itself and confirms · every failure says what happened +
what to do next · every empty state educates · tables stay scannable · statuses
are understandable without engineering knowledge · actions feel reversible.
