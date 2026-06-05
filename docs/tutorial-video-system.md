# Tutorial Video System

## In Plain English (start here)

SwingVantage already had a **Tutorial Center** at `/tutorial` — a library of short
guided videos with written step-by-step fallbacks. What it was missing was a way to
drop a tutorial **right where someone gets stuck**: a small "See how it works" player
on the homepage, a "How to record your swing" clip next to the upload box, a "How to
read your results" clip on the analysis page.

This system adds exactly that — one reusable inline video player you can place anywhere,
a central list of *where* each video should appear, and the plumbing (lazy loading,
captions, analytics, mobile handling) so those placements are fast and polished instead
of slowing the app down.

Nothing here forces a tutorial on anyone. Every placement is **poster-first and
click-to-play** (no surprise autoplay, no sound), and every video still shows its written
walkthrough if the recording isn't up yet. You add the actual `.mp4`/`.webm` files later;
the placements light up automatically.

---

## What was already here (and reused, not rebuilt)

| Piece | Location | Role |
| --- | --- | --- |
| Video manifest | `apps/web/src/lib/tutorial/videos.ts` | One entry per feature, persona tracks, helpers |
| Tutorial Center page | `apps/web/src/app/(app)/tutorial/page.tsx` + `components/tutorial/TutorialCenter.tsx` | Browsable library + guided tracks |
| Modal playlist player | `components/tutorial/TutorialVideoPlayer.tsx` | Plays a track like a playlist (YouTube/Vimeo/file) |
| Welcome nudge | `components/tutorial/TutorialWelcomePrompt.tsx` | Dismissible "new here?" prompt (store-backed) |
| Per-screen guides | `components/tutorial/ContextualHelpButton.tsx` + `lib/tutorial/content.ts` | The "?" Guide on every app screen |
| Dismissal state | `hooks/useTutorial.ts` + Zustand store `tutorialProgress` | watched / dismissed / skipped, in backups |
| Recording tips | `components/video/RecordingGuide.tsx` | Sport-aware "how to film" guidance |
| Analytics | `lib/analytics.ts` + `packages/core/src/analytics/events.ts` | Provider-agnostic `track()` |

## What this change adds

1. **`components/tutorial/TutorialVideo.tsx`** — the reusable inline/card player.
   Poster-first, IntersectionObserver lazy-mount, `<source>` WebM + MP4 + mobile,
   `.vtt` captions, reduced-motion aware, error fallback to the written script,
   analytics hooks, no layout shift (aspect-ratio box), `playsInline`, keyboard + ARIA.
2. **Extended manifest** (`lib/tutorial/videos.ts`) — backward-compatible optional fields
   on `TutorialVideo`: `journeyStage`, `webmSrc`, `mp4Src`, `mobileSrc`, `captionsSrc`,
   `thumbnail`, `priority`, `autoplayAllowed`, `mutedDefault`, `loop`, `fallbackText`,
   plus helpers `hasRecording()` and `getInlineSources()`.
3. **Placement registry** (`lib/tutorial/placements.ts`) — the single source of truth for
   *where* each tutorial appears, what CTA copy to use, and how it should behave.
4. **Tutorial analytics helper** (`lib/tutorial/analytics.ts`) — `trackTutorialVideo()`
   that stamps every event with `{ video_id, placement, page, sport, user_journey_stage,
   device_type }` and seven new `TUTORIAL_VIDEO_*` events in core.
5. **In-context placements** — homepage hero, the swing upload screens (golf + multi-sport),
   and the AI results screens.
6. **Asset framework** — `public/tutorials/{posters,thumbnails,captions,sources,mobile}`
   with a README + a sample caption file, plus `scripts/optimize-tutorial-video.mjs`.
7. **Docs** — this file, `tutorial-video-production-guide.md`, `tutorial-video-qa-checklist.md`.

## The tutorial video map

| Placement id | Video | Surface | Journey stage | Trigger | Display |
| --- | --- | --- | --- | --- | --- |
| `home-hero` | `welcome` | `/` hero | discover | click-to-play | inline |
| `upload-record` | `video-analysis` | `/video` upload step | capture | click-to-play | inline |
| `results-read` | `diagnose` | `/video` results | understand | click-to-play | card |
| `dashboard-tour` | `dashboard` | `/dashboard` | onboard | click-to-play | card |
| `drills-howto` | `drills` | `/drills` empty state | improve | click-to-play | card |
| `progress-howto` | `progress` | `/progress` | track | click-to-play | card |
| `upload-error-help` | `video-analysis` | upload error state | recover | click-to-play | card |

Placements marked in the registry but not yet mounted in JSX are intentional, documented
extension points — mounting them is a one-liner (`<TutorialVideo placement="..." />`).

## Performance rules honored

- Poster image only on first paint — **no video bytes** load until the user clicks play.
- `IntersectionObserver` defers even the impression/preload work until the card is on screen.
- `preload="none"` by default, `"metadata"` only for `priority: 'high'` placements.
- Aspect-ratio container (`aspect-video`) prevents Cumulative Layout Shift.
- No third-party player library; native `<video>` only. Zero new runtime dependencies.
- Mobile gets a smaller source via `<source media="(max-width: 640px)">` when provided.
- Honest coming-soon state renders instantly (no network) until real files are added.

## How to add a recording later

1. Produce the files (see `tutorial-video-production-guide.md` + `scripts/optimize-tutorial-video.mjs`).
2. Drop them in `public/tutorials/sources/`, `…/mobile/`, `…/posters/`, `…/captions/`.
3. In `lib/tutorial/videos.ts`, set the matching entry's `mp4Src` / `webmSrc` / `mobileSrc`
   / `poster` / `captionsSrc`. Nothing else to wire — every placement using that id
   lights up automatically.

## How to add a new placement

1. Add an entry to `TUTORIAL_PLACEMENTS` in `lib/tutorial/placements.ts` (reference an
   existing video `id`).
2. Render `<TutorialVideo placement="your-id" />` where it belongs.
