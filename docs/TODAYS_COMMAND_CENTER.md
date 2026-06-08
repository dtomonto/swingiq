# Today's Command Center (DailyActionIntelligenceOS)

The founder/admin's daily operating cockpit. A prioritized **"to do today"** list,
generated from **live platform signals** and scored transparently, so you always
know *what* to do, *why* it matters, *what data is missing*, the *exact steps*, the
*expected impact*, and *how the app knows it's done*.

- **Route:** `/admin/command-center` (admin-only; `robots: noindex`)
- **Nav:** Overview → *Today's Command Center*
- **Code:** `apps/web/src/lib/command-center/*`, page at `apps/web/src/app/admin/command-center/`

> Sibling note: `/admin/today` ("Today's Plan") is a separate, concurrently-built
> overview surface. The Command Center is the full DailyActionIntelligenceOS
> recommendation engine described here. Both are honest, registry-driven, and
> non-overlapping in storage; the owner can keep either or both.

## What you get

1. **Daily executive summary** — needs-attention / critical / high / completed
   counts, plus the biggest *data gap*, *growth opportunity* and *AI-quality risk*.
2. **"Do this first today"** — the single highest-priority actionable item.
3. **Prioritized to-do list** — action cards with full reasoning, evidence,
   missing-data analysis, step-by-step instructions, expected outcome, risk if
   ignored, and completion criteria.
4. **Section tabs** — Today, Critical, Data Needed, AI Quality, Growth/SEO,
   Content, Product, Completed, Snoozed, Dismissed.
5. **Filters** — priority band, type, sport.
6. **Per-card actions** — In progress · Complete · Snooze · Dismiss · Reactivate ·
   Add note · Open related tool.
7. **Run Intelligence Scan** — recomputes from the latest signals.
8. **Engine settings** — items/day cap, hide low priority, default snooze, include
   baseline, and per-type on/off toggles.

## How recommendations are generated

Generation is **server-side, stateless and deterministic** — the same signal always
yields the same recommendation `id` (the basis for de-duplication).

```
signals.server.ts   → gathers live signals (defensive; degrades to safe defaults)
   ↓ SignalBundle
engine.ts           → pure rules → scored, de-duplicated Recommendation[]
   ↓
generate.server.ts  → runScan(): the server entry the page calls
   ↓ (props)
CommandCenterClient → applies owner overlay + settings, renders the UI
```

### Live signals (nothing is invented)

| Signal | Source | Produces |
| --- | --- | --- |
| Per-sport drill coverage | `data/drills-content.ts` + DrillMatch catalog (`aggregateDrillLibrary`) | `content_gap` per thin sport |
| Open audit findings | `lib/admin/audits/data` (`loadFindings`) | `security` / `seo_growth` / `product_quality` … per open P0/P1 |
| Feature-education gaps | `lib/feature-education/server/data` (`loadAlertCounts`) | `tutorial_gap`, `documentation` |
| Setup state | `data/setup-registry.json` | `admin_configuration` roll-up |
| Analytics wiring | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` / `GA_ID` / `POSTHOG_KEY` env | `analytics_gap` (high-value) |
| Baseline best-practices | curated, `isSeed: true` | feedback loop, onboarding skill-level, sample reports, AI confidence layer |

**Honesty rule:** when data is missing, the engine *says so* and tells you how to
start collecting it — it never fabricates analytics. Baseline starters are labelled
"Initial recommendation" so they're never mistaken for measured results.

## Priority scoring (transparent)

`scoring.ts` is intentionally simple and additive:

```
priority_score =
    impact (0–25)
  + urgency (0–20)
  + confidence (0–15)
  + affectedUsers (0–15)
  + strategic (0–15)
  + risk (0–20)
  − effortPenalty (S=2, M=6, L=12, XL=18)
→ clamped to 1–100
```

Bands: **Critical 90–100 · High 70–89 · Medium 40–69 · Low 1–39.** Every card shows
`explainScore()` — the top drivers behind its number.

## Owner state & de-duplication

- Owner actions (in-progress / complete / snooze / dismiss / notes) and settings
  persist **in the browser** (`localStorage`, keyed by recommendation id). This is
  the same pattern the Action Center's browser-local queues use, and it works in
  production where the runtime filesystem is read-only.
- Because ids are deterministic, your actions **survive re-scans** — completing an
  item moves it to *Completed*; it won't re-spam the Today list.
- If a completed item's score later rises by `REOPEN_DELTA` (12) — i.e. the
  underlying issue got worse — it's flagged **"Worsened — reopened"** instead of
  silently staying done.
- Expired snoozes automatically revert to active.

## Adding a new recommendation rule

1. Add a signal to `SignalBundle` (in `engine.ts`) and populate it in
   `signals.server.ts` (wrap the source in try/catch → safe default).
2. Write a pure `rule(bundle): Recommendation[]` using the `build()` helper — set
   the scoring `factors`, `evidence`, `stepByStepActions` and `completionCriteria`.
3. Register it in the `RULES` array.
4. Add a unit test in `__tests__/command-center.test.ts`.

The engine is rule-based first but LLM-ready: a future rule may call a model to
phrase/rank while keeping the same scoring + dedupe contract.

## Settings (admin-configurable)

`maxPerDay`, `hideLowPriority`, `defaultSnoozeDays`, `alertThreshold`,
`includeBaseline`, and `disabledTypes[]` — all persisted client-side. Defaults in
`DEFAULT_SETTINGS` (`types.ts`).

## Security

Admin-only via the existing `/admin` layout + middleware (same gate as every other
admin page; `robots: noindex, nofollow`). Recommendations are computed from
aggregate registry data — no PII is surfaced in cards.

## Testing

```
npx jest src/lib/command-center --runInBand --cacheDirectory="$TEMP/jest-cc"
```

Covers scoring/banding, sport-coverage detection, analytics gap, audit ranking,
generation ordering + dedupe, snooze expiry, reopen detection, summary roll-ups,
focus selection and section routing.

## Limitations & follow-ups

- Generation is rule + registry driven today. Once a product-analytics key is
  connected, add behaviour-driven rules (funnels, retention, abandonment) — the
  `analytics_gap` recommendation exists precisely to unblock this.
- CentralIntelligenceOS / GrowthOS integration points are wired as deep-links and
  shared signals (audits, feature-education). Richer two-way integration (e.g.
  pulling GrowthOS experiment backlog) is a clean follow-up via new rules.
- Owner state is per-browser. A future enhancement could sync it to the account
  store for cross-device continuity.
