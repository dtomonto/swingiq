// ============================================================
// SwingIQ Universal Launch-Monitor Data Normalizer
// Converts CSV rows from any brand into the universal schema.
//
// Built to survive REAL exports, which are messy:
//   • metadata / title rows above the header (TrackMan, FlightScope)
//   • alternate delimiters (comma, semicolon, tab, pipe)
//   • a units row directly under the header ("mph", "yds", "deg")
//   • summary rows (Average / Std Dev / Max) mixed into the data
//   • a UTF-8 BOM, quoted fields, and escaped quotes
//   • brand-specific column names for the SAME data point
//
// The deterministic layer here recognises every documented
// FlightScope and TrackMan parameter. When a file is too unusual to
// auto-map, the import wizard falls back to the AI CSV agent
// (see ai-mapping.ts + /api/agents/csv-map).
// ============================================================

import type { BallData, ClubDeliveryData, StrikeData, LaunchMonitorBrand } from '../types';

// ── Column name maps per brand ────────────────────────────────

type ColumnMap = Record<string, string[]>; // universalField -> possible csv headers

// Comprehensive alias list covering the full documented FlightScope and
// TrackMan parameter sets (plus Foresight/SkyTrak/Garmin/Rapsodo/Uneekor
// common headers). Matching is case-insensitive and also tries a
// canonical form (units in parens + punctuation stripped), so e.g.
// "Carry Distance (yds)", "Carry_Distance" and "carrydistance" all match.
const UNIVERSAL_COLUMN_MAP: ColumnMap = {
  club: ['club', 'club name', 'club_name', 'clubname', 'club type', 'club used'],

  // ── Ball flight ──
  carry_distance: ['carry', 'carry distance', 'carry_distance', 'carry distance (yds)', 'carry (yds)', 'carry_yds', 'carry flat', 'carry flat (yds)', 'carrflat'],
  total_distance: ['total', 'total distance', 'total_distance', 'total distance (yds)', 'total (yds)', 'total_yds', 'total flat'],
  roll_distance: ['roll', 'run', 'roll distance', 'roll distance (yds)', 'roll (yds)'],
  ball_speed: ['ball speed', 'ball_speed', 'ball speed (mph)', 'ballspeed', 'bs (mph)', 'bs', 'ball velocity', 'ball'],
  launch_angle: ['launch angle', 'launch_angle', 'launch angle (deg)', 'la (deg)', 'la', 'vert. launch angle', 'vertical launch angle', 'vert launch', 'launch v', 'vla', 'launch (deg)'],
  launch_direction: ['launch direction', 'launch_direction', 'horiz. launch angle', 'horizontal launch angle', 'horiz launch', 'launch h', 'hla', 'start direction', 'azimuth'],
  spin_rate: ['spin rate', 'spin_rate', 'spin rate (rpm)', 'backspin', 'back spin', 'total spin', 'total spin (rpm)', 'spin', 'back spin (rpm)'],
  spin_axis: ['spin axis', 'spin_axis', 'spin axis (deg)', 'side spin', 'sidespin', 'side spin (rpm)', 'axis'],
  apex_height: ['apex', 'apex height', 'apex_height', 'apex height (ft)', 'max height', 'max height (ft)', 'peak height', 'height', 'height (ft)'],
  descent_angle: ['descent', 'descent angle', 'descent angle (deg)', 'landing angle', 'land angle', 'angle of descent', 'vertical descent angle'],
  smash_factor: ['smash factor', 'smash_factor', 'smash', 'sf'],
  side_carry: ['side', 'side carry', 'side_carry', 'side carry (yds)', 'side (yds)', 'carry side', 'carry side (yds)', 'offline'],
  lateral_offline: ['lateral', 'lateral offline', 'lateral_offline', 'lateral landing', 'side distance (yds)', 'side distance', 'total side', 'side total', 'total side (yds)', 'miss distance'],
  curve: ['curve', 'curve (yds)', 'curve distance'],
  hang_time: ['hang time', 'hang time (s)', 'flight time', 'air time'],

  // ── Club delivery ──
  club_speed: ['club speed', 'club_speed', 'club speed (mph)', 'club head speed', 'clubhead speed', 'chs', 'chs (mph)', 'cs (mph)', 'cs', 'swing speed'],
  attack_angle: ['attack angle', 'attack_angle', 'attack angle (deg)', 'aoa', 'angle of attack'],
  club_path: ['club path', 'club_path', 'club path (deg)', 'path', 'horizontal club path'],
  face_angle: ['face angle', 'face_angle', 'face angle (deg)', 'face to target', 'facetotarget', 'face'],
  face_to_path: ['face to path', 'face_to_path', 'face-to-path', 'face to path (deg)', 'facepath', 'ftp', 'f2p'],
  dynamic_loft: ['dynamic loft', 'dynamic_loft', 'dynamic loft (deg)', 'dyn loft', 'dl'],
  spin_loft: ['spin loft', 'spin_loft', 'spin loft (deg)', 'sl'],
  swing_plane_vertical: ['swing plane', 'vertical swing plane', 'swing plane (deg)', 'vertical plane', 'plane'],
  swing_plane_horizontal: ['horizontal swing plane', 'swing plane h', 'horizontal plane'],
  swing_direction: ['swing direction', 'swing direction (deg)'],
  closure_rate: ['closure rate', 'face closure rate', 'closure rate (deg/s)', 'face rotation rate'],
  dynamic_lie: ['dynamic lie', 'dyn lie', 'dynamic lie (deg)', 'lie', 'lie angle'],
  low_point: ['low point', 'low_point', 'low point (in)', 'low point distance', 'low point pos', 'lp'],

  // ── Strike ──
  impact_location_lateral: ['impact offset', 'impact x', 'impact_location_lateral', 'impact location (x)', 'horizontal impact', 'impact horizontal', 'strike location x', 'impactx'],
  impact_location_vertical: ['impact height', 'impact y', 'impact_location_vertical', 'impact location (y)', 'vertical impact', 'impact vertical', 'strike location y', 'impacty'],
};

// ── Brand-specific overrides (exact export header names) ──────

const BRAND_COLUMN_OVERRIDES: Partial<Record<LaunchMonitorBrand, ColumnMap>> = {
  flightscope: {
    spin_axis: ['Spin Axis', 'Axis', 'Side Spin'],
    low_point: ['Low Point Pos', 'Low Point (in)'],
    club_path: ['Club Path', 'In-to-Out'],
    swing_plane_vertical: ['Vertical Swing Plane'],
    swing_plane_horizontal: ['Horizontal Swing Plane'],
    closure_rate: ['Closure Rate'],
    dynamic_lie: ['Dynamic Lie'],
    descent_angle: ['Vertical Descent Angle', 'Angle of Descent'],
    lateral_offline: ['Lateral Landing', 'Side Distance (yds)'],
    hang_time: ['Flight Time'],
  },
  trackman: {
    carry_distance: ['Carry', 'Carry Distance', 'Carry Flat'],
    club_path: ['Club Path'],
    swing_direction: ['Swing Direction'],
    swing_plane_vertical: ['Swing Plane'],
    face_angle: ['Face Angle'],
    face_to_path: ['Face To Path'],
    attack_angle: ['Attack Angle'],
    spin_loft: ['Spin Loft'],
    dynamic_loft: ['Dynamic Loft'],
    dynamic_lie: ['Dynamic Lie'],
    lateral_offline: ['Side', 'Side Total', 'Total Side'],
    side_carry: ['Carry Side'],
    descent_angle: ['Landing Angle'],
    apex_height: ['Height', 'Max Height'],
    hang_time: ['Hang Time'],
    low_point: ['Low Point'],
    impact_location_lateral: ['Impact Offset'],
    impact_location_vertical: ['Impact Height'],
  },
  foresight: {
    spin_rate: ['Back Spin', 'Backspin (rpm)', 'Spin (rpm)'],
    spin_axis: ['Side Spin (rpm)', 'Side Spin'],
    carry_distance: ['Carry Dist (yds)', 'Carry Distance (yds)'],
    lateral_offline: ['Side Dist (yds)'],
    club_speed: ['Club Speed (mph)'],
  },
  garmin: {
    carry_distance: ['Carry (yds)', 'Distance Carry'],
    club_speed: ['Club Speed (mph)', 'Swing Speed'],
    launch_angle: ['Launch Angle (deg)'],
  },
  skytrak: {
    spin_rate: ['Back Spin', 'Spin Rate (rpm)'],
    spin_axis: ['Side Spin'],
    carry_distance: ['Carry Distance'],
  },
  rapsodo: {
    carry_distance: ['Carry Distance', 'Carry (yds)'],
    ball_speed: ['Ball Speed', 'Ball Velocity'],
    spin_rate: ['Total Spin', 'Spin Rate'],
  },
  uneekor: {
    spin_rate: ['Total Spin', 'Back Spin'],
    spin_axis: ['Side Spin'],
    club_speed: ['Club Speed', 'Clubhead Speed'],
    face_to_path: ['Face To Path'],
  },
};

// ── Canonicalisation (fuzzy header matching) ──────────────────

/** Lowercase, drop parenthetical units, strip non-alphanumerics. */
function canonicalize(header: string): string {
  return header
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // remove "(yds)", "(mph)", "(deg)"…
    .replace(/[^a-z0-9]/g, '') // strip spaces, underscores, punctuation
    .trim();
}

// ── Column Detection ──────────────────────────────────────────

export function detectColumnMapping(
  headers: string[],
  brand: LaunchMonitorBrand = 'manual',
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const brandOverrides = BRAND_COLUMN_OVERRIDES[brand] ?? {};

  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  const canonHeaders = headers.map((h) => canonicalize(h));
  const used = new Set<number>(); // don't map two fields to the same column

  for (const [universalField, candidates] of Object.entries(UNIVERSAL_COLUMN_MAP)) {
    const allCandidates = [...(brandOverrides[universalField] ?? []), ...candidates];

    let matchedIdx = -1;

    // Pass 1: exact (case-insensitive) header match — most precise.
    for (const candidate of allCandidates) {
      const idx = lowerHeaders.indexOf(candidate.toLowerCase().trim());
      if (idx !== -1 && !used.has(idx)) {
        matchedIdx = idx;
        break;
      }
    }

    // Pass 2: canonical match — tolerates units/punctuation/spacing.
    if (matchedIdx === -1) {
      for (const candidate of allCandidates) {
        const canon = canonicalize(candidate);
        if (!canon) continue;
        const idx = canonHeaders.indexOf(canon);
        if (idx !== -1 && !used.has(idx)) {
          matchedIdx = idx;
          break;
        }
      }
    }

    if (matchedIdx !== -1) {
      mapping[universalField] = headers[matchedIdx]!;
      used.add(matchedIdx);
    }
  }

  return mapping;
}

export function getMissingCriticalFields(mapping: Record<string, string>): string[] {
  const critical = ['club', 'carry_distance'];
  return critical.filter((f) => !mapping[f]);
}

export function getMissingRecommendedFields(mapping: Record<string, string>): string[] {
  const recommended = [
    'ball_speed', 'club_speed', 'launch_angle', 'spin_rate',
    'face_to_path', 'club_path', 'attack_angle', 'dynamic_loft',
    'smash_factor',
  ];
  return recommended.filter((f) => !mapping[f]);
}

// ── Row Normalization ─────────────────────────────────────────

function parseNum(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  if (t === '' || t === '--' || t === '-' || t === 'N/A' || t === 'n/a' || t === '—') return null;
  // Keep a leading sign and decimal point; strip units/commas/degree marks.
  const cleaned = t.replace(/,/g, '').replace(/[^0-9.+-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export interface NormalizedShot {
  club_name: string;
  ball_data: BallData;
  club_data: ClubDeliveryData;
  strike_data: StrikeData;
  raw: Record<string, string>;
}

export function normalizeRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  brand: LaunchMonitorBrand = 'manual',
): NormalizedShot {
  const get = (field: string): string | undefined => {
    const col = mapping[field];
    return col ? row[col] : undefined;
  };

  // Unit conversions
  let carry = parseNum(get('carry_distance'));
  let total = parseNum(get('total_distance'));
  const ballSpeed = parseNum(get('ball_speed'));
  const clubSpeed = parseNum(get('club_speed'));

  // Foresight sometimes exports in meters
  if (brand === 'foresight') {
    // Detect if values look like meters (< 100 for carry is suspicious)
    if (carry !== null && carry < 80 && carry > 5) carry = Math.round(carry * 1.09361);
    if (total !== null && total < 90 && total > 5) total = Math.round(total * 1.09361);
  }

  const ball_data: BallData = {
    carry_distance: carry,
    total_distance: total,
    roll_distance: parseNum(get('roll_distance')),
    ball_speed: ballSpeed,
    launch_angle_vertical: parseNum(get('launch_angle')),
    launch_direction_horizontal: parseNum(get('launch_direction')),
    spin_rate: parseNum(get('spin_rate')),
    spin_axis: parseNum(get('spin_axis')),
    apex_height: parseNum(get('apex_height')),
    descent_angle: parseNum(get('descent_angle')),
    side_carry: parseNum(get('side_carry')),
    lateral_offline: parseNum(get('lateral_offline')) ?? parseNum(get('side_carry')),
    curve: parseNum(get('curve')),
    flight_time: parseNum(get('hang_time')),
    shot_shape: null,
    smash_factor: parseNum(get('smash_factor')) ??
      (ballSpeed !== null && clubSpeed !== null && clubSpeed > 0
        ? Math.round((ballSpeed / clubSpeed) * 100) / 100
        : null),
  };

  const club_data: ClubDeliveryData = {
    club_speed: clubSpeed,
    attack_angle: parseNum(get('attack_angle')),
    club_path: parseNum(get('club_path')),
    face_angle_to_target: parseNum(get('face_angle')),
    face_to_path: parseNum(get('face_to_path')),
    dynamic_loft: parseNum(get('dynamic_loft')),
    spin_loft: parseNum(get('spin_loft')),
    swing_plane_horizontal: parseNum(get('swing_plane_horizontal')),
    swing_plane_vertical: parseNum(get('swing_plane_vertical')),
    low_point_position: parseNum(get('low_point')),
    low_point_height: null,
    closure_rate: parseNum(get('closure_rate')),
    swing_direction: parseNum(get('swing_direction')),
    lie_angle_dynamic: parseNum(get('dynamic_lie')),
  };

  const strike_data: StrikeData = {
    impact_location_lateral: parseNum(get('impact_location_lateral')),
    impact_location_vertical: parseNum(get('impact_location_vertical')),
  };

  return {
    club_name: get('club') ?? 'Unknown',
    ball_data,
    club_data,
    strike_data,
    raw: row,
  };
}

// ── CSV Parser ────────────────────────────────────────────────

const DELIMITERS = [',', ';', '\t', '|'];

/** Split a single CSV line honouring quotes and "" escapes. */
function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; // escaped quote ("")
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/** Pick the delimiter that yields the most consistent multi-column split. */
function detectDelimiter(lines: string[]): string {
  const sample = lines.slice(0, 12);
  let best = ',';
  let bestScore = -1;
  for (const d of DELIMITERS) {
    const counts = sample.map((l) => splitLine(l, d).length);
    const freq: Record<number, number> = {};
    counts.forEach((c) => { freq[c] = (freq[c] ?? 0) + 1; });
    // Best repeating column-count that is > 1 column.
    let modeCount = 1;
    let modeFreq = 0;
    for (const [c, f] of Object.entries(freq)) {
      const cn = Number(c);
      if (cn > 1 && (f > modeFreq || (f === modeFreq && cn > modeCount))) {
        modeCount = cn;
        modeFreq = f;
      }
    }
    const score = modeFreq * modeCount;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

// Tokens that strongly indicate a real header row (built from the alias map).
const HEADER_TOKENS: Set<string> = (() => {
  const set = new Set<string>();
  for (const candidates of Object.values(UNIVERSAL_COLUMN_MAP)) {
    for (const c of candidates) {
      const canon = canonicalize(c);
      if (canon.length >= 2) set.add(canon);
    }
  }
  // common bare words too
  ['club', 'carry', 'total', 'ball', 'speed', 'spin', 'launch', 'angle', 'side', 'smash', 'face', 'path', 'loft', 'apex', 'height', 'shot', 'date', 'time', 'distance'].forEach((w) => set.add(w));
  return set;
})();

function isNumericCell(v: string): boolean {
  const t = v.trim();
  if (t === '') return false;
  return /^[+-]?\$?\d[\d,]*\.?\d*\s*(mph|yds?|deg|rpm|ft|m|s|°|%)?$/i.test(t);
}

/** Score a row on how header-like it is (0..1+). */
function headerScore(cells: string[]): number {
  if (cells.length < 2) return 0;
  let known = 0;
  let nonEmpty = 0;
  let numeric = 0;
  for (const cell of cells) {
    const t = cell.trim();
    if (t === '') continue;
    nonEmpty++;
    if (isNumericCell(t)) numeric++;
    if (HEADER_TOKENS.has(canonicalize(t))) known++;
  }
  if (nonEmpty === 0) return 0;
  const knownFrac = known / nonEmpty;
  const textFrac = 1 - numeric / nonEmpty;
  // Reward recognised tokens heavily, plus mostly-textual rows.
  return knownFrac * 2 + textFrac * 0.5;
}

const UNIT_WORDS = new Set(['mph', 'yds', 'yd', 'yard', 'yards', 'deg', 'degrees', '°', 'rpm', 'ft', 'feet', 'm', 'meters', 's', 'sec', 'mps', 'km/h', 'kmh', 'in', 'inches', '%']);

/** True when a row looks like a units row (mostly unit words / empty). */
function looksLikeUnitsRow(cells: string[]): boolean {
  let nonEmpty = 0;
  let unitish = 0;
  for (const cell of cells) {
    const t = cell.trim().toLowerCase();
    if (t === '') continue;
    nonEmpty++;
    if (UNIT_WORDS.has(t) || /^[a-z°%/]{1,5}$/i.test(t)) unitish++;
  }
  return nonEmpty > 0 && unitish / nonEmpty >= 0.6;
}

const SUMMARY_LABELS = new Set(['average', 'avg', 'mean', 'std dev', 'stdev', 'std', 'standard deviation', 'max', 'maximum', 'min', 'minimum', 'total', 'totals', 'summary', 'median', 'sum']);

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  /** Detected field delimiter. */
  delimiter: string;
  /** Index (in the raw non-empty line list) of the chosen header row. */
  headerRowIndex: number;
  /** Raw lines that appeared before the header (metadata/title rows). */
  preamble: string[];
  /** The skipped units row, if one was detected. */
  unitsRow: string[] | null;
  /** Count of summary rows (Average/Std Dev/…) dropped from the data. */
  droppedSummaryRows: number;
}

/**
 * Parse messy launch-monitor CSV/TSV text into headers + row records.
 * Backward compatible: callers may destructure `{ headers, rows }`.
 */
export function parseCSV(csvText: string): ParsedCsv {
  const empty: ParsedCsv = {
    headers: [], rows: [], delimiter: ',', headerRowIndex: 0,
    preamble: [], unitsRow: null, droppedSummaryRows: 0,
  };
  if (!csvText) return empty;

  // Strip BOM + normalise newlines, keep only non-empty lines.
  const text = csvText.replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return empty;

  const delimiter = detectDelimiter(lines);

  // Find the header row: the most header-like line within the first 15.
  const scanLimit = Math.min(lines.length, 15);
  let headerRowIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < scanLimit; i++) {
    const cells = splitLine(lines[i]!, delimiter);
    const score = headerScore(cells);
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }
  // If nothing looked like a header, assume the first line is one.
  if (bestScore <= 0) headerRowIndex = 0;

  const preamble = lines.slice(0, headerRowIndex);
  const headers = splitLine(lines[headerRowIndex]!, delimiter);

  // Optional units row immediately under the header.
  let dataStart = headerRowIndex + 1;
  let unitsRow: string[] | null = null;
  if (dataStart < lines.length) {
    const maybeUnits = splitLine(lines[dataStart]!, delimiter);
    if (looksLikeUnitsRow(maybeUnits)) {
      unitsRow = maybeUnits;
      dataStart++;
    }
  }

  const rows: Record<string, string>[] = [];
  let droppedSummaryRows = 0;

  for (let i = dataStart; i < lines.length; i++) {
    const values = splitLine(lines[i]!, delimiter);
    if (values.every((v) => v === '')) continue;

    // Drop summary rows (Average / Std Dev / Max …) that brands append.
    const firstCell = (values[0] ?? '').trim().toLowerCase();
    if (SUMMARY_LABELS.has(firstCell)) {
      droppedSummaryRows++;
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, delimiter, headerRowIndex, preamble, unitsRow, droppedSummaryRows };
}

export function getMissingFieldMessage(missingFields: string[]): string {
  if (missingFields.length === 0) return '';
  const fieldLabels: Record<string, string> = {
    club_path: 'Club Path',
    face_to_path: 'Face-to-Path',
    attack_angle: 'Attack Angle',
    dynamic_loft: 'Dynamic Loft',
    smash_factor: 'Smash Factor',
    spin_rate: 'Spin Rate',
    ball_speed: 'Ball Speed',
    club_speed: 'Club Speed',
    launch_angle: 'Launch Angle',
  };
  const labels = missingFields.map((f) => fieldLabels[f] ?? f);
  return `This file does not include: ${labels.join(', ')}. ` +
    `The app can still analyze distance, launch, and dispersion, ` +
    `but some diagnostic rules require the missing data to run.`;
}
