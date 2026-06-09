# Agent & contributor workflow (keep `master` green, avoid churn)

## Why this exists

Multiple agents work this repo at once. When several edit the **shared `master`
checkout** directly, three things go wrong, repeatedly:

1. **Lost work** — one agent's branch switch / reset reverts another's
   *uncommitted* changes.
2. **Red `master`** — in-flight work lands a `tsc`/naming break that blocks
   everyone's next push.
3. **Branch sprawl** — merged branches pile up (35+ at one point).

This document is the agreed workflow that prevents all three. It's guidance, not
enforcement — but the two automated guards below make it stick.

## The rules

1. **Never build directly in the shared `master` checkout.** Work in an
   **isolated git worktree off `master`**:
   ```bash
   git worktree add -b feature/my-thing ../swingiq-mything master
   ```
   Build, validate, and commit there. Your edits can't be clobbered by another
   agent's branch switch, and you can't clobber theirs.

2. **Validate before you land.** From the worktree: `npm run type-check` and
   `npm run check:naming` must pass. (The pre-push hook enforces this — see
   below.)

3. **Land by fast-forward / clean merge into `master`**, resolving only the
   auto-generated registry JSONs (take `master`'s — the hooks regenerate them).
   Never stash or overwrite another agent's *uncommitted* work — if a merge is
   blocked by someone's dirty tree, **wait** for them to commit.

4. **Push only when the owner asks** (`git push origin master:master`). Direct
   push to `master` is the agreed flow (the owner holds the branch-protection
   bypass); PRs are optional.

5. **Clean up after landing**: remove the worktree + its branch, and periodically
   prune merged branches:
   ```bash
   git worktree remove ../swingiq-mything --force
   npm run branches:prune          # dry-run
   npm run branches:prune -- --apply
   ```

## Automated guards (installed via `npm run hooks:install`)

- **`pre-push` hook** (`scripts/hooks/pre-push`) — on a push to `master`, runs
  three gates and **blocks** on failure: sitemap coverage → naming → type-check.
  This is what keeps `master` green. Emergency bypass: `git push --no-verify`
  (or `SKIP_TSC=1 git push` to skip just the slow type-check).
- **`post-commit` hook** — auto-publishes `Update:` / `Dev-Update:` trailers and
  refreshes the feature/setup/audit registries.

## Worktree note (Windows)

A fresh worktree has no `node_modules`. Junction them from the main checkout so
`tsc`/`jest` work, then remove the junctions before `git worktree remove`:

```powershell
New-Item -ItemType Junction -Path <wt>\node_modules           -Target <main>\node_modules
New-Item -ItemType Junction -Path <wt>\apps\web\node_modules  -Target <main>\apps\web\node_modules
New-Item -ItemType Junction -Path <wt>\packages\core\dist     -Target <main>\packages\core\dist
```
