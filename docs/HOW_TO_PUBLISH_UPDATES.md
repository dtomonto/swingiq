# How to Publish a SwingIQ Product Update

This guide explains how to add a new entry to the SwingIQ Updates page at `/updates`.

**No terminal or code editor required.** You can add updates directly from GitHub's website.

---

## How to add an update from GitHub (step by step)

1. Go to your SwingIQ repository on GitHub.com
2. Navigate to: `apps/web/src/data/auto-updates.json`
3. Click the **pencil icon** (Edit this file) in the top-right corner of the file
4. The file contains a list of update entries inside `[ ]` square brackets
5. Copy the template below and paste it **before the last `]`** in the file
6. Fill in every field with plain-English content (see guide below)
7. Scroll down and click **Commit changes**
8. Your update will appear on `/updates` on the next deploy

### Copy-paste template

```json
{
  "id": "update-YOURINITIALS-001",
  "title": "Your plain-English title here",
  "slug": "your-plain-english-title-here",
  "summary": "1-2 sentences a normal person can understand. No technical words.",
  "releaseDate": "2026-06-01",
  "displayDate": "June 2026",
  "category": "New Feature",
  "status": "published",
  "visibility": "public",
  "sortOrder": 1000,
  "audience": ["all athletes"],
  "userBenefit": "You can now... (one sentence about what the user gains)",
  "whyItMatters": "One sentence explaining why this helps training, usability, or trust.",
  "whereToFindIt": "Go to Settings > Backup (or remove this line if not applicable)",
  "isFeatured": false,
  "isMajorMilestone": false,
  "createdAt": "2026-06-01",
  "updatedAt": "2026-06-01"
}
```

**Important:** If this is not the first entry in the file, add a comma after the `}` of the entry above yours before pasting. Entries are separated by commas.

### Field reference

| Field | What to put | Required? |
|---|---|---|
| `id` | Unique — use your initials + a number, e.g. `"update-SQ-001"` | Yes |
| `title` | 5–10 words, plain English, no jargon | Yes |
| `slug` | Same as title but lowercase with dashes, no spaces | Yes |
| `summary` | 1–2 sentences for a normal user | Yes |
| `releaseDate` | Format: `"YYYY-MM-DD"` | Yes |
| `displayDate` | Format: `"Month YYYY"` e.g. `"June 2026"` | Yes |
| `category` | See valid category list below | Yes |
| `status` | `"published"` to show publicly, `"draft"` to hide | Yes |
| `visibility` | `"public"` to show, `"private"` to hide | Yes |
| `sortOrder` | Higher number = older. Use a number higher than any existing entry | Yes |
| `audience` | Leave as `["all athletes"]` unless specific | Yes |
| `userBenefit` | Start with "You can now" or "Your" | Yes |
| `whyItMatters` | One sentence | Yes |
| `whereToFindIt` | Where in the app. Remove this line if not applicable | No |
| `isFeatured` | `true` = shown prominently at top. Only one should be true at a time | Yes |
| `isMajorMilestone` | `true` = shown in the milestone timeline. Use sparingly | Yes |
| `createdAt` / `updatedAt` | Same as `releaseDate` | Yes |

---

## Before you publish: The Update Qualification Test

Only publish an update if the answer to at least one of these questions is **Yes**:

1. Would a normal user care about this?
2. Does this help someone understand SwingIQ better?
3. Does this make the product easier to use?
4. Does this make training more useful, personalized, or actionable?
5. Does this help a parent, coach, or athlete understand the value of SwingIQ?
6. Does this support search visibility?
7. Does this help AI tools explain SwingIQ more accurately?
8. Does this strengthen SwingIQ's public reputation?
9. Does this create user trust without exposing technical details?
10. Does this help users find a feature they might have missed?

If the answer is No to all of the above, **do not publish it**.

---

## What to publish vs. what to skip

### Publish these:
- New user-facing features
- Major improvements to existing features
- New sports added to the platform
- Better training feedback or personalization
- Easier ways to get started
- Improved data upload, analysis, or backup
- Better mobile experience
- Clearer public website pages
- Equipment or profile improvements
- Privacy or security improvements (described safely)
- Features that help users discover the product

### Never publish these:
- Code refactoring or folder restructuring
- Developer tooling changes
- Minor bug fixes users wouldn't notice
- Package or dependency upgrades
- Database changes (migrations, schema updates)
- Environment variable or configuration changes
- Test suite changes
- CI/CD pipeline changes
- Commit messages or pull request descriptions
- Internal security details (never describe how protection works)
- Backend-only work with no visible user impact
- Experimental or unfinished features
- Technical implementation details of any kind

---

## How to write updates for normal users

Write as if you are explaining the change to a friend who plays golf, tennis, or softball. No technical background assumed.

### Remove technical jargon. Replace it with user benefit language.

| Do not write | Write instead |
|---|---|
| Added PostgreSQL migration for equipment_profiles table | You can now save your equipment details |
| Refactored sport context provider | Switching sports now updates the full dashboard experience |
| Implemented OCR pipeline with normalized extraction schema | You can upload a photo of a data table and get coaching insights from it |
| Patched dependency vulnerability | We improved account protection behind the scenes |
| Added API route for update records | You can now follow SwingIQ's progress on the Updates page |
| Normalized launch monitor data extraction | SwingIQ now reads more types of performance files more accurately |

### Avoid these words and phrases entirely:
- API, database, schema, refactor, dependency, package
- Route handler, middleware, environment variable, auth provider
- Repository, commit, pull request, branch
- TypeScript error, build pipeline, deployment workflow
- Normalized extraction schema, provider architecture, data model
- Scoring algorithm internals, OCR pipeline

---

## How to add a new update

**New user-facing updates go in:**
`apps/web/src/data/auto-updates.json`

See the step-by-step instructions at the top of this guide. You can edit this file directly in GitHub's web interface without needing a code editor or terminal.

The original hand-crafted updates (the 15 milestone entries) live in `apps/web/src/data/updates.ts`. You can add to that file too, but `auto-updates.json` is easier to edit and less likely to break from a typo.

---

## How to publish an update

1. Add your entry to `auto-updates.json` with `"status": "draft"` and `"visibility": "private"`.
2. Check that the content passes the Update Qualification Test above.
3. Read it out loud. If it sounds like a developer wrote it, rewrite it.
4. When ready, change `"status"` to `"published"` and `"visibility"` to `"public"`.
5. Commit the file from GitHub. The update appears on `/updates` on the next deploy.

---

## Valid status values

| Status | What it means | Shown publicly? |
|---|---|---|
| `published` | Approved and live | Yes |
| `draft` | Being written or reviewed | Never |
| `hidden` | Temporarily hidden | Never |
| `beta` | Available to test, not fully released | Only if visibility is `public` |
| `planned` | Not yet built | Only if visibility is `public` |
| `in_progress` | Being built | Only if visibility is `public` |
| `coming_soon` | Launching soon | Only if visibility is `public` |

**Rule:** Only `published` updates are shown by default. Other statuses require both the correct status AND `visibility: 'public'` to appear.

Never change `status: 'draft'` or `status: 'hidden'` to `visibility: 'public'` — they will still remain hidden.

---

## Valid category values

Pick the one that best fits the update:

- `New Feature` — brand new capability
- `Training Improvement` — better coaching, drills, or feedback
- `Equipment` — clubs, rackets, bats
- `Data & Insights` — importing, analyzing, or viewing performance data
- `Multi-Sport Expansion` — new sport support or cross-sport improvements
- `Golf Training` — golf-specific training improvements
- `Tennis Training` — tennis-specific improvements
- `Baseball Training` — baseball-specific improvements
- `Softball Training` — softball-specific improvements
- `Video & Swing Comparison` — video analysis or reference comparisons
- `Progress Tracking` — tracking history, milestones, trends
- `Account & Data` — backup, restore, settings, data ownership
- `Mobile Experience` — phone and tablet improvements
- `Website` — public pages or navigation improvements
- `SEO & Discoverability` — search visibility improvements
- `Security & Privacy` — trust and protection (plain-English only)
- `Product Updates` — general platform news

---

## Valid sport values

Use these exact strings:
- `'Golf'`
- `'Tennis'`
- `'Baseball'`
- `'Slow Pitch Softball'`
- `'Fast Pitch Softball'`
- `'All Sports'`

Leave `sport` undefined if the update applies to the platform generally.

---

## How to mark an update as the featured/latest update

Set `isFeatured: true` on one update at a time. This update will appear prominently at the top of the page. Set all others to `isFeatured: false`.

The `isFeatured` flag should be on the update you most want new visitors to see first.

---

## How to mark a major milestone

Set `isMajorMilestone: true` for platform-defining changes. These appear in the "How SwingIQ Has Improved Over Time" milestone timeline at the top of the Updates page. Only use this for changes that genuinely define a new phase of the product.

---

## How SEO, AEO, and GEO fields work

These optional fields help search engines and AI tools understand the update:

- **`seoKeywords`** — Search phrases this update should help with. Keep them natural. 3–6 per update is enough. No keyword stuffing.

- **`answerEngineSummary`** — A single clear sentence written for AI answer tools (Google AI Overviews, Perplexity, ChatGPT). This is what an AI tool should say if asked "what is this SwingIQ feature?"

- **`generativeSearchSummary`** — A slightly longer version for generative search systems that need more context about SwingIQ's entity and positioning.

Not all updates need all three fields. Add them when the update supports meaningful search visibility.

---

## How to avoid exposing security details

When writing about security or account protection improvements, describe the user benefit only.

**Good:**
> We improved account protection behind the scenes.

**Good:**
> Your data is better protected when you back up and restore your progress.

**Bad:**
> Fixed JWT token validation in the authentication middleware.

**Bad:**
> Patched a session storage vulnerability in the auth provider.

If in doubt, leave out the security detail entirely and just write "We made improvements to keep your account better protected."

---

## How to confirm that unfinished features are not falsely published

Before publishing any update, ask yourself:
- Is this feature actually available to users right now?
- Can I open SwingIQ, navigate to the feature, and use it?

If the answer is no:
- Use `status: 'planned'` or `status: 'coming_soon'` with `visibility: 'private'`
- Or leave it as `status: 'draft'`
- Do not use `status: 'published'` for anything users cannot actually access

---

## How to test that the update appears correctly

1. Save the file after making your changes.
2. Run the web app locally: `npm run dev:web`
3. Go to `http://localhost:3000/updates`
4. Confirm your update appears in the list.
5. Confirm `status: 'draft'` or `status: 'hidden'` entries do not appear.
6. Check that no technical jargon appears on the page.
7. Check that the page looks correct on a phone-sized screen.

---

## Transformation examples

### Example 1 — Feature update

**Technical note:**
> Refactored sport context provider.

**Do not publish.** This does not matter to users unless it produces a visible improvement. If it did create a visible improvement, describe that improvement instead:

**Better version (only if true):**
> Switching sports now updates the full dashboard experience.

---

### Example 2 — New feature

**Technical note:**
> Added equipment diagnostic data model, brand selector, rating engine, and sport-specific recommendations.

**Plain-English update:**

> **Title:** New Equipment Diagnostic Tool
>
> **Summary:** You can now add details about your clubs, racket, or bat and receive more personalized feedback based on your equipment.
>
> **User Benefit:** Your equipment can affect comfort, consistency, power, and control. SwingIQ can now connect your gear to your training profile.
>
> **Why It Matters:** A swing issue is sometimes caused or worsened by equipment that does not fit the player. Understanding the equipment context helps identify what to change first.
>
> **Where to Find It:** Go to the Bag or Equipment section from the navigation.
>
> **SEO Keywords:** golf club fitting feedback, tennis racket analysis, baseball bat recommendation, softball bat equipment

---

### Example 3 — Security improvement

**Technical note:**
> Patched JWT token handling vulnerability in auth middleware.

**Plain-English update:**

> **Title:** Improved Account Protection
>
> **Summary:** We made improvements behind the scenes to keep your account better protected.
>
> **User Benefit:** Your SwingIQ account is more secure.
>
> **Why It Matters:** Keeping your training history and account information protected is important. We take security seriously.

---

### Example 4 — Do not publish

**Technical note:**
> Upgraded Next.js from 14 to 15.

**Do not publish.** This is a developer dependency update with no direct user impact.

If it produces a visible user improvement (faster load times, new browser features), describe that improvement only:

> **Title:** SwingIQ Loads Faster on Mobile
>
> (Only if that is actually true and measurable.)
