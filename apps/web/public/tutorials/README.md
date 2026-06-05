# Tutorial video assets

Drop the produced tutorial files here. The app references them by path from
`apps/web/src/lib/tutorial/videos.ts` (the manifest). Until a file exists, the
matching placement shows an honest "coming soon" card plus the written steps —
so nothing breaks and the tutorial is still useful.

## Folder convention

| Folder | Holds | Manifest field | Example |
| --- | --- | --- | --- |
| `sources/` | Desktop MP4 (H.264) + WebM | `mp4Src`, `webmSrc` | `sources/welcome.mp4`, `sources/welcome.webm` |
| `mobile/` | Mobile-optimized MP4 (smaller) | `mobileSrc` | `mobile/welcome.mp4` |
| `posters/` | In-player poster (first frame, 1280×720) | `poster` | `posters/welcome.jpg` |
| `thumbnails/` | List/grid thumbnail (640×360) | `thumbnail` | `thumbnails/welcome.jpg` |
| `captions/` | WebVTT captions | `captionsSrc` | `captions/welcome.vtt` |

Paths in the manifest are **public-root-relative** (Next serves `public/` at `/`),
so `public/tutorials/sources/welcome.mp4` is referenced as `/tutorials/sources/welcome.mp4`.

## Naming

Use the video `id` from the manifest as the base filename (`welcome`, `video-analysis`,
`diagnose`, `drills`, `progress`, …). One id → one set of files across all folders.

## Producing files

See `docs/tutorial-video-production-guide.md` for scripts/storyboards and
`scripts/optimize-tutorial-video.mjs` for the exact FFmpeg commands (MP4, WebM,
mobile, poster, thumbnail).

## Performance targets

- Desktop MP4: ≤ ~4–6 MB for a 30–45s clip (CRF ~23, 1280×720).
- WebM (VP9): typically 30–40% smaller than the MP4.
- Mobile MP4: 720×1280 or 854×480, ≤ ~2–3 MB.
- Poster/thumbnail: progressive JPG, ≤ ~80 KB.
