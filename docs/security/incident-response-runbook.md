# Incident Response Runbook

Fast-path playbooks for the incidents most likely to affect SwingVantage.
Keep rotation steps, contacts and environment-variable names current. The
in-app mirror of these lives at `/admin/security-os/runbooks`.

## General flow

1. **Contain** — stop the bleed (disable a route/flag, rotate a key).
2. **Assess** — what was exposed, for how long, to whom.
3. **Eradicate** — remove the cause; add a test/control so it can't recur.
4. **Recover** — restore normal operation; verify.
5. **Review** — record a securityOS finding; do a short write-up.

## A secret / API key is exposed

1. Rotate the key at the provider immediately; revoke the old one.
2. Update the value in the host environment (Vercel) and redeploy.
3. Search git history (`git log -p`, Gitleaks) for the secret. If it was ever
   committed, treat the key as fully burned — rotation is mandatory.
4. Confirm the Gitleaks CI job is active so it can't recur; log a finding.

## An admin account is compromised

1. Remove the email from `ADMIN_EMAILS`; rotate `ADMIN_SECRET`.
2. Rotate Supabase keys if sessions may be affected; redeploy to invalidate.
3. Review `/admin/audit-log` and `/admin/security-os/audit-logs` for actions
   taken by the account.
4. Re-grant access with least-privilege `ADMIN_ROLES` after verification.

## The AI system leaks sensitive data

1. Disable the affected AI route (feature flag / env) to stop the leak.
2. Reproduce safely; add a red-team test that captures the failing prompt.
3. Add output redaction / system-prompt hardening; verify the test passes.
4. Review AI logging for over-collection; log a finding.

## Suspicious user activity spikes

1. Check rate-limiter metrics and AI-budget consumption.
2. Confirm `AI_DAILY_BUDGET_CENTS` is armed; lower it temporarily if needed.
3. Ensure the distributed (Upstash) limiter is active so limits hold fleet-wide.
4. Block abusive patterns; log a finding and monitor.

## A dependency vulnerability is found

1. Assess exploitability and whether the code path is reachable.
2. Patch to a fixed version; run tests.
3. If no fix exists, apply a mitigation or **accept risk with justification**
   in securityOS.
4. Confirm the dependency-audit CI job would catch a regression.

## Uploaded media is abused

1. Disable the affected upload path if necessary.
2. Verify type/size validation and storage-bucket permissions.
3. Remove the offending content; review retention/deletion.
4. Log a finding; consider adding content-safety scanning (Phase 2).

## Before launching a new feature

Run the [secure development checklist](./secure-development-checklist.md).

## After a production incident

- Write a short, blameless post-incident note (timeline, impact, fix).
- File follow-up findings for every gap the incident revealed.
- Update this runbook if the response missed a step.
