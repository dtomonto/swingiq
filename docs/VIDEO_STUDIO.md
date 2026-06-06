# Video Studio — the AI video department

## In Plain English (start here)

SwingVantage can already *show* videos (the Tutorial Center). **Video Studio** is
the brain on top: it figures out **where** a video would actually help, **writes**
the video (script, storyboard, captions, thumbnail, SEO), **generates** it through
pluggable AI video providers, **places** it on the right page, **measures** how it
does, and **re-checks** it over time to recommend improvements.

It works **with no API keys and no database today**:

- The **scanner** scores every page for "would a video help here?" — deterministically.
- The **brief generator** writes the whole creative brief — deterministically.
- The built-in **mock provider** produces a real branded poster, real timed
  captions (WebVTT), and a transcript for **free**. The actual moving footage is a
  *placeholder* until you connect a real provider — and the player is honest about
  that (it shows the poster + transcript, just like the tutorial "coming soon").
- Everything is kept in memory until you apply the SQL schema and connect Supabase,
  at which point it's durably saved. The admin panel tells you which mode you're in.

Nothing fakes a connection, a recording, or a result. Spend is **off by default**
(budget = $0 → only the free generator runs) so it can never surprise you with a bill.

Open it at **`/admin/video-studio`**.

---

## Architecture (text diagram)

```
        ┌─────────────────────────────────────────────────────────────┐
        │                     lib/video-studio (engine)                │
        │                                                              │
 surfaces.ts ─► scoring.ts ─► opportunityEngine.ts ─► VideoOpportunity │
 (app map)      (13 signals)   (rank + gap detect)         │           │
        │                                                  ▼           │
        │   brand.ts (voice/limits/claim guardrails) ─► briefGenerator │
        │                                                  │  (brief)   │
        │                                                  ▼           │
        │             providers/ (socket + registry + MOCK) ◄── jobs.ts│
        │                    │  generateVideo / captions / poster      │
        │                    ▼                                         │
        │              VideoAsset ─► placements.ts ─► SmartVideoSlot   │
        │                    │                                         │
        │   analytics.ts ─► aggregateEvents ─► scoring.performanceScore│
        │                    │                                         │
        │                    ▼                                         │
        │              reassessment.ts ─► recommendations              │
        │                                                              │
        │   repo.ts  (Supabase when configured, else in-memory)        │
        │   audit.ts (who did what)                                    │
        └─────────────────────────────────────────────────────────────┘
                 ▲                          ▲                    ▲
        app/api/video-studio/*    components/video-studio/*  app/admin/video-studio
        (admin/cron/public)       (player, slot, modal)      (control cockpit)
```

### The 10 data models (`lib/video-studio/types.ts`)

`VideoOpportunity`, `VideoCreativeBrief`, `VideoAsset`, `StudioPlacement`,
`VideoGenerationJob`, `VideoVersion`, `VideoPerformanceMetric`,
`VideoReassessment`, `VideoProviderConfig`, `VideoAuditLog`. Zod schemas guard
everything that crosses an API boundary.

---

## Setup

### 1. Use it immediately (zero config)
- Dev: just open `/admin/video-studio`. Scan → approve → generate brief → generate
  video → preview → publish → place. Works with the mock provider, in-memory.

### 2. Persist it (recommended)
- Supabase → SQL Editor → run **`apps/web/supabase-video-studio.sql`** (idempotent).
- Ensure these are set (already used elsewhere in the app):
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Now the repo persists to the `video_*` tables. The admin "in-memory" banner disappears.

### 3. Protect it in production
- Set `ADMIN_SECRET`. The `/admin/*` pages and all `/api/video-studio/*` admin
  routes require the `x-admin-secret` header (constant-time compared). In dev with
  no secret, admin access is open for local iteration (same rule as the rest of `/admin`).
- For scheduled reassessment, set `CRON_SECRET` (see Cron below).

### Environment variables

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for persistence | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | for persistence | Server-side writes to `video_*` tables |
| `ADMIN_SECRET` | prod | Guards admin pages + admin API routes |
| `CRON_SECRET` | for scheduling | Lets a scheduler trigger reassessment |
| `VIDEO_STUDIO_MAX_COST_CENTS` | optional | Per-job spend ceiling. **Default `0`** (free mock only) |
| `RUNWAY_API_KEY` | optional | Runway provider (footage) |
| `LUMA_API_KEY` | optional | Luma provider (footage) |
| `HEYGEN_API_KEY` / `SYNTHESIA_API_KEY` | optional | Avatar presenter providers |
| `ELEVENLABS_API_KEY` | optional | Voiceover synthesis |
| `REMOTION_RENDER_URL` | optional | Remotion motion-graphics render service |
| `FFMPEG_PATH` | optional | Server-side compose |
| `OPENAI_VIDEO_API_KEY` | optional | Reserved for OpenAI video |

Analytics piggybacks on the app's existing providers (GA4 / Plausible / PostHog);
no extra config. Without one, events log to the console in dev.

---

## How scoring works

**Opportunity priority** = a weighted blend of 13 signals derived from each
surface's honest traits (complexity, funnel stage, public/SEO, first-run,
data-heavy, support-hot, trust/decision moments, error-prone, sport-specific,
empty-state, retention). Weights favor the go-to-market priority (activation,
onboarding, support deflection, conversion, retention). See `scoring.ts`
`PRIORITY_WEIGHTS`.

**Confidence** rises with the number of strongly-aligned signals.
**Risk** is high for public/claim-sensitive content (trust, conversion), medium
for results-explainer / sport-instructional / public, else low.
**Approval policy:** auto-eligible only when **risk = low AND confidence = high**;
everything else needs a human (the switch the product asked for).

**Performance** (per live video) → six 0–100 scores: engagement, conversion
contribution, education, friction-reduction, freshness (age decay), and
`recommendationPriority` (inverted — high means "needs attention").

---

## How reassessment works

`reassess()` looks at a published video's performance scores + facts (placeholder?
captions? transcript? freshness? lifecycle? content changed? better provider?) and
returns ranked actions: keep / improve script / shorten / new thumbnail / move /
replace / add captions / add transcript / sport|mobile|onboarding variant / retire /
human review. Accessibility gaps rank highest. Performance-based actions are gated
behind a minimum sample size so brand-new videos aren't flagged before they have
views. High-impact actions (replace, retire) require human sign-off.

Run it from the admin **Reassess** tab, or on a schedule (below).

---

## Admin workflow

1. **Opportunities** — review ranked gaps. Approve/reject. "Generate brief".
2. **Pipeline** — read the brief (the approval panel). Guardrail violations block
   generation. "Generate video" → preview the poster/transcript/captions.
3. Publish (draft → live) and **Assign to placement**.
4. **Library** — manage every video; publish/unpublish, set lifecycle
   (evergreen/seasonal/experimental/outdated/deprecated).
5. **Queue** — job status + history.
6. **Reassess** — run reassessment; read recommendations.
7. **Settings** — providers (what's connected), spend budget, storage status.

### Placing a video on a page (for engineers)

```tsx
import { SmartVideoSlot } from '@/components/video-studio';

// Invisible until a video is published to this placement — safe to add anywhere.
<SmartVideoSlot placement="results-read" page="/video" sport={activeSport} />
```

For public pages, also emit structured data:

```tsx
import { VideoObjectSchema } from '@/components/video-studio';
<VideoObjectSchema asset={asset} path="/how-it-works" brief={brief} />
```

---

## Adding a real provider

1. Implement the `VideoProvider` interface (`lib/video-studio/providers/types.ts`):
   `generateVideo`, `generateVoiceover`, `generateCaptions`, `generateThumbnail`,
   `composeVideo`, `checkJobStatus`, `retrieveAsset`, `cancelJob`, `isConfigured`.
2. Register it in `providers/registry.ts` `IMPLEMENTED` (and its env in `PROVIDER_SPECS`).
3. Set its API key + raise `VIDEO_STUDIO_MAX_COST_CENTS` above the provider's
   `maxCostPerJobCents`. The job manager refuses to run anything over budget.
4. (Async providers) Jobs come back `pending`; `pollGenerationJob()` finishes them.

That's it — the engine, admin, placements, analytics, and reassessment are all
provider-agnostic and don't change.

### Optional: an LLM script enhancer
`briefGenerator.enhanceBrief()` is a safe no-op seam. Wire an AI text provider
behind `aiConfigured(process.env)` to re-word scripts — it must preserve meaning
and re-run `vetClaims()` before returning.

---

## Cron / scheduler setup

`POST /api/video-studio/reassess` accepts either an admin header or `CRON_SECRET`
(via `x-cron-secret` or `Authorization: Bearer`). Examples:

- **Vercel Cron** (`vercel.json`):
  ```json
  { "crons": [{ "path": "/api/video-studio/reassess", "schedule": "0 9 1 * *" }] }
  ```
  Add `CRON_SECRET` and have the cron send it (Vercel cron can use a header via a
  thin wrapper, or gate by Vercel's `x-vercel-cron` header — adapt `requireCronOrAdmin`).
- **GitHub Actions / server cron**: `curl -X POST .../api/video-studio/reassess -H "x-cron-secret: $CRON_SECRET"`.
- Consistent with the project's other local scheduled audits — keep results
  review-then-act (high-impact actions already require human sign-off).

---

## Security considerations

- Admin pages + admin API routes require `ADMIN_SECRET` (constant-time compare);
  unauthorized callers get a 404 (route existence isn't confirmed).
- All `video_*` tables have RLS enabled with **no public policies**; only the
  service-role key (server-side) touches them. Published videos reach end users via
  the `/serve` route, which only ever returns **published** assets — drafts never leak.
- Public routes (`/events`, `/serve`) are rate-limited (distributed via Upstash when
  configured, in-memory otherwise) and strictly Zod-validated.
- Spend guardrail refuses any job over budget **before** calling a provider.
- Every consequential action is written to the audit log.
- Generated posters are SVG **data URIs** built from typed inputs (XML-escaped); no
  user HTML is rendered.

## Performance considerations

- `SmartVideoSlot` defers all work (network + player import) until the slot nears the
  viewport (IntersectionObserver), reserves no space when empty (no layout shift),
  and dynamic-imports the player.
- `VideoPlayer` uses `preload="none"`, never autoplays with sound, captions on by
  default, transcript in a disclosure.
- The scanner/brief generator are pure and synchronous — no provider calls on page load.

## Deployment notes

- Apply `supabase-video-studio.sql` once. It's idempotent.
- Set `ADMIN_SECRET` (and `CRON_SECRET` if scheduling). Leave
  `VIDEO_STUDIO_MAX_COST_CENTS` at `0` until you intend to pay for real generation.
- The mock provider needs nothing.

## Future roadmap

- Wire a first real provider (Remotion for motion-graphics is the cheapest, fully
  self-hosted path; ElevenLabs for VO).
- Join `downstreamConversions` from the funnel into performance metrics.
- A/B experiment buckets on placements (the `experiment` field already exists).
- Auto-generate sport variants from a single approved brief.
- Multi-language captions + transcripts.
