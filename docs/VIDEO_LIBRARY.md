# Video Library

## In Plain English (start here)

The **Video Library** at **`/library`** is the one place to browse every video in
SwingVantage:

- **Feature Walkthroughs** — the short, guided video for every feature. These are
  the recordings already produced for the Tutorial Center; the library simply
  *reads* them, so there's nothing to maintain twice.
- **Training & Instruction** — the deeper videos you grow over time, organized into
  categories: **Feature Deep-Dives**, **Launch Monitor & Data**, **Drills &
  Technique**, **Coaching & Parent Guides**, and **Pro Swing & Film Study**.

It's searchable and filterable (by category and sport). Every card opens an
accessible player; videos that aren't recorded yet still open — to their written
walkthrough — so nothing is ever a dead end. Empty training rails show a friendly
"coming soon" home, so there's always an obvious place for new content to land.

**20 training videos** are recorded and live across all five rails (swing path,
launch-monitor data, drills & technique across every sport, coaching & parent
guides, and pro film study), alongside the feature walkthroughs.

### Publishing to the public `/learn` pages

The in-app `/library` shows every recorded video. The public, crawlable `/learn`
pages (the SEO/AEO/GEO surface) show only videos flipped **public**, so new
content rolls out to search gradually. Control this from the admin dashboard at
**`/admin/library`** ("Content → Library Publishing") — each video has a
Public / In-app-only toggle. State lives in a committed overrides file
(`src/data/library-publish-overrides.json`); because `/learn` is statically
generated, a flip is a git diff that goes live on the next deploy (same model as
the changelog Publishing screen). `getLearnItems()` is the single gate, used by
the `/learn` index, slug pages, and both sitemaps. 11 of the 20 are public today;
the rest are staged for the weekly drip. See also the
[Digital Asset Library](DIGITAL_ASSET_LIBRARY.md) for a catalog of every
generated media asset.

---

## How it's wired

```
/library  (app route, guest-friendly on a local-mode server)
   └─ LibraryBrowser  (search / category rails / sport filter / cards → modal)
        └─ getLibraryItems()   ← lib/library/index.ts
             ├─ featureWalkthroughs()  ← reads lib/tutorial/videos.ts (no edits)
             └─ getTrainingItems()     ← lib/library/training-videos.ts
                                          + recordings.generated.json (by convention)
```

- `lib/library/types.ts` — the shared `LibraryItem` shape + categories.
- `lib/library/training-videos.ts` — the training catalogue you grow.
- `lib/library/index.ts` — combines both sources + search/filter/group helpers.
- `components/library/*` — the hub UI + accessible player modal.

Nothing here edits the tutorial system — it only reads it, so the two never collide.

## Adding a training video

1. **Add an entry** in `apps/web/src/lib/library/training-videos.ts`
   (`id`, `title`, `description`, `category`, `sport`, `route`, `durationHint`,
   `script`). The written `script` is usable immediately as the transcript/fallback.
2. **Add narration + on-screen scenes** for the same `id` in
   `apps/web/scripts/library/library-config.mjs`.
3. **Record it** (see below). The card lights up automatically.

That's it — media paths resolve by convention (`/library/<id>.mp4`, `-poster.jpg`,
`.vtt`), so you never hand-edit paths.

## Recording (screen capture + AI voiceover)

Reuses the same proven approach as the tutorial recorder (Playwright screen capture
+ OpenAI `tts-1` voice "nova" + ffmpeg), but writes to its own files so it can't
collide.

One-time local dev tools (intentionally NOT in package.json so prod deploys don't
download an ffmpeg binary):

```bash
npm i -D @playwright/test ffmpeg-static
npx playwright install chromium
```

Then:

```bash
# 1) LOCAL-mode dev server (blank Supabase env → no login wall) on :3100
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3100

# 2) (recommended) seed demo data so Diagnose/Progress look real
BASE_URL=http://localhost:3100 node scripts/video-studio/seed-data.mjs

# 3) record one or more training ids
BASE_URL=http://localhost:3100 node scripts/library/record-library.mjs swing-path launch-monitor-workflow
```

Output per id: `public/library/<id>.mp4`, `<id>-poster.jpg`, `<id>.vtt`, and an
appended entry in `src/lib/library/recordings.generated.json`. Captions are timed
from the same narration lines, so every recorded video is captioned + transcribed.

Cost: TTS is a few cents per video (`tts-1` is inexpensive); screen capture and
ffmpeg are free.

## Categories

| Category | Group | For |
|---|---|---|
| Feature Walkthroughs | walkthroughs | One quick video per feature (from the Tutorial Center) |
| Feature Deep-Dives | training | Closer looks (e.g. swing path) |
| Launch Monitor & Data | training | Import, read, and act on your numbers |
| Drills & Technique | training | Drill demos + technique breakdowns by sport |
| Coaching & Parent Guides | training | Coaching with SwingVantage; guiding young athletes |
| Pro Swing & Film Study | training | Breakdowns + film-study sessions |

## Accessibility & performance

- Captions when available; the written walkthrough is always shown as a transcript.
- Player modal: keyboard operable (Esc), focus managed, scroll locked, backdrop close.
- Cards lazy-load posters; the player uses `preload="metadata"`; no autoplay with sound.

## Notes

- `/library` is under the authenticated app group. On the production app it's behind
  sign-in like the rest of the app; on a LOCAL-mode dev server (blank Supabase env)
  it's reachable as a guest for recording/preview.
- The library is additive and self-contained — see also `docs/VIDEO_STUDIO.md` for
  the AI "video department" that plans/generates/places videos programmatically.
