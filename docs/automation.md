# SwingIQ — Automation

What runs automatically, what you run manually, and — importantly — what we
deliberately do **not** automate.

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
| `audit:growth` | Runs all five growth/trust checks above | Yes |
| `growth:report` | Writes `content/growth/reports/YYYY-MM-DD.md` | No |
| `growth:plan` | Writes `content/growth/weekly-plans/YYYY-MM-DD.md` | No |
| `security:check` / `security:deps` | Existing security scans | Varies |

Run before every deploy: `npm run type-check && npm run lint && npm run audit:growth && npm run build`.

## 2. CI workflows (`.github/workflows/`)

- **growth-ci.yml** (added): on push/PR to `master` — type-check, lint, build,
  `audit:growth`, and a non-blocking dependency audit.
- **codeql.yml** (existing): code scanning.
- **security-audit.yml** (existing): security checks.

## 3. Manual workflows

These are intentionally human-driven:

- **Weekly growth loop:** run `npm run growth:report`, fill in KPIs from
  analytics, then `npm run growth:plan` to scaffold next week's calendar, then
  execute the tasks by hand.
- **Outreach:** personalize templates in `content/growth/*-outreach.md` and send
  one at a time to real, relevant contacts.
- **Content:** write SEO drafts and short-form scripts, review for accuracy and
  honesty, then publish.
- **Email lifecycle:** templates live in `content/emails/`; connect a provider
  (see below) and schedule sends through that provider — SwingIQ does not send
  email itself.

## 4. Email capture / sending

`/api/email-capture` stores leads via whichever provider is configured by env
(Resend, ConvertKit, Mailchimp, or a webhook). If none is set, it honestly
reports that the address was not stored. SwingIQ does not send marketing email
directly — use your provider's automations with the `content/emails/` templates.

## 5. What we do NOT automate (by policy)

- **No automated social posting** to Reddit, Facebook, TikTok, Instagram,
  Discord, forums, or any community. Scripts only generate *drafts* for a human
  to review and post.
- **No fake engagement, reviews, or ratings.**
- **No scraping or mass-DMing.** Outreach is personalized and manual.
- **No auto-publishing of SEO pages** — a human writes and reviews before a page
  is marked `published`.
- **No youth data made public**, ever, by default.
