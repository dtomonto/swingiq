# SwingVantage Roadmap — completing the 25 recommendations

_Created 2026-06-09 from the full-codebase analysis. This is the execution plan for
the 25 high-impact recommendations, sequenced by leverage and dependency._

## How to read this

There are **two tracks** that run in parallel:

- **Track A — Owner setup (you):** pasting keys/secrets. Each item is already a
  live card at **`/admin/setup`** with copy-paste values and auto "Done" detection.
  ~60 minutes total; unlocks the most value of any work here.
- **Track B — Engineering (agent):** code/infra changes, shipped in phases with
  tests + verification.

A few items need **both** (e.g. Sentry: I wire the SDK, you paste the DSN).

> **Sequencing rationale:** Track A first (it makes the product real and lets us
> *measure*), then Track B Phase 1 (stop the churn + harden the foundation), then
> activation, security/trust, and performance/architecture. Don't start activation
> work (Phase 3) before analytics is connected — you'd be optimizing blind.

---

## Track A — Owner setup (~60 min, unblocks everything)

All at `/admin/setup`. Priority order:

| # | Rec | What to set | Why first |
|---|-----|-------------|-----------|
| 1 | Analytics | `NEXT_PUBLIC_POSTHOG_KEY` (free) | Measure activation/retention — every later decision depends on it |
| 2 | AI vision | `AI_VISION_PROVIDER` + reuse `ANTHROPIC_API_KEY` | Makes the core product real (not placeholders) |
| 3 | AI budget | `AI_DAILY_BUDGET_CENTS=500` | Caps spend before any traffic |
| 3 | Upstash | `UPSTASH_REDIS_REST_URL/TOKEN` | Makes the rate limit hold fleet-wide |
| 4 | Sentry | `SENTRY_DSN` (after I wire the SDK — Phase 1) | Prod error visibility |
| 6 | GSC data | `GSC_ACCESS_TOKEN` + `GSC_SITE_URL` | Real ranks/impressions in SearchIntelligenceOS |

**Definition of done:** `/admin/setup` shows green for these; `/api/capabilities`
reports `aiVision:true`, analytics detected.

---

## Track B — Engineering phases

### Phase 1 — Foundation & stop-the-churn  *(do first; unblocks safe iteration)*
> **✅ Phase 1 COMPLETE (2026-06-09).** All six items shipped to `master`. Agent-doable
> portion of #4 done — the Sentry seam was already wired; activation is now a guided
> `/admin/setup` card (owner pastes a DSN). #23 dependabot config already existed; the
> dead `framer-motion` dep was removed.

| Rec | Deliverable | Effort | Acceptance | Status |
|---|---|---|---|---|
| **5** Concurrency/hook | Change the pre-commit hook to stage **only its own generated files** (not `git add -A`); document worktree-first in CONTRIBUTING | M | A staged unrelated file is never swept into a commit; registry JSONs stop getting conflict markers | ✅ shipped (`94984077`) — hook was already pathspec-safe; hardened staging guidance in CLAUDE.md |
| **22** Registry refresh → CI | Move feature/setup/audit registry refresh off per-commit hook to a scheduled/pre-merge CI job (or debounce) | M | Commits no longer spawn 3 chore commits; no JSON races | ✅ shipped (`94984077`) — registry auto-commits now opt-in behind `SWINGVANTAGE_REGISTRY_AUTOCOMMIT` |
| **16** RLS CI gate | CI script asserting every `public.` table in `supabase-*.sql` has `ENABLE ROW LEVEL SECURITY`; add CODEOWNERS on `lib/security/*`, `middleware.ts`, SQL | S | CI fails if a new table ships without RLS | ✅ shipped (`e136fbd7`) — `scripts/check-rls.mjs` + Security Audit step + CODEOWNERS |
| **4** Error monitoring | Wire `@sentry/nextjs` (client+server+edge), gated on `SENTRY_DSN` (inert when unset) + a rate-limit/budget breach alert | S–M | Errors appear in Sentry once DSN is set; zero overhead when unset | ✅ seam already wired (instrumentation + `lib/observability/report.ts`); activation card shipped (`5f91cb5e`) — owner pastes DSN per docs/OBSERVABILITY.md |
| **23** Deps hygiene | `npm rm framer-motion`; add Dependabot/Renovate config + keep `npm audit` failing CI on high+ | S | framer-motion gone; weekly dependency PRs | ✅ shipped (`f5d44a12`) — unused framer-motion removed; `.github/dependabot.yml` already present |
| **25** ARCHITECTURE.md | Concise map: the OS surfaces, keyless-first capability model, RLS data flow, "audit-don't-rebuild" rule, worktree workflow | S–M | A new contributor/agent can orient in 10 min | ✅ shipped (`e1c4cd59`) — top-level `ARCHITECTURE.md` |

### Phase 2 — Activation & measurement  *(needs Track A #1 analytics)*
| Rec | Deliverable | Effort | Acceptance |
|---|---|---|---|
| **8** Activation funnel | Confirm every funnel step emits an event; build a funnel view (PostHog) for upload→#1 fix→drills→retest | M | Drop-off per step visible |
| **9** Save-progress prompt | At the first-analysis "aha", prompt to create an account/save (local-first → cloud bridge); tested | M | Prompt fires once, post-first-analysis; A/B-ready |
| **10** North-star | Dashboard tile + definition for **completed improvement loops**; wire to the activation engine | S | One number the team watches weekly |
| **11** E2E money paths | 3–5 Playwright journeys: upload→analysis→save, signup, pricing→checkout | M | Journeys run in the Tests workflow; a broken funnel fails CI |

### Phase 3 — Security, trust & youth-safety
| Rec | Deliverable | Effort | Acceptance |
|---|---|---|---|
| **12** F6 nonce CSP | Apply the turnkey guide (`docs/security/F6-nonce-csp.md`), env-gated `CSP_NONCE`; you validate on a preview | S (+owner preview) | No CSP violations on preview; `'unsafe-inline'` droppable |
| **16**→**RLS** | (shipped in Phase 1) | — | — |
| **13** Recruiting auth (F3) | Server-side, rate-limited, constant-time password check + server-side expiry/revocation for `/player/[slug]`; never ship `passwordHash` to client | M | Minor data never delivered before auth; gated before cloud sharing |
| **14** Data deletion | Self-serve "delete my account + data" (auth user + cascading rows + storage + local wipe) with confirm + SLA copy | M | A user can fully delete; documented retention |
| **15** Youth-safety/consent | EXIF strip on any stored video; explicit upload consent copy; non-personalized ad config defaults; COPPA/GDPR-K stance doc | M | No GPS/EXIF persisted; consent shown; ads default non-personalized |
| **17** Admin MFA | TOTP enrollment + enforcement for `ADMIN_EMAILS` accounts | M | Admin login requires a second factor |

### Phase 4 — Performance & architecture
| Rec | Deliverable | Effort | Acceptance |
|---|---|---|---|
| **18** RSC reduction | Audit the 402 `'use client'` files; convert provably-server ones to RSC; measure JS delta | M | Public-route initial JS drops; no behavior change |
| **19** Bundle budget | `@next/bundle-analyzer` (env-gated) + a CI per-route size budget | M | Size regressions fail CI |
| **20** Split data files | Shard `updates.ts` / `seoPages.ts` / `tutorial/videos.ts` into per-sport/category siblings | M | No file > ~600 lines; fewer merge conflicts |
| **21** Unified Command Center | One admin dashboard surfacing each OS's top signal/action (reuse `command-center/engine.ts`) | M | Owner sees everything important on one screen |

### Phase 5 — Growth ops & focus  *(ongoing discipline)*
| Rec | Deliverable | Effort | Acceptance |
|---|---|---|---|
| **7** Public-funnel focus | Freeze new admin-OS features one cycle; redirect effort to the public conversion path | discipline | Next cycle's commits skew public/funnel, not admin |
| **24** Content review | Quarterly cannibalization/quality pass via SearchIntelligenceOS (the audit flags 5 similar-title pairs today) | S–M | Merge/differentiate duplicates; clusters stay clean |

---

## Master mapping (all 25)

| # | Recommendation | Track | Phase | Effort |
|---|---|---|---|---|
| 1 | Analytics | Owner | A | S |
| 2 | AI vision | Owner | A | S |
| 3 | AI budget + Upstash | Owner | A | S |
| 4 | Error monitoring | Both | 1 | S–M |
| 5 | Fix commit-hook concurrency | Eng | 1 | M |
| 6 | GSC data | Owner | A | S |
| 7 | Public-funnel focus | Both | 5 | — |
| 8 | Activation funnel | Eng | 2 | M |
| 9 | Save-progress prompt | Eng | 2 | M |
| 10 | North-star metric | Eng | 2 | S |
| 11 | E2E money paths | Eng | 2 | M |
| 12 | F6 nonce CSP | Both | 3 | S |
| 13 | Recruiting auth | Eng | 3 | M |
| 14 | Data deletion | Eng | 3 | M |
| 15 | Youth-safety/consent | Eng | 3 | M |
| 16 | RLS CI gate | Eng | 1 | S |
| 17 | Admin MFA | Eng | 3 | M |
| 18 | RSC reduction | Eng | 4 | M |
| 19 | Bundle budget | Eng | 4 | M |
| 20 | Split data files | Eng | 4 | M |
| 21 | Unified Command Center | Eng | 4 | M |
| 22 | Registry refresh → CI | Eng | 1 | M |
| 23 | Remove framer-motion + Dependabot | Eng | 1 | S |
| 24 | Content cannibalization review | Eng | 5 | S–M |
| 25 | ARCHITECTURE.md | Eng | 1 | S–M |

**Agent can fully execute now:** 5, 16, 22, 23, 25 (Phase 1), 20 (Phase 4), 24 (Phase 5).
**Agent executes, you provide a key/DSN/preview:** 4, 12, plus everything in Phase 2 (after analytics).
**Owner only:** 1, 2, 3, 6.

## Suggested cadence
1. **You:** Track A keys (60 min) → unblocks Phase 2.
2. **Me:** Phase 1 in full (foundation/hygiene — no keys needed), shipped incrementally.
3. **Me:** Phase 2 once analytics is live; Phase 3 security; Phase 4 perf; Phase 5 ongoing.

Each engineering item ships as its own small, verified, path-staged commit (tsc +
tests + `audit:growth` green), per the worktree/branch-protection conventions in
`CLAUDE.md`.
