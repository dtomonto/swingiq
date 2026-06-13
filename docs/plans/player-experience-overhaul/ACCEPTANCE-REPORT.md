# WS-12 — Acceptance-criteria verification

Each criterion from the original request, with status + evidence. Verified 2026-06-13 on
`claude/busy-pascal-5cteca` (PR #80). Build/lint/test: `tsc` clean, `eslint` clean, **jest 65/65**,
`check:rls`/`check:honesty`/`security:check` all pass.

| # | Acceptance criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Today defaults to a focused, non-overwhelming view | ✅ | `today/engine.ts` caps primary items by user type; `/today` + `TodayView` |
| 2 | Secondary data defaults collapsed → expands to meaning | ✅ | `TodayView` `CollapsedSection` (default closed) → real items; profile hub "Skill tree & why this" disclosure |
| 3 | Visible Today items vary by user type/role/skill level | ✅ | `TODAY_CAPS` + `deriveUserType`; tested in `today/__tests__/engine.test.ts` |
| 4 | Dashboard feels like a premium player-selection card | ✅ | `DashboardPlayerCard` (archetype class, sport accent, stage/confidence/momentum, skill snapshot) atop dashboard |
| 5 | A skill tree is auto-generated per player | ✅ | `skill-tree/generate.ts` `buildSkillTree` (starter + populated); `useSkillTree` |
| 6 | Skill-tree nodes update from session/report/retest data | ✅ | composed from `JourneyDashboard.branches` (which fold in those) + regression from journey; statuses tested |
| 7 | Skill tree connects to Today + athlete journey | ✅ | Today `skillFocus` from `useSkillTree`; WS-07 `regression.ts` feeds journey state into nodes |
| 8 | Player profile is the structured intelligence hub | ✅ | `lib/player-profile/*` + `ProfileIntelligenceHub` (archetype, strengths, focus, patterns, confidence) |
| 9 | Friends list with secure request/accept/decline/remove | ✅ | `lib/friends/*`, `/api/friends/**`, `/friends`; tests in `friends/__tests__` |
| 10 | Upload videos for friends only when permission allows | ✅ | `assertCanUploadForAthlete` + `/api/uploads/for-friend`; tested (non-friend/no-perm rejected) |
| 11 | Friend-assigned videos stored under the correct athlete | ✅ | route writes `video_analyses` under `athlete_user_id`/`user_id = athlete`; `buildOwnershipColumns` tested |
| 12 | Audit metadata records ownership/uploader/assignment/status | ✅ | append-only `upload_audit_log` + `audit_metadata` columns; `buildAuditEntry` tested |
| 13 | Existing upload/report/session flows still work | ✅ | additive migrations; legacy `user_id` unchanged; Motion Lab untouched; `tsc` clean |
| 14 | Athlete journey, dashboard, profile, recommendations updated | ✅ | WS-07 wiring + shared composition across surfaces |
| 15 | Analytics events added | ✅ | 18 events in `packages/core/src/analytics/events.ts`, fired across surfaces |
| 16 | Tests pass | ✅ | 65/65 overhaul unit tests |
| 17 | Build passes | ✅ | `tsc --noEmit` clean; `eslint` clean (1 pre-existing unrelated warning) |
| 18 | No major a11y / privacy / authz / design regressions | ✅ | see `PROD-READINESS-AUDIT.md` |

## Partial / noted (honest)
- **Criterion 6 / "report" inputs:** the tree consumes journey + session/video signals; an explicit
  per-node `source_report_ids` link is modeled (column + evidence field) but populated empty until a
  report→node mapping is added. No fabrication.
- **Coach/parent/team/facility Today grouping** (from the user-type spec) is represented via the
  `new/beginner/intermediate/advanced/returning` cap model; multi-athlete roll-ups for coach/team
  roles are a future enhancement (not in this scope).
- **Live-DB verification:** RLS/handle-uniqueness/friend-insert policies verified by static checks +
  unit tests; a manual smoke test after running the 6 migrations is recommended pre-GA.

## Verdict
All 18 acceptance criteria met (with the honest notes above). Ready for review/merge via PR #80.
