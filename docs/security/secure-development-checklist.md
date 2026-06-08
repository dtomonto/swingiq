# Secure Development Checklist

Run this before merging anything non-trivial and before launching a feature.
It maps to the securityOS posture checks, so a clean checklist keeps the
Security Health Score green.

## Access control (every new route/API)

- [ ] Does the route require auth where it should? (server-side, not just UI)
- [ ] Is the correct RBAC permission enforced for admin/sensitive routes?
- [ ] Added a test asserting a non-authorized role is **denied**.
- [ ] No IDOR: user-scoped data is filtered by the caller's identity.

## Input handling

- [ ] All external input is validated (zod / explicit checks).
- [ ] Public + AI endpoints are rate-limited (distributed limiter in prod).
- [ ] Oversized / malformed payloads are rejected cleanly.
- [ ] No user input is interpolated into queries/HTML without escaping.

## Secrets & data

- [ ] No secrets in client bundles or committed to git.
- [ ] No secrets/PII logged (use the securityOS redactor for audit metadata).
- [ ] New user-scoped tables have RLS policies.
- [ ] We collect only data that improves the product; nothing is sold.

## AI surfaces

- [ ] AI spend is bounded (`AI_DAILY_BUDGET_CENTS` armed when a paid provider
      is configured).
- [ ] User input to the model is treated as untrusted (prompt-injection aware).
- [ ] Model output is validated before it drives unsafe actions.
- [ ] System prompts / tool permissions are not exposed to users.

## Headers & transport

- [ ] CSP still covers any new origins/scripts you added.
- [ ] HSTS, frame-ancestors, referrer-policy, permissions-policy intact.

## CI / tests

- [ ] `npm run type-check` passes.
- [ ] Lint passes (incl. security rules where configured).
- [ ] Tests cover the security-relevant behavior you changed.
- [ ] Dependency-audit, secret-scan and SAST CI jobs are green.

## Before launch

- [ ] Re-run the securityOS scan; triage any new findings.
- [ ] No open critical/high findings on the surface you're launching.
- [ ] Runbook + docs updated if behavior changed.
