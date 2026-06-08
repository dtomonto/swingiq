# Phase 8 + 9 — Physical Readiness in the AI & Sport-Context Isolation

## In Plain English (start here)

**Phase 8 — your body is part of the plan.** SwingVantage's priority now factors
in how *physically ready* you are today (from BodySync). When your readiness is
low, "Physical readiness — warm up first" shows up as a priority with a one-tap
**dynamic warm-up** and a plain safety note, and it gently flags that a swing
fault *might* be mobility-driven on a rough day rather than purely mechanical.
It's general movement guidance, never medical advice.

**Phase 9 — stay in your sport unless you say otherwise.** Athlete GI used to
offer cross-sport tips automatically if you had data in more than one sport.
Now it **stays focused on your active sport by default**. If you *want* it to
point out skills that carry between your sports, there's a new
**"Allow cross-sport recommendations"** toggle in Settings (off by default).

---

## What changed (for engineers)

### Phase 8 — `lib/readiness/golf-mobility.ts` + priority engine
- `golf-mobility.ts` (pure): the golf mobility areas (thoracic rotation, hip
  IR/ER, hamstrings, ankles, shoulders, wrist/forearm, glutes, core, lead-knee),
  a short dynamic `GOLF_DYNAMIC_WARMUP`, a `READINESS_SAFETY` disclaimer, and
  `readinessSeverity` / `mayBeReadinessDriven` helpers.
- `lib/priority/engine.ts` gained an optional `readiness` input. When the
  BodySync zone is yellow/orange/red it adds a `physical_readiness` priority
  (severity from the zone, evidence = zone/score/regions, plan → `/bodysync`),
  and on low-readiness days it appends a "may be partly mobility-driven; warm up
  first" note to the top swing fault.
- `PriorityPanel` reads `useBodySync().assessment`, feeds it in, and renders a
  collapsible warm-up + safety note when a readiness priority is present.

### Phase 9 — opt-in cross-sport (one switch isolates by sport)
- `reasoning.ts` and `transfer.ts` already gated cross-sport keystone insights +
  transfers on `model.crossSport`. That flag is now
  `allSports.length >= 2 && bundle.allowCrossSport === true` (world-model.ts) —
  so a multi-sport athlete only gets cross-sport output when they opt in.
- `SignalBundle.allowCrossSport` (default off) threaded from
  `useAthleteGI` → `settings.allow_cross_sport` (new `AppSettings` field,
  default `false`). Settings page has the toggle.
- Tests/fixtures that exercise cross-sport features (eval harness cross-sport
  case, `agi.test.ts` transfer/imbalance/fusion, `DEMO_BUNDLE`) now set
  `allowCrossSport: true`; a new harness case asserts the DEFAULT stays isolated.

## Tests (added/updated)
New: `lib/readiness/__tests__/golf-mobility.test.ts`, readiness cases in
`lib/priority/__tests__/engine.test.ts`, a "cross-sport-disabled-stays-isolated"
eval scenario. Updated 4 AGI tests to opt into cross-sport. Full suite green
(1618), tsc clean, production build passes (344 pages).

## Safety
All readiness/mobility copy is general movement prep with a non-medical
disclaimer surfaced at the point of use — no diagnosis, "stop if it hurts",
"check with a professional".

## Not yet (future)
Fold readiness into the on-course **emergency** mode (Phase 11) and **practice
plan** warm-up/cooldown blocks directly; per-sport mobility sets for non-golf;
an explanation in the cross-sport insight of *why* a transfer is relevant when
enabled (partially present via transfer `note`).
