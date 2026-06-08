# Threat Model

A lightweight, founder-friendly threat model for SwingVantage. For each major
asset: the threats against it (STRIDE-style, in plain English), current
mitigations, and open gaps. Revisit when the architecture changes. The
securityOS Threat Model module (Phase 2) will make this interactive.

> STRIDE = Spoofing · Tampering · Repudiation · Information disclosure ·
> Denial of service · Elevation of privilege.

## Assets & threats

### User accounts
- **Threats:** credential theft (spoofing), session hijack, account takeover.
- **Mitigations:** Supabase auth, on-domain auth emails, HSTS.
- **Gaps:** MFA readiness (track), session-security review.

### Admin dashboard
- **Threats:** unauthorized access (elevation), insider misuse (repudiation).
- **Mitigations:** `ADMIN_EMAILS` allowlist, `ADMIN_SECRET`, RBAC roles,
  server-side guards, admin audit log.
- **Gaps:** set `ADMIN_ROLES` for least privilege; shared server-side audit
  table (deferred).

### AI analysis systems
- **Threats:** prompt injection, unsafe output, data leakage, cost abuse
  (DoS / unbounded consumption).
- **Mitigations:** AI spend kill-switch (`AI_DAILY_BUDGET_CENTS`), keyless-first
  defaults, rate limiting.
- **Gaps:** prompt-injection test suite, output-redaction checks.

### Uploaded swing videos/images
- **Threats:** malicious files, unsafe handling, public exposure.
- **Mitigations:** type/size limits, storage permissions.
- **Gaps:** content-safety scanning, metadata stripping (Phase 2).

### User performance data
- **Threats:** cross-user disclosure (broken access control).
- **Mitigations:** RLS policies, per-user scoping.
- **Gaps:** periodic RLS coverage audit.

### Database & storage
- **Threats:** leaked keys, IDOR, over-broad policies.
- **Mitigations:** RLS, least-privilege keys.
- **Gaps:** key-rotation cadence.

### Environment variables / secrets
- **Threats:** accidental commit, exposure in logs/bundles.
- **Mitigations:** Gitleaks in CI, redaction in audit logs.
- **Gaps:** periodic secret-rotation review.

### centralintelligenceOS / GrowthOS / securityOS
- **Threats:** sensitive data crossing system boundaries to non-admin surfaces.
- **Mitigations:** admin-only gating, minimized/redacted cross-system signals.
- **Gaps:** formal data-classification of cross-system payloads (Phase 3).

### Public SEO/AEO/GEO pages
- **Threats:** data leakage, injection via generated content, missing headers.
- **Mitigations:** CSP, curated sitemap, generated-content review queue.
- **Gaps:** Growth Launch Security Gate (Phase 3).

## How to use this

When adding a feature, find the asset it touches, check whether your change
introduces a new threat, and confirm the mitigation exists (or file a
securityOS finding). Keep the gaps list honest — an empty gaps list usually
means it's stale, not perfect.
