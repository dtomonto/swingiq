# Regenerating visual-regression baselines

_Last updated: June 2026_

The `E2E journeys (Playwright)` CI gate includes full-page visual-regression
snapshots (`apps/web/e2e/visual/redesign-visual.spec.ts`). When you intentionally
change anything that affects a captured page — the global header/footer, shared
layout, theme tokens, or the home / pricing / sample-report / trust pages — the
stored baseline PNGs no longer match and the gate fails **by design**. You then
need to regenerate the baselines and commit them.

## Why you usually can't just regenerate locally

The snapshots are **platform- and browser-specific**. Playwright names each file
`…-chromium-linux.png` (`{project}-{platform}`), and pixel output differs between
operating systems (font hinting, antialiasing). The CI gate runs on
`ubuntu-latest`, so baselines **must be generated on Linux with the same
Playwright version** the gate uses (pinned in CI to `@playwright/test@^1.60.0`).
Regenerating on macOS/Windows — or with a different Playwright build — produces
PNGs that still fail the Linux gate.

Some sandboxed/agent environments also can't reach Playwright's browser CDN or
GitHub's artifact host, which is exactly why the workflow below can commit the
result for you.

## Canonical path: the maintenance workflow

Use **`.github/workflows/update-visual-baselines.yml`** (manual `workflow_dispatch`).
It regenerates the baselines on the same `chromium-linux` image the gate uses.

### From the GitHub UI
1. Actions → **Update Visual Baselines** → **Run workflow**.
2. Pick your PR/feature branch as the ref.
3. Choose how to get the result:
   - **`commit_to_branch` unchecked (default):** the new baselines are uploaded as
     a `visual-baselines` artifact. Download it, drop the PNGs into
     `apps/web/e2e/visual/redesign-visual.spec.ts-snapshots/`, commit, and push.
   - **`commit_to_branch` checked:** the workflow commits the regenerated PNGs
     straight back to the triggering branch (use this when you can't download the
     artifact locally).

### From an agent / CLI (GitHub MCP or API)
Dispatch with the input set, e.g. `commit_to_branch: true`, targeting the branch
ref. The run regenerates on Linux and pushes the baseline commit for you.

## Re-triggering CI after a committed baseline

There's one wrinkle when `commit_to_branch` is used:

- **With a `BASELINE_PUSH_TOKEN` repo secret** (a PAT or GitHub App token with
  `contents: write`), the baseline commit is pushed with that token. A push made
  with a non-`GITHUB_TOKEN` credential **does** start a fresh CI run, so the E2E
  visual gate re-runs against the new baselines automatically — nothing else to do.
- **Without that secret**, the workflow falls back to the default `GITHUB_TOKEN`.
  GitHub's recursion guard means a `GITHUB_TOKEN`-pushed commit will **not** spawn
  a new workflow run (the run is created but sits in `action_required` with no
  jobs). Re-trigger CI yourself — the simplest way is an empty commit from your
  own identity:

  ```bash
  git commit --allow-empty -m "ci: re-trigger checks after CI-pushed visual baselines"
  git push
  ```

To remove the manual step permanently, add a `BASELINE_PUSH_TOKEN` secret
(Settings → Secrets and variables → Actions). A fine-grained PAT scoped to this
repo with **Contents: Read and write** is sufficient.

## Local regeneration (when not egress-restricted, on Linux)

If you're on Linux with network access and the CI-pinned Playwright version:

```bash
cd apps/web
npx playwright install --with-deps chromium
npx playwright test e2e/visual --update-snapshots   # builds + serves on :3100
```

Then review the changed PNGs and commit only
`apps/web/e2e/visual/**/*-snapshots/**`.

## Verifying

After the baselines land and CI re-runs, confirm the **E2E journeys (Playwright)**
check is green on the PR head. Because the snapshots are full-page, a real UI
regression and an intentional change look the same to the gate — so always eyeball
the regenerated PNGs (or the Playwright diff) before committing, to be sure you're
baselining the change you meant to make and not a bug.
