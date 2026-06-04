# Agent Worktree Convention

_Last updated: June 2026_

---

## 📘 In Plain English (start here)

Several AI agents (and you) sometimes work on SwingIQ **at the same time**. If they
all edit the **same folder**, they trip over each other — one agent switching git
branches can yank the project out from under another mid-save, and commits can
accidentally sweep up someone else's half-finished work.

**The rule:** every concurrent agent works in its **own private copy** (a *git
worktree*). They all share the same history and target the same `master`, but
they never step on each other's files.

**You don't have to do anything** — this is guidance for the agents. The one
helper command below makes it a one-liner.

---

## The one command

```bash
# make (or refresh) an isolated worktree for an agent named e.g. "seo-content"
node scripts/agent-worktree.mjs create seo-content
# → prints a path like  C:\Users\dtomo\Desktop\swiq-agents\seo-content
#   on branch  agent/seo-content  (based on origin/master)

# when done
node scripts/agent-worktree.mjs remove seo-content
```

- Worktrees live in a **sibling folder**, `C:\Users\dtomo\Desktop\swiq-agents\<name>`
  (off OneDrive, not nested in the repo).
- Each is on its own branch **`agent/<name>`** based on the latest `origin/master`.
- A fresh worktree has **no `node_modules`** — run **`npm install`** inside it once.
  The worktree is reused across runs, so the install only happens the first time.
  (We deliberately do NOT junction/symlink `node_modules` — it's fragile on Windows
  and risks the recursive delete following the link into the main repo.)

---

## The workflow each agent follows

1. **Get an isolated worktree:** `node scripts/agent-worktree.mjs create <name>`.
2. **Sync to latest master** inside it: `git fetch origin && git rebase origin/master`
   (abort and report if it ever conflicts — don't force).
3. **Install deps if missing:** `npm install` (first time only).
4. **Do the work** there. Because the tree is private, `git add -A` is safe — no
   risk of capturing another agent's changes.
5. **Type-check / lint** in the worktree.
6. **Commit** on `agent/<name>`.
7. **Publish:**
   - **Interactive agents** (you asked for it live): push to master directly —
     `git push origin agent/<name>:master` (fast-forward; rebase first if rejected).
     No PRs (per project convention).
   - **Scheduled tasks:** **do NOT push.** Commit locally only and leave the
     branch for the owner to review and publish (see below). This matches the
     owner's standing rule that scheduled tasks never push.
8. **Tear down** when finished: `node scripts/agent-worktree.mjs remove <name>`
   (optional for long-lived task worktrees, which are reused each run).

---

## How the owner publishes a scheduled task's work

A scheduled task leaves its commits on `agent/<name>` locally. To publish them to
the live site, review the changes and run **one** command:

```bash
git -C "C:\Users\dtomo\Desktop\swingiq" push origin agent/<name>:master
```

Because the agent branch is just `origin/master` + the new commits, this is a
fast-forward — `master` updates and the changes go live on the next deploy. If
git rejects it (master moved), the next scheduled run rebases automatically;
just re-run the command after.

---

## Why not just share one folder?

We tried that and hit it twice in one session: another agent pushed to `master`
mid-commit, and another switched the shared tree to a feature branch while a
commit was in flight. Worktrees remove the entire class of problem — shared
history, isolated files.

---

## Notes & gotchas

- **One branch, one worktree.** Git won't let the same branch be checked out in
  two worktrees. That's why each agent gets its own `agent/<name>` branch.
- **`node_modules` per worktree.** Each worktree needs its own `npm install`
  (done once; reused). Expect the first run for a new worktree to take a few
  minutes; later runs are fast.
- **Stale worktree dir?** If `create` fails because the path exists but isn't a
  valid worktree, run `remove <name>` then `create <name>`.
- **OneDrive.** Keep the repo and worktrees on the **local Desktop**
  (`C:\Users\dtomo\Desktop\...`), not under OneDrive — OneDrive's file locks break
  worktree add/remove.
- **Scheduled tasks** that produce code (e.g. `seo-content-production-weekly`)
  already follow this convention automatically.
