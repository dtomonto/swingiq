# Multilingual Marketing — Self-Maintaining Localization

## In Plain English (start here)

SwingVantage's public pages used to be English-only. This system lets them appear
in other languages **and** keeps those translations honest over time:

- Visitors who prefer another language are sent to a translated version of the page
  (today: Spanish at `/es`). Their language is auto-detected, and they can switch
  any time with the globe menu in the header.
- Search engines are told "this English page also exists in Spanish" (an `hreflang`
  link), which is how you eventually rank in Spanish Google.
- **The safety net:** if you ever edit the English wording, the matching translation
  is automatically marked *out of date* and that page quietly stops showing in
  Spanish until it's re-translated. So a visitor never sees a half-English,
  half-Spanish page, and Google never indexes a stale one. Nothing misleading.

You don't have to do anything for the safety net — it's automatic. When you want to
add or refresh translations, run one command (below).

## How it works

| Piece | File | Job |
| --- | --- | --- |
| Source strings (English + each language) | `apps/web/src/content/marketing/i18n/*.json` | The actual words. JSON so both the app and the Node CLI read the same file. |
| Manifest (the memory) | `apps/web/src/content/marketing/translation-manifest.generated.json` | Records the English each translation was confirmed against. The drift anchor. |
| Drift + exposure logic | `apps/web/src/lib/i18n-upkeep/` | Pure rules: a translation is `current` / `stale` / `missing`. |
| Exposure gate | `apps/web/src/lib/marketing-i18n/expose.ts` | "Which languages is this page actually available in?" Used by routing, hreflang, sitemap, and the switcher — the single source of truth. |
| Localized routes | `apps/web/src/app/[lang]/` | English stays at the root; translated pages live at `/es`, `/es/…`. Only fully-translated pages are built. |
| Upkeep CLI | `scripts/i18n/upkeep.mjs` | Detects drift, can bless (confirm) translations, optional AI translate. |

**The honesty gate is the core idea:** a language is exposed for a page only when
*every* string that page needs is `current` for that language. Drift is computed
live from the committed manifest vs. the current English JSON, so editing English
instantly hides affected pages from a language — even before the scheduled job runs.

## Day-to-day

```bash
# See what's current / stale / missing (writes docs/i18n-upkeep-report.md).
# Exits non-zero if there's drift, so CI / the scheduled task notices.
npm run i18n:upkeep

# After you ADD or FIX translations by hand in the *.json files, confirm them:
npm run i18n:bless

# Optional: auto-translate stale/missing entries with AI, then confirm them.
# OFF by default (no spend). Requires TRANSLATE_AI_ENABLED=1 and an AI key.
npm run i18n:translate
```

## Adding a language or page

1. **New language** (e.g. French): add its code to `MARKETING_LOCALE_CODES` in
   `apps/web/src/lib/marketing-i18n/constants.ts`, create
   `content/marketing/i18n/fr.json` (translate the keys), then `npm run i18n:bless`.
2. **New localizable page**: extract its English copy into the marketing JSON under
   a new namespace, register the page → keys in
   `apps/web/src/lib/marketing-i18n/registry.ts`, add a route under `app/[lang]/…`
   that renders from the dictionary, translate, then `npm run i18n:bless`.

Until a page is both registered and fully translated for a language, it simply stays
English for that language — automatically.

## Automatic upkeep (scheduled)

A scheduled task runs `npm run i18n:upkeep` on a cadence, writes the dated report,
and makes a **local commit only** (you review and push) — consistent with the other
scheduled audits. With AI translation enabled it also refreshes stale/missing
entries before committing. It never pushes.

## Notes

- `<html lang>` for localized pages is set client-side (the root layout renders a
  static `<html lang="en">` it can't vary per route); the SEO signal that matters —
  `canonical` + `hreflang` — is server-rendered via `buildMetadata`.
- The auto-redirect for visitors is client-side on purpose, so crawlers always get
  the server-rendered English with correct canonical/hreflang.
- AI auto-translation is provider-gated and **off by default** (zero spend), matching
  the keyless-first pattern used elsewhere (blog-to-social, ads, video-studio).
