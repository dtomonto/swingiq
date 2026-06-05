# Tutorial Video Production Guide

## In Plain English (start here)

This is the recording recipe book. The app's tutorial *placements* are already
built — they're just waiting for the actual video files. This doc tells whoever
records them exactly what to say, what to show on screen, how long each clip should
be, and what to name the files so they snap straight into the app.

Every clip is **short on purpose** (10–45 seconds). Short, modular clips load fast,
feel like coaching, and are easy to re-record when the UI changes. Don't make one
long video.

When a clip is ready: run it through `scripts/optimize-tutorial-video.mjs`, drop the
files in `apps/web/public/tutorials/…`, and set the matching fields in
`apps/web/src/lib/tutorial/videos.ts`. The placement lights up automatically.

> The full voiceover scripts already live in the manifest (`script: [...]` on each
> video). This guide adds the production wrapper around them: objective, placement,
> shot list, on-screen text, CTA, captions, thumbnail, mobile notes, and compression
> target.

---

## Global style

- **Tone:** an expert coach guiding a friend. Confident, warm, plain-English. Not a
  software demo. Mirror the app's honest framing — findings are smart estimates, not
  verdicts.
- **Aspect:** record 16:9 at 1280×720+ for desktop. Also export a vertical/square-safe
  mobile cut where the placement is phone-heavy (upload, results).
- **No music bed louder than the voice.** Captions required on the discover/capture/
  understand clips (they auto-play muted-free and many watch without sound).
- **On-screen text:** large, high-contrast, ≤ 6 words per card. Never rely on tiny UI
  text being legible — zoom the relevant control.
- **Length discipline:** if a script runs long, cut a step, don't speed-talk.

## File + manifest mapping (per video id)

| Asset | Path | Manifest field |
| --- | --- | --- |
| Desktop MP4 | `/tutorials/sources/<id>.mp4` | `mp4Src` |
| WebM | `/tutorials/sources/<id>.webm` | `webmSrc` |
| Mobile MP4 | `/tutorials/mobile/<id>.mp4` | `mobileSrc` |
| Poster | `/tutorials/posters/<id>.jpg` | `poster` |
| Thumbnail | `/tutorials/thumbnails/<id>.jpg` | `thumbnail` |
| Captions | `/tutorials/captions/<id>.vtt` | `captionsSrc` |

Compression: `node scripts/optimize-tutorial-video.mjs <input> <id>` (see that script
for the exact FFmpeg commands; `--dry-run` just prints them).

---

## Priority 1 — produce these first

### 1. `welcome` — "See how it works" (homepage hero + Tutorial Center)

- **Objective:** in 60s, make a first-time visitor understand what SwingVantage does
  and why it's worth trying — swing in, top fix out.
- **Placement:** `home-hero` (homepage, under the hero) + Getting Started in `/tutorial`.
- **Length:** 30–45s.
- **Voiceover:** manifest `welcome.script` (5 lines).
- **On-screen text:** "Analyze" → "Understand" → "Improve" → "Track" as the four beats.
- **Shot list:**
  1. Cold open: a phone filming a golf swing (2s).
  2. Screen-capture: upload on `/video`, AI result appears with the top fix highlighted.
  3. Screen-capture: a drill card + 7-day plan.
  4. Screen-capture: progress chart trending up.
  5. End card: logo + "Free. No account needed."
- **CTA:** "Start free — analyze your swing."
- **Required screen recordings:** `/video` upload→result, `/drills`, `/progress`.
- **Captions:** required (`welcome.vtt` — sample provided).
- **Thumbnail concept:** split-frame — real swing on the left, the AI "top fix" card on
  the right, big play glyph.
- **Mobile notes:** ship a `mobile/welcome.mp4`; keep the result card centered and large.
- **Compression target:** ≤ 6 MB desktop MP4, ≤ 3 MB mobile.

### 2. `video-analysis` — "How to record your swing" (upload screen)

- **Objective:** get a clean, analyzable clip on the first try — angle, framing, light.
- **Placement:** `upload-record` (golf + multi-sport upload step) + `upload-error-help`.
- **Length:** 20–35s.
- **Voiceover:** manifest `video-analysis.script`.
- **On-screen text:** "Down-the-line OR face-on", "Whole body in frame", "Steady + lit".
- **Shot list:**
  1. Overhead diagram: phone on a tripod, two angle options (down-the-line, face-on).
  2. Good vs bad framing side-by-side (full body vs cropped).
  3. Tap "Upload", pick the clip, AI begins.
  4. End card: "Better footage = a more confident read."
- **CTA:** "Record your swing now."
- **Required screen recordings:** the `/video` upload box + `RecordingGuide` expanded.
- **Captions:** required.
- **Thumbnail concept:** the framing diagram with a green ✓ on the correct angle.
- **Mobile notes:** this is mostly watched on a phone *at the range* — vertical cut,
  big text, ≤ 25s.
- **Compression target:** ≤ 4 MB desktop, ≤ 2 MB mobile.

### 3. `diagnose` — "How to read your AI analysis" (results screen)

- **Objective:** stop the "okay… now what?" moment. Explain score, confidence, the top
  fix, and the next action.
- **Placement:** `results-read` (results card, golf + multi-sport).
- **Length:** 30–45s.
- **Voiceover:** manifest `diagnose.script`.
- **On-screen text:** "Top fix first", "Confidence, not certainty", "Do the drill".
- **Shot list:**
  1. Pan down a real result: highlight the single top priority.
  2. Zoom the confidence/severity chip; one line on what it means.
  3. Highlight the recommended drill → "Open this feature".
  4. End card: "One fix at a time beats twenty."
- **CTA:** "Open your top drill."
- **Required screen recordings:** a populated `/video` result + `AnalysisTransparency`.
- **Captions:** required.
- **Thumbnail concept:** the results panel with the top-priority row spotlighted.
- **Mobile notes:** crop to the priority card; avoid showing the full two-column layout.
- **Compression target:** ≤ 5 MB desktop.

---

## Priority 2 — the rest of the in-context placements

| id | Title | Placement | Length | CTA | Captions |
| --- | --- | --- | --- | --- | --- |
| `dashboard` | Your Today dashboard | `dashboard-tour` | 20–30s | "Take the tour" | optional |
| `drills` | Practice with purpose | `drills-howto` | 20–35s | "Build my plan" | optional |
| `progress` | How progress works | `progress-howto` | 20–30s | "See my trends" | optional |

Each reuses its manifest `script` as the voiceover. Shot list = screen-capture the named
route, spotlight the one control the script mentions per beat, end on a one-line CTA.

## Priority 3 — sport-specific capture variants (optional)

`RecordingGuide` already gives sport-specific *text*. If you produce sport-specific
*video* capture clips later, add new manifest ids (`record-tennis`, `record-baseball`,
…) with `journeyStage: 'capture'`, then point new placements at them. Keep each ≤ 25s.

## The rest of the library

Every other entry in `lib/tutorial/videos.ts` already has a complete voiceover script
and is browsable in the Tutorial Center with its written walkthrough. Record those on the
same recipe (screen-capture the route, follow the script, ≤ 2–3 min) as time allows —
the Center works fully as text until then.
