// ============================================================
// SwingVantage — Universal Data-Source Registry (Phase 2)
// ------------------------------------------------------------
// ONE normalized registry describing every launch-monitor / simulator
// / file source we can ingest, plus how to ingest it. The import UI,
// auto-detection, and (future) sync connectors all read from here, so
// ADDING A NEW SOURCE = adding a registry entry (+ optional column
// aliases in the core normalizer) — never rewriting the importer.
//
// The deterministic parsing + column mapping itself lives in
// @swingiq/core (normalizer.ts). This module is the catalogue +
// detection layer on top of it.
// ============================================================

import type { LaunchMonitorBrand } from '@swingiq/core';

/** How data can get into SwingVantage from a given source. */
export type ImportMethod =
  | 'file_csv' // CSV export upload
  | 'file_xlsx' // Excel export upload
  | 'file_json' // JSON export upload
  | 'zip' // ZIP of multiple session files
  | 'manual_paste' // paste rows
  | 'photo_ocr' // photo of the monitor screen (AI vision)
  | 'api_oauth' // official OAuth API (future)
  | 'cloud_watch' // watch a cloud folder (future)
  | 'email_forward'; // forward the export email (future)

/** Connection lifecycle for a source (drives the admin/connector UI). */
export type SyncStatus =
  | 'file_only' // we support file/photo import, no live sync
  | 'connected' // a live API/cloud connection is configured
  | 'coming_soon'; // listed, live sync not yet available

/** How well SwingVantage maps this source today. */
export type SourceConfidence = 'high' | 'medium' | 'low';

export interface DataSource {
  /** Stable id (registry key + saved-mapping key). */
  id: string;
  /** Display name. */
  name: string;
  category: 'launch_monitor' | 'simulator' | 'manual' | 'generic';
  /**
   * Brand the core normalizer should use for brand-specific column
   * overrides + unit handling. Sources without dedicated overrides use
   * 'other' (still fully importable via the universal alias map).
   */
  brand: LaunchMonitorBrand;
  supportedMethods: ImportMethod[];
  supportedFileTypes: string[];
  /** Universal metric keys this source typically provides. */
  availableMetrics: string[];
  authType: 'none' | 'oauth' | 'api_key';
  syncStatus: SyncStatus;
  confidence: SourceConfidence;
  /** Honest limitation note shown to the user (never overstate support). */
  limitations?: string;
  /** Plain-language "how to export" instructions. */
  exportInstructions: string;
  /**
   * Distinctive header names that strongly indicate this source, used by
   * detectSource(). Canonicalized before matching, so units/punctuation
   * don't matter.
   */
  signatureHeaders?: string[];
  /** Filename fragments that hint at this source (lowercased). */
  fileNameHints?: string[];
}

// Universal metric sets reused below.
const FULL_METRICS = [
  'club', 'carry_distance', 'total_distance', 'roll_distance', 'ball_speed',
  'club_speed', 'smash_factor', 'launch_angle', 'launch_direction', 'spin_rate',
  'spin_axis', 'apex_height', 'descent_angle', 'curve', 'side_carry',
  'lateral_offline', 'attack_angle', 'club_path', 'face_angle', 'face_to_path',
  'dynamic_loft', 'spin_loft', 'low_point', 'impact_location_lateral',
  'impact_location_vertical',
];
const BALL_METRICS = [
  'club', 'carry_distance', 'total_distance', 'ball_speed', 'launch_angle',
  'spin_rate', 'spin_axis', 'apex_height', 'descent_angle', 'side_carry',
  'smash_factor',
];

export const DATA_SOURCES: DataSource[] = [
  {
    id: 'flightscope',
    name: 'FlightScope (Mevo, Mevo+, X3) / FS Golf',
    category: 'launch_monitor',
    brand: 'flightscope',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'high',
    exportInstructions: 'In the FS Golf app: Sessions → select a session → Export → CSV. Email or save the file, then upload it here.',
    signatureHeaders: ['vertical swing plane', 'horizontal swing plane', 'closure rate', 'lateral landing', 'flight time'],
    fileNameHints: ['flightscope', 'fsgolf', 'fs_golf', 'mevo'],
  },
  {
    id: 'trackman',
    name: 'TrackMan (TM4, iO, Range)',
    category: 'launch_monitor',
    brand: 'trackman',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'high',
    exportInstructions: 'In the TrackMan app or Performance Studio: open the session → Export → CSV. Upload the file here.',
    signatureHeaders: ['swing direction', 'spin loft', 'dynamic loft', 'attack angle', 'face to path', 'low point'],
    fileNameHints: ['trackman', 'tm4', 'tps'],
  },
  {
    id: 'foresight',
    name: 'Foresight / Bushnell (GCQuad, GC3, Launch Pro)',
    category: 'launch_monitor',
    brand: 'foresight',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'high',
    limitations: 'Foresight sometimes exports in meters — SwingVantage auto-detects and converts to yards.',
    exportInstructions: 'In FSX / FSX Pro / FSX Play: open the session → File → Export Data → CSV. Upload the file here.',
    signatureHeaders: ['back spin', 'side spin', 'carry dist', 'side dist', 'club speed'],
    fileNameHints: ['foresight', 'fsx', 'gcquad', 'gc3', 'launchpro', 'bushnell'],
  },
  {
    id: 'skytrak',
    name: 'SkyTrak / SkyTrak+',
    category: 'launch_monitor',
    brand: 'skytrak',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: BALL_METRICS.concat(['club_speed', 'attack_angle', 'club_path', 'face_angle']),
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'high',
    exportInstructions: 'In the SkyTrak app: History → select a session → Download / Export CSV. Upload the file here.',
    signatureHeaders: ['back spin', 'side spin', 'launch angle', 'side angle'],
    fileNameHints: ['skytrak'],
  },
  {
    id: 'uneekor',
    name: 'Uneekor (Eye Mini, Eye XO, Eye XR)',
    category: 'launch_monitor',
    brand: 'uneekor',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'In Refine / View software: Reports → Export → CSV. Upload the file here.',
    signatureHeaders: ['total spin', 'back spin', 'clubhead speed', 'face to path'],
    fileNameHints: ['uneekor', 'refine'],
  },
  {
    id: 'garmin',
    name: 'Garmin Approach R10 / R50',
    category: 'launch_monitor',
    brand: 'garmin',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: BALL_METRICS.concat(['club_speed', 'attack_angle', 'club_path', 'face_angle']),
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'In the Garmin Golf app: open the range session → menu → Export. Upload the file here.',
    signatureHeaders: ['distance carry', 'swing speed', 'launch angle'],
    fileNameHints: ['garmin', 'r10', 'approach'],
  },
  {
    id: 'rapsodo',
    name: 'Rapsodo MLM / MLM2PRO',
    category: 'launch_monitor',
    brand: 'rapsodo',
    supportedMethods: ['file_csv', 'file_xlsx', 'photo_ocr', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: BALL_METRICS.concat(['club_speed', 'club_path', 'face_angle']),
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'In the Rapsodo app: History → select shots → Export CSV (or email the report). Upload the file here.',
    signatureHeaders: ['ball velocity', 'total spin', 'carry distance', 'launch angle'],
    fileNameHints: ['rapsodo', 'mlm'],
  },
  {
    id: 'full_swing',
    name: 'Full Swing KIT',
    category: 'launch_monitor',
    brand: 'full_swing',
    supportedMethods: ['file_csv', 'file_xlsx', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'In the Full Swing app: open the session → Export. Upload the file here.',
    fileNameHints: ['fullswing', 'full_swing', 'kit'],
  },
  // ── Simulators (software that exports its own session data) ──
  {
    id: 'gspro',
    name: 'GSPro (simulator)',
    category: 'simulator',
    brand: 'other',
    supportedMethods: ['file_csv', 'file_json', 'manual_paste'],
    supportedFileTypes: ['.csv', '.json'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    limitations: 'GSPro forwards data from your connected launch monitor — column names match that device. Auto-detect handles both.',
    exportInstructions: 'GSPro relays your launch monitor. Export the session/round data (CSV or its shot log JSON) and upload it here.',
    signatureHeaders: ['gspro'],
    fileNameHints: ['gspro', 'gs_pro'],
  },
  {
    id: 'e6',
    name: 'E6 Connect (simulator)',
    category: 'simulator',
    brand: 'other',
    supportedMethods: ['file_csv', 'file_json', 'manual_paste'],
    supportedFileTypes: ['.csv', '.json'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    limitations: 'E6 forwards data from your connected launch monitor — column names match that device. Auto-detect handles both.',
    exportInstructions: 'In E6 Connect: open the session report and export to CSV. Upload the file here.',
    fileNameHints: ['e6', 'e6connect'],
  },
  {
    id: 'awesome_golf',
    name: 'Awesome Golf (simulator)',
    category: 'simulator',
    brand: 'other',
    supportedMethods: ['file_csv', 'file_json', 'manual_paste'],
    supportedFileTypes: ['.csv', '.json'],
    availableMetrics: BALL_METRICS.concat(['club_speed']),
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'low',
    exportInstructions: 'In Awesome Golf: open the session stats and export/share the data, then upload it here.',
    fileNameHints: ['awesome', 'awesomegolf'],
  },
  {
    id: 'golfzon',
    name: 'GOLFZON',
    category: 'simulator',
    brand: 'golfzon',
    supportedMethods: ['file_csv', 'file_xlsx', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: BALL_METRICS.concat(['club_speed']),
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'low',
    exportInstructions: 'Export your GOLFZON round/practice data to CSV if available, then upload it here.',
    fileNameHints: ['golfzon'],
  },
  // ── Generic / manual ──
  {
    id: 'generic_csv',
    name: 'Other CSV / Spreadsheet',
    category: 'generic',
    brand: 'manual',
    supportedMethods: ['file_csv', 'file_xlsx', 'manual_paste'],
    supportedFileTypes: ['.csv', '.xlsx'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'Upload any CSV or spreadsheet of shot data. SwingVantage will map the columns and let you confirm.',
  },
  {
    id: 'generic_json',
    name: 'Other JSON export',
    category: 'generic',
    brand: 'other',
    supportedMethods: ['file_json'],
    supportedFileTypes: ['.json'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'low',
    limitations: 'Best for an array of shot objects. SwingVantage flattens it to rows and maps the keys.',
    exportInstructions: 'Upload a JSON file containing an array of shots (or an object with a shots/data array).',
  },
  {
    id: 'manual',
    name: 'Manual entry / Other device',
    category: 'manual',
    brand: 'manual',
    supportedMethods: ['manual_paste', 'file_csv'],
    supportedFileTypes: ['.csv'],
    availableMetrics: FULL_METRICS,
    authType: 'none',
    syncStatus: 'file_only',
    confidence: 'medium',
    exportInstructions: 'Map your own columns, or paste rows of data. Use this when your device is not listed.',
  },
];

/** Look up a source by id. */
export function getSource(id: string): DataSource | undefined {
  return DATA_SOURCES.find((s) => s.id === id);
}

/** All sources, optionally filtered by category. */
export function listSources(category?: DataSource['category']): DataSource[] {
  return category ? DATA_SOURCES.filter((s) => s.category === category) : DATA_SOURCES;
}

// ── Auto-detection ────────────────────────────────────────────

/** Lowercase, drop parenthetical units, strip non-alphanumerics. */
function canon(s: string): string {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim();
}

export interface SourceDetection {
  sourceId: string;
  brand: LaunchMonitorBrand;
  /** 0..1 confidence the file came from this source. */
  score: number;
  confidence: SourceConfidence;
}

/**
 * Best-effort guess of which source a file came from, using its header
 * names + filename. Returns null when there is no meaningful signal (the
 * caller should fall back to the universal/manual path). Generic sources
 * are never auto-detected — only branded ones with real signatures.
 */
export function detectSource(headers: string[], fileName = ''): SourceDetection | null {
  const canonHeaders = new Set(headers.map(canon).filter(Boolean));
  const fname = fileName.toLowerCase();

  let best: SourceDetection | null = null;

  for (const source of DATA_SOURCES) {
    if (!source.signatureHeaders && !source.fileNameHints) continue;

    let hits = 0;
    let possible = 0;

    for (const sig of source.signatureHeaders ?? []) {
      possible++;
      if (canonHeaders.has(canon(sig))) hits++;
    }
    // Header-signature score (weighted highest).
    let score = possible > 0 ? hits / possible : 0;

    // Filename hint is a softer, additive signal.
    const nameHit = (source.fileNameHints ?? []).some((h) => fname.includes(h));
    if (nameHit) score = Math.min(1, score + 0.4);

    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = {
        sourceId: source.id,
        brand: source.brand,
        score,
        confidence: score >= 0.6 ? 'high' : score >= 0.3 ? 'medium' : 'low',
      };
    }
  }

  // Require a minimum signal so we don't mis-attribute a generic file.
  return best && best.score >= 0.25 ? best : null;
}
