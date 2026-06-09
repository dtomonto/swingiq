# BranchGuardianOS — Git/Worktree Governance OS

> Admin-only developer-operations system that inventories, scores, and governs
> every Git branch and worktree — keeping the repo clean, reducing stale work,
> and preventing accidental loss of work. **It never runs git for you.**

- **Dashboard:** Admin → Developer Operations → **BranchGuardianOS** (`/admin/branch-guardian`)
- **Permission:** `devops.manage` (super_admin + admin inherit it automatically)
- **Status:** noindex, admin-gated, server + local-first (no DB)

## What it does

1. **Inventory** — every local branch, remote ref, worktree, stash and the
   current in-progress operation (merge/rebase/cherry-pick), with last-commit
   date, author, ahead/behind main, upstream state, merged status and
   uncommitted/untracked changes.
2. **Branch & Worktree Health Scoring** — a transparent 0–100 score per branch
   and per worktree, plus an overall **Git Cleanliness Score**.
3. **Ranked, non-destructive recommendations** — stale/abandoned/merged/diverged
   branches, missing-upstream work, naming violations, risky untracked files,
   prunable/missing worktrees, stash backlogs — each with reason, evidence,
   recovery-first guidance, and copy-paste **command text** labelled by safety.
4. **Feeds** — pushes a "to do today" item into the Command Center and an
   untracked-secrets posture check into securityOS.

## The architecture (why it's safe by construction)

The Next.js app **never shells out to git**. Production (Vercel) has no `.git`
and a read-only filesystem. So the git inventory is produced out-of-band:

```
scripts/scan-branches.mjs   →  apps/web/src/data/branch-guardian-snapshot.json
   (read-only git commands)      (committed JSON snapshot)
          │
          ▼
lib/branch-guardian/snapshot.server.ts  (loads the committed JSON)
          │
          ▼
lib/branch-guardian/scan.ts  (PURE: scores branches + worktrees, derives recs)
          │
          ├─► /admin/branch-guardian          (dashboard)
          ├─► command-center signals          (a "to do today" item)
          └─► security-os posture             (untracked-secrets check)
```

The scoring/recommendation engine is **pure and isomorphic**, so the dashboard
re-runs the exact same scan client-side when you change thresholds — settings
are live. **Nothing in the app or browser ever executes git.** Cleanup is always
copy-paste command text you run yourself in a terminal.

### Files

| Area | Path |
| --- | --- |
| Snapshot generator (only place git runs) | `scripts/scan-branches.mjs` |
| Committed snapshot | `apps/web/src/data/branch-guardian-snapshot.json` |
| Pure engine | `apps/web/src/lib/branch-guardian/{types,naming,protected,scoring,recommendations,commands,scan}.ts` |
| Server wiring + guard | `apps/web/src/lib/branch-guardian/{snapshot.server,generate.server,access.server}.ts` |
| Client owner state | `apps/web/src/lib/branch-guardian/useBranchGuardian.ts` |
| Dashboard | `apps/web/src/app/admin/branch-guardian/{page,BranchGuardianDashboardClient}.tsx` |
| UI components | `apps/web/src/components/branch-guardian/BranchGuardianUI.tsx` |
| Tests | `apps/web/src/lib/branch-guardian/__tests__/branch-guardian.test.ts` |

## Scoring model

Both branch and worktree scores start at **100** and subtract transparent,
signed factors (each shown in the UI). Bands:

| Score | Band | Meaning |
| --- | --- | --- |
| 90–100 | Clean & active | well-structured, fresh |
| 70–89 | Mostly healthy | minor cleanup |
| 50–69 | Needs attention | |
| 25–49 | Stale / risky | |
| 0–24 | High risk | likely abandoned / broken |

**Branch deductions:** staleness vs the stale/abandoned thresholds; merged-but-
undeleted; commits behind main (and divergence); no-upstream unpublished work;
upstream `[gone]`; naming violations; uncommitted/risky files in its worktree.

**Worktree deductions:** missing path; git-prunable; checked-out branch gone;
detached HEAD; uncommitted/risky files; idle beyond the review threshold.

**Git Cleanliness Score** = `0.6 × branch-hygiene-avg + 0.4 × worktree-hygiene-avg`,
minus small penalties for an in-progress op, risky untracked files, or a large
stash backlog.

## Safety rules (the guarantees)

- **No git mutation path exists in the app or browser.** Commands are text only.
- **Protected branches are never deletion candidates:** `main`, `master`,
  `production`, `staging`, `develop`, `release/*`, `hotfix/*`, the detected main
  branch, plus any admin-configured patterns.
- **Every destructive command is labelled** (`destructive`) and **gated behind an
  explicit "Approve cleanup" confirmation** that only *reveals/copies* the
  command — it is never executed.
- **Recovery-first:** every recommendation shows backup guidance before any
  cleanup command.
- **Metadata only:** the snapshot stores no file contents; risky untracked files
  are shown by path only, and a conservative secret redactor runs at write time.
- **Audit log:** every action (review/snooze/approve/copy/settings) writes a
  redacted entry, kept locally.

### Recovery / backup commands

```bash
git branch backup/<name> <name>          # recoverable pointer
git diff main...<name> > <name>-backup.patch   # portable archive
git stash push -m "backup before cleanup"      # save uncommitted work
git worktree list                              # review before removing
git status --short                             # see what's uncommitted
```

## Branch naming convention

`<type>/<scope-or-system>-<kebab-description>` where `<type>` is one of:
`feature`, `fix`, `chore`, `hotfix`, `experiment`, `release`, `docs`, `refactor`.
Examples: `feature/branchguardianos-admin-dashboard`, `fix/theme-contrast`.
Non-conforming branches are **flagged** (low-severity), never blocked or renamed.

## Running it

```bash
npm run scan:branches            # refresh the committed snapshot
node scripts/scan-branches.mjs --print --no-write   # preview without writing
node scripts/scan-branches.mjs --main master        # force the main branch
```

The script is **read-only** and never pushes or deletes. It is **not** wired into
the post-commit hook (capturing HEAD every commit would churn a snapshot commit
each time). Run it manually, or on the **monthly** hygiene cadence (see
`docs/scheduled-audits-registry.md`). Commit the regenerated snapshot so the
dashboard shows fresh data; the UI shows an "as of" banner and warns when stale.

## Reviewing recommendations

1. Open `/admin/branch-guardian` → **Recommendations**.
2. Read the reason + evidence; follow the **recovery-first** guidance.
3. Copy the safe/dry-run commands and run them in your terminal.
4. For a deletion/removal, click **Approve cleanup** to reveal the destructive
   command, back up first, then run it yourself.
5. **Mark reviewed / Snooze / Dismiss** to manage the queue (saved locally).

## Deferred (fast-follow)

- Monthly-report **trend history** UI (score history already accrues daily).
- Admin **notifications** for high-risk items.
- Dedicated **GrowthOS / CentralIntelligenceOS** signal hand-offs (currently
  cross-reference links).
