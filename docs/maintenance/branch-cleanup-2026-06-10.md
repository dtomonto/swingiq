# Branch / worktree / remote cleanup — 2026-06-10

A governance cleanup of merged and redundant Git refs, run by an interactive agent with
owner approval. Recorded here so the deletions are auditable and the outstanding manual
follow-ups don't get lost. Related: [BranchGuardianOS](../BRANCH_GUARDIAN_OS.md),
[Agent worktree convention](../AGENT_WORKTREE_CONVENTION.md).

## How "merged" was judged

By **patch-id** (`git cherry origin/master <branch>`), not raw diff. Squash- and rebase-merged
work counts as merged even when the branch tip is not an ancestor of `master`. A plain
`git diff origin/master <branch>` is misleading for old-based branches — it reports hundreds
of files that merely reflect `master` having advanced, not unique work on the branch.

## Deleted

**17 local branches**

- `agent/a11y-contrast`, `agent/docs-consent`, `agent/connector-os`, `agent/blog-content`,
  `agent/pubos-cron`, `agent/seo-dedupe-vibora`, `agent/a11y-hero-contrast`
- `chore/pickleball-padel-extras`
- `feature/phase89-readiness-sport`, `feature/fast-analyzer`, `feature/mobile-optimization`,
  `feature/phase1-onboarding-ux`, `feature/athlete-general-intelligence`
- `ship-connector-os`, `integration/recording-hardening`
- `claude/motionlab-e2e-a11y`, `fix/sport-sessions-rerender`

**9 worktrees** — fast-analyzer, mobile-optimization, blog-content, connector-os, pubos-cron,
seo-dedupe-vibora, recording-hardening, swingiq-phase1-wt, swingiq-agi-wt. Removed with
`git worktree remove` **without** `--force`, which refuses a dirty tree — a deliberate safety
net against destroying a concurrent agent's uncommitted work.

**25 merged remote branches** — the full `git branch -r --merged origin/master` set. Verified
no open PR pointed at any of them. `origin/master` advanced mid-run (`cc93e08d → ec3dd06f → …`);
each branch's merged status was re-checked immediately before its delete.

## Preserved (intentionally NOT deleted)

- **Worktrees with real uncommitted work** (their branches are merged, but the trees are not):
  `swiq-agents/design-lab` (`agent/design-lab`) and `swiq-agents/sport-shell-hero`
  (`agent/sport-shell-hero`). A naive "merged branch" sweep would wrongly flag these.
- **Genuinely unmerged branches:** central-intelligence-os, ra-phase3, seo-dedupe,
  phase11-emergency, growthos, milestone-authority-system, todays-command-center,
  club-score-explanations, vigilant-*, motionlab-handoff.
- `backup/master-pre-reset-2026-06-08` (intentional backup) and both open-PR branches
  (#19 `claude/hero-glow-a11y-contrast`, #12 `claude/vigilant-meitner-mcba9r`).

## Outstanding manual follow-ups

1. **Locked orphan directory** `C:\Users\dtomo\Desktop\swiq-agents\a11y-hero-contrast`.
   A live process held `…\apps\web` open, so the physical directory could not be deleted
   (Git had already unregistered the worktree and its merged branch was deleted). Remove it
   once the process exits:
   ```powershell
   Remove-Item -LiteralPath "C:\Users\dtomo\Desktop\swiq-agents\a11y-hero-contrast" -Recurse -Force
   ```
2. **Two patch-id-redundant remotes** left in place (their content is on `master` but they
   were not in the ancestry-merged set, so they were excluded from the 25):
   `origin/claude/motionlab-e2e-a11y` and `origin/fix/sport-sessions-rerender`. Safe to
   `git push origin --delete` if desired.

## Gotcha for next time

Do **not** run `git worktree prune` after a `git worktree remove` that failed with
"Permission denied". `prune` unregisters the still-on-disk worktree, and because the failed
`remove` already broke that worktree's `.git` link, `git worktree repair` then fails with
"`.git` file broken" — leaving an unrepairable orphan directory (exactly follow-up #1 above).
If a `remove` is permission-denied, leave the worktree registered and retry later instead.
