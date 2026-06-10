# ConnectorOS — Privacy & Data Retention

SwingVantage is privacy-forward with a junior-athlete audience. Every connector must
preserve trust. This file is the privacy contract for the ConnectorOS layers.

## Core rules

- **Keyless-first / opt-in.** No connector sends data off-device unless explicitly
  configured. Cookie-setting analytics (GA4, PostHog, Clarity) are **opt-in** via
  `lib/consent.ts` — declined by default until the visitor accepts.
- **No PII in analytics.** See `event-taxonomy.md` — never names, emails, IPs, exact
  child age, raw notes, or raw media URLs.
- **Honest data labels.** All metrics carry a `DataSource` label (real / estimated /
  imported / placeholder / mock). Never fabricate.

## Monitoring (Sentry) privacy

- PII scrubbing **on** before/when Sentry is enabled: strip `request.cookies`,
  auth headers, emails, and any `user.*` beyond an anonymized id.
- `beforeSend` must drop events originating from masked/private surfaces.
- Source maps uploaded via `SENTRY_AUTH_TOKEN` (CI only) — never commit maps or token.
- The existing `reportError` reporter already avoids sending until a sink is
  configured, so default installs leak nothing.

## Analytics privacy masking

- **PostHog**: session replay masks all inputs (`maskAllInputs`), no autocapture of
  sensitive fields; respect consent before init.
- **Clarity**: opt-in only; masks text/inputs by default — keep masking on.
- **GA4**: IP anonymization on; no user-id of minors; consent-gated.

## Video retention & trust

- On-device **MediaPipe** by default — frames never leave the browser unless a cloud
  pose endpoint is explicitly set.
- **Mux (future)**: signed playback only; set a retention window; auto-delete source
  after analysis where possible; thumbnails over full clips for previews; usage-cost
  caps (mirror `VIDEO_STUDIO_MAX_COST_CENTS`). Never expose Mux secrets client-side.
- User-facing copy on any upload: *"Your video is not published publicly."*

## Export / delete

- Existing flows: `DATA_EXPORT_REQUESTED` / `DATA_DELETE_REQUESTED` + `/admin/legal`
  request handling. Deleting an account must cascade to any Mux assets when enabled.

## Youth / parent caution

- Language stays performance-coaching, never medical/therapy.
- Ads (if ever enabled) must be **non-personalized / contextual** (COPPA/GDPR-K).
- No behavioral profiling of minors; no third-party ad tracking in the report flow.

## User-safe error messaging pattern

Never show stack traces. Tell the user what failed, preserve trust, offer a retry:

> "We could not complete this swing analysis. Your video was not published publicly.
> Please retry or use a shorter clip."

Implemented as a typed helper in `lib/connector-os/monitoring/errors.ts`.
