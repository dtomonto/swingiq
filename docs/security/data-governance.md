# Data Governance

How SwingVantage handles data, and the privacy-by-design principles securityOS
enforces. The interactive Privacy & Data Governance Center is Phase 2; this is
the Phase-1 reference.

## Principles

- **Never sell user data.** Full stop.
- **Minimize.** Collect only what improves the product; don't store sensitive
  data you don't need.
- **Redact.** Secrets and PII are masked in logs (see audit-logging).
- **Permission-aware sharing.** Cross-system signals (to centralintelligenceOS
  / GrowthOS) are minimized and redacted; sensitive security data stays
  admin-only.
- **User control.** Honor export/delete requests (`/admin/legal`).

## Data inventory (high level)

| Data type | Sensitivity | Used by | Notes |
| --- | --- | --- | --- |
| User profile | Medium | product, CIOS | minimize fields |
| Uploaded media | High | AI analysis | private storage + signed URLs |
| Swing/session data | Medium | product, CIOS | RLS-isolated per user |
| AI analysis output | Medium | product | no training on user data |
| Analytics | Low | GrowthOS | aggregate, consent-aware |
| Admin notes / logs | Medium | securityOS, admin | redacted; admin-only |
| Email/contact | Medium | lifecycle | consent-based |

(The Phase-2 center turns this into a live, per-type inventory with retention,
access controls and export/delete readiness.)

## Retention

- Keep media and derived data only as long as it serves the user.
- Deletion must remove the underlying object/rows, not just hide them.

## What to do when adding a new data type

1. Justify why it improves the product.
2. Classify its sensitivity and set access controls (RLS for user-scoped).
3. Decide retention up front.
4. Confirm it won't leak into logs or non-admin surfaces.
5. Add it to this inventory.
