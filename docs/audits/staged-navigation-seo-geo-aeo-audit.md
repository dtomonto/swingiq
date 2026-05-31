# SwingIQ — Staged Navigation, SEO, GEO & AEO Audit

*Audit date: 2026-05-31. Based on code inspection of `master` branch + `feature/swingiq-production-master-system`.*  
*This is a staged-environment audit — the site is not yet publicly live. Findings are based on code, not live crawl data.*

---

## Summary

| Category | Issues Found | Fixed This Sprint | Deferred |
|----------|-------------|------------------|----------|
| Dead-end / orphaned pages | 1 critical (no 404 page) | 1 fixed | 0 |
| Middleware public path gaps | 20+ pages missing from PUBLIC_PATHS | Fixed | 0 |
| robots.txt missing allows | 15+ public pages missing Allow | Fixed | 0 |
| Missing sitemap | No sitemap.xml existed | Fixed | 0 |
| Root layout meta (golf-only title) | 1 | Fixed | 0 |
| Privacy/Terms marked noindex | 2 | Fixed | 0 |
| Missing trust/safety page | 1 | Fixed (created /trust) | 0 |
| Missing FAQ page | 1 | Fixed (created /faq) | 0 |
| Missing llms.txt | 1 | Fixed | 0 |
| Sport cards link to /dashboard not analysis pages | 5 | Fixed | 0 |
| Footer missing new pages | Several | Fixed | 0 |
| Equipment diagnostic routes | Not built | — | Deferred P2 |
| Usage category/youth onboarding | Not built | — | Deferred P2 |
| Breadcrumb component | Not built | — | Deferred P1 |

---

## P0 — Critical Issues Found & Fixed

### 1. No 404 / not-found page (FIXED)

**Problem:** No `not-found.tsx` existed in the App Router. Users hitting any unknown URL received a blank Next.js default 404 page with no navigation, no home link, no sport links — a complete dead end.

**Fix:** Created `apps/web/src/app/not-found.tsx` with:
- Logo linking to Home
- "Go to SwingIQ Home" primary CTA
- "Open My Dashboard" secondary CTA
- Sport-specific analysis links
- Footer nav (How It Works, FAQ, Updates, Privacy, Terms)
- `robots: 'noindex, nofollow'` metadata

---

### 2. Middleware PUBLIC_PATHS missing all new public pages (FIXED)

**Problem:** `apps/web/src/middleware.ts` only listed `/`, `/login`, `/signup` as public paths. Once Supabase env vars are added, ALL other pages — including `/golf-swing-analysis`, `/how-it-works`, `/privacy`, `/parents`, `/updates`, `/faq`, `/trust`, etc. — would redirect unauthenticated visitors to `/login`. This would break every public marketing page.

**Fix:** Added 20+ public pages to `PUBLIC_PATHS`:
```
/how-it-works, /golf-swing-analysis, /tennis-swing-analysis,
/baseball-swing-analysis, /softball-swing-analysis, /golf, /tennis,
/baseball, /slow-pitch-softball, /fast-pitch-softball, /features,
/faq, /pricing, /parents, /updates, /resources, /glossary,
/privacy, /terms, /trust, /security
```

---

### 3. robots.txt incomplete (FIXED)

**Problem:** robots.txt only listed `Allow: /`, `Allow: /login`, `Allow: /signup`. All other public pages were in an ambiguous state. No sitemap reference.

**Fix:** Added explicit `Allow:` directives for all 20+ public pages. Added `Sitemap: https://swingiq.app/sitemap.xml`.

---

## P1 — Navigation & SEO Issues Found & Fixed

### 4. No sitemap.xml (FIXED)

**Problem:** No sitemap existed. Search engines and AI crawlers had no structured list of SwingIQ's indexable pages.

**Fix:** Created `apps/web/src/app/sitemap.ts` — Next.js App Router dynamic sitemap. Served at `/sitemap.xml`. Includes all public pages with priority and changeFrequency. Excludes all app/dashboard/admin routes.

---

### 5. Root layout title says "Golf Performance System" (FIXED)

**Problem:** `apps/web/src/app/layout.tsx` metadata title was "SwingIQ — Golf Performance System" — omitting tennis, baseball, softball. Incorrectly positioned the product as golf-only.

**Fix:** Changed to "SwingIQ — AI Swing Performance Platform". Updated description and keywords to include all 5 sports. Added `metadataBase` and complete `openGraph` block.

---

### 6. Privacy Policy marked noindex (FIXED)

**Problem:** `apps/web/src/app/privacy/page.tsx` had `robots: 'noindex'`. Privacy policies should typically be indexed — they are a trust signal and are expected by users, regulators, and AI answer engines.

**Fix:** Removed `noindex`. Added `alternates: { canonical: '/privacy' }`.

### 7. Terms of Service marked noindex (FIXED)

**Fix:** Same as above — removed `noindex`, added canonical.

---

### 8. Missing /trust page (FIXED)

**Problem:** No Trust & Safety page existed. Users had no place to understand SwingIQ's data handling, AI honesty commitments, or security posture in plain English.

**Fix:** Created `apps/web/src/app/trust/page.tsx` — comprehensive trust page covering local-first data, video privacy, export/deletion, youth safety, honest AI labels, security posture, and contact info.

---

### 9. Missing /faq page (FIXED)

**Problem:** FAQ content existed on the homepage only. No standalone `/faq` route for direct search/AEO targeting.

**Fix:** Created `apps/web/src/app/faq/page.tsx` — 25 questions across 6 sections (Getting Started, Supported Sports, How the AI Works, Data Import, Privacy & Data, Equipment). Includes `FAQPage` JSON-LD schema for AEO/GEO.

---

### 10. Missing llms.txt (FIXED)

**Problem:** No `llms.txt` file. AI crawlers (ChatGPT, Perplexity, Claude, etc.) had no structured summary of what SwingIQ is, what it does, and what it does not claim.

**Fix:** Created `apps/web/public/llms.txt` with plain-text summary of the product, supported sports, key features, privacy posture, and honest limitations.

---

### 11. Sport cards on homepage linked to /dashboard instead of sport pages (FIXED)

**Problem:** All 5 sport cards on the homepage linked to `/dashboard`. This missed SEO internal linking opportunities to the dedicated sport analysis pages.

**Fix:** Updated each card to link to the appropriate sport analysis page (`/golf-swing-analysis`, `/tennis-swing-analysis`, etc.).

---

### 12. Footer missing new public pages (FIXED)

**Problem:** Homepage footer did not include links to `/faq`, `/trust`. These are now important trust and discoverability pages.

**Fix:** Added `/faq` and `/trust` to footer. Reordered for logical reading.

---

## Route Inventory

### Public routes (indexable)

| Route | File | Index? | Status |
|-------|------|--------|--------|
| `/` | `app/page.tsx` | ✅ Yes | Good — has structured data, OG, keywords |
| `/how-it-works` | `app/how-it-works/page.tsx` | ✅ Yes | Good — canonical set |
| `/golf-swing-analysis` | `app/golf-swing-analysis/page.tsx` | ✅ Yes | Good — FAQ schema, canonical |
| `/tennis-swing-analysis` | `app/tennis-swing-analysis/page.tsx` | ✅ Yes | Good — FAQ schema, canonical |
| `/baseball-swing-analysis` | `app/baseball-swing-analysis/page.tsx` | ✅ Yes | Good — FAQ schema, canonical |
| `/softball-swing-analysis` | `app/softball-swing-analysis/page.tsx` | ✅ Yes | Good — covers both softball types |
| `/faq` | `app/faq/page.tsx` | ✅ Yes | New — FAQPage JSON-LD |
| `/trust` | `app/trust/page.tsx` | ✅ Yes | New |
| `/parents` | `app/parents/page.tsx` | ✅ Yes | Good |
| `/pricing` | `app/pricing/page.tsx` | ✅ Yes | Minimal — expand later |
| `/updates` | `app/updates/page.tsx` | ✅ Yes | Good — 33 entries |
| `/privacy` | `app/privacy/page.tsx` | ✅ Yes | Fixed — was noindex |
| `/terms` | `app/terms/page.tsx` | ✅ Yes | Fixed — was noindex |
| `/login` | `app/login/` | Crawlable, no content | Low value — keep crawlable |
| `/signup` | `app/signup/` | Crawlable, no content | Low value — keep crawlable |

### Protected app routes (noindex / block)

| Route | Robots | Status |
|-------|--------|--------|
| `/dashboard` | Disallow in robots.txt | ✅ Correct |
| `/sessions/*` | Disallow | ✅ Correct |
| `/diagnose` | Disallow | ✅ Correct |
| `/training` | Disallow | ✅ Correct |
| `/video` | Disallow | ✅ Correct |
| `/bag` | Disallow | ✅ Correct |
| `/profile` | Disallow | ✅ Correct |
| `/settings/*` | Disallow | ✅ Correct |
| `/compare` | Disallow | ✅ Correct |
| `/ai-coach` | Disallow | ✅ Correct |
| `/admin/*` | Disallow | ✅ Correct |
| `/api/*` | Disallow | ✅ Correct |

---

## Dead-End Page Audit

Pages that could trap a user with no way out:

| Page | Dead-end risk | Navigation present | Fixed? |
|------|---------------|--------------------|--------|
| 404/not-found | **CRITICAL** — was blank | None | ✅ Fixed |
| `/privacy` | Low — has "← Back" link | Yes | ✅ OK |
| `/terms` | Low — has "← Back" link | Yes | ✅ OK |
| `/trust` | None — new page has nav | Yes | ✅ OK |
| `/faq` | None — new page has nav | Yes | ✅ OK |
| `/parents` | Low — has dashboard CTA | Yes | ✅ OK |
| `/pricing` | Low — has links out | Yes | ✅ OK |
| App pages (dashboard, sessions, etc.) | Low — all wrapped in AppShell | AppShell sidebar | ✅ OK |
| `/sessions/import/image` | Moderate — deep workflow | Back link needed | Deferred |
| `/sessions/log` | Moderate — deep workflow | Back link needed | Deferred |

---

## Sport Journey Continuity Audit

| Sport | Home → Select | Dashboard | Profile | Upload | Diagnose | Results | Return Path |
|-------|--------------|-----------|---------|--------|----------|---------|-------------|
| Golf | ✅ | ✅ DashboardContent | ✅ | ✅ Import wizard | ✅ | ✅ | ✅ AppShell |
| Tennis | ✅ | ✅ NonGolfDashboard | ✅ | ✅ Session log | ✅ | ✅ | ✅ AppShell |
| Baseball | ✅ | ✅ NonGolfDashboard | ✅ | ✅ Session log | ✅ | ✅ | ✅ AppShell |
| Slow Pitch | ✅ | ✅ NonGolfDashboard | ✅ | ✅ Session log | ✅ | ✅ | ✅ AppShell |
| Fast Pitch | ✅ | ✅ NonGolfDashboard | ✅ | ✅ Session log | ✅ | ✅ | ✅ AppShell |

The `AppShell` provides consistent navigation across all protected app pages via the sport-aware sidebar.

---

## SEO / GEO / AEO Readiness

| Signal | Status |
|--------|--------|
| Unique title per page | ✅ All public pages |
| Meta description per page | ✅ All public pages |
| Canonical URLs | ✅ Set on sport pages + legal pages |
| Open Graph per page | ✅ Sport analysis pages + homepage |
| FAQPage JSON-LD | ✅ Homepage + /faq + sport analysis pages |
| WebApplication JSON-LD | ✅ Homepage |
| Sitemap.xml | ✅ Created |
| robots.txt | ✅ Fixed |
| llms.txt | ✅ Created |
| Internal linking (footer) | ✅ Homepage footer updated |
| Sport card internal links | ✅ Fixed (now point to analysis pages) |
| BreadcrumbList JSON-LD | ❌ Deferred |
| HowTo JSON-LD | ❌ Deferred |
| /features page | ❌ Not yet created |
| /resources page | ❌ Not yet created |
| /glossary page | ❌ Not yet created |
| Search Console submission | ❌ Manual — requires production domain |
| Core Web Vitals check | ❌ Requires live deployment |

---

## Accessibility Notes

| Area | Status |
|------|--------|
| AppShell keyboard navigation | ✅ Sidebar uses `<Link>`, mobile uses `<button>` |
| Mobile drawer — Escape key closes | ✅ |
| Mobile drawer — backdrop click closes | ✅ |
| `aria-label` on hamburger menu | ✅ |
| `aria-modal` on drawer | ✅ |
| `role="dialog"` on drawer | ✅ |
| Skip-to-content link | ❌ Not yet added |
| Visible focus rings | Partial — Tailwind default |
| Breadcrumb component | ❌ Not yet built |
| New pages (404, FAQ, Trust) | ✅ Use `<Link>` for navigation, `<button>` for actions |

---

## Recommended Next Sprint (P1–P2)

| Priority | Task | Why |
|----------|------|-----|
| P1 | Add skip-to-content link to AppShell | Accessibility requirement |
| P1 | Add breadcrumb component to deep app pages | Navigation clarity |
| P1 | Add "back to import" link on `/sessions/import/image` | Dead-end risk |
| P1 | Create `/features` page | SEO + GEO content gap |
| P2 | Create `/resources` page | AEO content gap |
| P2 | Create `/glossary` page | AEO / answer engine targeting |
| P2 | Add BreadcrumbList JSON-LD to sport analysis pages | AEO signal |
| P2 | Equipment diagnostic center (`/equipment/*`) | Product feature gap |
| P2 | Usage-category/youth safety onboarding | Trust & safety requirement |
| P3 | E2E navigation tests (Playwright) | Test coverage gap |
| P3 | Submit sitemap to Google Search Console | SEO action |
| P3 | Submit sitemap to Bing Webmaster Tools | SEO action |
