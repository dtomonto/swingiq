# pose3d — Proprietary 3D Pose Reconstruction

## In Plain English (start here)

Single-camera "3D" can only ever *estimate* depth. This module adds two genuinely
stronger ways to get 3D, and is honest about which one you're using:

1. **Two cameras → real 3D (measured).** If you film the same rep from two angles,
   SwingIQ uses classic camera geometry (triangulation) to compute the *actual*
   3D position of each joint. This is real measured 3D, the same math motion-capture
   studios use — just with two phones instead of a $50k rig. We prove it works with
   tests that recover a known skeleton to under a millimetre.

2. **One camera → smarter depth (trained model).** For the common one-phone case,
   SwingIQ ships a small neural network we **actually trained** to guess depth from
   the body's 2D shape. It's trained on a procedurally-generated body simulator (no
   private data needed) and, on held-out tests, it explains ~78% of the depth it
   couldn't see. It's still an estimate — just a much smarter one than raw MediaPipe.

Nothing here claims medical, injury, or "tour-grade" accuracy. The two-camera path
reports its own error honestly (so a bad setup shows *low* confidence instead of
fake 3D), and the one-camera model is always labelled an AI estimate.

Everything runs in the browser. No new libraries were added.

---

## Modules (`apps/web/src/lib/pose3d/`)

| File | What it is |
| --- | --- |
| `linalg.ts` | Matrix/vector ops, a Jacobi eigensolver (triangulation null-space), and a **3×3 SVD**. |
| `camera.ts` | Pinhole camera (normalized coords), projection matrices, look-at calibration, two-phone **rig presets**. |
| `triangulate.ts` | **DLT multi-view triangulation** → true metric 3D + reprojection error. |
| `eightpoint.ts` | Normalized **8-point essential-matrix** estimation + Sampson distance + RANSAC. |
| `decompose.ts` | Essential matrix → (R, t) via SVD + **cheirality** disambiguation. |
| `selfcalibrate.ts` | **Per-capture self-calibration**: 2D correspondences → recovered camera geometry. |
| `sync.ts` | **Temporal sync**: cross-correlate per-frame motion to align two clips. |
| `synth.ts` | Procedural 33-joint skeleton generator + projector (the training data + test ground truth). |
| `mlp.ts` | From-scratch MLP: forward pass + **Adam backprop** + gradient clipping. |
| `lift3d.ts` | Single-view lift **inference** (loads `weights/lift3d.json`). |
| `providers.ts` | **Lift-provider seam** (trained MLP today; ONNX/server stub for the future). |
| `engine.ts` | High-level API: `enrichFrameWithLift` (single view) + `reconstructMultiViewFrame` (multi). |
| `weights/lift3d.json` | The **trained** lift-model weights (committed). |
| `__tests__/` | SVD, triangulation, self-calibration, sync, shipped-weights validation, and the gated trainer. |

## How the two paths are wired into Motion Lab

- **Single view** (`runMotionAnalysis`, `proDepth` option, on by default): after pose
  detection, `enrichFrameWithLift` replaces each joint's depth `z` with the trained
  model's prediction. `x/y` stay MediaPipe estimates, so the track is still an honest
  `estimated` result (model tag `…+lift3d`).
- **Multi view** (`runMultiViewMotionAnalysis`, the wizard's "2 cameras · true 3D"
  mode): two clips → uniform frame extraction (preserves cross-view correspondence) →
  pose on each → **motion-based temporal sync** aligns the clips → **self-calibration**
  recovers the camera geometry from the data (falls back to a rig preset if the
  estimate is weak) → `buildMultiViewTrack` triangulates each synced frame (plus a
  small reprojection-error search for residual jitter) → a `measured` track. The model
  version records which calibration + lag were used. The 3D viewer and results footer
  say "Measured 3D · multi-view".

The single-view lift runs through a **provider seam** (`providers.ts`): the trained
MLP implements `Lift3DProvider` today; `getActiveLiftProvider()` will prefer a
configured ONNX/server model automatically once one is added — no downstream changes.

## What's real vs what needs your data

| Real & shipping now | Honest limitation | Production upgrade path |
| --- | --- | --- |
| DLT triangulation → metric 3D (tested <1 mm) | Needs two views with a real baseline | A larger/fixed rig + checkerboard intrinsics for absolute scale |
| **Per-capture self-calibration** (8-point essential matrix + RANSAC + cheirality) recovers the camera geometry FROM THE DATA — no rig preset needed (tested: recovers true relative rotation) | Up-to-scale; assumes default phone intrinsics | Bundle-adjustment refinement + known-length scale (subject height) |
| **Motion-based temporal sync** (cross-correlation of per-frame motion) aligns the two clips | Integer-frame alignment | Audio-clap or flash sync for sub-frame precision |
| Trained lift model (~78% depth variance explained) | Trained on **synthetic** projections, not real mocap | Fine-tune on real motion-capture (below) |
| Reprojection-error confidence | Wrong calibration → low confidence (by design) | — |

## Training the lift model

The committed weights were produced by the gated trainer (uses the in-repo synthetic
generator, no external deps):

```bash
# from apps/web
TRAIN_POSE3D=1 npx jest lift3d.train
# → writes src/lib/pose3d/weights/lift3d.json and asserts it beats baseline
```

### Production grade (fine-tune on real mocap → ONNX)

The architecture is intentionally a plain MLP so it ports cleanly. To go beyond the
synthetic prior:

1. Collect/obtain a 2D→3D dataset (e.g. **Human3.6M**, **AMASS**, or your own
   multi-view captures — the triangulation path above can *generate* the 3D labels).
2. Rebuild the same `input` (66 torso-normalized 2D coords) → `target` (33 relative
   depths) pairs from real data.
3. Train a larger temporal model in **PyTorch** (e.g. a 1-D temporal conv or a small
   transformer over a window of frames), validate MPJPE.
4. Export to **ONNX**, run it in-browser with **onnxruntime-web**, and implement the
   `PoseProvider` seam (`lib/motion`) so Motion Lab consumes it with `basis` upgraded
   accordingly. No UI changes needed — the track type is the contract.

## Honesty guarantees

- Multi-view = `measured`; single-view lift = `ai_inferred`/`estimated` (never
  `measured`). Confidence is derived from real reprojection error, not asserted.
- No medical diagnosis, injury prediction, or guaranteed-improvement claims.
- All processing is on-device; the original videos never leave the browser.
