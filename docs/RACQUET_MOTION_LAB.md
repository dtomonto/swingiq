# Racquet Motion Lab — slow-motion video overlay lab

_Created 2026-06-10. Scope note for the Motion Lab's racquet-sports (tennis ·
pickleball · padel) experience and the video-overlay analysis surface._

## What this is

The Motion Lab (`lib/motion-lab`, `components/motion-lab`, route `/motion-lab`)
already delivers the bulk of a sport-specific analysis lab: a sport/motion
taxonomy with per-motion phase templates, on-device MediaPipe pose, a
camera-quality gate, sport-specific metrics + scores, a confidence-labelled
"one fix · one plan · one retest" coaching report, drills, cross-session
comparison/repeatability, estimated implement (racquet/club) path tracking,
kinetic-chain + temporal reads, local-first persistence, JSON/CSV/PDF export,
and a coach/roster admin view. Tennis, pickleball, and padel are first-class
sports in `taxonomy.ts` with their own phase models.

## What shipped in this pass — the Video Overlay Lab

The one central gap versus a "slow-motion clip lab" was that the post-analysis
replay was an **abstract 3D skeleton reconstruction**, not the user's *actual
footage with overlays drawn on it*. That is now built:

- **`components/motion-lab/VideoOverlayLab.tsx`** — plays the user's real clip
  and draws synchronized, toggleable 2D overlays on top of it:
  - Skeleton, joint angles, balance (centre of mass + base of support), contact
    window, racquet/club path, footwork (stance), and phase labels.
  - Slow-motion (0.25× / 0.5× / 0.75× / 1×), frame-by-frame stepping (walks the
    pose-track frames so video + overlay advance together), a phase-segmented
    scrubber, jump-to-phase, loop-a-phase, bookmarks, screenshot, fullscreen,
    and keyboard transport (space = play/pause, ← / → = step).
  - Confidence-aware: low-visibility landmarks fade rather than asserting a
    number; overlay layers disable when their data isn't available.
- **`lib/motion-lab/overlay-geometry.ts`** — pure, unit-tested helpers
  (nearest-frame lookup, 2D joint angles, COM + base-of-support estimate,
  stance read, lead-side resolution). No I/O, no React.
- Wired into `MotionResultsDashboard` with a **Video / 3D** toggle. The video
  lab is the default when a freshly-analysed clip is in memory.
- **`lib/motion-lab/recording-guidance.ts` + `components/motion-lab/RecordingGuidance.tsx`**
  — sport-specific "how to film this" tips (tennis / pickleball / padel / golf /
  baseball / softball) plus a self-confirm angle-quality checklist, shown in the
  capture step **before** upload. Pure data + selectors, unit-tested; complements
  the post-analysis `CameraQualityReport` (guidance prevents bad clips; the gate
  explains them after).

### Privacy invariant (do not regress)

The original video **never leaves the device and is never persisted** — only a
compact pose track is saved. The video lab therefore renders **only for the live
session** (`resultVideoUrl` in the wizard, bound to the just-analysed clip). When
a saved session is reopened from the library, the video is gone by design and the
view falls back to the 3D reconstruction. The wizard clears `resultVideoUrl` on
`openSession`/`startOver` so one session's overlays can never pair with another
clip's footage.

## Phase 2 — planned build-out (the "video lab + extras" track)

Tracked here so it isn't lost. None of this is built yet.

1. **Demo / sample mode.** Pre-baked sample sessions (tennis forehand, pickleball
   dink, padel bandeja/wall-rebound) with a bundled sample clip + pose track so a
   visitor can experience the overlay lab before uploading. Needs a small sample
   asset under `public/` and a `loadSampleSession()` seam; respect the privacy
   model (sample clip is shipped, not user data).
2. **Analytics instrumentation.** Emit Motion-Lab events (lab opened, sport/shot
   selected, uploaded, trimmed, analysis started/completed/failed, overlay
   toggled, slow-mo used, frame-step used, phase clicked, report saved, drill
   opened, retest started, clip deleted). Requires adding the event names to the
   typed `AnalyticsEventName` union in `@swingiq/core` (`lib/growth/types.ts`)
   and rebuilding `dist`; keep it behind the existing keyless analytics seam.
3. **Admin controls.** Enable/disable the lab and the video-overlay surface by
   sport / cohort / beta flag from the admin OS; surface upload volume,
   completion rate, average confidence, and most-common detected faults by sport.
4. ~~**Recording guidance + angle-quality checklist** shown *before* upload~~ —
   **shipped** (see `recording-guidance.ts` / `RecordingGuidance.tsx`).
5. **Manual landmark correction.** A "fix this joint" mode on the overlay canvas
   feeding `ImplementManualHints` and a future pose-correction seam, so low-
   confidence frames can be hand-tuned. The overlay-geometry layer is already
   pure and frame-indexed to support this.
6. **Before/after retest comparison in the video lab** — play two clips
   side-by-side or ghosted, driven by the existing `retestOfSessionId` plumbing.

## Where things live

| Concern | File |
|---|---|
| Sport / motion / phase taxonomy | `lib/motion-lab/taxonomy.ts` |
| Domain types | `lib/motion-lab/types.ts` |
| 2D overlay geometry (pure) | `lib/motion-lab/overlay-geometry.ts` |
| Slow-mo video overlay player | `components/motion-lab/VideoOverlayLab.tsx` |
| 3D reconstruction viewer | `components/motion-lab/Motion3DViewer.tsx` |
| Results composition + Video/3D toggle | `components/motion-lab/MotionResultsDashboard.tsx` |
| Wizard flow (select → capture → analyze → results) | `components/motion-lab/MotionLabWizard.tsx` |
