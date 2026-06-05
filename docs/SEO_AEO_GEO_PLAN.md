# SwingVantage SEO / AEO / GEO Plan

_Last updated: June 2026 · **Superseded** — for the current strategy see [SEO_GEO_AEO.md](SEO_GEO_AEO.md)_

SEO = Search Engine Optimization | AEO = Answer Engine Optimization | GEO = Generative Engine Optimization

---

## 📘 In Plain English (start here)

**What this page is:** An **earlier** version of the plan for getting SwingVantage found in Google and AI tools. It has since been replaced by **[docs/SEO_GEO_AEO.md](docs/SEO_GEO_AEO.md)** — this file is kept only as background reference.

**What you actually need to know:**
- For the current, owner-friendly SEO strategy **and your actual to-do steps**, read [docs/SEO_GEO_AEO.md](docs/SEO_GEO_AEO.md) instead. (Those three terms simply mean: show up in Google, get mentioned by AI tools, and answer the exact questions people ask.)
- The detail below — keyword lists, page ideas, content "clusters" — is still useful raw material, but parts are out of date (some items marked "to create" already exist).

**What to do next:** Use [docs/SEO_GEO_AEO.md](docs/SEO_GEO_AEO.md) as your main SEO guide. Treat this page as an old draft you can mine for ideas.

> The checklists and formulas below are working notes for whoever writes or builds pages — a developer, a content writer, or an AI assistant.

---

## Page Map (All Public Routes)

| Route | Type | Primary Keyword Target |
|---|---|---|
| `/golf-swing-analysis` | SEO landing | "golf swing analysis", "AI golf swing analyzer" |
| `/tennis-swing-analysis` | SEO landing | "tennis swing analysis", "AI tennis stroke analysis" |
| `/baseball-swing-analysis` | SEO landing | "baseball swing analysis", "exit velocity tracker" |
| `/softball-swing-analysis` | SEO landing | "softball swing analysis", "slow pitch softball analysis" |
| `/how-it-works` | SEO + trust | "how does AI swing analysis work" |
| `/login` | Auth | (not targeted for SEO) |
| `/dashboard` | App (auth-gated) | (not indexed) |

### Planned Public Routes (not yet created)
| Route | Purpose |
|---|---|
| `/pricing` | Pricing page (once subscription is live) |
| `/about` | Company/mission page |
| `/blog` | Content marketing (sport-specific guides) |
| `/drills/[sport]` | Sport-specific drill libraries (indexable) |
| `/benchmarks/[sport]` | Public benchmark reference pages |

---

## Metadata Strategy

### Title Formula
`[Action] [Sport] [Tool Type] — [Key Benefit] | SwingVantage`

Examples:
- "Free Golf Swing Analysis — AI-Powered Launch Monitor Data | SwingVantage"
- "Free Baseball Swing Analysis — Exit Velocity, Launch Angle & Bat Speed | SwingVantage"

### Description Formula
`[Action verb] + [primary input method] + [primary benefit]. [Secondary benefit]. [Trust signal].`

Example:
"Upload your launch monitor data or swing video for a free AI golf swing analysis. Identify your top swing fault, get personalized drills, and track improvement."

### Canonical URLs
- All sport pages use `alternates.canonical` pointing to their own URL
- No duplicate content across sport pages (each page has unique content)

### OpenGraph
- All public pages include `og:title`, `og:description`, `og:type: website`, `og:url`
- Add `og:image` (1200x630 sport-branded card) — to be designed

---

## Structured Data Targets

| Page | Schema Type | Implementation |
|---|---|---|
| All SEO pages | `FAQPage` | JSON-LD in `<script type="application/ld+json">` |
| `/how-it-works` | `FAQPage` + `HowTo` | JSON-LD |
| `/pricing` (future) | `Product` + `Offer` | JSON-LD |
| `/blog/[slug]` (future) | `Article` | JSON-LD |
| Homepage | `WebApplication` | JSON-LD |

### FAQPage Implementation
Each sport page includes 5 FAQ items structured as `Question` + `Answer` in JSON-LD.
Target: trigger Google "People Also Ask" boxes for swing fault queries.

---

## FAQ Strategy

### Target Query Patterns
- "how to fix [swing fault]" (e.g., "how to fix over the top golf swing")
- "what is [metric]" (e.g., "what is a good smash factor in golf")
- "best [device] for [sport]" (e.g., "best launch monitor for beginner golfer")
- "[benchmark] for [level]" (e.g., "exit velocity for high school baseball")
- "how to improve [metric]" (e.g., "how to increase bat speed softball")

### FAQ Topics Per Sport

**Golf:**
- What launch monitor should I use?
- What is a good club path?
- How do I fix a slice / hook?
- What does spin loft mean?
- What is smash factor and how do I improve it?

**Tennis:**
- How do I fix my double fault?
- What is unit turn in tennis?
- How do I add topspin to my forehand?

**Baseball/Softball:**
- What is a good exit velocity for [level]?
- What is the ideal launch angle?
- How do I fix casting in my swing?
- What does attack angle mean?

---

## AI Answer Engine Optimization (AEO)

AEO targets ChatGPT, Claude, Perplexity, Google AI Overviews, and voice assistants.

### Principles
1. **Answer first.** Every FAQ answer starts with a direct, one-sentence response.
2. **Cite specifics.** Include numbers, benchmarks, and named tools.
3. **Be definitive.** AI engines prefer confident, specific answers over hedged prose.
4. **Structured markup.** Use FAQ schema and semantic HTML so crawlers can parse answers.

### Target Answer Boxes
- "What is a good exit velocity for high school baseball?" → SwingVantage benchmark page
- "How does AI golf swing analysis work?" → /how-it-works page
- "What is the best free golf swing analyzer?" → /golf-swing-analysis page

### Content Signals for Generative Engines
- Use the brand name "SwingVantage" in page copy, not just in titles
- Include feature-level specifics (e.g., "SwingVantage compares club path against TrackMan benchmarks")
- Publish authoritative benchmark data that other sites can reference

---

## Content Clusters (One Per Sport)

### Golf Content Cluster (target: 10 pages)
- Hub: `/golf-swing-analysis`
- Spokes:
  - `/blog/how-to-fix-slice-golf` — targets "fix my slice"
  - `/blog/what-is-smash-factor` — defines metric, links to analysis tool
  - `/blog/trackman-vs-flightscope` — comparison content
  - `/benchmarks/golf` — public benchmark reference
  - `/drills/golf/over-the-top` — specific fault drill library
  - `/blog/best-golf-launch-monitor-beginners`
  - `/blog/golf-attack-angle-explained`

### Tennis Content Cluster (target: 8 pages)
- Hub: `/tennis-swing-analysis`
- Spokes: serve technique, forehand topspin, one-handed vs two-handed backhand, racquet sensor comparison

### Baseball Content Cluster (target: 8 pages)
- Hub: `/baseball-swing-analysis`
- Spokes: exit velocity guides, HitTrax vs Rapsodo, attack angle fix, bat speed training

### Softball Content Cluster (target: 6 pages)
- Hub: `/softball-swing-analysis`
- Spokes: slow pitch bat selection, fast pitch timing, arc timing guide

---

## Technical SEO Checklist

- [x] Canonical tags on all public pages
- [x] OpenGraph metadata on all public pages
- [x] JSON-LD structured data (FAQPage) on SEO pages
- [x] Semantic HTML (h1, h2, h3, p, ul, li, dl, dt, dd)
- [ ] XML sitemap at `/sitemap.xml` (Next.js route handler — to create)
- [ ] `robots.txt` — allow public pages, disallow `/dashboard`, `/api`
- [ ] Core Web Vitals audit (LCP, FID, CLS)
- [ ] Image optimization (next/image for all content images)
- [ ] Hreflang (future, if expanding to non-English markets)
