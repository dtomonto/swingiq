# SwingIQ — Privacy & Youth Safety Notes

Plain-English notes on SwingIQ's privacy posture, how youth use is handled, the
claims we deliberately avoid, and what needs legal review before scale.

Last updated: May 31, 2026.

---

## 📘 In Plain English (start here)

**What this page is:** Short, plain notes on how SwingIQ protects privacy, how it treats young athletes, and the claims it is careful **not** to make. This whole page is written for you — there's no developer-only section to skip.

**What you actually need to know:**
- **Private by default.** Before anyone makes an account, their data stays in their own browser. Videos are analyzed on the device, not uploaded. Nothing is shared publicly unless the user chooses to — and even then it's a text summary, never the raw video.
- **Young athletes are handled carefully.** SwingIQ is not aimed at children under 13, and for anyone under 18 it asks a parent or guardian to manage uploads and review results. Youth data is never made public by default.
- **Honest claims only.** SwingIQ does **not** claim to be certified under any privacy law (COPPA, GDPR, CCPA), does not give medical advice, and does not promise guaranteed results or show fake reviews/ratings.

**What to do next (your steps):**
1. Make sure the three contact inboxes work: `privacy@swingiq.app`, `support@swingiq.app`, `security@swingiq.app`.
2. Get a lawyer to review your Privacy Policy and Terms before you charge money or grow into regulated areas.

---

## 1. Safety posture (what's true today)

- **Local-first by default.** Pre-account data lives in the browser, not on a
  server. Video analysis runs in the browser; raw footage is not sent to an
  external server by default.
- **Private by default.** Nothing is shared publicly unless the user explicitly
  chooses to. Sharing is text-summary only — never raw video — and a privacy
  acknowledgement gates every share action (see
  `components/report/ShareableReportCard.tsx`).
- **User-controlled deletion + export.** Users can export everything and delete
  any record or everything from Settings.
- **Honest AI.** Outputs are labeled estimates, not certified instruction, and
  we never guarantee a result. Trust components and notices repeat this near
  conversion points.

## 2. Parent / guardian handling

- SwingIQ is **not directed at children under 13**.
- For athletes under 18 we recommend a **parent or guardian manages uploads and
  reviews results**. This is stated on `/parents`, the youth SEO page, the
  `YouthSafetyNotice` component, and youth-related tools.
- **Youth data is never made public by default.** Shareable youth reports
  additionally remind that only a parent/guardian should share.
- Youth-related email capture (`youth_baseball`, `youth_softball`) triggers a
  parent-onboarding template (`content/emails/parent-onboarding.md`) emphasizing
  supervision, simplicity, and privacy.

## 3. Claims we deliberately avoid

We do **not** claim:
- Compliance with COPPA, HIPAA, GDPR, CCPA, or any specific framework (we have
  not certified any of these).
- Medical advice, injury diagnosis, or treatment.
- Guaranteed athletic outcomes, scores, or results.
- Certifications, awards, testimonials, ratings, or reviews we do not have.

The privacy, terms, and trust pages say plainly that we describe current
practices in plain English and recommend independent legal review before scale.

## 4. Third-party services disclosed

The privacy page discloses the categories of services that may process data
(database/auth, hosting, AI narrative generation with pre-computed stats only,
and aggregate analytics). Analytics (GA4) is **off unless `NEXT_PUBLIC_GA_ID`
is set**, keeping the site private by default.

## 5. Contacts

- Privacy / data requests: `privacy@swingiq.app`
- Support: `support@swingiq.app`
- Security: `security@swingiq.app`

> **Owner action:** ensure these inboxes (or forwarding) actually exist and are
> monitored before relying on them publicly.

## 6. Needs legal review before scale

1. Formal Privacy Policy and Terms of Service review by a lawyer.
2. If you later collect data from minors or operate in regulated jurisdictions,
   review COPPA / GDPR / CCPA obligations **before** launch in those contexts.
3. Confirm data-processing agreements with any third-party providers you
   connect (email, analytics, AI).
4. Revisit youth-data handling if/when cloud accounts and sync ship — the
   local-first posture is part of what keeps youth risk low today.
