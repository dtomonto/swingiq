# Security Testing

How SwingVantage tests for security regressions, and how to run each check.
These map directly to securityOS Secure-Development-Lifecycle posture checks.

## In CI today (`.github/workflows/`)

- **Secret scanning** — Gitleaks (`security-audit.yml`). Fails on a detected
  secret.
- **Dependency audit** — `npm audit` (`security-audit.yml`). Fails on critical,
  warns on high; uploads a report artifact.
- **SAST** — CodeQL (`codeql.yml`, `security-and-quality` queries).
- **Lint + typecheck** — ESLint + `tsc --noEmit`.
- **Custom security checks** — `scripts/security-check.mjs`.

## Run locally

```bash
# From repo root
npm audit --audit-level=high                 # dependency vulnerabilities
node scripts/security-check.mjs              # custom checks

# From apps/web
npm run type-check                           # types
npm test -- security-os                      # securityOS unit tests
```

## securityOS unit tests

`apps/web/src/lib/security-os/__tests__/security-os.test.ts` covers:

- score weighting + the `unknown`-excluded honesty rule,
- posture-check evaluation (pass/partial/fail/unknown),
- findings derivation + risk scoring,
- recommendation bucketing/priority,
- audit-log secret redaction,
- `security.manage` access gating (non-admin denial via RBAC).

## Phase 2 additions

- Prompt-injection / AI red-team suite (results → findings).
- Playwright security smoke tests for auth/admin routes.
- API abuse / rate-limit smoke tests.
- OWASP ZAP baseline (CI adapter or documented manual run).
