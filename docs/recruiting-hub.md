# Player Recruiting Hub

## In Plain English (start here)

This is the feature that turns everything an athlete already does in SwingVantage —
swing analysis, metrics, progress — into a **professional recruiting profile** they
can send to a college coach, scout, club director, or travel-ball organization.

Think of it as a "living résumé + highlight reel + verified data sheet" for an
athlete, in one shareable link. A coach opens the link on their phone, watches the
top reel, scans the key numbers, reads an honest summary, and contacts the athlete
or guardian — all without making an account.

The hard rule that runs through the whole thing: **nothing misleading.** Every number
and claim carries a label saying where it came from (self-reported, coach-verified,
imported from a device, AI-estimated, needs verification). The AI never says
"Division I prospect" or "pro-ready." It describes what the evidence actually shows.

It works for **golf, baseball, fast-pitch softball, slow-pitch softball, and tennis**,
and it protects minors with guardian controls and private-by-default profiles.

---

## 1. Product strategy

**Position:** a premium *recruiting intelligence layer* on top of the existing
performance app. Not a highlight-reel toy — a credibility engine. The moat is the
data SwingVantage already collects (verified, longitudinal, sport-specific) plus an
AI that refuses to exaggerate, which is exactly what coaches distrust about every
other recruiting profile.

**Who it's for:** athlete, parent/guardian, coach/trainer, recruiter/scout (viewer),
platform admin.

**Why coaches trust it:** source-of-truth labels on every data point, verified vs
self-reported separation, improvement *trajectory* (not a single number), and
frictionless evaluation (open link → evaluate in 90 seconds → contact).

**Business fit:** aligns with the platform's go-to-market (free first). Recruiting is
a natural premium surface (Free / Plus / Pro / Team) without paywalling privacy or
safety — those stay free for everyone.

## 2. User flows

- **Athlete onboarding:** choose sport → player type → build profile → upload film →
  add data → generate AI summary → build reel → preview coach view → create share
  link → send outreach.
- **Coach view:** open link → snapshot → featured reel → key metrics → AI summary →
  full film/data → download packet → contact → save/request more.
- **Guardian:** manage privacy → approve public profile → approve outreach templates →
  control contact info → review analytics → revoke links.

## 3. Information architecture

App surface (authenticated): `/recruiting` hub with tabbed sub-pages —
`onboarding`, `profile-builder`, `film-library`, `data-dashboard`,
`highlight-builder`, `packet-generator`, `outreach`, `analytics`, `settings`.

Public surface: `/player/[shareSlug]` — the coach-facing view, no app chrome,
`noindex` by default, gated by the share link's permissions.

## 4. Data model

Local-first store `swingvantage-recruiting` (mirrors Academy/Motion-Lab secondary
stores) is the runtime source of truth on-device; a Supabase schema
(`supabase-recruiting-schema.sql`) backs cross-device sharing + engagement analytics
when an account is connected (hybrid framing, same as the rest of the app).

Entities: `RecruitingProfile` (+ per-sport `SportProfile`), `FilmAsset`, `Clip`,
`HighlightReel`, `PlayerMetric` (+ embedded `MetricSource`), `CoachNote`,
`AIPlayerSummary`, `ShareLink` (+ embedded permissions), `RecruitingPacket`,
`OutreachContact`, `OutreachMessage`, `EngagementEvent`, `GuardianConsent`,
`VerificationRequest`, `RecruiterContactSubmission`, `AbuseReport`, `AuditLogEntry`.
Every row: id, ownership, created/updated, visibility, verification/source, soft-delete.

## 5. UI component plan

`RecruitingProfileCard`, `ProfileStrengthMeter`, `FilmLibrary` (uploader + tagger),
`HighlightReelBuilder` (clip selector), `DataDashboard` (`DataMetricCard` +
`SportBenchmarkChart` radar + improvement timeline), `AIPlayerSummaryPanel`,
`VerificationBadge`/`DataSourceLabel`, `ShareLinkManager`, `PrivacyControls` +
`GuardianConsentPanel`, `OutreachAssistant`, `EngagementAnalyticsPanel`,
`CoachNotesPanel`, `CoachProfileView` (public), `RecruiterContactForm`,
`PacketGeneratorButton`. Built on existing `ui/*` primitives + `trust/*`.

## 6. Security / privacy plan

Private-by-default profiles; visibility per section + per metric + per film asset.
Share links with permission levels (public / private / password / expiring /
coach-specific / scout-specific / team / anonymous-analytics), download + contact
toggles, watermarking, instant revocation. Guardian consent gate for minors (DOB →
age → if under 18, outreach + public exposure require guardian approval; guardian
contact masks athlete contact). Abuse reporting + blocklist. Audit log for sensitive
actions (publish, share, revoke, delete, consent). `noindex` on all athlete pages.
Compliance reminder area (NCAA/NAIA/NJCAA/club/international) — reminders only, never
legal advice. No scraping of coach contacts; outreach requires explicit user approval.

## 7. AI system design

Keyless-first, mirrors the social/agents pattern: a deterministic engine produces the
grounded output (player summary, outreach, reel recommendations, warnings); an
optional provider call (`/api/recruiting/*`, `AI_PROVIDER`-gated) re-words it and
falls back to the deterministic result on any error. The AI is constrained to
**describe evidence, not project ceilings** — every claim is traceable to a labeled
data point and carries a confidence level (high/medium/low/needs-review). Risk
detection flags unsupported claims, practice-only reels, contact-info exposure, and
over-long reels.

## 8. Implementation phases

1. **Core** — types, sport metric catalog, benchmarks, strength/summary/outreach/film
   /analytics/share/packet engines, store, tests. *(this PR)*
2. **Athlete UI** — hub, onboarding, profile builder, film library, data dashboard,
   reel builder, packet, outreach, analytics, settings. *(this PR)*
3. **Coach view + sharing** — public `/player/[shareSlug]`, link manager, packet
   print. *(this PR)*
4. **Cloud backing** — apply `supabase-recruiting-schema.sql`, wire publish/analytics
   to Supabase when connected. *(owner-applied SQL; engine is schema-ready)*
5. **Monetization gating + Team/Academy multi-athlete** — future.

## 9. Edge cases

No film yet; metrics with no history (no trend); minor with no guardian consent
(outreach + publish blocked); expired/revoked link (clean "link unavailable" state);
sport with sparse benchmarks (show "limited reference data"); self-reported-only
profile (strength capped + warning); very long reel (warning); local mode coach view
on another device (honest "this link needs cloud sync to open elsewhere" notice).

## 10. Acceptance criteria

See the prompt's section 13 — each item maps to an engine + UI surface below and is
covered by `lib/recruiting/__tests__`.

## 11–13. Code / tests / QA

Implemented under `lib/recruiting/*`, `components/recruiting/*`,
`app/(app)/recruiting/*`, `app/player/[shareSlug]/*`, with unit tests for the
strength, summary (no-exaggeration guardrails), outreach (guardrails), and share
(permissions/expiry) engines. QA checklist lives at the end of this doc.

### QA checklist
- [ ] Create profile, see strength tier rise as sections complete.
- [ ] Upload/tag film; feature a clip; build a reel; see length/coverage warnings.
- [ ] Add sport metrics with source labels; radar + trend render; verified vs self-reported separated.
- [ ] Generate summary (all audiences); no exaggerated claims; confidence + sources shown.
- [ ] Generate outreach; guardrails block scholarship guarantees; nothing auto-sends.
- [ ] Create share links (each type); revoke kills access; password/expiry enforced.
- [ ] Coach view loads fast, mobile, no chrome, `noindex`; contact form works.
- [ ] Packet prints clean and branded; no video embedded; disclaimers present.
- [ ] Minor: guardian gate blocks public + outreach until consent.
- [ ] Engagement analytics aggregate views/watch-time; insights read honestly.
