# Video SEO — the strict contract

Every **public, recorded** video on SwingVantage — tutorial walkthroughs
(`/tutorials/sources/*`), the training library (`/library/*`), and Video Studio
AI assets — must pass the strictest video SEO requirements. The bar is enforced
in code so it applies to **all future-generated videos automatically**, not just
today's catalogue.

## What "strict" means (per video)

A public recorded video must have:

| Requirement | Source of truth | Surfaced as |
|---|---|---|
| Title 8–100 chars | seed `title` | `VideoObject.name`, `<title>`, og |
| Description 50–320 chars | seed `description` | `VideoObject.description`, meta description, og |
| Poster/thumbnail | `…-poster.jpg` (generated) | `VideoObject.thumbnailUrl`, sitemap `thumbnail_loc`, og:image |
| MP4 content | `…​.mp4` (generated) | `VideoObject.contentUrl`, sitemap `content_loc`, og:video |
| WebVTT captions | `…​.vtt` (generated) | `<track>` + accessibility/CC signal |
| Real duration | `recordings.generated.json → durationSec` | `VideoObject.duration` (ISO-8601), sitemap `duration` |
| Real upload date | `recordings.generated.json → uploadDate` | `VideoObject.uploadDate`, sitemap `publication_date` |
| Transcript ≥ 3 lines | seed `script[]` | on-page transcript + `VideoObject.transcript` |

Plus, baked into the schema for every video: `inLanguage`, `isFamilyFriendly`,
`isAccessibleForFree`, `publisher`, `embedUrl`, and (when re-recorded)
`dateModified`.

Honest "coming soon" entries (no recording) are **exempt** — they emit no
`VideoObject` and carry no media, so they can't make false claims.

## Where it's enforced

- **`src/lib/library/seo.ts`** → `validateVideoSeo(item)` / `passesVideoSeo(item)`
  are the single source of truth for the bar (`SEO_LIMITS`).
- **`src/lib/library/__tests__/seo-requirements.test.ts`** runs the validator
  over **every** public recorded video. A new video that lands without a poster,
  captions, a real upload date, or a real transcript **fails CI**. This is the
  gate that makes the standard apply to future videos.

## How future videos satisfy it automatically

The recorders stamp the SEO metadata at record time, so a correctly-authored
video passes with no extra steps:

- `scripts/library/record-library.mjs` and `scripts/video-studio/record-batch.mjs`
  each write the MP4, `-poster.jpg`, **`.vtt` captions**, and a manifest entry
  with `durationSec` + `uploadDate` (set once) + `dateModified` (every re-record).
- Authoring a video means: a seed entry (id, **title**, **≥50-char description**,
  sport, **≥3-line script**) + matching narration in the recorder config. Run the
  recorder and every SEO field is produced.

If you add a video and the gate fails, **fix the content** (lengthen the
description, add transcript lines, re-record to generate captions) — never relax
`SEO_LIMITS` to get green.

## One-time backfill

`scripts/video-studio/backfill-seo.mjs` brought the original recordings (made
before captions + dates were generated) up to the bar without re-recording:
generated `.vtt` captions from the real narration and stamped a baseline
`uploadDate` (`VIDEO_BASELINE_UPLOAD_DATE`). It's idempotent — safe to re-run.
