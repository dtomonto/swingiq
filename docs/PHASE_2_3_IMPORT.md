# Phase 2 + 3 — Universal Import & Learned Column Mapping

## In Plain English (start here)

Getting your launch-monitor / simulator data into SwingVantage used to be a
one-file-at-a-time chore where you re-mapped the columns every time. Phase 2 + 3
make import feel automatic:

1. **It knows your device.** Drop in a file and SwingVantage recognises which
   launch monitor or simulator it came from (TrackMan, FlightScope, Foresight,
   GSPro, E6, SkyTrak, Garmin, Rapsodo, and more) from the column names + filename.
2. **It stops re-asking you to map columns.** The first time you import a given
   export layout, SwingVantage remembers how its columns line up. Next time you
   upload the same kind of file, it reuses that mapping — and if it's confident,
   skips the mapping screen entirely.
3. **You can import a whole history at once.** A new **Bulk** mode takes many
   files together (CSV, Excel, or JSON), detects each one, **skips duplicates**
   you've already imported, and saves them all as separate sessions in one go.
4. **Adding a new device later is easy.** Sources live in one catalogue, so
   supporting a new monitor is a data entry, not an app rewrite.

What's intentionally honest: live "push" sync from each vendor's cloud isn't
built (most have no public API). The registry marks every source `file_only`
today and is structured so official API / cloud-watch connectors can be added
later without changing the importer.

---

## What changed (for engineers)

The deterministic parsing + column-mapping core already existed in
`@swingiq/core` (`import/normalizer.ts`: robust `parseCSV`, `detectColumnMapping`
with brand alias maps, `normalizeRow`). Phase 2/3 builds the catalogue,
detection, memory, and bulk layers on top — all in `apps/web/src/lib/import/`
(so no core rebuild is needed; `@/` always resolves to source).

### Source registry + auto-detect — `lib/import/sources.ts`
`DATA_SOURCES`: one normalized entry per source (id, brand, supported methods +
file types, available metrics, auth type, sync status, confidence, limitations,
export instructions, detection signatures). `detectSource(headers, fileName)`
ranks sources by distinctive header matches + filename hints. **Add a source =
add a registry entry** (+ optional brand aliases in the core normalizer).

### Learned mapping memory — `lib/import/mapping-memory.ts` + store
- `schemaFingerprint(headers)` — stable id for a file's column layout (order /
  case / units / punctuation-independent, count-aware).
- `mappingConfidence(mapping)` — high / medium / low, drives the wizard UX
  (skip mapping / quick review / full mapping).
- `SavedMapping` records are persisted per fingerprint in the store slice
  `store/slices/importMappings.ts` (`rememberImportMapping` upserts + bumps
  useCount; a manual correction is sticky). Local-first like onboarding —
  re-learned per device, defaulted in `cloud-repo.fillDefaults`.

### Shared pipeline — `lib/import/process.ts`
`analyzeFile(name, text, { lookupSaved })` = parse (CSV **or** JSON) →
fingerprint → detect source → choose mapping (**saved memory wins**, else
deterministic) → normalize → `shotsSignature` for duplicate detection. Used by
both the guided wizard and bulk importer, plus `normalizedToShot` /
`primaryClubOf` helpers (extracted so both paths build identical sessions).

### UI
- `ImportWizard.tsx` — now fingerprints on upload, auto-detects + shows the
  source, **reuses a saved mapping** (skips to preview when high-confidence),
  flags manual corrections, and **remembers the mapping on import**.
- `BulkImport.tsx` (new) + a Guided/Bulk tab on `sessions/import/page.tsx` —
  multi-file upload, per-file detection + saved-mapping reuse, duplicate
  detection (vs existing sessions and within the batch), select/deselect,
  one-click import-all, and a summary.

## Tests (26 new)
`lib/import/__tests__/`: `sources.test.ts` (registry + detect),
`mapping-memory.test.ts` (fingerprint / confidence / saved-mapping helpers),
`process.test.ts` (CSV+JSON parse, analyze, saved-mapping reuse, dedupe).
Full suite green, tsc clean, production build passes.

## Not yet (future)
Official OAuth/API + cloud-folder-watch + email-forward connectors (registry is
ready for them); ZIP-of-sessions expansion; XLSX binary parsing (currently
relies on CSV/JSON export — `.xlsx` is accepted but best results are CSV).
