# Blog → Social Studio

## In Plain English (start here)

When you publish a blog post, this turns it into ready-to-post social content for
every major platform — written in each platform's native style, linking back to
the article with tracked links so you can measure what drives traffic.

Two things to know up front:

1. **It works with or without AI.** With an AI key set, posts are AI-written and
   then run through our own quality guardrails. With no key, it still produces
   real, specific posts from a deterministic engine ("keyless mode"). Either way
   you get the same review experience.
2. **It never posts anything by itself.** You review, edit, approve, and then
   **copy** or **export** the posts to publish them (or paste into a scheduler).
   Live auto-posting is intentionally not built — see *What's stubbed* below.

**Where to use it:** `/admin/social` (admin-only).

---

## Quick start

1. Go to **`/admin/social`**. New posts you've committed show as **"Flagged for
   social"** chips up top — click one to jump to it (see *New-post trigger*).
2. Pick a blog post and the platforms you want.
3. (Optional) set brand voice, audience, objective, CTA intensity, campaign.
4. Click **Generate**. You'll get per-platform tabs with multiple variations.
5. Review each: edit inline, check the **quality score** and any **warnings**,
   then **Copy** it or **Export CSV** for all of them.
6. **Regenerate all** or **Regenerate <platform>** to get fresh angles.
7. *(Optional — needs the schema)* **Save to library** to persist the generation
   with your edits + approvals; reload past ones from the **Library** dropdown;
   open a post's **History** to view/restore earlier edits.

No AI key? You'll see a "Keyless draft" badge and still get usable posts.

---

## New-post trigger (commit hook)

So you never forget to promote a new article, a post-commit hook flags it for you:

- **Install once:** `npm run hooks:install` (the same hook that powers /updates).
- On each commit, `scripts/generate-social-queue.mjs` detects blog slugs **added**
  to `data/blog-posts.ts` (or named in a `Social: <slug>` commit trailer) and
  records them in `data/social-pending.json` — committed automatically, **never
  pushed**.
- Those slugs appear as **"Flagged for social"** chips in the Studio. Run it
  manually anytime with `npm run social:queue`.

The hook only *flags* — it never generates posts or calls AI (hooks stay
fast/offline, and Vercel's FS is read-only at runtime). You still click Generate.

## Library, history & persistence

Optional — turn on by running `server/supabase_schema_social.sql` once:

- **Save to library** persists a generation with your edits + approvals.
- The **Library** dropdown reloads any past saved generation.
- Once saved, **approve/reject and edits auto-save**, and each post's **History**
  button shows the edit timeline with one-click **Restore**.

Without the schema it stays in-session (a "library off" hint shows); Copy and CSV
export always work.

---

## How it works

```
Blog post (data/blog-posts.ts)
        │
        ▼
analyze.ts ──► BlogAnalysis (topic, insight, takeaways, angle, funnel, keywords)
        │
        ▼
generate.ts ──► generateSocial()
        ├─ AI configured?  prompt.ts → ai.ts (OpenAI/Anthropic) → AiResult
        │        │
        │        ▼  (AI writes copy; OUR engine enforces the rules)
        ├─ assembleFromAi(): tracked UTM (utm.ts) + clean hashtags (hashtags.ts)
        │                    + hard char cap + quality score (quality.ts)
        └─ no AI / AI failed → buildFallbackPosts() (fallback.ts)  ← keyless
        │
        ▼
SocialGeneration { analysis, posts[], creative, schedule }
        │
        ├─ API:  POST /api/social/generate   (admin-guarded, rate-limited)
        └─ UI:   /admin/social  (review / edit / approve / copy / export)
```

**Design principle:** the AI only writes the *creative text*. UTM links, hashtag
counts, character ceilings, and quality scoring are always applied by our own
code, so AI output can never break a platform rule or ship an untracked link.

### File map

| File | Role |
|---|---|
| `lib/social/types.ts` | Shared types |
| `lib/social/platforms.ts` | Per-platform rules (limits, link rules, hashtags, variations, tone) |
| `lib/social/analyze.ts` | Deterministic blog → analysis |
| `lib/social/hashtags.ts` | Platform-aware hashtags (no stuffing) |
| `lib/social/utm.ts` | Per-platform/variation tracked links |
| `lib/social/quality.ts` | 1–100 scoring + warnings (incl. banned-phrase detection) |
| `lib/social/fallback.ts` | Keyless post writer |
| `lib/social/prompt.ts` | AI master prompt (strict JSON, injection-safe) |
| `lib/social/ai.ts` | OpenAI/Anthropic call + defensive parsing |
| `lib/social/options.ts` | Safe option validation |
| `lib/social/store.ts` | Persistence (save / list / update / versions) — service-role |
| `lib/social/admin-guard.ts` | Shared admin check (header **or** allowlisted user) |
| `lib/social/generate.ts` | Orchestrator (`generateSocial`, `generateSocialFallback`) |
| `app/api/social/{generate,save,list,posts/[id]}` | Admin APIs (generate / persist / load / patch + versions) |
| `app/admin/social/*` | Studio UI |
| `lib/auth/admin.ts` + `admin-allowlist.ts` | ADMIN_EMAILS-based admin authorization |
| `scripts/generate-social-queue.mjs` | New-post commit-hook trigger → `data/social-pending.json` |
| `server/supabase_schema_social.sql` | Optional persistence schema |

### Configuration

| Env var | Effect |
|---|---|
| `AI_PROVIDER` = `openai` \| `anthropic` \| `none` | Enables AI mode (else keyless) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI (default `gpt-4o-mini`) |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic (default `claude-haiku-4-5`) |
| `ADMIN_SECRET` | Header-based admin (legacy/proxy) for `/admin/*` + the API |
| `ADMIN_EMAILS` | Comma-separated allowlist — logged-in users who get admin (the easy prod path) |

### Testing

```bash
cd apps/web && npx jest src/lib/social src/lib/auth   # 44 tests
npx tsc --noEmit                                       # type-check
```

### Extending

- **Add a platform:** add an entry to `PLATFORM_RULES` in `platforms.ts` (limits,
  link rule, hashtag range, variation set, tone/notes) and add it to the
  `Platform` union in `types.ts`. The engine, prompt, UI, and scoring pick it up
  automatically.
- **Tune the writing:** edit hooks/CTAs in `fallback.ts` (keyless) and the master
  prompt in `prompt.ts` (AI). Add filler phrases to `BANNED_PHRASES` in `quality.ts`.

---

## What's stubbed & how to integrate it

The following were intentionally **not** built because they require external
infrastructure that doesn't exist yet. The architecture leaves clean seams for
each. Wire them in this order as you grow.

### 1. The library / persistence — ✅ BUILT (just run the schema)

This is done and wired. To turn it on:

1. Run **`server/supabase_schema_social.sql`** in the Supabase SQL Editor.
2. Make sure Supabase env vars are set (they already are in this project).

Then in `/admin/social`: **Save to library** persists the generation + your
edits + approvals; the **Library** dropdown reloads saved snapshots; once saved,
approve/reject and edits auto-save (PATCH) live. Until the schema is run, the
Studio shows a "library off" hint and Copy/Export still work.

Implemented by `lib/social/store.ts` + `app/api/social/{save,list,posts/[id]}`.
Edit history rows are recorded in `social_post_versions` on every edit — the only
remaining nicety is a UI to *browse* that version history.

### 2. Live auto-publishing to platforms (Automation Mode 3)

Currently the workflow is copy/export. To publish automatically you need a
per-platform **publisher** behind one interface:

```ts
// lib/social/publishers/index.ts (to add)
export interface Publisher {
  platform: Platform;
  publish(post: GeneratedPost): Promise<{ id: string; url: string }>;
}
```

Then implement one per network and call it from a `POST /api/social/publish`
route **only for `status === 'approved'` posts**. What each network requires:

| Platform | API | Auth | Notes |
|---|---|---|---|
| LinkedIn | Marketing/Share API | OAuth 2.0 + app review | Org vs personal posting differ |
| X / Twitter | API v2 `POST /2/tweets` | OAuth 2.0 | **Paid tier required** |
| Facebook / Instagram | Meta Graph API | OAuth + Business/Page tokens; **app review** | IG needs a Business account + Content Publishing API; Stories/links limited |
| Threads | Threads API (Meta) | OAuth | Newer; check current limits |
| YouTube Community | No official write API | — | Manual only for now |
| Pinterest | Pinterest API v5 | OAuth + app review | Create Pin with destination URL |
| TikTok | Content Posting API | OAuth + app review | Video required |
| Reddit | Reddit API | OAuth (script app) | **Respect subreddit rules; never astroturf** |

Practical guidance:
- Store tokens **server-side only** (new env vars, never `NEXT_PUBLIC_`).
- Keep a kill-switch env (e.g. `SOCIAL_AUTOPUBLISH=off`) and default it off.
- **Youth-safety:** SwingVantage serves juniors — get a compliance read before
  enabling any automated posting, and keep posts non-personalized.
- Most networks require app review (days–weeks). Start with one platform.

### 3. Scheduling

`buildSchedule()` already returns a recommended cadence, and `social_posts` has a
`scheduled_at` column. To act on it:

1. Set `scheduled_at` + `status = 'scheduled'` when approving.
2. Add a cron (this repo already uses Vercel Cron — see `vercel.json`) hitting
   `POST /api/social/run-scheduled` on an interval.
3. That route selects due posts (`scheduled_at <= now() and status='scheduled'`)
   and calls the publisher from step 2, then sets `published_at`/`status`.

Until publishers exist, "scheduling" = the recommended cadence + CSV export to a
tool like Buffer/Later.

### 4. Performance metrics + the learning loop

The schema (`social_post_metrics`) and the per-variation UTM links are the
foundation. Three ways to get data in, easiest first:

1. **UTM via your existing analytics (available NOW).** Every post already has a
   unique `utm_source`/`utm_content`. Open Plausible/GA and you can already see
   which platform + variation drives blog clicks — no code needed.
2. **Ingest UTM clicks** into `social_post_metrics` (`source='utm_analytics'`) via
   a scheduled job hitting your analytics provider's API, matching on
   `utm_content = '{platform}_{variation}'`.
3. **Platform APIs** for impressions/engagement (`source='platform_api'`) — only
   available once the publisher OAuth from step 2 exists.

**Closing the loop:** once metrics exist, add `lib/social/learning.ts` that
aggregates `social_post_metrics` by `hook_type`, `cta_type`, `platform`, and
posting time, and biases `pickHookType`/`pickCtaType`/`recommendPlatforms` toward
the historical winners. Until there's real data, the engine uses sensible
heuristics — do **not** fabricate a learning signal with no inputs.

### 5. Production admin access

`/admin/*` and the API require `x-admin-secret` to match `ADMIN_SECRET` in
production (browsers don't send that header by default — this is an existing
app-wide limitation, see `app/admin/layout.tsx`). To make admin usable in prod,
move admin auth to a **Supabase role check** (e.g. an `is_admin` flag on the
user), then:
- replace the `isAdmin()` checks in the layout + `api/social/generate/route.ts`
  with the role check, and
- add RLS policies to the four `social_*` tables for that admin role (the schema
  currently grants access to the service role only).
```
