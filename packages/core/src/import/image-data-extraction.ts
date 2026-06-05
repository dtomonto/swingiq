// ============================================================
// SwingVantage — Launch-Monitor Image → Data Extraction (pure layer)
//
// The accurate, domain-aware half of the "upload a photo of your data
// and we read the numbers" feature. This module owns everything that
// can be unit-tested without a network call:
//
//   • buildImageExtractionPrompt   — a strong, layout-aware system +
//     user prompt that teaches the vision model exactly what a launch
//     monitor screen looks like and the canonical metric vocabulary.
//   • parseExtractedTable          — bullet-proof parsing of the model's
//     JSON reply (tolerates code fences, ragged rows, junk) into a clean
//     { headers, rows } table.
//   • buildExtractionRepairPrompt  — a text-only self-correction pass,
//     mirroring the swing-vision provider, so a malformed first reply is
//     repaired instead of thrown away.
//   • summarizeFieldCoverage       — maps the extracted headers onto the
//     universal launch-monitor schema (reusing detectColumnMapping) so the
//     UI can show "we recognised Carry, Ball Speed, Spin…" and the data
//     flows straight into the diagnostic engine.
//
// The actual provider HTTP call lives server-side in the API route; this
// file never touches the network or any secret. Honest-first: extraction
// always carries a confidence and ALWAYS requires user review before save.
// ============================================================

import {
  detectColumnMapping,
  getMissingCriticalFields,
  getMissingRecommendedFields,
} from './normalizer';
import type { LaunchMonitorBrand } from '../types';

// ── Public types ──────────────────────────────────────────────

export type ImageExtractionConfidence = 'high' | 'medium' | 'low';

/** Whether the photo shows one shot (a screen of labelled metrics) or a
 *  multi-row session table. Both are normalised to the same shape below. */
export type ExtractionLayout = 'single_shot' | 'table';

/** A clean, rectangular table the importer can review and save. */
export interface ExtractedTable {
  layout: ExtractionLayout;
  /** Club detected in the image (e.g. "7 Iron", "Driver"), if any. */
  club: string | null;
  /** Column names (metric labels). */
  headers: string[];
  /** One array of cell strings per shot; every row has `headers.length` cells. */
  rows: string[][];
  confidence: ImageExtractionConfidence;
  /** Units the model believes the screen used, e.g. "yards / mph". */
  unitsDetected: string | null;
  /** Non-fatal notes ("glare on the spin value", "cut-off column"). */
  warnings: string[];
}

/** How the extracted headers line up with the universal schema. */
export interface FieldCoverage {
  /** universalField -> the header it was matched to. */
  mapping: Record<string, string>;
  /** Universal fields we recognised (keys of `mapping`). */
  recognizedFields: string[];
  /** Critical fields still missing (club, carry_distance). */
  missingCritical: string[];
  /** Recommended-but-missing fields (ball speed, spin, path…). */
  missingRecommended: string[];
}

// ── Canonical metric vocabulary (kept in sync with the normalizer) ──
// Teaching the model these exact names dramatically improves the odds the
// extracted headers auto-map to the universal schema downstream.
const CANONICAL_METRICS = [
  'Club',
  'Carry Distance',
  'Total Distance',
  'Ball Speed',
  'Club Speed',
  'Smash Factor',
  'Launch Angle',
  'Launch Direction',
  'Spin Rate',
  'Spin Axis',
  'Apex Height',
  'Descent Angle',
  'Club Path',
  'Face Angle',
  'Face To Path',
  'Attack Angle',
  'Dynamic Loft',
  'Side Carry',
  'Lateral Offline',
] as const;

/** The exact JSON the model must return — shared by the first call and the repair pass. */
export const IMAGE_EXTRACTION_JSON_CONTRACT = `Return STRICT, MINIFIED JSON and NOTHING ELSE — no prose, no markdown, no code fences.

Schema:
{
  "layout": "single_shot" | "table",
  "club": string | null,
  "headers": string[],
  "rows": string[][],
  "confidence": "high" | "medium" | "low",
  "unitsDetected": string | null,
  "warnings": string[]
}

Rules:
- "single_shot": the image shows ONE shot as a screen of labelled numbers. Put each metric label in "headers" and its single value in ONE row. Example: headers ["Club","Carry Distance","Ball Speed","Spin Rate"], rows [["7 Iron","172","118","6400"]].
- "table": the image is a grid/spreadsheet with a header row and many shot rows. Use the visible header row for "headers" and one array per data row for "rows". Skip summary rows like Average / Max / Std Dev.
- EVERY row array MUST have exactly the same length as "headers". Pad short rows with "" and never merge two metrics into one cell.
- Copy values EXACTLY as shown (keep decimals and minus signs). NEVER guess, round, or invent a number. If a value is unreadable use "".
- Strip unit suffixes from values ("245 yds" -> "245", "152 mph" -> "152", "-3.4°" -> "-3.4") and report the units once in "unitsDetected".
- Prefer these canonical header names when the metric is clearly one of them: ${CANONICAL_METRICS.join(', ')}. If a label is genuinely different, keep what you see.
- "confidence": "high" only if the whole screen is sharp and every value is unambiguous; "medium" if mostly clear; "low" if blurry, glared, angled, or partly cut off.
- Add a short note to "warnings" for anything you were unsure about. If you cannot read any data, return empty "headers" and "rows" with "confidence":"low".`;

// ── Prompt builders ───────────────────────────────────────────

export interface ImageExtractionPromptOptions {
  /** Human label of the device/source, e.g. "TrackMan" or "a launch monitor". */
  source: string;
  /** Sport, used only to phrase the prompt naturally. */
  sport?: string;
}

/** Build the system + user prompt for the first (image-bearing) call. */
export function buildImageExtractionPrompt(
  opts: ImageExtractionPromptOptions,
): { system: string; userText: string } {
  const sport = (opts.sport ?? 'golf').replace(/_/g, ' ');
  const system =
    'You are SwingVantage\'s launch-monitor data-extraction engine. You read a single photo or ' +
    'screenshot of a sports launch monitor / performance screen (or a stats table) and ' +
    'transcribe the numbers into structured data with perfect fidelity.\n\n' +
    'You understand how these screens are laid out: a big primary distance, a cluster of ' +
    'labelled ball-flight metrics (ball speed, launch, spin, apex, carry, total) and club-delivery ' +
    'metrics (club speed, club path, face angle, attack angle, smash factor), sometimes a club ' +
    'name and a shot dispersion graphic. Brands include TrackMan, FlightScope, Foresight/GCQuad, ' +
    'Garmin, Rapsodo, SkyTrak, Uneekor and Full Swing.\n\n' +
    'Accuracy is everything: a wrong digit produces a wrong diagnosis. Transcribe what is on the ' +
    'screen — never estimate, never fill gaps from typical values.\n\n' +
    IMAGE_EXTRACTION_JSON_CONTRACT;

  const userText =
    `This image is a ${sport} ${opts.source} screen or data table. ` +
    'Read every metric label and its value and return the JSON described above. ' +
    'If the image shows one shot, use layout "single_shot"; if it is a multi-row table, use "table".';

  return { system, userText };
}

/** Build the text-only repair prompt (no image re-sent) when the first reply is malformed. */
export function buildExtractionRepairPrompt(
  priorText: string,
  error: string,
): { system: string; userText: string } {
  const system =
    'You repair a draft JSON object so it EXACTLY matches the required SwingVantage extraction schema. ' +
    'Output ONLY the corrected JSON object — no prose, no markdown fences. Preserve the original ' +
    'values; do NOT invent new numbers. Fix structure, row lengths, types and enum values.\n\n' +
    IMAGE_EXTRACTION_JSON_CONTRACT;
  const userText =
    `This draft failed validation:\n\n${priorText}\n\nValidation error: ${error}\n\n` +
    'Return the corrected JSON object only.';
  return { system, userText };
}

// ── Response parsing ──────────────────────────────────────────

const MAX_HEADERS = 40;
const MAX_ROWS = 300;

/** Pull the first balanced-looking JSON object out of a model reply. */
function extractJsonBlob(text: string): string | null {
  if (!text) return null;
  // Drop ```json … ``` fences if present.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced ? fenced[1]! : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return body.slice(start, end + 1);
}

function asConfidence(v: unknown): ImageExtractionConfidence {
  return v === 'high' || v === 'medium' || v === 'low' ? v : 'low';
}

function asLayout(v: unknown, rowCount: number): ExtractionLayout {
  if (v === 'single_shot' || v === 'table') return v;
  return rowCount > 1 ? 'table' : 'single_shot';
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (typeof v === 'boolean') return '';
  return String(v).trim();
}

export type ParseResult =
  | { ok: true; table: ExtractedTable }
  | { ok: false; error: string };

/**
 * Parse a vision model's raw reply into a clean, rectangular table.
 * Tolerant of code fences, trailing prose, ragged rows and non-string cells.
 * Returns ok:false with a short reason when the reply isn't usable JSON
 * (the caller then runs the repair pass).
 */
export function parseExtractedTable(rawText: string): ParseResult {
  const blob = extractJsonBlob(rawText);
  if (!blob) return { ok: false, error: 'No JSON object found in the response.' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(blob);
  } catch {
    return { ok: false, error: 'Response was not valid JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Response JSON was not an object.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.headers)) {
    return { ok: false, error: 'Missing "headers" array.' };
  }
  if (!Array.isArray(obj.rows)) {
    return { ok: false, error: 'Missing "rows" array.' };
  }

  const headers = obj.headers
    .map(cellToString)
    .filter((h) => h !== '')
    .slice(0, MAX_HEADERS);

  const rawRows = obj.rows.slice(0, MAX_ROWS);
  const rows: string[][] = [];
  for (const r of rawRows) {
    if (!Array.isArray(r)) continue;
    // Rectangularise to the header count: pad short rows, drop overflow.
    const cells = headers.map((_, i) => cellToString(r[i]));
    if (cells.some((c) => c !== '')) rows.push(cells);
  }

  // A header-less reply (model couldn't read anything) is a soft, valid result.
  const club = cellToString(obj.club) || null;
  const unitsDetected = cellToString(obj.unitsDetected) || null;
  const warnings = Array.isArray(obj.warnings)
    ? obj.warnings.map(cellToString).filter((w) => w !== '').slice(0, 12)
    : [];

  const table: ExtractedTable = {
    layout: asLayout(obj.layout, rows.length),
    club,
    headers,
    rows,
    confidence: asConfidence(obj.confidence),
    unitsDetected,
    warnings,
  };
  return { ok: true, table };
}

// ── Field coverage (maps extracted headers onto the universal schema) ──

/** Map ImageExtractionSource-style strings onto a normalizer brand. */
export function sourceToBrand(source: string | undefined): LaunchMonitorBrand {
  const s = (source ?? '').toLowerCase();
  const known: LaunchMonitorBrand[] = [
    'flightscope', 'trackman', 'foresight', 'skytrak', 'uneekor',
    'garmin', 'rapsodo', 'full_swing', 'golfzon', 'bushnell',
  ];
  const hit = known.find((b) => s.includes(b.replace('_', '')) || s.includes(b));
  return hit ?? 'manual';
}

/**
 * Describe how the extracted headers line up with the universal schema, so the
 * UI can reassure the user ("recognised 8 of your metrics") and so the save
 * step knows which diagnostic inputs are present.
 */
export function summarizeFieldCoverage(
  headers: string[],
  source?: string,
): FieldCoverage {
  const brand = sourceToBrand(source);
  const mapping = detectColumnMapping(headers, brand);
  return {
    mapping,
    recognizedFields: Object.keys(mapping),
    missingCritical: getMissingCriticalFields(mapping),
    missingRecommended: getMissingRecommendedFields(mapping),
  };
}

/** Convert an extracted table into row records keyed by header (for normalizeRow). */
export function tableToRecords(table: ExtractedTable): Record<string, string>[] {
  return table.rows.map((row) => {
    const rec: Record<string, string> = {};
    table.headers.forEach((h, i) => {
      rec[h] = row[i] ?? '';
    });
    return rec;
  });
}
