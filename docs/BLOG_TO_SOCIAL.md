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
2. **It never posts anything by itself unless you turn that on.** You review,
   edit, approve, then **copy/export** — or enable **auto-publish + scheduling**
   (both off by default; see *Deferred pieces — now built* below).

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

## Deferred pieces — now built (turn on with credentials)

These were initially deferred (they need external infrastructure). They are now
built **keyless-first**: real code that's dormant until you add credentials —
exactly like AI/email/Stripe. Each degrades to a safe no-op until configured.

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

### 2. Auto-publishing — ✅ BUILT (off by default)

`lib/social/publishers/`. The Studio shows a **Publish** button on approved posts.
Turn it on with the master switch **`SOCIAL_AUTOPUBLISH=on`**, then choose a path:

- **Webhook (works today, no OAuth):** set `SOCIAL_PUBLISH_WEBHOOK_URL` to a
  Zapier / Make / n8n / Buffer hook that posts for you. Easiest path.
- **Direct platform APIs (dormant until tokens set):**
  - LinkedIn: `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_AUTHOR_URN`
  - X: `X_ACCESS_TOKEN` (**paid X API plan required**)
  - Facebook Page: `FACEBOOK_PAGE_ID` + `FACEBOOK_PAGE_TOKEN`
  - Reddit: `REDDIT_ACCESS_TOKEN` + `REDDIT_SUBREDDIT`
  - Instagram / TikTok / YouTube / Threads / Pinterest → route via the webhook.

Routing per post: kill-switch → direct (if configured) → webhook → no-op. It
never throws and never half-posts; only **approved** posts are published.
**Youth-safety:** SwingVantage serves juniors — get a compliance read before
enabling, and keep posts non-personalized. (X/Meta/etc. need their own app review.)

### 3. Scheduling — ✅ BUILT

Set a post's time in the Studio (**Schedule** control) → `status=scheduled` +
`scheduled_at`. `vercel.json` runs **`/api/social/run-scheduled`** on a cron (daily
by default — raise the frequency on a Vercel Pro plan), which publishes due posts
through the publisher engine and retries failures on the next run. The cron route
self-protects with `CRON_SECRET` and is allow-listed in `middleware.ts` (Vercel
Cron has no Supabase session). `lib/social/schedule-runner.ts`.

### 4. Performance metrics + the learning loop — ✅ BUILT

Record metrics three ways: the Studio **Metrics** form (manual, works today),
`POST /api/social/metrics` with `source='utm_analytics'` (point a Plausible/GA
sync job at it, matching `utm_content = '{platform}_{variation}'`), or
`source='platform_api'` later. `lib/social/learning.ts` ranks the best hooks,
CTAs, and platforms by CTR and **feeds them back into generation**: the keyless
writer leads strong variations with the proven hook, the schedule orders
platforms by measured performance, and the AI prompt gets a "historical signal"
hint — all only once data exists (never a fabricated signal). See it in the
Studio's **What's working** panel (`GET /api/social/learning`). Per-variation UTM
links also let Plausible/GA measure click-through with zero setup.

### 5. Production admin access — ✅ BUILT

`/admin/*` now authorizes a logged-in user whose email is in **`ADMIN_EMAILS`**
(comma-separated), in addition to the legacy `ADMIN_SECRET` header. Set
`ADMIN_EMAILS` in Vercel and log in with that email — secure by default (empty =
nobody). `lib/auth/admin.ts` + `lib/auth/admin-allowlist.ts`. (RLS on the four
`social_*` tables still grants the service role only; tighten to a Supabase admin
role if you ever move off the email allowlist.)
