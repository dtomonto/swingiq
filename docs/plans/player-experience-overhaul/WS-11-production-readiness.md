# WS-11 — Production-readiness (authz, privacy, a11y, states)

> **Paste this entire file into a fresh Claude Code session.** Cross-cutting workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).

## Role
Hardening + audit pass over WS-01..WS-08. Run continuously as a checklist and as a focused
pass before WS-12. Fix gaps directly or file precise findings per workstream.

## Operating rules
- Worktree: `npm run wt create prod-readiness` → `cd ../swiq-agents/prod-readiness` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest --runInBand --cacheDirectory ./.jest-cache-prod` (scope as needed).
- Useful repo scripts (root): `npm run check:rls`, `npm run security:check`, `npm run check:honesty`, `npm run ci`.

## Checklist (verify + fix)
**Authorization / privacy**
- Server-side authorization on friend upload (WS-06) and friend profile access (WS-05) — never
  client-trusted. RLS as defense-in-depth on every new table (WS-08).
- No arbitrary user-id assignment from client; `athlete_user_id`/`assigned_by_user_id` derived
  from `auth.uid()` + verified friendship server-side.
- Safe privacy defaults (least access). No exposure of private videos/reports/sessions/profile
  data without explicit permission. Admin/intelligence surfaces stay admin-only + `noindex`.
- Durable audit metadata (`upload_audit_log`, append-only) records who/whom/when/why/status.

**Reliability / compatibility**
- Backward compatibility: existing upload/report/session flows still work; `athlete_user_id`
  defaults to legacy `user_id`; no broken routes.
- Idempotent, additive migrations only.

**UX quality**
- Accessible, mobile-first UI everywhere; loading / empty / error / permission-denied states for
  all new surfaces; no low-contrast/white-on-white.

**Tests**
- Tests exist for prioritization (WS-01), skill-tree updates (WS-03), friends (WS-05), and
  upload-for-friend authorization (WS-06). Add missing ones or file findings.

## Deliverables
- A `PROD-READINESS-AUDIT.md` in this plan dir: pass/fail per item with file references and
  follow-ups. Fix in-scope gaps; hand larger ones back to the owning WS.

## Definition of done
All checklist items pass or have tracked follow-ups; security scripts green; tsc/eslint/jest green.
See also `docs/plans/player-experience-overhaul/README.md`.
