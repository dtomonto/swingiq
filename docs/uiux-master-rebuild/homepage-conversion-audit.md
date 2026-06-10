# Homepage conversion audit (#1 Phase 5)

> Audit of the marketing homepage (`app/(marketing)/page.tsx` →
> `components/marketing/LocalizedHome.tsx`, English) against the 10-section
> conversion structure. Manual review — 2026-06-10.

## Section scorecard

| # | Conversion section | On the page? | Where |
|---|---|---|---|
| 1 | **Hero** — value prop + primary CTA | 🟢 | "Find the one fix holding your swing back" + "Analyze My Swing — Free" + trust chips + glowing report-preview card |
| 2 | **Social proof** — counts / testimonials / ratings | 🟡 | Global Founding-Members counter banner (real, honest number) renders site-wide incl. home; **no dedicated testimonials/results section** |
| 3 | **Problem / pain** | 🟢 | "Practice without proof is just repetition" + 3 pain cards |
| 4 | **Solution / how it works** | 🟢 | "From upload to improvement in 60 seconds" + tutorial video + 4 steps |
| 5 | **Product / segmentation** | 🟢 | "Choose your discipline" — 4 sport cards |
| 6 | **Demonstration / what you get** | 🟢 | "See what you'll get" + `SampleReportPreview` |
| 7 | **Benefits / differentiation** | 🟢 | "Built for athletes who want proof" — private / pro-grade / instant |
| 8 | **Value-add / lead capture** | 🟢 | Free-tools grid (slice fixer, quiz, planner, …) |
| 9 | **Objection handling** | 🟢 | 7-question FAQ + safety disclaimer band |
| 10 | **Final CTA** | 🟢 | "Ready to fix your swing?" contained glow band |

**Offer / pricing** (often a separate section) is intentionally folded into the
hero + every CTA as **"100% free, no account"** — correct for a free-first
product, so it isn't a gap.

**Result: 9 / 10 strong, 1 partial.** Structure, order and hierarchy are solid —
problem → how → product → proof → benefits → objections → CTA is a textbook
flow, and the B hero hierarchy (eyebrow → H1 → sub → primary/secondary CTA →
trust chips → product preview) is clean.

## Findings

1. **🟡 No dedicated social-proof section.** Social proof is currently carried only
   by the global Founding-Members counter banner. There are no testimonials,
   star ratings, named athletes, or an "N swings analyzed" stat on the page.
   This is the single biggest conversion-structure gap.
   - *Constraint:* per the project's "never fabricate data" rule, we must NOT
     invent counts or testimonials. The honest options are: (a) surface the real
     Founding-Members number more prominently in-page, and (b) add a testimonial
     row once real, attributable quotes exist.

2. **🟡 CTA destination inconsistency.** The identically-labelled "Analyze My
   Swing Free" CTA pointed to three different routes: hero + final → `/start`,
   the sample-section text CTA → `/video`, and the `SampleReportPreview`'s own
   button → `/dashboard` (which bounces an anonymous visitor to the login wall).
   Same label should mean same destination so the funnel is predictable.
   **→ Fixed in this pass:** both sample-section CTAs now go to `/start`, so all
   four homepage "Analyze My Swing" CTAs are unified (verified live).

3. **🟢 Everything else checks out.** One clear primary action repeated at hero,
   mid-page and footer; a low-commitment secondary ("See how it works"); honest
   trust chips; AA-safe B tokens throughout; localized parity (es/fr render a
   leaner dict-only variant so no English leaks mid-page).

## Recommendations (priority order)

1. **Add a real social-proof beat** (highest conversion ROI) — e.g. a slim band
   under the hero showing the live Founding-Members count + 2–3 attributable
   testimonials when available. Reuse the existing founding counter source; never
   fabricate.
2. ~~Unify the primary CTA destination~~ — **done** (sample → `/start`).
3. Optional: a logos/"as covered in" or aggregate-stat strip if/when real data
   exists (press, total analyses) — honest only.

_No structural rebuild needed; the homepage already implements the 10-section
flow well. The work is one missing beat (social proof), gated on having real
data to show._
