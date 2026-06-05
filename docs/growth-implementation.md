# SwingIQ — Growth Implementation Guide

This document tracks the SwingIQ Growth Operating System: what is built, what is
still manual, and how to operate and extend each piece.

Last updated: May 31, 2026.

---

## 📘 In Plain English (start here)

**What this page is:** A progress log of the "growth" features — the trust badges, search-friendly pages, free tools, email sign-up forms, and usage analytics — listing what's finished and what still needs you.

**What you actually need to know — the only four things on your plate:**
1. **Set up your email inboxes.** Make sure `support@swingiq.app`, `privacy@swingiq.app`, and `security@swingiq.app` actually receive mail (set up forwarding at your domain/email host). The site now shows these addresses publicly, so they need to work.
2. **(Optional) Turn on analytics.** Add a Google Analytics ID to see your visitor numbers. Leave it off and the site stays private. (Steps in section 5 below.)
3. **(Optional) Turn on email capture.** Connect one email provider (Resend, ConvertKit, or Mailchimp) so sign-up forms actually save addresses. Until you do, the forms honestly tell people their address was not stored. (Steps in section 6.)
4. **Get legal review** of your Privacy Policy and Terms before charging money or scaling up.

**What to do next:** Handle item 1 (inboxes) soon; items 2–4 when you're ready. Everything else on this page — the file names, code, and command lines — is for a developer or an AI assistant.

> The rest of this page lists exactly what was built and where it lives in the code. It's a reference for a developer or an AI assistant; you only need the four items above.

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

### Phase 3 — Programmatic SEO (complete for priority pages)
- `apps/web/src/content/seoPages.ts` registry + `components/seo/SeoArticle.tsx`.
- 9 published pages: `/free-swing-analysis`, `/golf/fix-slice`,
  `/golf/why-do-i-slice-my-driver`, `/golf/launch-monitor-analysis`,
  `/golf/practice-at-home`, `/softball/slow-pitch-power`,
  `/softball/how-to-hit-line-drives`, `/baseball/youth-hitting`,
  `/tennis/forehand-analysis`. Drafts remain unrouted.

### Phase 4 — Free tools (complete)
- `/tools` + 7 tools: golf-slice-fixer, swing-mistake-quiz,
  at-home-swing-drill-generator, practice-plan-generator,
  private-lesson-savings-calculator, slow-pitch-line-drive-guide,
  equipment-diagnostic.

### Phase 5 — Shareable reports + challenges (complete)
- `components/report/ShareableReportCard.tsx`, `/report/sample`, and challenge
  pages (`/challenges` + 3 challenges).

### Phase 6 — Email capture (complete; provider optional)
- `lib/email/capture.ts`, `/api/email-capture`, `components/email/EmailCapture.tsx`,
  6 lifecycle templates in `content/emails/`.

### Phase 8 + 9 — Growth content + automation (complete)
- `content/growth/*` (backlog, video ideas, community/outreach templates,
  weekly review). Scripts: `validate:seo`, `validate:content`, `validate:links`,
  `generate:sitemap`, `growth:report`, `growth:plan`, `audit:growth`. CI:
  `.github/workflows/growth-ci.yml`.

### Phase 10 — Audience pages (complete)
- `/coaches`, `/creators`, `/teams`, `/partners` (plus existing `/parents`).

### Phase 12 — Docs (complete)
- `docs/seo-system.md`, `docs/automation.md`,
  `docs/privacy-and-youth-safety-notes.md`, `docs/analytics-events.md`, this file.

## 2b. What remains manual / future work

- **Connect a real email provider** (Phase 6 is wired but no provider is set —
  see section 6). Until then, capture forms honestly report "not stored."
- **Connect analytics** (set `NEXT_PUBLIC_GA_ID`).
- **Write the draft SEO backlog pages** before publishing them (they're in
  `content/growth/seo-backlog.json` / `seoPages.ts` as drafts to avoid thin
  content).
- **Retrofit trust components** into the upload/diagnose flow and every sport
  page (currently on the homepage, SEO pages, tools, challenges, and audience
  pages).
- **Wire the ShareableReportCard into the live analysis result screen** (today
  it's demonstrated on `/report/sample`).
- **Lifecycle email scheduling** runs in your email provider, not in-app.
- **Legal review** of privacy/terms before commercial scale.

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

The abstraction is built (`apps/web/src/lib/email/capture.ts`) and the capture
form (`EmailCapture`) appears on tools, challenges, and audience pages. It
**never shows a fake success message** — if no provider is configured it tells
the user their address was not stored. To turn it on, add ONE provider's
variables to `apps/web/.env.local`:

- **Resend:** `RESEND_API_KEY` + `RESEND_AUDIENCE_ID`
- **ConvertKit:** `CONVERTKIT_API_KEY` + `CONVERTKIT_FORM_ID`
- **Mailchimp:** `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` + `MAILCHIMP_SERVER_PREFIX`
- **Any other system:** `EMAIL_CAPTURE_WEBHOOK_URL` (receives a POST with the lead)

Restart/redeploy after adding. Lead `source` (e.g. `golf_slice`, `coach`) is
captured automatically. Lifecycle copy lives in `content/emails/` — schedule
sends through your provider's automations.

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
| `NEXT_PUBLIC_SITE_URL` | Optional | Overrides the canonical site URL (defaults to `https://swingvantage.com`). |
| `NEXT_PUBLIC_GA_ID` | Optional | Enables Google Analytics 4. Unset = private, console-only. |

(Existing Supabase / AI-provider variables are documented in the project's other
setup docs.)
