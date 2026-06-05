# Athlete General Intelligence (AGI)

## In Plain English (start here)

SwingIQ already has a lot of smart tools, but each one is a *specialist*: one
reads your swing's biomechanics, one matches drills, one tracks progress, one
checks readiness. Each is great at its single job and knows nothing about the
others.

**Athlete General Intelligence is the generalist.** It's one engine that looks
at *everything you've analysed, across every sport, at the same time*, and asks
bigger-picture questions a single specialist can't:

- "What's the **one thing** holding back the most sports at once?"
- "This athlete is good at rotation in golf — does that **carry over** to their
  tennis?"
- "Which weakness, if fixed, **improves three sports** instead of one?"

That's what the **"general"** in the name means: *breadth* (it spans all your
sports) and *transfer* (what it learns in one it applies to another). It is the
opposite of a narrow, single-task tool.

**What it is *not*:** it is not "artificial general intelligence" in the
science-fiction sense — it isn't self-aware, and it doesn't think like a person.
We chose the honest reading of the letters: **A**thlete **G**eneral
**I**ntelligence. Like the rest of SwingIQ, it shows its work: every number
comes from your own analysed sessions, every conclusion shows *why* it reached
it and *how confident* it is, and single-camera analysis is always called an
**estimate**, never a lab measurement. Nothing here is medical advice.

You'll find it in the app under **Analyze → Athlete GI** (`/agi`).

## How it works (the four layers)

1. **Capabilities** (`capabilities.ts`) — the trick that makes it general. Every
   sport-specific metric (golf shoulder turn, tennis unit turn, baseball
   separation…) is mapped onto a small set of **sport-neutral athletic
   capabilities**: Rotation & Coil, Kinetic Sequencing, Balance & Posture,
   Tempo & Timing, Power & Speed, Consistency. These are the traits you actually
   carry between sports, so the engine can reason about *you*, not about one
   swing.

2. **World model** (`worldModel.ts`) — fuses every signal into one
   `AthleteWorldModel`. Fusion is **confidence-weighted** (a solid measurement
   counts more than a flat-depth guess) and **basis-conservative** (a fused
   capability is never reported as more certain than its weakest input). It also
   carries the athlete's declared **identity** (sports trained, skill, goal),
   publishes an honest **coverage** score, and lists what's still missing —
   including sports the athlete says they train but hasn't analysed.

3. **Reasoning** (`reasoning.ts`) — deterministic insights, each with an
   inspectable **reasoning chain** (claim + evidence), a basis, and a
   confidence. The signature output is the **Keystone**: the single weak
   capability that limits the most sports. There's also a **Goal** insight that
   ties the athlete's own stated goal to the capability it most depends on (and
   says whether that *is* the keystone — perfect alignment — or something to
   work alongside it), plus a **Today / readiness** insight, and Strength,
   Transfer gap, Consistency, and Coverage insights. A readiness **safety
   caution** (flagged discomfort) is ranked above everything, including the
   keystone.

4. **Transfer + Plan** (`transfer.ts`, `planner.ts`) — `buildTransfers` links
   capabilities across your sports using the shared movement-principle map
   (`@/lib/skillTransfer`), grounded in your real per-sport scores.
   `buildGeneralPlan` turns it into **one prioritised plan** centred on the
   keystone, reusing whatever drills the source engines already prescribed.

The top-level entry point is `runAthleteGI(bundle)` in `engine.ts` — pure, no
React, no browser, no network, fully unit-tested (`__tests__/agi.test.ts`).

### Engine v2 additions

- **Score bands** — every capability gets an honest `band` (building / developing
  / solid / sharp), the same friendly scale as readiness.
- **Trajectories** — each capability carries a trend (up / down / flat + Δ) built
  from snapshot history, so the whole profile shows movement, not just the keystone.
- **Trust grade** (`trust.ts`) — one A–D meta-confidence for the whole picture
  from coverage + basis quality + sample depth + cross-sport breadth, always with
  the reasons holding it up and what would raise it. On `result.trust`.
- **Plateau insight** — when the focus capability stalls across ≥3 check-ins, the
  engine says so and prescribes a *new* approach instead of more of the same.
- **Keystone translation** (`buildKeystoneTranslations`) — phrases the keystone in
  each of the athlete's sports via the shared principle expressions
  (`result.keystoneTranslations`).
- **Readiness-scaled, sport-interleaved plan** — weekly minutes scale with today's
  readiness (rest on a safety caution); for multi-sport athletes the keystone block
  rotates its sport context (one trait, trained across sports).

## Progress over time (the retest loop)

The plan keeps telling people to "re-analyse in 2–3 weeks to confirm your
keystone moved" — `progress.ts` + `history.ts` make that real:

- `history.ts` persists a tiny snapshot of the model (capability scores + the
  current focus) in its own localStorage key, **one entry per day**, capped and
  SSR-safe. It stores only small numbers — never video or pose.
- `buildProgress(model, history)` (pure) compares the current model to the most
  recent snapshot **from a different day** (so "today" never compares to itself)
  → per-capability deltas, biggest improver/decliner, and how the current focus
  moved. It surfaces as a **Progress** insight and on `result.progress`.
- `useAthleteGI` reads history once on mount and records today's snapshot via an
  effect, so progress simply accrues as the athlete keeps using the app.

## Where the data comes from (the adapters)

The engine is source-agnostic: it consumes a normalised `SignalBundle`, and
each data source is a thin adapter under `lib/agi/adapters/` that emits one.

- `motion-lab.ts` — Motion Lab sessions → capability signals (rotation,
  sequencing, …). The richest source.
- `store-sessions.ts` — launch-monitor sessions + saved video analyses → session
  refs for consistency/coverage. **Ball-flight outcomes don't become body
  capabilities** — kept honest.
- `profile.ts` — the declared golf profile + per-sport profiles → `AthleteIdentity`
  (sports trained, skill, handedness, and the free-text **goal**, mapped to the
  capabilities it depends on via `goalToCapabilities`).
- `readiness.ts` (+ pure `readiness-map.ts`) — the readiness engine's score →
  a **"today's form"** snapshot. This is a *daily-state axis, not a body
  capability*: it changes how hard to train today and can raise a **safety
  caution that outranks every other insight** — it never edits the structural
  capability scores. AGI adds no new readiness math; it reuses the existing
  engine's `PerformanceSignals`.
- `feedback.ts` (+ pure `feedback-map.ts`) — the athlete's DrillMatch feedback →
  **proven drills** (the ones they marked as helping). The plan then *leads with*
  the drills that have personally worked, ahead of generic prescriptions. Honest:
  it's the user's own verdict, never a universal claim.
- `merge.ts` — combines bundles and de-dupes sessions by id.
- `useAthleteGI.ts` — the one client hook that reads **all** of the above and
  runs the pipeline. Add a new source = add one adapter; nothing else changes.

## Where it shows up in the app

- **`/agi`** (sidebar → Analyze → Athlete GI) — the full dashboard.
- **Today dashboard** — a compact `<AthleteGISummary />` next to the existing
  intelligence panel (golf + non-golf), surfacing the top conclusion + keystone
  + today's form + the progress trend, with a link through to `/agi`. It
  self-hides until there's a session, a stated goal, or a readiness signal.
- **Shareable report** — `<AgiReportCard />` at the bottom of `/agi`: copy /
  email-coach / web-share / print-to-PDF the cross-sport report. Mirrors the
  app's `ShareableReportCard` pattern (privacy ack, analytics, youth-safe via
  `usage_category`, text-only). The builders are pure (`report.ts`:
  `buildAgiReportText` + `buildAgiReportHtml`); print opens a clean standalone
  window with no app chrome.

## Coordination note (read before editing motion-lab)

The AGI layer is a **read-only consumer of Motion Lab**. It only ever *reads*
stored sessions, and it does so behind a **single thin adapter**
(`lib/agi/adapters/motion-lab.ts`) that touches only long-stable, public
motion-lab fields (`metrics`, `scoreboard`, `report.topFixes`, `capture.sport`).

This is deliberate: Motion Lab is under active development by a separate
workstream (temporal intelligence, kinetic chain, object tracking…). If its
internals change, **only that one adapter file needs to follow** — the engine,
reasoners, planner, and tests never import motion-lab and stay untouched. New
metrics added to motion-lab will *auto-classify* into a capability via the
keyword fallback in `capabilities.ts`, so the AGI layer keeps working without
edits as Motion Lab grows.

## Extending it

- **New capability** → add to `CAPABILITIES` in `capabilities.ts` and (optionally)
  link a principle id from `@/lib/skillTransfer`.
- **New metric → capability mapping** → add to `KNOWN_METRIC_CAPABILITY`, or rely
  on the keyword classifier.
- **New signal source** (e.g. launch-monitor data, readiness, benchmarks) → write
  another adapter that emits a `SignalBundle`; the engine consumes it unchanged.
- **LLM narrative** → pass `enhanceNarrative` to `runAthleteGI`. It may only
  re-word the text; it can never change numbers, basis, or confidence
  (`enhanced: true` then flags that the prose was assisted).

## Audit roadmap status (June 2026)

An expert audit drove a 5-phase hardening roadmap. Status:

- **Phase 1 — value & instrumentation (done):** `isThinModel` softens the keystone
  to an honest "early read" + caps its confidence on thin data; a fully-populated
  **demo athlete** (`demo.ts`) so first-timers see the wow; a classifier contract
  test; engine analytics (`AGI_*` events).
- **Phase 2 — trust & UX (done):** **golden-athlete eval harness** (`eval/`,
  `npm run eval:agi`) that pins output *quality*; centralized `config/thresholds.ts`;
  **insight feedback** ("useful?/not me", `insightFeedback.ts`); plain-language
  glossary; safe iframe-srcdoc print.
- **Phase 3 — grounded narrative (done, tandem):** the **athlete summarizer**
  (`summarizer.ts`, grounded ~120-word narrative + a validator that rejects invented
  numbers / out-of-roster sports / medical terms; optional LLM re-word behind the
  provider) — surfaced in the `/agi` UI as the "Your read" card.
- **Phase 4 — agentic loop (done):** **commit-to-plan** with an approval gate
  (`commitment.ts`) → persists the focus + a 2-week retest date (audit trail) →
  a **"retest due"** prompt closes the loop.
- **Phase 5 — moat (engine done; wiring/infra pending):** **team intelligence**
  (`team.ts`, `buildTeamSummary`) aggregates a roster's keystones + the top shared
  capability gap — pure + tested; **wiring it into `/coach` and cloud-syncing
  history (Supabase + RLS) and validating the capability ontology against outcome
  data are owner-infra/data-gated follow-ups** (`docs/ATHLETE_GI_STRATEGY.md`).
