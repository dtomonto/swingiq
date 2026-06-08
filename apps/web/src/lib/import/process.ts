// ============================================================
// SwingVantage — Shared import processing (Phase 2/3)
// ------------------------------------------------------------
// One pipeline used by BOTH the guided single-file wizard and the bulk
// multi-file importer, so they can never drift:
//
//   parse (CSV or JSON) → fingerprint → detect source → choose mapping
//   (saved memory > deterministic) → normalize rows → dedupe signature
//
// AI column-mapping (network, async) stays in the wizard; this module is
// the deterministic, offline core so bulk import is fast and reuses the
// learned mappings from previous sessions.
// ============================================================

import {
  parseCSV,
  detectColumnMapping,
  normalizeRow,
  type NormalizedShot,
  type LaunchMonitorBrand,
  type Shot,
  type ClubCategory,
  type SwingType,
} from '@swingiq/core';
import { detectSource } from './sources';
import { schemaFingerprint, mappingConfidence, type MappingConfidence, type SavedMapping } from './mapping-memory';
import { buildBaselineResolver, type BaselineSession } from '@/lib/shot-intent/baselines';
import { classifyShotIntent, type ShotIntent } from '@/lib/shot-intent/classify';

/** Best-effort mapping from a club name string to a typed ClubCategory. */
export function inferClubCategory(clubName: string): ClubCategory {
  const n = clubName.toLowerCase();
  if (n.includes('driver') || n === 'dr' || n === '1w') return 'driver';
  if (n.includes('fairway') || /[2-5]w/.test(n)) return 'fairway_wood';
  if (n.includes('hybrid') || /[2-5]h/.test(n)) return 'hybrid';
  if (/^(2|3|4)\s?i(ron)?$/.test(n) || n === '2-iron' || n === '3-iron' || n === '4-iron') return 'long_iron';
  if (/^(5|6|7)\s?i(ron)?$/.test(n) || n === '5-iron' || n === '6-iron' || n === '7-iron') return 'mid_iron';
  if (/^(8|9)\s?i(ron)?$/.test(n) || n.includes('pw') || n.includes('pitching')) return 'short_iron';
  if (n.includes('wedge') || n.includes('aw') || n.includes('sw') || n.includes('lw') || n.includes('gap')) return 'wedge';
  if (n.includes('putter') || n === 'pt') return 'putter';
  return 'mid_iron';
}

/** Convert a NormalizedShot into a full Shot record for the store. The optional
 *  classification (from the shot-intent classifier) sets a real swing_type +
 *  outlier flag instead of assuming every shot was a full swing. */
export function normalizedToShot(
  ns: NormalizedShot,
  index: number,
  sessionId = 'pending',
  classification?: { swingType: SwingType; isOutlier: boolean },
): Shot {
  const now = new Date().toISOString();
  return {
    id: `shot_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    session_id: sessionId,
    user_id: 'local',
    club_id: null,
    club_name: ns.club_name || 'Unknown',
    club_category: inferClubCategory(ns.club_name || ''),
    shot_number: index + 1,
    date_time: now,
    swing_type: classification?.swingType ?? 'full',
    intended_shot_shape: null,
    actual_shot_shape: ns.ball_data.shot_shape ?? null,
    is_outlier: classification?.isOutlier ?? false,
    user_notes: '',
    ball_data: {
      carry_distance: ns.ball_data.carry_distance,
      total_distance: ns.ball_data.total_distance,
      ball_speed: ns.ball_data.ball_speed,
      launch_angle_vertical: ns.ball_data.launch_angle_vertical,
      spin_rate: ns.ball_data.spin_rate,
      spin_axis: ns.ball_data.spin_axis,
      side_carry: ns.ball_data.side_carry,
      lateral_offline: ns.ball_data.lateral_offline ?? ns.ball_data.side_carry,
      apex_height: ns.ball_data.apex_height,
      smash_factor: ns.ball_data.smash_factor,
      roll_distance: ns.ball_data.roll_distance,
      descent_angle: ns.ball_data.descent_angle,
      launch_direction_horizontal: ns.ball_data.launch_direction_horizontal,
      flight_time: ns.ball_data.flight_time,
      curve: ns.ball_data.curve,
      shot_shape: ns.ball_data.shot_shape,
    },
    club_data: {
      club_speed: ns.club_data.club_speed,
      attack_angle: ns.club_data.attack_angle,
      club_path: ns.club_data.club_path,
      face_angle_to_target: ns.club_data.face_angle_to_target,
      face_to_path: ns.club_data.face_to_path,
      dynamic_loft: ns.club_data.dynamic_loft,
      spin_loft: ns.club_data.spin_loft,
      swing_plane_horizontal: ns.club_data.swing_plane_horizontal,
      swing_plane_vertical: ns.club_data.swing_plane_vertical,
      low_point_position: ns.club_data.low_point_position,
      low_point_height: ns.club_data.low_point_height,
      closure_rate: ns.club_data.closure_rate,
      swing_direction: ns.club_data.swing_direction,
      lie_angle_dynamic: ns.club_data.lie_angle_dynamic,
    },
    strike_data: {
      impact_location_lateral: ns.strike_data.impact_location_lateral,
      impact_location_vertical: ns.strike_data.impact_location_vertical,
    },
    created_at: now,
  };
}

/** The most-used club name across shots (for the session summary). */
export function primaryClubOf(shots: { club_name: string }[]): string {
  const counts: Record<string, number> = {};
  for (const s of shots) counts[s.club_name] = (counts[s.club_name] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed';
}

/**
 * Content signature for duplicate detection: stable across re-uploads of the
 * SAME shots (count + each shot's club + rounded carry), independent of import
 * time. Used to skip re-importing a file that's already in the athlete record.
 */
export function shotsSignature(
  shots: { club_name: string; ball_data: { carry_distance: number | null } }[],
): string {
  if (shots.length === 0) return 'empty';
  let h = 5381;
  const feed = (s: string) => { for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i); };
  for (const s of shots) {
    feed(s.club_name.toLowerCase());
    feed('|');
    feed(String(Math.round(s.ball_data.carry_distance ?? -1)));
    feed(';');
  }
  return `${shots.length}-${(h >>> 0).toString(36)}`;
}

// ── File parsing (CSV or JSON) ────────────────────────────────

export interface ParsedRows {
  headers: string[];
  rows: Record<string, string>[];
  meta: {
    delimiter: string;
    headerRowIndex: number;
    preambleCount: number;
    droppedSummaryRows: number;
    unitsRowSkipped: boolean;
    format: 'csv' | 'json';
  };
}

/** Flatten a JSON export (array of shot objects, or { shots|data|rows: [...] }). */
function parseJSON(text: string): ParsedRows | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  let arr: unknown;
  if (Array.isArray(data)) arr = data;
  else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    arr = obj.shots ?? obj.data ?? obj.rows ?? obj.results;
  }
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const headerSet = new Set<string>();
  const objRows = arr.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && !Array.isArray(r));
  if (objRows.length === 0) return null;
  for (const r of objRows) for (const k of Object.keys(r)) headerSet.add(k);
  const headers = [...headerSet];
  const rows = objRows.map((r) => {
    const row: Record<string, string> = {};
    for (const h of headers) {
      const v = r[h];
      row[h] = v === null || v === undefined ? '' : String(v);
    }
    return row;
  });
  return {
    headers,
    rows,
    meta: { delimiter: 'json', headerRowIndex: 0, preambleCount: 0, droppedSummaryRows: 0, unitsRowSkipped: false, format: 'json' },
  };
}

/** Parse a file's text as JSON (by extension/content) or CSV/TSV. */
export function parseAnyFile(fileName: string, text: string): ParsedRows | null {
  const isJson = /\.json$/i.test(fileName) || /^\s*[[{]/.test(text);
  if (isJson) {
    const json = parseJSON(text);
    if (json) return json;
    // fall through to CSV if JSON parse failed but extension lied
  }
  const parsed = parseCSV(text);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) return null;
  return {
    headers: parsed.headers,
    rows: parsed.rows,
    meta: {
      delimiter: parsed.delimiter,
      headerRowIndex: parsed.headerRowIndex,
      preambleCount: parsed.preamble.length,
      droppedSummaryRows: parsed.droppedSummaryRows,
      unitsRowSkipped: parsed.unitsRow !== null,
      format: 'csv',
    },
  };
}

// ── High-level: analyze a file deterministically ──────────────

export interface AnalyzedFile {
  fileName: string;
  ok: boolean;
  error?: string;
  headers: string[];
  rows: Record<string, string>[];
  meta: ParsedRows['meta'];
  fingerprint: string;
  /** Detected source id (registry), or null when unknown. */
  detectedSourceId: string | null;
  brand: LaunchMonitorBrand;
  mapping: Record<string, string>;
  confidence: MappingConfidence;
  /** Whether the mapping came from learned memory. */
  reusedSavedMapping: boolean;
  normalizedShots: NormalizedShot[];
  signature: string;
}

/**
 * Deterministically analyze one file: parse, fingerprint, detect source,
 * choose the best mapping (a remembered mapping for this exact layout wins,
 * else the deterministic detector), and normalize the rows.
 *
 * @param lookupSaved  return a SavedMapping for a fingerprint, or undefined.
 * @param preferredBrand  user-selected brand hint (overrides detection).
 */
export function analyzeFile(
  fileName: string,
  text: string,
  opts: {
    lookupSaved?: (fingerprint: string) => SavedMapping | undefined;
    preferredBrand?: LaunchMonitorBrand;
  } = {},
): AnalyzedFile {
  const base = {
    fileName,
    headers: [] as string[],
    rows: [] as Record<string, string>[],
    meta: { delimiter: ',', headerRowIndex: 0, preambleCount: 0, droppedSummaryRows: 0, unitsRowSkipped: false, format: 'csv' as const },
    fingerprint: 'empty',
    detectedSourceId: null,
    brand: 'manual' as LaunchMonitorBrand,
    mapping: {} as Record<string, string>,
    confidence: 'low' as MappingConfidence,
    reusedSavedMapping: false,
    normalizedShots: [] as NormalizedShot[],
    signature: 'empty',
  };

  const parsed = parseAnyFile(fileName, text);
  if (!parsed) {
    return { ...base, ok: false, error: 'Could not find clear rows of shot data in this file.' };
  }

  const fingerprint = schemaFingerprint(parsed.headers);
  const detection = detectSource(parsed.headers, fileName);
  const brand = opts.preferredBrand ?? detection?.brand ?? 'manual';

  // Mapping priority: a remembered mapping for this exact layout wins.
  const saved = opts.lookupSaved?.(fingerprint);
  let mapping: Record<string, string>;
  let reusedSavedMapping = false;
  if (saved && Object.keys(saved.mapping).length > 0) {
    mapping = { ...saved.mapping };
    reusedSavedMapping = true;
  } else {
    mapping = detectColumnMapping(parsed.headers, brand);
  }

  const normalizedShots = parsed.rows.map((row) => normalizeRow(row, mapping, brand));

  return {
    ...base,
    ok: true,
    headers: parsed.headers,
    rows: parsed.rows,
    meta: parsed.meta,
    fingerprint,
    detectedSourceId: detection?.sourceId ?? null,
    brand,
    mapping,
    confidence: mappingConfidence(mapping),
    reusedSavedMapping,
    normalizedShots,
    signature: shotsSignature(normalizedShots),
  };
}

// ── Shot-intent classification (Phase 6) ──────────────────────

export interface IntentOptions {
  /** Prior sessions to learn per-club baselines from (the athlete's history). */
  priorSessions?: BaselineSession[];
  /** Bag carry by club name, used as a baseline fallback. */
  bagCarryByName?: Record<string, number | null>;
}

/**
 * Classify each normalized shot's intent against per-club baselines learned from
 * the athlete's history PLUS this file's own shots, so a single-club range file
 * still gets a sensible baseline.
 */
export function classifyNormalizedShots(
  normalizedShots: NormalizedShot[],
  opts: IntentOptions = {},
): { swingType: SwingType; isOutlier: boolean; intent: ShotIntent }[] {
  const thisFileAsSession: BaselineSession = {
    shots: normalizedShots.map((ns) => ({
      club_name: ns.club_name,
      club_category: inferClubCategory(ns.club_name || ''),
      ball_data: { carry_distance: ns.ball_data.carry_distance },
    })),
  };
  const resolve = buildBaselineResolver([...(opts.priorSessions ?? []), thisFileAsSession], opts.bagCarryByName);
  return normalizedShots.map((ns) => {
    const category = inferClubCategory(ns.club_name || '');
    const r = classifyShotIntent(
      {
        carry: ns.ball_data.carry_distance,
        clubSpeed: ns.club_data.club_speed,
        ballSpeed: ns.ball_data.ball_speed,
        launchAngle: ns.ball_data.launch_angle_vertical,
        category,
      },
      resolve(ns.club_name || '', category),
    );
    return { swingType: r.swingType, isOutlier: r.isOutlier, intent: r.intent };
  });
}

/** Build full Shot[] from normalized shots WITH intent classification applied. */
export function buildShotsWithIntent(normalizedShots: NormalizedShot[], opts: IntentOptions = {}): Shot[] {
  const cls = classifyNormalizedShots(normalizedShots, opts);
  return normalizedShots.map((ns, i) => normalizedToShot(ns, i, 'pending', cls[i]));
}

/** Count shots by intent for a quick "shot mix" summary. */
export function summarizeShotMix(classifications: { intent: ShotIntent }[]): Record<ShotIntent, number> {
  const mix = { chip: 0, pitch: 0, half: 0, three_quarter: 0, full: 0, punch: 0, mishit: 0 } as Record<ShotIntent, number>;
  for (const c of classifications) mix[c.intent]++;
  return mix;
}
