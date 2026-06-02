# AI Visual Swing Analysis

## In Plain English (start here)

SwingIQ can now **actually look at your swing video** using AI, instead of giving
generic tips. Here's the whole idea in three sentences:

1. When someone uploads a swing, the app quietly turns the video into a set of
   still photos (frames) **inside their browser**.
2. It sends **only those photos** (never the whole video file) to an AI vision
   model, which describes what it really sees and gives priorities, drills, and a
   practice plan.
3. If you haven't connected an AI key yet, the app says so honestly —
   *"AI visual analysis is not currently configured"* — and shows **no fake
   feedback**.

**What you need to do to turn it on:** get one API key (Anthropic is the
recommended default) and put it in your `.env.local` file. That's it. Until you
do, the analyzer still loads and is safe to demo — it just shows the honest
"not configured" message instead of made-up results.

**Why this matters:** the old version never inspected the video. It produced
rule-based "estimates" labeled with ⚠. That's gone. Now every observation comes
from an AI model that reviewed the actual frames, with a confidence level and
honest notes about video quality.

---

## How the pipeline works

```
Upload (browser)
   └─ extractSwingFrames()        apps/web/src/lib/frame-extraction.ts
        • samples ~16 frames across the WHOLE clip (not just one window)
        • downscales each to ≤720px JPEG, base64
   └─ POST /api/video-vision-analysis   apps/web/src/app/api/video-vision-analysis/route.ts
        • validates sport + frames, rate-limits, size-guards
        • getVisionProvider(process.env)
            ├─ no key  → { configured: false, message }   (strict no-fake)
            └─ key set → provider.analyze(frames + sport prompt)
        • Zod-validates the model's JSON before returning
   └─ UI renders
        ├─ AIVisualAnalysisPanel       (validated result)
        └─ AINotConfiguredNotice       (no key)
```

Core module: `packages/core/src/video-analysis/visual/`
- `schema.ts` — Zod schemas + `validateAIResult()` (never throws; returns ok/err)
- `prompts.ts` — `buildVisionPrompt()` with a sport-specific biomechanics block
- `provider.ts` — `AIVisionProvider` interface + Anthropic / OpenAI / Google
  implementations + `DisabledVisionProvider` + `getVisionProvider()` factory

## Configuration

Set these in `apps/web/.env.local` (see `apps/web/.env.example`):

| Variable | Purpose | Default |
|---|---|---|
| `AI_VISION_PROVIDER` | `anthropic` \| `openai` \| `google` (falls back to `AI_PROVIDER`) | — |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_AI_API_KEY` | provider key | — |
| `AI_VISION_MODEL` | model override | `claude-3-5-sonnet-20241022` / `gpt-4o` / `gemini-1.5-flash` |
| `MAX_VIDEO_FRAMES_ANALYZED` | frames sampled across the clip | `16` (hard max `24`) |
| `MAX_VIDEO_UPLOAD_MB` / `MAX_VIDEO_DURATION_SECONDS` | upload limits | `500` / `300` |

No key configured → the route returns `{ configured: false }` and the UI shows the
honest notice. Secrets are read from the environment only; nothing is hardcoded.

## Frame selection (motion-based)

`apps/web/src/lib/frame-extraction.ts` scans the clip, measures motion via
grayscale frame-differencing, locates the actual **swing window**, and
concentrates the returned frames there (keeping a setup + finish frame). It falls
back to even sampling when there's no clear motion peak. Tunables: server cap
`MAX_VIDEO_FRAMES_ANALYZED` (route clamps to `[1, 24]`); client `DEFAULT_FRAME_COUNT`.
Pass `{ smart: false }` to force uniform sampling.

## Reliability & cost

- **Self-correction retry** — if the model's JSON fails schema validation, the
  provider makes ONE text-only follow-up call (no images re-sent) asking it to fix
  its own draft to the schema. Eliminates most "couldn't analyze" failures cheaply.
  HTTP errors are returned immediately (no retry).
- **Prompt caching** — the Anthropic provider marks the large system prompt with
  `cache_control` so it's cached across the vision call and the retry. (OpenAI and
  Gemini cache long prompts automatically.)
- **Image detail** — `AI_VISION_IMAGE_DETAIL` (`auto` | `low` | `high`, OpenAI)
  trades fidelity for token cost; frames are already downscaled, so `low` is a cheap
  option.

## Adding a new sport prompt

1. Add the sport id to `VisualSportSchema` in `schema.ts` (keep it in sync with
   core `SportId`).
2. Add a `SPORT_FOCUS` entry in `prompts.ts` describing the phases and the
   biomechanics checkpoints the AI should assess (only what's visibly supported).
3. That's it — the provider and route are sport-agnostic.

## Adding pose / landmark estimation later

The schema already includes an internal `VisualObservation` shape (phases,
body mechanics, confidence) designed for pose data. To add real pose detection
(MediaPipe, TensorFlow.js, a cloud vision API, etc.):

1. Produce `VisualObservation` data from landmarks.
2. Feed it into the prompt as extra grounding (or add a new provider that blends
   pose + frames). The public `AIVisualAnalysisResult` the UI renders does not
   need to change.

## Testing without exposing fake feedback

- `packages/core/src/video-analysis/visual/visual.test.ts` — schema validation,
  prompt routing, provider factory, and the disabled (no-fake) path.
- `apps/web/src/app/video/__tests__/no-heuristic-copy.test.ts` — guards that the
  production video UI shows no "heuristic / estimated / simulated / placeholder"
  language to users.
- Mocks are allowed **only** in tests/fixtures. Production never renders mock
  mechanical analysis as if it were real.

## Privacy

Only downscaled still frames are sent to the configured AI provider, and only
when the user runs an analysis. The original video file is never uploaded or
stored server-side, frames are not persisted after the request, and videos are
never used to train a shared model. The upload privacy notice and the
"What happens to my video?" panel reflect this exactly.
```
