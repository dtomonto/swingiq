# Motion Lab — 3D Motion Analysis

## In Plain English (start here)

Motion Lab is a new page in SwingIQ where someone can upload (or record) a short
clip of a swing, serve, pitch, or throw and get back:

- a **3D stick-figure replay** they can spin around, zoom, slow down, and step
  through frame-by-frame,
- the **phases** of the motion laid out on a timeline (e.g. setup → top → impact
  → finish),
- a set of **biomechanical numbers** (how much they turn, how stable their head
  is, whether their body fires in the right order, etc.),
- an **overall score** plus six sub-scores (Power, Sequencing, Rotation, Balance,
  Timing, Consistency),
- a **plain-language coaching report** with the top 3 things to fix and what NOT
  to change,
- a **drill plan** and a one-week practice schedule,
- and a **compare** tool that overlays a past session as a faint "ghost" and
  shows what got better or worse.

**The honest part:** all of this comes from a single phone camera. The body
tracking is real (Google's MediaPipe, running privately on the device), and the
depth is a genuine model output — but a single camera can only *estimate* true
3D. So every number is labeled as an **estimate** with a **confidence** score,
and the app never claims medical, injury, or "tour-grade" accuracy. The video
itself never leaves the device.

You can **upload a file or record in-app**, **trim** to just the rep, pick a
**skill level** (which sets the reference ranges you're scored against) and a
**tracking accuracy** tier (Fast / Balanced / Accurate), and **export** the
result as JSON, CSV, or a printable **PDF** coach report.

It runs entirely in the browser. Nothing new needs to be installed.

---

## Where it lives

| Piece | Path |
| --- | --- |
| Route (page) | `apps/web/src/app/(app)/motion-lab/page.tsx` |
| UI components | `apps/web/src/components/motion-lab/` |
| Engine (the "brain") | `apps/web/src/lib/motion-lab/` |
| Nav link | added under **Analyze** in `components/layout/Sidebar.tsx` |

Open it at **`/motion-lab`** (it's in the authenticated app, alongside
`/video` and `/diagnose`).

## How the pipeline works

`lib/motion-lab/pipeline.ts` orchestrates everything, reusing the app's existing,
already-shipping infrastructure:

1. **Extract frames** — `lib/frame-extraction.ts` samples ~24 still frames,
   concentrated on the actual motion (it finds the "swing window" by frame
   differencing).
2. **Detect pose** — `lib/pose` runs **MediaPipe Pose Landmarker** on-device and
   returns real `x, y, z, visibility` for 33 body landmarks. Frames are never
   uploaded for detection.
3. **Reconstruct** — light temporal smoothing stabilises the 3D estimate
   (`smoothTrack`).
4. **Segment phases** — `phases.ts` time-warps the sport's canonical phase
   template onto the real motion, anchoring the impact/contact/release phase to
   the detected peak hand-speed frame.
5. **Metrics** — `biomechanics.ts` turns the pose track into per-frame signal
   series and ~13 proxy metrics (rotation, separation, sequencing, head
   stability, sway, posture change, tempo, balance, etc.).
6. **Score** — `scoring.ts` composes the metrics into six weighted components +
   an overall score, carrying the weakest data basis forward so an estimate can
   never present itself as a measurement.
7. **Coach** — `reporting.ts` writes the executive summary, diagnosis, root-cause
   hypothesis, top-3 fixes, "what not to change", practice plan, and five tone
   variants (beginner / athlete / coach / youth / data).
8. **Drills** — `drills.ts` prescribes 4 drills (immediate / feel / technical /
   constraint) tied to the weakest metrics, plus a weekly plan.
9. **Quality gate** — `quality.ts` assesses capture quality (subject detected,
   full body in frame, tracking reliability, resolution, fps, motion window,
   camera angle) and gives "improve your capture" tips.

The result is a `MotionSession` saved locally via `persistence.ts`
(localStorage, its own key, never touches existing stores). The stored pose
track is **subsampled and rounded** so replay/compare work without bloating
storage. The original video is never stored.

## What is real vs estimated

| Real / measured | Estimated (clearly labeled) | Fallback / future |
| --- | --- | --- |
| MediaPipe body landmarks (on-device) | All biomechanical metrics (single-camera proxies) | True multi-view / metric 3D |
| Frame extraction & motion-window detection | Phase windows (template warped onto motion peak) | Trained sport-specific phase model |
| Per-frame velocity / rotation signals | Reference ranges (starter heuristics, editable) | Validated, level-segmented norms |
| Camera-quality signals from tracking | Lighting / motion-blur (inferred from tracking) | Direct image-quality analysis |

If no pose is detected (bad lighting, body out of frame), the pipeline does **not**
fabricate data — it returns an honest low-confidence result and the 3D viewer
shows a "no pose detected" message with capture guidance.

## The 3D viewer

`components/motion-lab/Motion3DViewer.tsx` is a **dependency-free** 3D renderer on
a 2D canvas. It projects the real MediaPipe landmarks with a rotation +
light-perspective transform. Features: orbit (drag), zoom, front/side/top
presets, play/pause, speed, frame stepping, scrub, hand/head motion trails,
confidence shading (low-confidence bones are dashed/grey), a ghost-overlay
comparison mode, and PNG screenshot export.

> **Why not Three.js / React Three Fiber?** The prompt suggested them, but the
> existing app has neither, and adding heavy 3D dependencies to a React 19 /
> Next 16 app risked the build (a hard "don't break the app" constraint). The
> canvas renderer is robust, honest, and zero-install. The pose data flows
> through a clean track type, so a Three.js/R3F viewer (or a true trained 3D
> model) can replace the source/renderer later without touching the engine.

## Extension points (future proprietary upgrade)

- **Pose provider seam** — `lib/motion/` already defines a `PoseProvider`
  interface. A trained model, server endpoint, or multi-view rig can implement
  it and feed Motion Lab a higher-confidence `MotionPoseTrack`.
- **Reference ranges** — the starter heuristics in `biomechanics.ts` are isolated
  in small helpers; swap them for validated, level-segmented norms when
  available.
- **Phase model** — `phases.ts` uses a deterministic warp today; a learned phase
  classifier can replace `detectPhases` behind the same signature.

## Capture, accuracy & exports

- **Record in-app** — `MotionRecorder.tsx` uses `getUserMedia` + `MediaRecorder`
  (on-device, builds metadata from the measured recording to avoid the WebM
  `Infinity`-duration quirk). **Trim** — `VideoTrimmer.tsx` marks the rep; the
  window is passed to frame extraction (no ffmpeg re-encode).
- **Skill level** — `referenceRanges.ts` holds every metric's 0–100 scoring,
  segmented beginner → elite. This is the one place to swap starter heuristics
  for validated norms. The selected level is shown per metric ("Target …").
- **Tracking accuracy** — pose detection supports `lite` / `full` / `heavy`
  MediaPipe tiers (`detectPoses(frames, quality)`); the wizard exposes them as
  Fast / Balanced / Accurate. Each tier caches its own landmarker.
- **Exports** — JSON + CSV (`export.ts`) and a dependency-free printable **PDF**
  coach report (`printReport.ts`, opens a print-ready window). A collapsible
  **Technical details** panel on the results page shows frames detected/attempted,
  tracking confidence, basis, model, engine, and processing time (debug mode).

## Privacy & safety

- Video is read locally; only the analysis + a compact pose track persist, on the
  device only. Sessions can be deleted individually.
- No medical diagnosis, injury prediction, or guaranteed-improvement claims.
- Youth-friendly tone available; confidence and limitations are always shown.
