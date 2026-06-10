# RecordAssist Vision + Kinetic Tracking OS

SwingVantage's guided, privacy-first, on-device self-recording system. It helps a
solo athlete place their phone, get in frame, and capture a clip that the analysis
pipeline can actually read — with live visual overlays, a proprietary **Frame
Readiness Score**, and a hands-free **voice + caption** coach.

> One fix. One plan. One retest. — RecordAssist improves the very first step:
> capturing a usable clip before analysis begins.

- **User route:** `/record-assist` (App → Analyze → "Record with Guidance")
- **Admin console:** `/admin/record-assist`
- **Kill-switch:** Feature Flags → `record_assist.enabled`

---

## 1. Codebase audit (what already existed)

RecordAssist was built to **reuse**, not rebuild. The audit found a mature stack:

| Area | Existing asset | How RecordAssist uses it |
| --- | --- | --- |
| Pose | `lib/pose/pose-detection.ts` (MediaPipe `tasks-vision`, IMAGE mode, 33-pt BlazePose, env-configurable WASM/model base, kill-switch) | New `runtime/live-pose.ts` mirrors the same model/WASM resolution but in **VIDEO** running-mode for real-time preview detection. |
| Recording | `components/video/VideoRecorder.tsx` (getUserMedia + MediaRecorder codec negotiation) | `runtime/camera.ts` reuses the same MIME negotiation + facing-mode fallback. |
| Sport taxonomy | `lib/motion-lab/taxonomy.ts`, `@swingiq/core` `SportId`, `lib/sport-brand/registry.ts` (accent CSS vars) | `sports.ts` bridges RecordAssist's six-sport vocabulary to the platform `SportId`; the selector uses the same accent vars. |
| Analytics | `lib/analytics.ts` `track()` + `@swingiq/core` `ANALYTICS_EVENTS` | 26 new events registered in core; `analytics-engine.ts` emits via an injected sink wired to `track()`. |
| Feature flags | `lib/admin/flags.ts` + `lib/admin/stores/feature-flags.ts` (`isFlagEnabled`, `useFeatureFlags`) | `record_assist.enabled` / `record_assist.voice` flags + a `useSyncExternalStore` gate (mirrors `MotionLabGate`). |
| Admin | `components/admin/{PageHeader,SectionCard,HelpPanel,StatusBadge}` + `lib/admin/nav.ts` | New `/admin/record-assist` console + nav entry in the `media-ai` group. |
| Design system | `components/ui/{Button,Card}`, `cn()`, semantic Tailwind tokens | All RecordAssist UI uses the existing primitives + tokens (no new styling system). |
| Quality guidance | `lib/motion-lab/recording-guidance.ts`, `lib/motion-lab/quality.ts` | Conceptual basis for the readiness components + retake reasons. |

**Greenfield:** there was **no** voice/TTS/SpeechSynthesis system — RecordAssist
introduces the first one (`runtime/speech.ts` + `VoiceGuidanceEngine`).

---

## 2. Architecture

```
apps/web/src/lib/record-assist/
  types.ts                     # dependency-free type vocabulary
  sports.ts                    # bridge to platform SportId + sport metadata
  saved-angles.ts              # "record same angle again" foundation (localStorage)
  sim.ts                       # synthetic frames for the documented QA states
  engines/                     # PURE, dependency-free, fully unit-tested
    landmarks.ts               # BlazePose 33-pt map + geometry helpers
    frame-quality-engine.ts    # frame signals → structured quality verdict
    readiness-score-engine.ts  # Frame Readiness Score (0–100) + states
    sport-preset-engine.ts     # capture presets for all 6 sports
    voice-guidance-engine.ts   # message selection + throttling planner
    retake-engine.ts           # post-clip retake recommendations
    compatibility-engine.ts    # device-tier resolution from a probe
    analytics-engine.ts        # typed event emitter (injected sink)
  runtime/                     # browser-only adapters
    live-pose.ts               # MediaPipe VIDEO-mode + frame luma/contrast
    camera.ts                  # getUserMedia + MediaRecorder helpers
    speech.ts                  # SpeechSynthesis + Vibration
  hooks/                       # React glue
    useDeviceCompatibility, useCameraStream, useGuidedCapture,
    useVoiceGuidance, useRecordingState, useRecordAssistAnalytics
  __tests__/                   # 62 engine unit tests + fixtures

apps/web/src/components/record-assist/
  RecordAssistGate · RecordAssistExperience · GuidedCameraView
  SportAngleSelector · SetupInstructionCard · VoiceGuidanceControls
  ReadinessScoreBadge · AthleteFrameOverlay · GuidanceCaption
  RecordingCountdown · RetakeRecommendationCard · CameraPermissionPanel
  PrivacyNotice · DeviceCompatibilityWarning

apps/web/src/app/(app)/record-assist/page.tsx       # user route (gated)
apps/web/src/app/admin/record-assist/               # admin console
```

**Design rule — pure engine core.** `types.ts` + `engines/*` import nothing from
React or `@swingiq/core`, so the entire readiness/voice/retake brain is testable
with zero build dependencies and can be reused anywhere (admin simulator, future
native app, server-side scoring).

### Data flow (live loop)

```
camera preview ──▶ useGuidedCapture (≈8 fps)
   │                 ├─ LivePoseDetector.detect()  → PoseSample (on-device)
   │                 ├─ sampleFrameStats()         → luma / contrast
   │                 ▼
   │            FrameSignalInput
   │                 ▼
   │   evaluateFrameQuality() → FrameQualitySignals
   │                 ▼
   │   computeReadiness()     → ReadinessScore (0–100 + state + confidence)
   │                 ▼
   └─▶ useVoiceGuidance: VoiceGuidancePlanner.plan() → speak + caption + haptic
```

Nothing leaves the device during framing. A clip is only created if the user
records, and only leaves the device if they choose to analyze it.

---

## 3. The Frame Readiness Score

A single honest 0–100 number predicting whether the clip will be usable.

| Component | Default weight |
| --- | --- |
| Full body visible | 25 |
| Implement likely visible | 15 |
| Centering | 15 |
| Distance | 15 |
| Lighting | 10 |
| Camera stability | 10 |
| Background clarity | 5 |
| Correct sport angle | 5 |

States: **0–39** Not usable · **40–69** Needs adjustment · **70–84** Usable ·
**85–100** Excellent. Per-sport presets may nudge the weights (e.g. tennis serve
weights orientation/headroom higher; putting weights stability higher) and the
engine **renormalizes back to 100**. Recording is **never blocked** — low scores
warn but always allow proceed.

Every score carries a **confidence** label (`high` / `medium` / `low` /
`insufficient`) so the UI never overclaims.

---

## 4. Voice guidance

`VoiceGuidanceEngine` is two pure layers:

1. `selectGuidance()` — picks the single highest-impact message by priority
   (no person → multiple people → body cut off → distance → centering →
   orientation → implement risk → lighting → stability → ready).
2. `VoiceGuidancePlanner` — anti-spam throttle: a global min-gap between any two
   messages, a per-message repeat cooldown, and a "never talk over yourself"
   guarantee. Countdown messages bypass throttling.

Modes: **Coach** (full), **Simple** (short cues), **Silent** (captions only).
Captions render in every mode for accessibility; haptics fire when supported.
Every message carries an `i18nKey` for future translation.

---

## 5. Privacy & trust

- Body tracking + framing run **100% on-device** (MediaPipe in the browser).
- The live preview is **never uploaded or stored**.
- A clip exists only after the user records; it leaves the device only on an
  explicit "analyze" action.
- Confidence labels everywhere; explicit "not medical / not pro motion-capture"
  language.
- Parent-friendly guidance for minors.
- Graceful permission-denied + unsupported-browser states (upload fallback).

---

## 6. Testing

- **62 unit tests** (`npx jest src/lib/record-assist`) across all seven engines,
  covering every documented state: permission granted/denied, no person, too
  close/far, off-center, head/feet cut off, low light, busy background, shaky,
  multiple people, voice throttling, mute/silent, readiness math, preset
  selection, countdown, retake, device tiers, analytics.
- **Playwright** (`e2e/record-assist.spec.ts`): the deterministic guided-recording
  entry flow (route → gate → sport/action selection → camera-permission panel).
- **Admin QA simulator** (`/admin/record-assist`): runs the real engines against
  synthetic frames for every state — no camera required.

Run locally:

```bash
cd apps/web
npx jest src/lib/record-assist --runInBand --cacheDirectory ./.jest-cache-ra
npx tsc --noEmit
```

---

## 7. Roadmap (phases)

- **Phase 1 — MVP (this PR):** camera permission, live preview, sport/action
  presets, on-device pose, framing overlays, full-body/head/feet/centering/
  distance/orientation/lighting checks, Frame Readiness Score, voice + captions +
  haptics, countdown, recording, retake intelligence, saved-angle foundation,
  device fallback, analytics, admin console, unit + e2e tests.
- **Phase 2 — Kinetic foundation:** skeletal overlay, camera-motion proxy
  (devicemotion / landmark jitter), auto-trim + motion-event detection, full
  retest-same-angle flow, deep in-app handoff to the analyzer, saved-location memory.
- **Phase 3 — Advanced biomechanics:** tempo / balance / hip-shoulder separation
  proxies, swing-plane proxy, movement-box analytics, frame-by-frame stepping,
  side-by-side comparison, kinematic-sequence estimates (all confidence-labelled).
- **Phase 4 — Intelligence layer:** personalized setup memory, multi-language
  voice, multi-camera / second-device pairing, admin preset tuning, continuous
  quality learning from anonymized failure categories.

---

## 8. Known limitations (MVP)

- **Camera-motion proxy** is reported as `unknown` for now (stability still scored
  conservatively); Phase 2 wires devicemotion / landmark-jitter.
- **Auto-trim** is instrumented (`auto_trim_applied`) but not yet applied — Phase 2.
- **Analyzer handoff** in the review step offers download + the existing upload
  path; deep in-app handoff (clip → `/video` analyzer state) is a Phase 2 item.
- Live pose needs WebGL + a secure context; without them RecordAssist degrades to
  manual framing guides (overlays + checklist) and still records.
- Adoption/quality dashboards are powered by the events listed in the admin
  console via your analytics provider (e.g. PostHog) — the events ship now; the
  saved dashboards are configured provider-side.
