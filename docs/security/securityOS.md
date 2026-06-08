# securityOS

securityOS is the admin-only security operating system for SwingVantage, at
`/admin/security-os`. It answers, in one place: **what is vulnerable, why it
matters, how urgent it is, and exactly what to do today.**

It is built to match the existing admin "OS" modules (centralintelligenceOS,
GrowthOS, the Command Center): a **pure, deterministic engine** fed by a
**server-only signal gatherer**, with **owner state persisted client-side**
(localStorage) so it works in production's read-only filesystem.

## Where the code lives

| Concern | File |
| --- | --- |
| Types (pure) | `apps/web/src/lib/security-os/types.ts` |
| Scoring engine (pure) | `apps/web/src/lib/security-os/scoring.ts` |
| Posture-check catalog (pure) | `apps/web/src/lib/security-os/posture-checks.ts` |
| Findings deriver (pure) | `apps/web/src/lib/security-os/findings.ts` |
| Recommendations (pure) | `apps/web/src/lib/security-os/recommendations.ts` |
| Redaction (pure) | `apps/web/src/lib/security-os/redaction.ts` |
| Signal gathering (server) | `apps/web/src/lib/security-os/posture.server.ts` |
| Scan generation (server) | `apps/web/src/lib/security-os/generate.server.ts` |
| Access guard (server) | `apps/web/src/lib/security-os/access.server.ts` |
| Owner state (client) | `apps/web/src/lib/security-os/useSecurityOS.ts` |
| Pages | `apps/web/src/app/admin/security-os/**` |
| API | `apps/web/src/app/api/admin/security-os/scan/route.ts` |

## Security Health Score

A weighted 0–100 roll-up across seven domains (default weights):

- Identity & Access — 20%
- Application Security — 20%
- Data Protection — 15%
- AI Security — 15%
- Infrastructure & Deployment — 10%
- Monitoring & Incident Response — 10%
- Secure Development Lifecycle — 10%

Each domain aggregates **posture checks**. Every check evaluates a real signal
to one of:

- `pass` (100) — control is in place
- `partial` (50) — present but weak
- `fail` (0) — missing
- `unknown` — the signal couldn't be read

**Honesty rule:** `unknown` checks are *excluded* from the score and instead
lower a visible **confidence** figure. Nothing is ever silently assumed-pass.
Weights are configurable in Settings and normalized at scoring time.

## Findings & recommendations

Every failing/partial check (plus security-relevant audit-robot findings)
becomes a **finding** with a stable id, severity, risk score, framework
mapping (OWASP ASVS / Top 10 / LLM Top 10 / NIST SSDF), business + technical
impact and ordered fix steps. Findings flow through a status workflow
(New → Triaged → In Progress → Needs Review → Resolved, plus Accepted Risk /
False Positive / Deferred). Open findings drive the prioritized
**recommendations**, bucketed into Do Today / This Week / Monitor / Needs
Manual Setup / Waiting on Credentials.

## Access control

securityOS is gated by the `security.manage` RBAC permission (see
`apps/web/src/lib/admin/rbac.ts`). Super Admin and Admin hold it by default;
narrower roles do not. Every page and the scan API call the server-side guard
`requireSecurityAccess()` / `checkSecurityAccess()` — enforcement is
server-side, never client-only.

## Persistence

Owner state (finding status, notes, risk acceptances, settings, score history,
security audit log) is stored in `localStorage` under the
`swingvantage:security-os:*` keys. This is intentional: the production runtime
filesystem is read-only and this matches every other admin OS module. A
server-side `security_*` table set can be mirrored later without changing the
pure engine.

## Ethics

securityOS protects users; it never sells or exposes user data. Cross-system
signals shared with centralintelligenceOS/GrowthOS (Phase 3) are minimized,
redacted and permission-aware. The security audit log redacts secrets/PII
before anything is stored.

## Roadmap

- **Phase 1 (this):** Executive Command Center, score engine, findings,
  recommendations, audit logging, settings, docs.
- **Phase 2:** Scan runner + tool adapters, dedicated AI / API / Upload
  security centers, privacy & data inventory, threat-model module.
- **Phase 3:** CI/CD automation, Growth Launch Security Gate,
  centralintelligenceOS/GrowthOS integration, alerting, incident workflows.
