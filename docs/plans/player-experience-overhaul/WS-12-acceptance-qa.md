# WS-12 — Acceptance-criteria verification (closeout)

> **Paste this entire file into a fresh Claude Code session.** Closeout workstream of the
> SwingVantage "Player Experience Overhaul" (`docs/plans/player-experience-overhaul/README.md`).
> Run after WS-01..WS-11.

## Operating rules
- Worktree: `npm run wt create acceptance-qa` → `cd ../swiq-agents/acceptance-qa` → `npm install`.
- Explicit pathspec commits; never `git add -A`/`--force`/`--no-verify`. `Co-Authored-By` trailer.
- Verify full suite: `cd apps/web && npx tsc --noEmit && npx eslint . && npx jest --runInBand --cacheDirectory ./.jest-cache-qa`; root `npm run ci`.

## Objective
Verify the whole overhaul against the original acceptance criteria and produce a pass/fail report
with evidence (test names, screenshots/route checks, file refs). Fix only trivial gaps; file the rest.

## Acceptance checklist (from the original request)
- [ ] Today defaults to a focused, non-overwhelming view.
- [ ] Secondary data defaults collapsed and expands into meaningful detail.
- [ ] Visible Today items vary by user type, role, and skill level.
- [ ] Dashboard feels like a premium video-game player-selection/player-card experience.
- [ ] A skill tree is generated automatically for each player.
- [ ] Skill-tree nodes update from session/report/retest data.
- [ ] Skill tree connects to Today + athlete journey logic.
- [ ] Player profile acts as the structured intelligence hub.
- [ ] Friends list exists with secure request/accept/decline/remove flows.
- [ ] Users can upload videos for friends only when permission rules allow it.
- [ ] Friend-assigned videos are stored under the correct athlete profile.
- [ ] Audit metadata records ownership, uploader, assignment, permissions, status.
- [ ] Existing upload/report/session flows still work.
- [ ] Athlete journey, dashboard, profile, recommendation systems updated.
- [ ] Analytics events added.
- [ ] Tests pass.
- [ ] Build passes.
- [ ] No major accessibility, privacy, authorization, or design regressions.

## Deliverables
- `ACCEPTANCE-REPORT.md` in this plan dir: each item marked pass/fail with evidence + owner for
  any remaining gaps. Run the full build/lint/test and record results.

## Definition of done
Report complete; build/lint/test results recorded; all criteria pass or have tracked owners.
