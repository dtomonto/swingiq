# SwingVantage — Automation

What runs automatically, what you run manually, and — importantly — what we
deliberately do **not** automate.

---

## 📘 In Plain English (start here)

**What this page is:** A list of what the project does by itself, what a human still has to do by hand, and — most importantly — the things SwingVantage **refuses** to automate on purpose.

**What you actually need to know:**
- The one section worth reading even as a non-developer is **"What we do NOT automate (by policy)"** near the bottom. It's a values and safety statement: no fake reviews or ratings, no spam or mass-messaging, no auto-posting to social media, and **youth data is never made public by default.** These are promises about how SwingVantage behaves.
- The table of `npm run` commands is for a developer or an AI assistant — those are typed into a terminal, not something you click in the app.

**What to do next:** Nothing required. If you ever wonder "does SwingVantage secretly spam people or fake reviews?", the answer is in the "What we do NOT automate" section — and it's no.

> The command tables and CI/workflow sections below are a developer/AI reference. You don't need them to use or run SwingVantage.

---

## 1. Scripts (run with `npm run <name>`)

| Command | What it does | Fails build? |
|---|---|---|
| `type-check` | TypeScript across the monorepo | Yes |
| `lint` | ESLint across the monorepo | Yes |
| `build` | Production build of the web app | Yes |
| `scan:placeholders` | Flags visible placeholder text on public pages | Yes |
| `check:trust` | Alias for `scan:placeholders` | Yes |
| `validate:seo` | Published SEO pages: routed, indexed, substantive | Yes |
| `validate:content` | seo-backlog.json enums + email frontmatter | Yes |
| `validate:links` | Internal broken-link check (static hrefs) | Yes |
| `generate:sitemap` | Verifies sitemap paths resolve to routes | Yes |
| `updates:generate` | Turns `Update:` / `Dev-Update:` commit trailers into changelog entries | No |
| `hooks:install` | One-time: installs the post-commit hook for automatic update publishing | No |
| `audit:growth` | Runs all five growth/trust checks above | Yes |
| `growth:report` | Writes `content/growth/reports/YYYY-MM-DD.md` | No |
| `growth:plan` | Writes `content/growth/weekly-plans/YYYY-MM-DD.md` | No |
| `security:check` / `security:deps` | Existing security scans | Varies |

Run before every deploy: `npm run type-check && npm run lint && npm run audit:growth && npm run build`.

**Accessibility:** `lint` now extends `plugin:jsx-a11y/recommended`, so most
accessibility rules are enforced as errors. Seven rules with pre-existing
violations in the older app surface (`label-has-associated-control`,
`media-has-caption`, `no-autofocus`, `click-events-have-key-events`,
`no-static-element-interactions`, `no-redundant-roles`,
`interactive-supports-focus`) are set to **warn** in `apps/web/.eslintrc.json`
and tracked for incremental cleanup. New code should satisfy them.

## 2. CI workflows (`.github/workflows/`)

- **growth-ci.yml** (added): on push/PR to `master` — type-check, lint, build,
  `audit:growth`, and a non-blocking dependency audit.
- **codeql.yml** (existing): code scanning.
- **security-audit.yml** (existing): security checks.

## 3. Update publishing (commit-trailer automation)

The `/updates` and `/dev-updates` pages publish themselves from your commits —
opt-in, and safe by default.

- Add `Update: <plain-English line>` to a commit message → a **product** entry is
  created on `/updates` as a **draft** (hidden until a human flips it live).
- Add `Dev-Update: <technical line>` → an entry on the engineering log
  `/dev-updates` that publishes on the next deploy.
- Commits with neither trailer are ignored — refactors, dependency bumps, and CI
  changes never reach the page.

Run `npm run hooks:install` once per clone to install the `post-commit` hook. After
that it runs `updates:generate` automatically on every commit, makes a single
follow-up commit containing just the two data files (`apps/web/src/data/auto-updates.json`
+ `auto-dev-updates.json`), and **never pushes** — you push manually. You can also run
`npm run updates:generate` by hand. Full guide: `docs/AUTO_PUBLISH_UPDATES.md`.

## 4. Manual workflows

These are intentionally human-driven:

- **Weekly growth loop:** run `npm run growth:report`, fill in KPIs from
  analytics, then `npm run growth:plan` to scaffold next week's calendar, then
  execute the tasks by hand.
- **Outreach:** personalize templates in `content/growth/*-outreach.md` and send
  one at a time to real, relevant contacts.
- **Content:** write SEO drafts and short-form scripts, review for accuracy and
  honesty, then publish.
- **Email lifecycle:** templates live in `content/emails/`; connect a provider
  (see below) and schedule sends through that provider — SwingVantage does not send
  email itself.

## 5. Email capture / sending

`/api/email-capture` stores leads via whichever provider is configured by env
(Resend, ConvertKit, Mailchimp, or a webhook). If none is set, it honestly
reports that the address was not stored. SwingVantage does not send marketing email
directly — use your provider's automations with the `content/emails/` templates.

## 6. What we do NOT automate (by policy)

- **No automated social posting** to Reddit, Facebook, TikTok, Instagram,
  Discord, forums, or any community. Scripts only generate *drafts* for a human
  to review and post.
- **No fake engagement, reviews, or ratings.**
- **No scraping or mass-DMing.** Outreach is personalized and manual.
- **No auto-publishing of SEO pages** — a human writes and reviews before a page
  is marked `published`.
- **No auto-publishing of product `/updates`** — commit-trailer entries land as
  drafts a human flips live (only the technical `/dev-updates` log auto-publishes),
  and the update hook **never pushes** for you.
- **No youth data made public**, ever, by default.
