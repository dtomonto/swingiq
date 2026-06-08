# Phase 4 + 5 — Auto Golf-Bag Intelligence & Athlete Timeline

## In Plain English (start here)

**Phase 4 — your bag builds itself.** Once you've imported some sessions,
SwingVantage reads the club names + carry distances from your shots and offers to
build your bag for you. On the **My Golf Bag** page you'll see a "Detected from
your sessions" card: one tap adds a club you've been hitting but never entered,
and it flags when a club's typical carry has drifted (e.g. you have your 7-iron
at 150 but your last sessions average 160) so you can update it. **You stay in
charge** — anything you type by hand is treated as the truth and never silently
overwritten.

**Phase 5 — your whole history, in order.** A new **Timeline** page (under
Progress) shows everything in your record on one chronological feed: sessions,
the issues found in them, video analyses, daily notes, equipment changes, and
setup — filterable by type and sport. It's the human view of the same full
history the AI reasons over (not just your latest session). The storage note is
honest: it says "saved on this device" until you have an account, then "synced
across your devices — no session limit."

---

## What changed (for engineers)

### Phase 4 — `lib/equipment/bag-detection.ts` (pure)
- `detectBagFromSessions(sessions)` → `DetectedClub[]`: groups all imported shots
  by normalized club name, picks the most-common spelling, computes a **robust
  typical carry** (drops the single highest + lowest as fluke/mishit when ≥4
  shots), infers `BagCategory`, and rates confidence by sample size.
- `reconcileBag(existingClubs, detected)` → `{ newClubs, baselineUpdates }`:
  suggestions only. Honors the **source-of-truth hierarchy** (user > imported >
  inferred) — it flags user-set carries before offering to replace them, never
  auto-mutating.
- `LocalClub` gained optional provenance fields (`source_of_truth`,
  `imported_carry_avg`, `imported_shot_count`, `active`) — all back-compat.
- UI: `BagAutoDetectCard` in `BagManager` (add club / add all / update baseline).
  Manual saves in `BagManager` now stamp `source_of_truth: 'user'`.

### Phase 5 — `lib/timeline/` (pure) + `/timeline`
- `buildTimeline(input)` merges every **dated** event (sessions, their top
  diagnosis, video analyses, daily notes, equipment additions, setup completion)
  into one newest-first `TimelineEvent[]`. Undated counters (raw milestone flags)
  are deliberately excluded rather than faked.
- `summarizeTimeline` (counts / range / sports) + `filterTimeline` (type + sport).
- `/timeline` page: filter chips, vertical event stream, empty state, and a
  **mode-gated** storage note (`useAuth().mode` — never claims local-only when
  cloud-synced). Added to the sidebar under Progress.

## Tests (15 new)
`lib/equipment/__tests__/bag-detection.test.ts` (category inference, robust carry,
confidence, reconcile add/update/threshold/user-confirmed) and
`lib/timeline/__tests__/build.test.ts` (merge, ordering, date-skipping, summary,
filters). Full suite green (1591), tsc clean, production build passes.

## Not yet (future)
Phase 4: shaft/flex/make/model inference (needs richer source data); per-club
trend of carry over time (the data now exists via imported_* + timeline). Phase
5: drill-completion + priority/grade-history events once those carry timestamps;
AI summarization endpoint over the timeline; CSV/JSON export of the timeline.
