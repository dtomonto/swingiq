# Audit Action Dashboard

_At-a-glance status board · generated 2026-06-01 · full detail in [master-audit-report.md](master-audit-report.md)_

> Quick read for the owner. Each item links to a finding ID (`F-xx`) in the master report.
> **Status legend:** 🔴 not started · 🟡 in progress · 🟢 done. Everything below is currently
> 🔴 unless marked otherwise — these are local recommendations, nothing has been pushed.

---

## 🚨 Critical Issues (do before commercial launch)

| Finding | Issue | Status | Recommended next action |
|---|---|---|---|
| F-12 | OpenAI key was in plaintext — treat as compromised | 🔴 | Rotate the key now; update `.env.local` + Vercel |
| F-11 | GitHub security switches off (branch protection, secret scan, Dependabot, vuln reporting) | 🔴 | Flip the 4 switches in GitHub Settings (~30 min) |
| F-19 | No analytics connected — zero visibility into anything | 🔴 | Wire GA4/PostHog/Plausible + Google Search Console |
| F-18 | No error/uptime monitoring | 🔴 | Add Sentry + an uptime monitor |
| F-15 | Privacy/Terms unreviewed; no COPPA/GDPR/CCPA assessment | 🔴 | Engage an attorney before paid/youth scale |
| F-14 | Supabase RLS + private buckets not applied | 🔴 | Apply `apps/web/supabase-rls.sql`; set buckets private (when cloud goes live) |

---

## ⚡ High-ROI Quick Wins (high impact, low effort)

| Finding | Win | Status | Recommended next action |
|---|---|---|---|
| F-01 | Missing OG image + app icons → blank previews, no favicon, no PWA install | 🔴 | Add artwork **or** implement `opengraph-image.tsx` + `icon.tsx` |
| F-21 | Sitemap not submitted to search engines | 🔴 | Submit `sitemap.xml` in GSC + Bing after deploy |
| F-04 | `llms.txt` computer-vision claim may be inaccurate | 🔴 | Verify vs live analyzer; correct the claim |
| F-13 | `ADMIN_SECRET` / `CRON_SECRET` unset | 🔴 | `openssl rand -hex 32` → `.env.local` + Vercel |
| F-06 | Deep session pages can dead-end | 🔴 | Add back links to `/sessions/import/image`, `/sessions/log` |
| F-05 | No skip-to-content link / weak focus rings | 🔴 | Add skip-link to AppShell; standardize focus |

---

## 🎯 Strategic Bets (durable value / moats)

| Finding | Bet | Status | Recommended next action |
|---|---|---|---|
| F-25 | AI Coach session memory | 🔴 | Run monthly AI audit; feed last 3 session summaries into prompt |
| F-27 | Stripe monetization | 🔴 | Implement Checkout + webhooks before a paid tier |
| F-03 | Standardize metadata/schema on shared helpers | 🔴 | Migrate hand-rolled pages to `buildMetadata` + `jsonLd.ts` |
| F-17 | Verified professional swing reference library | 🔴 | Replace placeholder video IDs; flip `verified` flags |
| — | Proprietary benchmark DB / multi-gen profiles / white-label | 🔴 | Year-2 moat investments (see master report §5) |

---

## ✅ Already Resolved / Healthy (confirmed by audits)

| Item | Status | Source |
|---|---|---|
| Organization + WebSite structured data on homepage (F-09) | 🟢 done (homepage) | S1 |
| `llms.txt` answer-page coverage expanded (F-10) | 🟢 done | S1 |
| All 5 growth/trust checks pass (links, thin content, sitemap, placeholders) | 🟢 healthy | S1, S5 |
| Custom security scan: 0 findings, 0 critical | 🟢 healthy | S3 |
| Staged-nav P0/P1 closed (404, middleware, robots, sitemap, trust/FAQ) | 🟢 done | S2 |

---

## Status Summary

| Bucket | Total | 🔴 Not started | 🟡 In progress | 🟢 Done |
|---|---|---|---|---|
| Critical | 6 | 6 | 0 | 0 |
| Quick wins | 6 | 6 | 0 | 0 |
| Strategic | 5 | 5 | 0 | 0 |
| Resolved/healthy | 5 | 0 | 0 | 5 |

**Single recommended next action:** start the **0–7 day** list in the master report — rotate the
OpenAI key (F-12), flip the GitHub security switches (F-11), and ship the OG/icon assets (F-01).
Those three are the highest value for the least effort and unblock everything downstream.

---

## How to keep this board current

After each scheduled audit run (SEO monthly, security weekly, growth report), update the relevant
finding's status emoji and add any new findings to [master-audit-report.md](master-audit-report.md)
§3 with a new `F-xx` ID. See that report's §2 for the source-of-truth list of audit feeds.
