# Motion Lab — Robustness Roadmap

Plan to close the **honest limitations** of the on-device worst-case-video recovery
work (quality profiler, low-light retry, primary-athlete selection) and a reassessment
of the next upgrades. Everything here preserves the load-bearing promises: **the video
never leaves the device**, single-camera output stays basis `estimated`, and no tool
ever fabricates a landmark or a metric.

Two codebase facts shape this plan:

- The `PoseProvider` seam (`apps/web/src/lib/motion/`) **already exists** with `cloud` +
  `movenet` adapters — but the **shipping** `lib/motion-lab/` pipeline bypasses it and
  calls `lib/pose` directly. Multi-engine work therefore needs a small **router the
  pipeline actually uses**, not just more adapters.
- **Playwright + `e2e/fixtures/` + the `lib/agi/eval/harness.ts` pattern already exist**,
  and the 32×32 motion signatures are computed per frame — so optical-flow, benchmark,
  and E2E tools can *reuse* infrastructure rather than start cold.

Sizing: **S** ≤ ½ day · **M** 1–2 days · **L** 3–5 days of focused work.

---

## Part A — Tools to satisfy the honest limitations

### L1 — Motion-blur recovery (today: tone-only, no deblur)

True blind deconvolution in-browser is expensive *and* the highest hallucination risk.
The defensible tool is **sharp-frame selection + bounded sharpening**, not frame repair.

- **Tools:** `lib/blur-analysis.ts` (per-frame blur score from gradient/Laplacian energy,
  extending `grayStats`); `selectSharpestNear(window, k)`; a clamped unsharp pass in
  `frame-enhance.ts` behind the existing keep-if-better A/B.
- **Approach:** bias frame selection toward the sharpest frames *within the motion window*;
  apply unsharp only when blur is high **and** the retry recovers more poses. Stretch:
  WebGPU deblur behind a capability flag.
- **Deps:** none. **Effort:** M.
- **Honesty:** blur stays a first-class `SOFT_OR_BLURRED` issue; sharpening never raises a
  metric's confidence floor; originals retained.
- **Accept:** on a blurry fixture, mean pose confidence ↑ with no increase in
  biomechanically-impossible jumps.

### L2 — Second pose engine + fusion (today: MediaPipe only)

- **Tools:** wire `moveNetPoseProvider` for real (TF.js MoveNet — the placeholder ships a
  step-by-step recipe); `lib/motion-lab/pose-fusion.ts` (`PoseFusionService`);
  `lib/pose/keypoint-map.ts` (MoveNet-17 ↔ MediaPipe-33 onto a shared joint subset).
- **Approach:** router runs MediaPipe first; on low agreement/confidence runs MoveNet,
  computes a **model-agreement score**, selects **best source per joint**, rejects outliers.
  YOLO-pose / OpenPose / Gemini stay **cloud, key-gated** behind `cloudPoseProvider`
  (off by default — they break on-device privacy otherwise).
- **Deps:** `@tensorflow-models/pose-detection` + a tfjs backend — **lazy-loaded**, with its
  own **CSP allowances** (exact lesson from #96). Bundle cost is real → never on the
  critical path for good video. **Effort:** L.
- **Honesty:** fused output stays basis `estimated`; agreement surfaced in profile + debug.
- **Accept:** on a hard fixture where MediaPipe drops joints, fusion fills them at ≥
  threshold agreement; good video still runs the **single-engine fast path** (no regression).

### L3 — Cross-frame athlete tracker (today: per-frame pick)

- **Tool:** `lib/pose/athlete-tracker.ts` — greedy IoU/centroid tracker with stable track IDs;
  pick the track with the best *cumulative* athlete score (size·centrality·motion·visibility).
- **Approach:** gap-tolerant association for short occlusions; `selectPrimaryPose` becomes the
  per-frame scorer feeding the track-level decision. Pure → testable with the existing
  `record-assist/__tests__/fixtures.ts` pose builders.
- **Deps:** none. **Effort:** M.
- **Honesty:** a subject "swap" mid-clip lowers confidence + raises `MULTIPLE_PEOPLE`.
- **Accept:** a two-person fixture where the bystander is briefly larger still yields one
  continuous athlete track.

### L4 — Real camera-motion estimator (today: exposure-variance proxy)

- **Tool:** `lib/camera-motion.ts` — global translation between consecutive 32×32 signatures
  (already computed) via block-matching / phase-correlation → camera-shake + pan/tilt;
  optional digital stabilization (crop-and-shift) as a preprocessing variant.
- **Approach:** subtract global motion from subject motion → cleaner swing-window detection
  and a true `CAMERA_SHAKE` signal; stabilize only when it improves landmark stability.
- **Deps:** none (reuses signatures). **Effort:** M.
- **Accept:** synthetic panned fixture reports high camera-motion + low subject-motion; static
  fixture reports ~0.

### L5 — Real-browser multi-person E2E + benchmark (today: DOM-gated, unexercised)

- **Tools:** `e2e/motion-lab-video.spec.ts` driving real tiny fixture videos through the actual
  MediaPipe path; `e2e/fixtures/motion/*`; `npm run motion:benchmark`.
- **Approach:** mirror `lib/agi/eval/harness.ts`. **Two tiers:** a node benchmark over labeled
  pose-track fixtures (deterministic, CI-able) asserting the brief's thresholds; Playwright over
  real video for the browser-only paths.
- **Deps:** none new (Playwright configured). **Effort:** M.
- **Accept:** the benchmark prints per-fixture tier/level/confidence/runtime/engine-path and
  **gates:** good→L4–5, usable→L3, poor→L2, terrible→guidance, never blank, never crash.

### Cross-cutting (build these first)

- **`MotionPoseRouter`** (`lib/motion-lab/pose-router.ts`) — the missing seam. Wraps engines →
  tracker → fusion → smoothing behind one call the pipeline uses, finally making the
  `PoseProvider` seam pay off. **L1's retry, L2, and L3 slot in here.** Build first.
- **Benchmark harness (L5, node tier)** — build second, so every later tool is *measured*.

### Sequencing

```
Wave 1 (foundation):   MotionPoseRouter ──► Benchmark + fixtures (node tier)
Wave 2 (cheap, no dep): Camera-motion (L4) ║ Cross-frame tracker (L3) ║ Blur selection (L1)
Wave 3 (heavy, dep):    MoveNet + fusion (L2)  [router + benchmark + CSP/bundle first]
```

Waves 1–2 add **zero dependencies**. Wave 3 is the only one that grows bundle/CSP surface — do
it last, behind the benchmark, lazy-loaded.

---

## Part B — Reassessed "next recommended upgrades"

This plan **absorbs** two former upgrades (cross-frame tracker → L3, second engine → L2). The
re-ranked forward list, by leverage ÷ effort:

| Rank | Upgrade | Why now / why later | Effort | Depends on |
|---|---|---|---|---|
| 1 | **Self-host MediaPipe runtime + model** (`NEXT_PUBLIC_MEDIAPIPE_*_BASE`) | Kills the third-party CSP origins behind #96, removes a CDN SPOF, tightens privacy. Nearly free. | S | — |
| 2 | **Retest comparability scoring** (brief §38) | Profile + angle estimate make it cheap now; powers the "one retest" promise and gates misleading comparisons. | M | profile (done) |
| 3 | **Local admin quality analytics** (failure reasons, tier distribution, retry hit-rate) | Pure on-device telemetry, no PII; closes the loop on what footage fails. | M | profile (done) |
| 4 | **Trained equipment detector** behind `ObjectTrackingProvider` | Big credibility win, but only defensible after the body track is stable. | L | L2, L3 |
| 5 | **Gated cloud/semantic tier** (YOLO-pose / Gemini via `cloudPoseProvider`) | Last: contradicts on-device default, costs money, needs key-gating + consent UX. Edge-case only. | L | L2, consent UX |

**Ranking changes:** self-hosting jumped to #1 (cheapest privacy+reliability win, closes the
#96 root-cause class); equipment detection dropped below tracker/fusion (not defensible until the
body track is stable); the cloud/semantic tier moved to last and is explicitly opt-in.

---

## Guardrails (hold across everything)

- Single-camera → basis stays `estimated`; no tool claims `measured`.
- Every new signal is **keep-if-better A/B'd** against a baseline; never adopted blindly.
- Nothing lowers a metric's honesty floor.
- New heavy deps are lazy-loaded with their own CSP entries.
- Each tool ships with pure unit tests **and** a benchmark fixture.

---

## Status

- **2026-06-14:** Wave 1 started — `MotionPoseRouter` extracted as the detection seam and a
  node-tier benchmark harness (`npm run motion:benchmark`) added with labeled pose-track
  fixtures and the brief's pass/fail gates.
