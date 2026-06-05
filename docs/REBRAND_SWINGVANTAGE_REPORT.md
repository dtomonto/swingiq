# Rebrand Completion Report — SwingIQ → SwingVantage

## In Plain English (start here)

The whole product is now **SwingVantage** (domain **swingvantage.com**). Everything a user,
search engine, or reader sees says SwingVantage. A handful of *invisible* internal labels
still say "swingiq" on purpose — changing them would erase existing users' saved data or break
the build, with zero benefit to anyone. The app builds, all tests pass, and the live homepage
was verified in the browser. The only things left are account/domain tasks that only you can
do (DNS, email forwarding, social handles) — those are in
[`docs/brand/REBRAND_OWNER_CHECKLIST.md`](brand/REBRAND_OWNER_CHECKLIST.md).

Branch: **`feature/rebrand-swingvantage`** (not merged — review and merge when ready).

---

## 1. Summary of what changed

| Area | Change |
|---|---|
| Product name | `SwingIQ` → `SwingVantage` everywhere it is visible (2,174 lines across 655 files) |
| Brand monogram | `SQ` → `SV` (16 in-app surfaces + generated icons/OG image) |
| Domain | `swingiq.app` → `swingvantage.com` (canonical, OG, sitemap, robots, llms.txt, Plausible) |
| Contact email | `*@swingiq.app` → `*@swingvantage.com` (role-based; forwarding set up by owner) |
| Hero / positioning | Homepage leads with "See your swing from a smarter vantage"; free-first hook kept |
| AEO | Added "What is SwingVantage?" + youth-athlete FAQ (feeds FAQ JSON-LD) |
| Assets | Regenerated `icon-192/512.png`, `apple-icon.png`, `og-default.png` (SV + wordmark) |
| Docs | New brand guide + owner checklist; README leads with SwingVantage |

## 2. Commits (on `feature/rebrand-swingvantage`)

1. `rebrand(core)` — central config (site.ts, layout.tsx, manifest.json)
2. `rebrand(sweep)` — cased SwingIQ → SwingVantage across 655 files
3. `rebrand(domain)` — swingiq.app → swingvantage.com + emails
4. `rebrand(residual)` — safe lowercase items (download filenames, SEO keywords, test fix)
5. `rebrand(polish)` — vantage hero, SV monogram across 15 surfaces, AEO FAQ
6. `rebrand(assets+docs)` — SV monogram in generated assets + brand docs
7. `docs(rebrand)` — this report

## 3 / 4. Old references removed → SwingVantage

- All user-facing copy, page `<title>`/meta, OpenGraph/Twitter, PWA manifest, i18n strings
  (all locales), email templates, growth content, `seoPages.ts`, code comments.
- TypeScript identifiers renamed consistently: `SwingIQStore`→`SwingVantageStore`,
  `useSwingIQStore`, `SwingIQState`, `SwingIQBackup`, `SwingIQSlice` (and all usages).
- **Verification:** `git grep "SwingIQ"` → **0**; `git grep "swingiq.app"` → **1** (an
  intentional "redirect from the old domain" line in the owner checklist).

## 5. SEO / AEO / GEO updates

- Titles, descriptions, OG/Twitter cards, `metadataBase`, JSON-LD (Organization, WebSite,
  SoftwareApplication, FAQPage) all reference SwingVantage / swingvantage.com.
- `sitemap.ts`, `robots.txt`, `public/llms.txt` updated.
- Homepage FAQ expanded with answer-engine-friendly entries (What is SwingVantage, youth use).
- Free-first positioning preserved (kept "Free AI swing analysis" in headline/SEO copy).

## 6. Physical / offline strategy

- `docs/brand/BRAND_GUIDE.md` — name, meaning, taglines, voice, visual tokens, sport lines.
- `docs/brand/REBRAND_OWNER_CHECKLIST.md` — domain/DNS, email forwarding, GSC/Bing, analytics,
  social handles, payments, and a full print/QR/deck/signage collateral list.

## 7. Technical naming updates

Changed only where safe: display config, metadata constants, the generated-asset wordmark,
non-re-imported download filenames (`swingvantage-motionlab-*`, swing-analysis exports,
share-card PNGs), and a Supabase doc example name.

## 8. Intentionally NOT changed (and why)

| Item | Why kept |
|---|---|
| `swingiq-store` localStorage key + all `swingiq_*` / `swingiq-*-v1` keys (sport selection, local accounts/session, retests, motion sessions, AGI history, celebrations, guide, video history, offline/IndexedDB) | These persist real user data locally. Renaming them silently **wipes saved progress / logs users out**. |
| `@swingiq/*` npm scope, root `package.json` name, workspace names, turbo filters, tsconfig path alias | Internal build wiring; non-user-facing; high churn / breakage risk, zero benefit. |
| Backup format: `swingiq-backup-v1`, `swingiq_encrypted` marker, `.swingiqbackup` extension, `swingiq-backup-` filename, `name.includes('swingiq')` scan | The on-disk backup data contract. Changing it breaks **restore + decryption of existing exported backups** and the auto-continue file scan. |
| Analytics event names (`ANALYTICS_EVENTS`) | Semantic, not brand-prefixed. The source brief's `swingvantage_*` prefix would *break historical analytics continuity* for no gain. |
| On-disk repo folder `swingiq`, current `swingiq-web-*.vercel.app` URL, historical branch names | Factual references that must stay accurate; owner renames the Vercel project per checklist. |
| `30-day-swingiq` challenge slug, published update slugs (`swingiq-launches`, etc.) | Stable content/route identifiers; the user-facing titles are already rebranded. |

> **Future migration note:** to fully retire the backup `swingiq` identifiers and the localStorage
> keys later, add a one-time shim that reads the old key/format and re-writes under the new name
> (dual-read on import). Not done here to avoid risk to existing users pre-launch.

## 9. Risks / migration concerns

- **None block the build or merge.** Risks are all owner-side: canonical URLs/emails now point at
  `swingvantage.com`, which must be live + forwarding before public launch (see checklist).
- Pre-existing, not introduced by this rebrand: lint warnings (37, hooks/unused-vars), and a stale
  `.next` cache that referenced unmerged GrowthOS pages (cleared during QA).

## 10. Required owner actions

See [`docs/brand/REBRAND_OWNER_CHECKLIST.md`](brand/REBRAND_OWNER_CHECKLIST.md). Top items:
secure DNS for swingvantage.com, set up **email forwarding** for the role addresses to your
private inbox (address kept out of the repo), set `NEXT_PUBLIC_SITE_URL`, update GSC/Bing/
analytics, claim social handles, run trademark clearance.

## 11. Recommended next steps before launch

1. Stand up swingvantage.com + email forwarding; set `NEXT_PUBLIC_SITE_URL`.
2. Merge `feature/rebrand-swingvantage`.
3. Replace the code-generated SV mark with a designed logo if/when available (`npm run generate:brand`).
4. Legal review of privacy/terms; trademark clearance.

## 12. QA results

| Check | Result |
|---|---|
| `npm run type-check` | ✅ 3/3 (after clearing a stale `.next` from an unmerged branch) |
| `npm test` | ✅ 410 passed, 1 skipped (incl. backup-format + AGI report tests) |
| `npm run build` | ✅ 2/2 tasks, no errors |
| `npm run lint` | ✅ 0 errors (37 pre-existing warnings) |
| Grep gate `SwingIQ` | ✅ 0 |
| Grep gate `swingiq.app` | ✅ 1 (intentional old-domain redirect note) |
| Privacy gate (forwarding email) | ✅ `@outlook.com`/`@gmail.com` = 0 in repo; only the public GitHub handle `@dtomonto` in CODEOWNERS (pre-existing) |
| Live homepage (browser preview) | ✅ title, "smarter vantage" hero, SV badge; no SwingIQ/SQ; no rebrand console errors |
| Local store key intact | ✅ `swingiq-store` unchanged — existing users keep their data |

## 13. Remaining old-name references

Only the intentional/technical items in §8 and the single migration-redirect note in the owner
checklist. No stray user-facing `SwingIQ` remains.
