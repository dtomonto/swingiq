# SwingVantage — agent operating guide

Read this before editing. It exists because the #1 source of breakage here is
**multiple agents editing the same checkout at once** (races on `master`, foreign
files swept into the wrong commit, broken production deploys).

## 1. Concurrency: work in your own git worktree

Several agents (interactive + scheduled) touch this repo simultaneously. Do **not**
edit the shared main checkout when other work may be in flight. Get an isolated
worktree first:

```bash
npm run wt create <task-name>     # → ../swiq-agents/<task-name> on branch agent/<task-name>
npm run wt list
npm run wt remove <task-name>
```

Each worktree is on its own `agent/<name>` branch off the latest `origin/master`,
in a sibling folder (not nested in the repo). A fresh worktree has no
`node_modules` — run `npm install` inside it once. Full rationale + rules:
**[docs/AGENT_WORKTREE_CONVENTION.md](docs/AGENT_WORKTREE_CONVENTION.md)**.

## 2. Landing changes on `master`

`master` is **branch-protected**: force-pushes and branch deletion are blocked, and
the standard path is a **PR that passes the required CI checks** (type-check, lint &
build · growth audit · Jest · security lint/typecheck · custom security checks ·
dependency audit). The repo admin/owner token can still fast-forward-push `master`
directly as a break-glass (this is how interactive + scheduled tasks publish today).

- **Interactive owner work / scheduled tasks:** ff-push as documented in the
  worktree convention (admin bypass).
- **Anyone else / when in doubt:** open a PR (`gh pr create --fill --base master`)
  and merge once the checks are green.
- **Never** use `--force`, never skip hooks (`--no-verify`), never disable branch
  protection to land code. Emergency only: `gh api -X DELETE repos/dtomonto/swingiq/branches/master/protection`.

## 3. Verify before you land

```bash
cd apps/web
npx tsc --noEmit
# Use a PRIVATE jest cache + runInBand to avoid concurrent-agent cache contention:
npx jest <area> --runInBand --cacheDirectory ./.jest-cache-<area>
```

The shared `%TEMP%\jest` cache races between agents and produces bogus
"Unexpected token" transform errors — that is contention, not a real failure.

## 4. House rules

- **Audit before building.** This codebase is large and mature — most "new"
  features are already ~80–95% built. Search first; reuse + extend, don't rebuild.
- **Never fabricate data.** Rankings, volumes, backlinks, traffic, metrics all carry
  an honest `DataSource` label (real / estimated / imported / placeholder / mock).
  Keyless-first: every integration has a working keyless mode and is OFF until a key
  is set (see `apps/web/src/lib/capabilities.ts`).
- **Admin/intelligence surfaces are admin-only + `noindex`.** Don't expose internal
  tooling, user data, or secrets publicly.
- **Absolute paths after `cd`.** A `cd` in the Bash tool shifts the working dir;
  Write/Edit with relative paths then land in a nested `apps/web/apps/web/…`. Use
  absolute paths.
- Commit messages end with the project's `Co-Authored-By` trailer; a post-commit
  hook auto-refreshes the feature/setup/audit registries (expect extra chore commits).

When in doubt, prefer the smallest reversible change and leave the tree clean.
