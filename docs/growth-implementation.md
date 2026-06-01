# SwingIQ — Growth Implementation Guide

This document tracks the SwingIQ Growth Operating System: what is built, what is
still manual, and how to operate and extend each piece. It is written to be
readable by a non-developer owner — every step is spelled out.

Last updated: May 31, 2026.

---

## 1. What was built (this sprint)

### Trust, privacy & conversion hardening (Phase 1 — complete)
- **Centralized site config** — `apps/web/src/config/site.ts` is now the single
  source of truth for the site name, live URL, contact emails, default page
  description, and social handles.
- **Removed every visible placeholder** — the `[Add contact email]`,
  "placeholder policy", and "pre-launch product" text is gone from the privacy,
  terms, trust, and pricing pages. Real `mailto:` links now come from the config.
- **Honest, MVP-safe legal language** — privacy and terms now have effective
  dates and plain-English wording. They do **not** claim GDPR/CCPA/COPPA
  compliance; they recommend legal review before scaling.
- **Reusable trust components** — in `apps/web/src/components/trust/`:
  `TrustBar`, `LiveAndFreeBadge`, `PrivacyAssuranceBlock`, `YouthSafetyNotice`,
  `WhatHappensToMyVideo`, `NotCoachReplacementNotice`, `SafeUploadExplainer`,
  `SampleReportPreview`. Import from `@/components/trust`.
- **Homepage conversion** — new subhead, "See Sample Report" secondary CTA,
  trust bar under the hero, plus a sample-report section and a parent/coach
  trust section.

### SEO / AEO / GEO foundation (Phase 2 — partial)
- **Metadata helper** — `apps/web/src/lib/seo/metadata.ts` exports
  `buildMetadata()` to produce title, description, canonical, Open Graph, Twitter
  card, and robots settings from one call.
- **JSON-LD builders** — `apps/web/src/lib/seo/jsonLd.ts`: `websiteSchema`,
  `organizationSchema`, `softwareApplicationSchema`, `articleSchema`,
  `faqPageSchema`, `howToSchema`, `breadcrumbListSchema`, `serviceSchema`, and
  `buildGraph()`. No fake ratings/reviews/credentials.
- **Components** — `JsonLd` (renders a graph) and `Breadcrumbs` (accessible trail
  + matching JSON-LD) in `apps/web/src/components/seo/`.

### Analytics (Phase 7 — partial)
- **Expanded event registry** — `packages/core/src/analytics/events.ts` now
  includes email-capture, quiz, tool-result, share/report, CTA, outbound, and
  privacy/parent-safety events.
- **Provider-agnostic abstraction** — `apps/web/src/lib/analytics.ts` `track()`
  sends to GA4 (when configured), Plausible, or PostHog, and falls back to the
  dev console. `Analytics` component loads GA only when `NEXT_PUBLIC_GA_ID` is set.
- **Docs** — full event catalogue in `docs/analytics-events.md`.

### Automation (Phase 9 — started)
- **Placeholder scanner** — `scripts/scan-placeholders.mjs`, run via
  `npm run scan:placeholders` (alias `npm run check:trust`). Fails the build if
  visible placeholder text reappears on user-facing pages.

---

## 2. What remains manual / not yet built

These phases from the growth plan are **not** yet implemented and are good
candidates for the next sprint:

- Programmatic SEO content registry + templates (Phase 3) and the priority
  landing pages (`/golf/fix-slice`, `/free-swing-analysis`, `/coaches`, etc.).
- Free growth tools (Phase 4): slice fixer, swing-mistake quiz, drill generator,
  practice-plan generator, savings calculator, line-drive guide, equipment
  diagnostic.
- Shareable reports + referral loops (Phase 5) and challenge pages.
- Email capture UI + provider integration (Phase 6) — abstraction pathway only;
  no provider connected yet.
- Growth content operating system (Phase 8) and remaining automation scripts +
  CI workflows (Phase 9).
- Coach/creator/team/facility expansion pages (Phase 10) beyond existing
  `/parents`.
- Remaining docs: `seo-system.md`, `automation.md`,
  `privacy-and-youth-safety-notes.md` (Phase 12).

---

## 3. How to add an SEO page (today)

1. Create a folder under `apps/web/src/app/`, e.g. `golf/fix-slice/`.
2. Add `page.tsx`. At the top:
   ```ts
   import { buildMetadata } from '@/lib/seo/metadata';
   export const metadata = buildMetadata({
     title: 'How to Fix a Slice',
     description: 'A direct, beginner-safe guide to fixing your slice.',
     path: '/golf/fix-slice',
   });
   ```
3. Add structured data with the JSON-LD helpers and the `<JsonLd>` component.
4. Add a `<Breadcrumbs>` trail near the top.
5. Add the new URL to `apps/web/src/app/sitemap.ts` and `public/robots.txt`.
6. Run `npm run type-check` and `npm run lint` before committing.

> Quality rule: never publish a thin page. Each SEO page needs a direct answer,
> real explanation, a diagnosis checklist, beginner-safe drills, common mistakes,
> a "when to work with a coach" note, FAQs, and a CTA.

---

## 4. How to run the validation scripts

| Command | What it does |
|---|---|
| `npm run type-check` | TypeScript across the monorepo |
| `npm run lint` | ESLint across the monorepo |
| `npm run scan:placeholders` | Fails if visible placeholder text exists |
| `npm run check:trust` | Alias for the placeholder scan |
| `npm run security:check` | Custom security anti-pattern scan |

Run all of these before deploying.

---

## 5. How to configure analytics (owner steps)

1. Create a Google Analytics 4 property and copy its Measurement ID
   (`G-XXXXXXXXXX`).
2. Open `apps/web/.env.local` (create the file if it does not exist).
3. Add: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
4. Save and restart `npm run dev:web` (or redeploy).
5. If you leave it unset, the site stays analytics-free and private.

---

## 6. How to configure email capture

Not yet wired. When you choose a provider (ConvertKit, Mailchimp, Resend,
Supabase, Airtable, or a database), the next sprint will add a provider-agnostic
abstraction that reads its key from an environment variable and **never shows a
fake success message** if persistence is not connected.

---

## 7. Trust / legal placeholder validation

- The privacy, terms, and trust pages now use real contact emails and honest
  language. **You must make sure these inboxes actually receive mail before
  relying on them:** `support@swingiq.app`, `privacy@swingiq.app`,
  `security@swingiq.app` (set up forwarding at your domain registrar / email host).
- Run `npm run scan:placeholders` any time you edit a public page to confirm no
  placeholder text slipped back in.
- The legal copy is plain-English and MVP-safe. Have it reviewed by a lawyer
  before commercial scale or collecting data in regulated jurisdictions.

---

## 8. Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Optional | Overrides the canonical site URL (defaults to `https://swingiq.app`). |
| `NEXT_PUBLIC_GA_ID` | Optional | Enables Google Analytics 4. Unset = private, console-only. |

(Existing Supabase / AI-provider variables are documented in the project's other
setup docs.)
