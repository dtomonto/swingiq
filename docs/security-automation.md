# Security Automation Guide

This document explains the automated security systems that run on every push and pull request to the SwingIQ repository.

---

## 📘 In Plain English (start here)

**What this page is:** A description of the automatic safety checks that run by themselves every time the app's code is changed on GitHub.

**What you actually need to know:**
- These checks run **on their own** — you don't start them or watch them. Every code change is automatically scanned for leaked passwords, known security holes in outside software, and coding mistakes.
- The one-time setup that's on you is in GitHub's settings (also listed in [OWNER_TASKS.md](OWNER_TASKS.md)): turning on secret scanning, Dependabot, and "branch protection" (a rule that stops bad code from being merged).
- **Dependabot** is a helper that automatically suggests fixes when outside software the app relies on has a security update. When it opens a suggestion and the checks pass, you can accept it.

**What to do next:** Do the GitHub security switches in [OWNER_TASKS.md](OWNER_TASKS.md). You can ignore the command-line examples on this page unless a developer or AI assistant is helping you.

> The rest of this page (workflow names, commands, `git filter-repo`, etc.) is for a developer or an AI assistant maintaining the project. None of it is required to run SwingIQ.

---

## Overview of Workflows

### 1. `security-audit.yml` — Main Security Audit

**Triggers:** Every push to any branch, every pull request targeting `main`/`master`, manually via GitHub Actions UI, and on a weekly schedule (Mondays at 8:00 AM UTC).

This workflow runs four jobs in parallel:

| Job | What it Does | Fail Condition |
|---|---|---|
| **Secret Scan** | Gitleaks scans every commit for accidentally committed secrets | Any secret found |
| **Dependency Audit** | `npm audit` checks for known CVEs in your dependencies | Any critical CVE |
| **Lint & Typecheck** | ESLint + TypeScript compiler check for code quality | Any lint error or type error |
| **Custom Security Checks** | `scripts/security-check.mjs` scans source code for anti-patterns | Any critical finding |

### 2. `codeql.yml` — CodeQL Static Analysis

**Triggers:** Push or pull request to `main`/`master`, weekly schedule.

GitHub's CodeQL engine performs deep static analysis of JavaScript and TypeScript code looking for security vulnerabilities like SQL injection, XSS, path traversal, and other OWASP Top 10 issues. Results appear in the GitHub Security tab under "Code scanning alerts."

---

## How to Read Audit Reports

After each workflow run, security reports are saved as **artifacts** that you can download from the GitHub Actions run page:

- `npm-audit-report` — JSON output from `npm audit`. Shows each vulnerable package, its severity, and whether a fix is available.
- `custom-security-report` — Plain text output from the custom check script. Lists each finding with the file path and line number.

**To download an artifact:**
1. Go to your GitHub repository → Actions tab
2. Click on the workflow run
3. Scroll to the bottom of the run summary page
4. Click the artifact name to download it

---

## Branch Protection Settings to Enable Manually

These settings require a GitHub repository admin to configure. Go to: **Repository → Settings → Branches → Add branch protection rule** for `main`/`master`.

Recommended settings:

- **Require a pull request before merging** — Prevents direct pushes to main
- **Require status checks to pass before merging** — Add these required checks:
  - `Secret Scan (Gitleaks)`
  - `Dependency Audit (npm audit)`
  - `Lint & Typecheck`
  - `Custom Security Checks`
  - `CodeQL Analyze (javascript-typescript)`
- **Require branches to be up to date before merging** — Prevents stale branches
- **Require review from Code Owners** — Enforces CODEOWNERS file for sensitive paths
- **Do not allow bypassing the above settings** — Applies rules to admins too

---

## How Dependabot Works

Dependabot automatically opens pull requests to update outdated or vulnerable dependencies.

**What it monitors:**
- `apps/web` npm dependencies — weekly
- Root workspace npm dependencies — weekly
- GitHub Actions versions in `.github/workflows/` — weekly

**How updates are grouped:**
- Minor and patch version bumps are batched into a single PR per package ecosystem (less noise)
- Major version bumps get individual PRs because they may contain breaking changes

**What to do when a Dependabot PR arrives:**
1. Review the changelog linked in the PR description
2. Check if the CI workflow passes on the PR
3. If CI is green and the change looks safe, merge it
4. For major version bumps, test locally before merging: `npm install` then `npm run dev`

---

## How to Handle a Failed Secret Scan

If Gitleaks finds a secret in your code, the workflow will fail immediately.

**Steps to resolve:**

1. **Rotate the secret immediately.** Assume it is compromised. See `SECURITY.md` for rotation links for each secret type.

2. **Remove the secret from your code.** Find and delete the hardcoded value.

3. **Remove it from git history.** A secret that was ever committed remains in git history even after deletion. Use `git filter-repo` or contact GitHub support to purge it:
   ```bash
   # Install: pip install git-filter-repo
   git filter-repo --path-glob "*.env*" --invert-paths
   # Or to remove a specific string from all commits:
   git filter-repo --replace-text <(echo "ACTUAL_SECRET_VALUE==>REDACTED")
   ```
   Note: This rewrites history and requires a force push. Coordinate with your team.

4. **Add the pattern to `.gitleaks.toml`** if it was a false positive (e.g., a placeholder value in a test file).

5. Re-push once the history is clean.

---

## How to Handle a CVE Alert

**From Dependabot (automated):**
- Dependabot will open a PR automatically for packages with known CVEs
- Review and merge the PR — CI must pass before merging
- If Dependabot cannot auto-fix (e.g., no patched version exists), the PR will note this; you may need to find an alternative package

**From `npm audit` workflow failure:**
1. Run `npm audit` locally to see the full report
2. Run `npm audit fix` to auto-apply safe patches
3. For breaking changes: `npm audit fix --force` (review the diff carefully)
4. If no fix is available, assess the risk:
   - Is the vulnerable code path reachable in SwingIQ?
   - Can you add a temporary `npm audit` exception in the workflow until a fix ships?

**From CodeQL (code scanning alert):**
1. Go to **Security → Code scanning alerts** in GitHub
2. Click the alert to see the file and line number
3. Follow the remediation guidance shown in the alert
4. Fix the code, push, and the alert will auto-close when CodeQL re-scans

---

## Custom Security Check Rules

The `scripts/security-check.mjs` script enforces these rules:

| Rule | Severity | Description |
|---|---|---|
| `PUBLIC_SECRET_VAR` | Critical | `NEXT_PUBLIC_*KEY/SECRET/TOKEN/PASSWORD` — secret exposed to browser |
| `DANGEROUS_HTML_NO_SANITIZE` | Critical | `dangerouslySetInnerHTML` without a sanitization comment nearby |
| `EVAL_USAGE` | Critical | `eval()` usage anywhere in source code |
| `HARDCODED_API_KEY` | Critical | Literal strings starting with `sk-proj-`, `sk-ant-`, or `AIza` |
| `CONSOLE_LOG_IN_API_ROUTE` | Warning | `console.log` inside `src/app/api/` routes |

To run the custom check locally:
```bash
npm run security:check
```

To run all security checks at once:
```bash
npm run security:all
```
