# ConnectorOS — Implementation Roadmap

Staged so the **minimum viable connector stack** lands first and paid/account-bound
layers are scaffolded, not forced. Status reflects this pass.

## ✅ Shipped in this pass (keyless, no new deps)

- ConnectorOS docs suite (`docs/connector-os/*`).
- `lib/connector-os/feature-flags/{flags,connector-status}.ts` — one typed status
  registry over `lib/capabilities` + `lib/consent` + env (the single source of truth).
- `lib/connector-os/seo/indexnow.ts` + Bing verification support + `seo:indexnow` /
  `seo:validate` scripts.
- `lib/connector-os/monitoring/errors.ts` — user-safe error-message pattern.
- Admin **ConnectorOS** read surface (status of every connector) wired into nav.
- `.env.example` grouped additions (Sentry, Turnstile, Bing, IndexNow, Mux,
  Cloudinary, MediaPipe flag) — all commented/OFF.

## Day 1 — controls (operator action, no code)

- Set PostHog + GA4 keys → analytics live (consent-gated).
- Set `NEXT_PUBLIC_GSC_VERIFICATION` + `NEXT_PUBLIC_BING_SITE_VERIFICATION` → verify
  in GSC + Bing; submit sitemap.
- Confirm everything green in **Admin → System Health / ConnectorOS**.

## Week 1 — QA & reliability

- Add Sentry: `@sentry/nextjs`, init in `instrumentation*.ts`/client, set the global
  `__svCaptureException` sink, enable PII scrubbing (`reportError` then delivers).
- Lighthouse CI in `quality.yml` with realistic thresholds (Perf 70+, A11y 90+, BP
  90+, SEO 90+) — start at/just below current, ratchet up.
- Expand Playwright high-value flows (homepage CTA, sport pick, sample report,
  privacy/export, theme switch, mobile smoke) + axe checks.

## Month 1 — growth & admin

- Add the 4 gap events (`theme_changed`, `seo_content_page_viewed`,
  `admin_dashboard_viewed`, `ad_impression_eligible`) to the core registry + wire.
- Turnstile on public forms (signup/contact/newsletter) once keys exist.
- IndexNow key-file route + automated submit on publish.

## Month 2–3 — video intelligence

- Mux direct uploads + signed playback + webhook handler + retention/cost caps.
- Optional Cloudinary for image/poster optimization.
- MediaPipe evidence model surfaced in reports (observed frame → signal → confidence
  → why it matters → drill).

## Later — design system & monetization

- Storybook + stories for core components; Chromatic when funded; Tokens Studio
  export/import with Figma as source of truth.
- Monetization: AdSense/affiliate/Stripe/beehiiv/Rewardful — already flag-gated;
  activate edges first, never the report surface.

## Explicitly deferred (need accounts/keys or would add bloat)

Sentry SDK, Turnstile widget, Mux/Cloudinary SDKs, Storybook/Chromatic, Tokens
Studio, Lighthouse CI runner — scaffolded via docs/env/flags; install per stage above.
