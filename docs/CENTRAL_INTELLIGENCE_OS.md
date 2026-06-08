# CentralIntelligenceOS + Founding Members Campaign

## In Plain English (start here)

SwingVantage now has an **ethical "brain"** that quietly remembers each athlete —
their sport, skill, goals, equipment, sessions, and the issues they keep working
on — so the app gets **smarter and more personal over time** instead of starting
from scratch every visit. We call it **CentralIntelligenceOS**.

It powers three things you'll actually see:

1. **A slim "Founding Members: X / 1,000" bar at the top of every page.** Early
   users who **complete their profile** *and* **record 10 valid sessions** become
   one of the first **1,000 Founding Members** and get a permanent member number
   (e.g. *Founding Member #042*). Logged-in users see their own progress in the bar.
2. **An admin command center** at **`/admin/central-intelligence`** — your
   one-stop view of users, profiles, sessions, coaching patterns, the campaign,
   recommendations, and data governance.
3. **An achievement + trust UI** on the athlete's Profile and Settings pages —
   the Founding Member badge, session milestones, and clear, friendly controls
   over how their data is used (and an export/delete option).

**The promise we make and enforce in code:** user data is used *only* to improve
that user's experience and the product. It is **never sold**, **never exposed to
other users**, and aggregate insights are **always anonymized**.

**Paid membership tiers stay locked** until 1,000 Founding Members qualify — this
keeps the free-first launch intact. You can override that from the admin if needed.

> Nothing here charges money or sends email on its own. It's safe to ship.

---

## What was built

### The brain — `apps/web/src/lib/central-intelligence/`
Pure, local-first, keyless (no AI/keys required). Fully unit-tested.

| File | Purpose |
|------|---------|
| `config.ts` | Constants + the data-ethics guarantees. `FOUNDING_REQUIRED_COUNT=1000`, `FOUNDING_REQUIRED_SESSIONS=10`. |
| `types.ts` | The six memory layers, completion, sessions, founding, recommendations. |
| `profile-completion.ts` | Coaching-critical required fields **per sport** (golf, tennis, baseball, both softballs, pickleball, padel) + the scorer + next-best-field. |
| `sessions.ts` | What counts as a **valid session** + counting + per-source breakdown. |
| `founding.ts` | Qualification rules + membership-tier gate (pure). |
| `memory.ts` | Ethical memory builders + **coaching continuity** read-model + next-best-action. |
| `aggregate.ts` | Anonymized distributions with **k-anonymity** suppression + funnels. |
| `recommendations.ts` | Deterministic recommendations engine. |
| `snapshot.ts` | Adapter: main app store → engine inputs (incl. primary-sport derivation). |
| `store.ts` | Client local-first store: memories, consent, privacy prefs, cached claim, achievements. |
| `achievements.ts` | Founding Member badge + session milestones (1/3/5/10). |
| `sample-data.ts` | Clearly-labelled illustrative aggregates for the admin dashboard (keyless-first, like GrowthOS mock-data). |
| `founding-server.ts` | **Server-only.** Tamper-proof member-number assignment + membership gate. |
| `dashboard.ts` | **Server-only.** Composes the admin command center (live founding data + aggregates). |

### Server APIs — `apps/web/src/app/api/central-intelligence/`
- `GET /founding/progress` — **public**, privacy-safe campaign count for the banner (cached 30s).
- `POST /founding/claim` — **auth-guarded**; the server assigns the member number (never the client).
- `POST /admin/config` — **admin-guarded**; required count + membership override.

### UI
- `components/founding/FoundingFathersCounterBanner.tsx` — the global top bar (mounted once in `app/layout.tsx`).
- `components/founding/useFoundingProgress.ts` — composes local progress + global count + auto-claim.
- `components/founding/banner-content.ts` — pure per-state copy/CTA (unit-tested).
- `components/founding/FoundingProfileCard.tsx` — profile/session progress + badge + milestones (on `/profile`).
- `components/founding/DataTrustNote.tsx` — honest data-use copy.
- `components/founding/PrivacyControls.tsx` — personalization/product-improvement consent + export/delete (on `/settings`).
- `app/admin/central-intelligence/` — the command center (server page + client shell).

### Wiring
- Added **Central Intelligence** to the admin nav (`lib/admin/nav.ts`, Overview group).
- Added Founding/CI **analytics events** (`packages/core/src/analytics/events.ts`).

---

## How to verify locally

```bash
# From apps/web — run the CentralIntelligenceOS tests.
# NOTE: this machine has concurrent agents racing the shared Jest cache; use a
# private cache dir + a single worker for a clean run (see "Known gotcha" below).
npx jest src/lib/central-intelligence src/components/founding --runInBand --cacheDirectory ./.jest-cache-local
# → 54 passing (38 brain, 9 banner, 7 server)

# Typecheck (only pre-existing, unrelated errors remain — see below)
npx tsc --noEmit
```

In the running app:
1. Open any page → the **Founding Members: 0 / 1,000** bar shows at the top
   (hidden on `/admin` and auth pages).
2. Sign in, go to **/profile** → the **FoundingProfileCard** shows completion %,
   the next field to add, sessions X/10, and milestone badges.
3. Complete the profile + record 10 valid sessions → the banner flips to
   **"You're Founding Member #001!"** and the badge appears.
4. Visit **/admin/central-intelligence** → explore all nine panels; flip the
   membership-tier gate.
5. **/settings** → the **Privacy & your data** card: toggle consent, export, delete.

---

## Environment variables / manual setup

**None required to run** — everything works keyless (in-process) in dev.

**For real persistence of Founding Members across deploys:** the server reuses
the existing GrowthOS **`growth_records`** table (JSONB), with record kinds
`founding-member` and `founding-config`. If you've already applied the GrowthOS
Supabase schema, **no new migration is needed** — founding data persists
automatically once `SUPABASE_SERVICE_ROLE_KEY` is set. If not, founding data
lives in-process (fine for dev, resets on cold start).

Admin access uses the existing guard (`ADMIN_EMAILS` allowlist or `ADMIN_SECRET`).

---

## Risks & follow-ups (documented on purpose)

1. **Member-number atomicity.** Numbers are assigned as *(current count + 1)* and
   are idempotent per user (one record per user id). Under heavy *simultaneous*
   claims at launch scale this could in theory hand two people the same number.
   **Follow-up:** back the counter with a Postgres sequence / RPC for true
   atomic ordering. The client can never choose its own number regardless.
2. **Server-side eligibility re-derivation.** Identity is server-verified (the
   Supabase session) in cloud mode, but the *eligibility counts* (profile
   complete, valid sessions) are currently reported by the client's local-first
   store. **Follow-up:** re-derive the valid-session count from the relational
   sync tables (`lib/db`) so eligibility is fully server-authoritative. The
   `serverVerified` flag on each member record tracks this.
3. **Admin dashboard aggregates** use a clearly-labelled **sample** population
   until the relational aggregate is wired (the campaign numbers are already
   live). Replace `sample-data.ts` reads in `dashboard.ts` with real aggregate
   queries when ready.
4. **Jest cache gotcha (this machine).** Concurrent agents share `%TEMP%\jest`,
   which intermittently corrupts transforms ("Missing semicolon" on TS `!`).
   Use `--cacheDirectory <local>` (and `--runInBand`) for a clean run. The repo
   owner already has a durable project-local `cacheDirectory` fix locally.
5. **Pre-existing build breakage (not from this work).** On the local branch,
   `next build`/`tsc` already fail on unrelated files (`@/lib/security/client-ip`,
   `@/lib/seo/serialize-json-ld` missing; an `OverrideKind` mismatch). These
   exist on `origin/master` in working form — reconcile local master with origin.

## Privacy / legal review items before public launch

- Confirm the data-use copy (`DATA_ETHICS` in `config.ts`) matches the published
  Privacy Policy, and that "export / delete" satisfy your jurisdiction's rights
  (the in-app delete clears CentralIntelligence memory; wire full-account
  export/delete to the same controls).
- Log real per-user admin inspection to the audit log (`privacy_audit_logs`
  concept) before exposing any non-anonymized user record in the explorer.
- Keep aggregate cohorts above `AGGREGATE_MIN_COHORT` (10) — already enforced.
- Youth-safety: the campaign never personalizes ads and never exposes private
  session detail publicly.
