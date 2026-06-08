# SwingVantage SEO Content Plan — Views → Habit → Ad Revenue

_Last updated: June 2026_

---

## 📘 In Plain English (start here)

**What this page is:** A repeatable playbook for getting lots of people to SwingVantage
from Google, turning them into people who come back often, and (later) earning ad
revenue from all those views. It's the execution companion to the strategy doc
[`SEO_GEO_AEO.md`](SEO_GEO_AEO.md) and the automated monthly audit
(`seo-aeo-geo-monthly-audit`).

**The whole strategy in one line:** publish a steady, modest number of genuinely
useful pages that answer the exact problems athletes search for → hook each visitor
into a tool they'll come back to → once traffic is steady, run privacy-safe ads
against all those views. **Quality and trust beat volume — we deliberately grow
slowly so the site never looks spammy.**

**What you actually do each month:** publish ~2 new problem pages + ~4 blog posts
(roughly one a week, one sport at a time), refresh 1–2 old ones, and check the
numbers (analytics + Search Console are wired up). That's it. The rest of this doc
is the detail behind those moves.

---

## 0. Conservative SEO policy (READ FIRST — applies to every content task)

We optimise for **trust, not tricks.** A brand-new domain with little authority
gets penalised for looking auto-generated, so our posture is deliberately cautious:
"would a careful human reviewer call this spammy?" — if there's *any* doubt, don't
ship it.

**Hard rules (all automated content tasks must follow these):**

1. **Quality over volume, always.** One excellent page beats ten mediocre ones.
   Shipping nothing in a given run is a perfectly good, healthy outcome.
2. **Slow, human cadence.** Net-new pages are capped: ~1 blog post per week (single
   rotating sport) and ~1 new landing page every *other* week (~2/month). No bursts,
   no batches. Off-weeks are for *refreshing* existing pages, not adding new ones.
3. **No near-duplicates / doorway pages.** Never publish a page that substantially
   overlaps an existing one's angle. A fan of near-identical "fix X" pages is the
   #1 thing that reads as a programmatic spam cluster.
4. **No keyword stuffing and no `<meta name="keywords">` tag.** Google ignores it
   and Bing can treat a stuffed list as a negative signal. Write naturally for the
   reader; never repeat a phrase to "rank" for it. (`buildMetadata()` no longer
   emits keywords — don't re-add them.)
5. **No fake anything.** No invented stats, studies, quotes, reviews, ratings,
   awards, or credentials. The JSON-LD helpers intentionally omit `AggregateRating`
   / `Review` — keep it that way.
6. **Honest, useful framing.** Keep the heuristic-estimate language, the "when to
   see a coach" note, and youth-safety reminders. Helpfulness earns rankings;
   manipulation risks penalties.
7. **Curated, not blanket, linking.** Internal links are relevant and modest
   (2–3 per page), with natural anchor text — never exact-match-stuffed. The sitemap
   stays a curated trust surface, not a dump of every URL.

When these rules conflict with "more traffic faster," the rules win. We would
rather grow slowly and keep a clean reputation than risk a manual action or a
helpful-content demotion that's expensive to recover from.

---

## 1. The growth model (and the honest math)

```
   SEO content  ──►  new visitors  ──►  hooked into a tool  ──►  habitual return  ──►  ad impressions
   (this plan)       (Google)          (Fix Stack/Analyze)      (streaks/email)        (revenue)
```

Ads pay per view, and rates are low (~$5–15 per 1,000 page views for sports
content). So revenue scales with **both** levers, not one:

| Monthly page views | Rough ad revenue/mo |
|---|---|
| 100k | ~$500–1,500 |
| 500k | ~$2,500–7,500 |
| 2M | ~$10k–30k |

**The multiplier is habit.** A visitor who returns 8×/month produces 8× the
impressions of a one-time visitor. That's why content (new visitors) and the
return loop (Fix Stack, streaks, retests, email reminders) are equally important —
this plan feeds both.

---

## 2. The monthly cadence (repeatable)

Do this every month. It pairs with the automated `seo-aeo-geo-monthly-audit`
task, which handles technical SEO and drafts; this is the human "what to publish"
layer.

1. **Publish ~2 new landing pages** from the backlog in §3 (golf has the most
   search volume, so weight it 2:1) — at a slow, ~every-other-week pace, never in a
   batch. See §0 for why we cap velocity. (Blog posts run separately, ~1/week.)
2. **Refresh 1–2 existing pages** that are ranking on page 2 of Google (small
   wins: add a section, a FAQ, an internal link, a fresher date). On weeks we're
   *not* publishing a new page, refreshing is the default activity.
3. **Add 3–5 glossary terms** (cheap long-tail wins; feeds answer engines).
4. **Check the numbers** (§6) and pick next month's targets from what's gaining
   impressions.

> Keep drafts as drafts until they're genuinely useful — the anti-thin-content
> gate in `docs/seo-system.md` enforces this, and thin pages hurt the whole site.

---

## 3. Keyword target backlog (problem-first)

People don't search "AI swing analysis" — they search their **frustration**.
Target those. Each becomes one page using the template in §4. SwingVantage already has
several of these (`/golf/fix-slice`, `/golf/stop-topping-the-ball`,
`/softball/stop-popping-up`, `/baseball/exit-velocity-drills`,
`/tennis/backhand-basics`); keep mining the same vein.

**Golf (highest volume — weight here):**
- why do I slice my driver but not my irons
- how to stop coming over the top
- chunking / fat iron shots fix
- how to stop hitting it thin
- inconsistent driver distance / low smash factor
- how to shallow the golf club
- what is a good ball speed / launch angle for my swing speed
- pull hook fix / two-way miss

**Tennis:**
- why do I hit the net on my forehand
- topspin forehand basics for beginners
- one-handed vs two-handed backhand
- serve toss consistency / why is my serve inconsistent

**Baseball:**
- how to increase exit velocity at home
- why am I rolling over / ground balls to short
- fixing a long swing / bat drag
- timing drills for fastballs

**Softball (slow + fast pitch):**
- how to hit line drives in slow pitch
- stop popping up in softball
- generating power without speed (slow pitch)
- reaction-time hitting drills (fast pitch)

**Cross-cutting / high-intent (great for the habit hook):**
- "is my [metric] good?" comparison pages → link to `/benchmarks`
- "free swing analysis" variants → link to `/free-swing-analysis`
- equipment-fit questions → link to the equipment diagnostic tool

Pull more candidates from Search Console's "queries" report once data flows
(§6) — real impressions beat guesses.

---

## 4. The proven page template

Use the existing AEO/GEO format (full spec in `docs/seo-system.md` §5) so pages
rank in Google **and** get quoted by AI answer engines:

1. **Direct answer** in the first 2 sentences (answer the exact question).
2. **Short explanation** of why it happens.
3. **Self-diagnosis** ("which of these is you?").
4. **What SwingVantage checks** for this issue → primary conversion hook.
5. **Drills** (2–4, with the existing drill links).
6. **Common mistakes**.
7. **When to see a coach** (keep the honest disclaimer).
8. **FAQ** (3–6 Q&As → FAQ schema).
9. **CTA** into the relevant tool.
10. **Structured data** (Article + FAQ via `lib/seo/jsonLd.ts`; use
    `buildMetadata()` so canonical/OG are consistent).

Programmatic pages live in `content/seoPages.ts` — adding a well-formed entry
there is the fastest way to ship one.

---

## 5. Turn every visitor into a habit (the return loop)

A view is worth far more if the person comes back. Every content page must hand
the reader a reason to enter the app and a reason to return:

- **One clear CTA** per page into the matching tool (Analyze, Fix Stack, the free
  tools, a challenge). No account required — that's a conversion advantage; lead
  with it.
- **Link to the habit surfaces**: Fix Stack (`/fix`), Player Arc (`/arc`),
  streaks, and retests. These are what make people return daily.
- **Capture an email** where natural ("email me my plan / remind me to retest").
  Wire an email provider (see `.env.example` → Email capture) so reminders can
  actually go out — this is the single biggest retention lever still off.
- **Internal links**: every new page links to 2–3 related pages and 1 benchmark
  page. This spreads ranking strength and increases pages-per-visit (= more ad
  impressions per session).

---

## 6. Measure it (now wired up)

Analytics and Search Console are now turn-on-able (see `.env.example`):

- **Plausible** (recommended — cookieless, no consent banner) or GA4 →
  set the env var, deploy, and you'll see page views, top pages, and return rate.
- **Search Console** → set `NEXT_PUBLIC_GSC_VERIFICATION`, verify, and submit
  `/sitemap.xml`. Then watch the **Queries** and **Pages** reports.

Each month, watch four numbers:
1. **Organic clicks/impressions** (GSC) — is the content engine growing?
2. **Top landing pages** — double down on what's working; refresh what's stuck on
   page 2.
3. **Returning-visitor rate** — is the habit loop working?
4. **Pages per session** — are internal links earning extra impressions?

You can't optimize an ad business you can't measure — this is step zero.

---

## 7. Ads-readiness checklist (before turning ads on)

Run ads only once these are true — otherwise you risk rejection, legal exposure,
or trashing the user experience you worked to build:

- [ ] **Real, steady traffic** (aim for a few thousand sessions/month before it's
      worth it — ad networks also want this for approval).
- [ ] **Privacy Policy reviewed** (currently a placeholder — must be real before
      AdSense approval; see `docs/SECURITY_AND_PRIVACY.md`).
- [ ] **Use contextual (non-personalized) ads.** They fit SwingVantage's privacy-first,
      youth-safe brand and are **required** for any under-13 audience (COPPA bans
      personalized ads to children). Lower RPM, but on-brand and compliant.
- [ ] **Consent setup** if you ever use personalized ads in the EU/UK (CMP banner).
- [ ] **Ad placement that respects UX** — keep the core analyze/fix flow clean;
      put ads on content/marketing pages, not mid-diagnosis.
- [ ] **Don't show ads to paying users** if/when the Pro tier launches.

---

## 8. How this connects to the rest of the system

- **`docs/SEO_GEO_AEO.md`** — the strategy, on-page checklist, and backlink plan.
- **`docs/seo-system.md`** — the page format (§5) and the canonical
  `buildMetadata()` / `jsonLd.ts` helpers and anti-thin-content gate.
- **`seo-aeo-geo-monthly-audit`** (scheduled task) — runs the 1st of each month:
  fixes safe technical items, enhances pages, drafts (never auto-publishes)
  content, and writes a dated report. This plan tells you what to publish from
  those drafts.
- **`content/seoPages.ts`** — where programmatic pages are defined.
- **Habit surfaces** — `/fix`, `/arc`, retests, streaks, badges (see
  `docs/WEB_APP_GUIDE.md`) are the return-visit engine this content feeds.

**Bottom line:** content brings the views, the app's honest improvement loop turns
them into a habit, and contextual ads monetize the volume — in that order.
