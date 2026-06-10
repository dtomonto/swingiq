# Re-recording the walkthrough / tutorial videos

## Why
The in-app tutorial walkthroughs (`/tutorial`, the floating coach, the per-page
help videos) are **real screen recordings of the live app**, captured by
`apps/web/scripts/video-studio/record-batch.mjs`. The 37 source clips live in
`apps/web/public/tutorials/sources/*.mp4` and were recorded against the
**pre-rebrand UI**, so they show the old (light) design instead of the new
**Dark Performance (B)** look. They need to be re-recorded against the current UI.

> This can't be done in CI or by an automated agent: it drives a real Chromium
> browser, records video, transcodes with ffmpeg, and generates spoken narration
> via the OpenAI TTS API (needs `OPENAI_API_KEY`). It's an operator task on a
> local machine.

## One-time setup
```bash
cd apps/web
# Playwright + chromium + ffmpeg-static (heavy dev deps, NOT installed by default)
npm run tutorials:record:install
# Narration needs an OpenAI key (TTS). Kept out of argv; read from the env.
export OPENAI_API_KEY=sk-...        # PowerShell: $env:OPENAI_API_KEY="sk-..."
```

## Record
The recorder drives the app in **LOCAL mode** (no Supabase) on `BASE_URL`
(default `http://localhost:3100`). Start the dev server first, then record:

```bash
# Terminal 1 — the app the recorder will film (B design is the default theme)
cd apps/web && PORT=3100 npm run dev

# Terminal 2 — record EVERY tutorial in one pass (re-skins them all to B):
cd apps/web && npm run tutorials:record:all

# …or a single id / one group while iterating:
npm run tutorials:record -- dashboard
npm run tutorials:record -- group:getting-started
```

For each id the script: records the on-screen tour → transcodes → adds OpenAI-TTS
narration → muxes → writes a poster → appends `durationSec` to
`src/lib/tutorial/recordings.generated.json` (which auto-wires the tutorial card).
Output `.mp4`s land in `public/tutorials/sources/`.

## Commit
The regenerated `*.mp4` (binary) + `recordings.generated.json` are the artifacts
to commit. They're large — expect a sizeable diff. Review one video to confirm
the new B design rendered, then commit the `public/tutorials/sources/**` changes
plus the manifest.

## Groups (ids)
`getting-started`, `core`, `analyze`, `progress-share`, `account-community`
(see `apps/web/scripts/video-studio/batch-config.mjs`). `group:all` records the
union of all of them.
