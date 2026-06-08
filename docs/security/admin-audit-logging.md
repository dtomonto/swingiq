# Admin Audit Logging

Two complementary trails make admin actions accountable:

- **Admin audit log** (`/admin/audit-log`) — general mutating admin actions
  (flags, content, users). Local-first ring buffer
  (`apps/web/src/lib/admin/stores/audit-log.ts`).
- **Security audit log** (`/admin/security-os/audit-logs`) — security-specific
  events: finding status changes, risk acceptances, exports, settings changes,
  scan runs. Stored under `swingvantage:security-os:audit:v1`.

## What is recorded (security log)

Each entry carries: `id`, `at` (ISO), `actor` (admin email or `admin`),
`action` (machine key, e.g. `finding.status`), `entityType`, `entityId`,
`summary`, `severity` (`info`/`warning`/`critical`), and **redacted**
`metadata`.

## Redaction guarantee

Before any entry is stored, its metadata passes through
`apps/web/src/lib/security-os/redaction.ts`, which masks anything resembling an
API key, token, JWT, bearer header, private-key block or email, and fully
masks values under sensitive keys (`secret`, `token`, `password`,
`authorization`, …). **Raw secrets, passwords and full keys are never logged.**

## Reviewing the trail

The viewer supports search, severity filter, date-range filter, export (JSON)
and clear. Use it to confirm a change happened, or to scope actions during an
incident.

## Retention

The security log keeps up to the configured retention (default 500, max 1000)
most-recent entries locally. For a shared, cross-device, tamper-evident trail,
mirror to a server-side `security_audit_log` table (deferred — the entry shape
is already serializable for that).
