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

### Staging on the shared checkout — the #1 way commits go wrong here

Multiple agents share one git index, so **`git add -A` / `git add .` / a bare
`git commit -a` will sweep another agent's in-flight files into your commit.**
This has caused real incidents (22 unrelated files in one commit).

- **Always stage explicit paths**, then **commit with a pathspec**:
  `git commit -m "…" -- path/to/file1 path/to/file2`. A pathspec commit records
  ONLY those paths even if something else is staged — it cannot sweep.
- After committing, **verify**: `git show --stat HEAD` (or `HEAD~1` if the
  post-commit hook moved HEAD) should list only your files.
- Better still: **work in a worktree** (§1) so you have your own index entirely.
- The post-commit hook itself is safe (it stages only its own JSON via pathspec);
  the risk is *your* broad `git add`, not the hook.

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
- **Announce user-facing work with commit trailers.** The same post-commit hook runs
  `generate-updates.mjs`, which turns two opt-in trailers into changelog drafts — so
  the public `/updates` and `/dev-updates` pages stay current automatically instead of
  needing hand-backfill. When a commit ships something worth announcing, add:
  - `Update: <one plain-English line for athletes>` → drafts a product update (`/updates`)
  - `Dev-Update: <one plain-English line about the outcome>` → drafts a developer update (`/dev-updates`)

  Both land as **drafts** (nothing goes public until flipped in the data file or
  `/admin/updates`), a leak-guard blocks secrets/paths, and entries are keyed by SHA so
  re-runs never duplicate. Use `Update:` only for genuinely athlete-facing changes;
  `Dev-Update:` for engineering milestones. Refactors/CI/dep-bumps get neither. Optional
  finer trailers (`Update-Category`, `Dev-Impact`, `Dev-Milestone`, …) are documented in
  `scripts/generate-updates.mjs` and `docs/AUTO_PUBLISH_UPDATES.md`.

  **Protect the product — both pages are public and competitor-readable.** Describe
  *what* changed and *why it helps an athlete*, never *how it's built*. Never name
  vendors, libraries, models, infra, internal system codenames, file paths, or
  config/env flags in `Update:`/`Dev-Update:` copy (or in the curated `DEV_UPDATES`
  seeds in `apps/web/src/data/devUpdates.ts`). The generator's leak-guard and a CI
  test (`devUpdates.test.ts`) both enforce this; see the policy in
  `docs/AUTO_PUBLISH_UPDATES.md` and the header of `devUpdates.ts`.

When in doubt, prefer the smallest reversible change and leave the tree clean.

---

# SwingVantage — product & design guide

## Product
SwingVantage is a premium AI-powered multi-sport swing improvement platform.

## Core promise
One fix. One plan. One retest.

## Design standard
The UI must feel premium, polished, mobile-first, trustworthy, and commercially credible.

## Sports
Golf, tennis, baseball, softball, pickleball, and padel.

Each sport should feel like its own branded product while still belonging to the SwingVantage parent system.

## Implementation principles
- Preserve existing functionality unless explicitly changing it.
- Prefer reusable components over page-specific UI.
- Use Tailwind CSS and shadcn/ui patterns where appropriate.
- Keep components composable.
- Avoid hard-coded one-off styling.
- Use design tokens where possible.
- Prioritize mobile-first UX.
- Run lint/build/tests after major changes.
- Do not introduce unnecessary dependencies.
- Keep accessibility, keyboard navigation, contrast, and semantic HTML in mind.
- Every major UI change should improve clarity, trust, and conversion.

## Core UX priorities
1. Homepage clarity
2. Sport-specific branded experiences
3. Upload / recording flow simplicity
4. AI report readability
5. Dashboard actionability
6. Today's Tasks usability
7. Admin publishing confidence
8. Privacy-forward trust signals

## QA expectations
After changes:
- Run lint
- Run typecheck if available
- Run tests if available
- Check mobile layouts
- Check empty states
- Check loading states
- Check error states
- Summarize risks
