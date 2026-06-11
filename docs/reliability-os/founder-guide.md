# ReliabilityOS — Founder Operating Guide

ReliabilityOS is your operational-health command center, at **`/admin/reliability`**.
It answers, in plain language: *what broke, who/what was affected, how severe, is it
still happening, and what should I fix first?*

It is **lightweight and privacy-first by design**:

- Failures are captured from the app's **existing** error reporter and analytics seams —
  no new tracking SDK. The client error sink (`registerOperationalSink`) plugs into the
  same `reportError()` path the global error boundary, server `onRequestError`, and
  `window.error`/`unhandledrejection` already use.
- Every captured event is **sanitized to metadata only** — no passwords, tokens, request
  bodies, PII, video contents, or raw AI prompts are ever stored.
- Repeated failures are **grouped into issues** by a stable fingerprint, so your status
  and notes survive re-scans.
- Owner state (issue status, notes, settings) lives in **your browser** (localStorage),
  matching securityOS and the Command Center — it works on production's read-only filesystem.

## Cross-user capture (honest scope)

- **Keyless (default):** the dashboard shows failures captured in **your admin session's
  browser** plus signal-derived health. It clearly says cross-user capture is off and
  **never invents numbers** for other users.
- **With Supabase configured:** the client also fire-and-forgets each sanitized event to
  `/api/reliability/ingest`, which stores it in the existing `growth_records` table
  (`kind: operational-event` — no new migration). The dashboard then reflects failures
  across all users.

## Daily check (30 seconds)

1. Open `/admin/reliability`.
2. Read **System Status** (Healthy / Watch / Degraded / Critical).
3. Scan the **executive metrics**: open critical/high, failed uploads 24h, failed logins
   24h, page/tool failures 24h.
4. Look at the top of the **Failure Inbox** — the highest-severity, most-recent issues.
5. If an alert banner is showing (upload/login spike, degraded/critical), open that issue.

## Weekly check

- Mark fixed issues **Resolved**, snooze/ignore noise.
- For anything recurring, open the issue and click **Copy Debug Context**, then paste it
  into Claude Code to investigate (it includes route, stage, occurrences, a safe error
  message, suggested steps, and correlation IDs).
- Walk the **reliability panels** (Upload / Login / Page / Tool / Admin) to spot a single
  area degrading.

## Monthly check

- Review the **most affected route / area** and the top failure categories.
- Tune **alert thresholds** (upload/auth failure counts, window) to match real volume.
- Run the **Diagnostics → Run page check** to confirm key public routes load.

## What it does NOT do (by design, Phase 1)

- It does not page you or send email (the alert queue is in-dashboard).
- It does not deeply instrument every server flow yet — auth/upload/tool/API call sites
  can opt in via `logUploadFailure` / `logAuthFailure` / `logToolFailure` from
  `lib/reliability-os/capture`. These are follow-ups.
- The cross-surface "open critical issues" badge is intentionally omitted: issue status
  lives in the browser (localStorage), so a server-rendered count would be misleading.
  Use the dashboard's System Status as the source of truth.

## Where the code lives

- Pure engine + types + fingerprinting: `apps/web/src/lib/reliability-os/`
- Client capture buffer + sink: `apps/web/src/lib/reliability-os/capture.ts`
  (registered in `apps/web/src/instrumentation-client.ts`)
- Optional ingest: `apps/web/src/app/api/reliability/ingest/route.ts` +
  `apps/web/src/lib/reliability-os/ingest.server.ts`
- Owner-state hook: `apps/web/src/lib/reliability-os/useReliabilityOS.ts`
- Admin UI: `apps/web/src/app/admin/reliability/`
