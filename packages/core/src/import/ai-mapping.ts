// ============================================================
// SwingVantage — AI CSV Mapping Agent (framework-agnostic core)
// ------------------------------------------------------------
// When a launch-monitor export is too unusual for the
// deterministic detector (odd header names, a new brand, a
// hand-built spreadsheet), the AI CSV agent reads the headers
// plus a few sample rows and infers which column is which
// universal field.
//
// This module is pure + testable: it builds the prompt and
// strictly parses/validates the model's JSON. The actual API
// call lives in the web app's /api/agents/csv-map route so the
// provider key stays server-side. Output is always validated
// against the real headers + known field keys, so a hallucinated
// column can never enter the pipeline.
// ============================================================

/** A universal field the normalizer understands. `key` must match the
 *  mapping keys read by normalizeRow(). */
export interface CsvMappingField {
  key: string;
  label: string;
  /** Plain hint so the model knows what the data point means. */
  hint: string;
}

export const UNIVERSAL_FIELDS: CsvMappingField[] = [
  { key: 'club', label: 'Club / shot label', hint: 'the club or shot name, e.g. Driver, 7 Iron, PW' },
  { key: 'carry_distance', label: 'Carry distance', hint: 'how far the ball flew in the air (yards)' },
  { key: 'total_distance', label: 'Total distance', hint: 'carry plus roll (yards)' },
  { key: 'roll_distance', label: 'Roll / run', hint: 'distance the ball rolled after landing (yards)' },
  { key: 'ball_speed', label: 'Ball speed', hint: 'ball speed off the face (mph)' },
  { key: 'club_speed', label: 'Club / club-head speed', hint: 'club-head speed at impact (mph)' },
  { key: 'smash_factor', label: 'Smash factor', hint: 'ball speed divided by club speed (~1.0-1.5)' },
  { key: 'launch_angle', label: 'Launch angle (vertical)', hint: 'vertical launch angle of the ball (degrees)' },
  { key: 'launch_direction', label: 'Launch direction (horizontal)', hint: 'horizontal start direction (degrees, +right)' },
  { key: 'spin_rate', label: 'Spin rate', hint: 'total/back spin (rpm)' },
  { key: 'spin_axis', label: 'Spin axis / side spin', hint: 'tilt of the spin axis (degrees, +right)' },
  { key: 'apex_height', label: 'Apex / max height', hint: 'peak height of the shot (feet)' },
  { key: 'descent_angle', label: 'Descent / landing angle', hint: 'angle the ball lands at (degrees)' },
  { key: 'curve', label: 'Curve', hint: 'sideways curve of the ball flight (yards)' },
  { key: 'hang_time', label: 'Hang / flight time', hint: 'seconds the ball was in the air' },
  { key: 'side_carry', label: 'Side carry (offline at carry)', hint: 'left/right offline at the carry point (yards, +right)' },
  { key: 'lateral_offline', label: 'Total offline / side', hint: 'final left/right offline distance (yards, +right)' },
  { key: 'attack_angle', label: 'Attack angle', hint: 'angle of attack into the ball (degrees, +up)' },
  { key: 'club_path', label: 'Club path', hint: 'horizontal club path (degrees, +in-to-out)' },
  { key: 'face_angle', label: 'Face angle (to target)', hint: 'club face angle relative to target (degrees, +open/right)' },
  { key: 'face_to_path', label: 'Face to path', hint: 'face angle relative to the path (degrees)' },
  { key: 'dynamic_loft', label: 'Dynamic loft', hint: 'effective loft delivered at impact (degrees)' },
  { key: 'spin_loft', label: 'Spin loft', hint: 'angle between attack angle and dynamic loft (degrees)' },
  { key: 'swing_plane_vertical', label: 'Swing plane (vertical)', hint: 'vertical swing plane / plane angle (degrees)' },
  { key: 'swing_plane_horizontal', label: 'Swing plane (horizontal)', hint: 'horizontal swing plane (degrees)' },
  { key: 'swing_direction', label: 'Swing direction', hint: 'TrackMan swing direction (degrees)' },
  { key: 'closure_rate', label: 'Face closure rate', hint: 'rate the face is closing through impact (deg/s)' },
  { key: 'dynamic_lie', label: 'Dynamic lie', hint: 'lie angle delivered at impact (degrees)' },
  { key: 'low_point', label: 'Low point', hint: 'low point distance relative to the ball (inches)' },
  { key: 'impact_location_lateral', label: 'Impact location (toe/heel)', hint: 'horizontal strike location on the face' },
  { key: 'impact_location_vertical', label: 'Impact location (high/low)', hint: 'vertical strike location on the face' },
];

const VALID_KEYS = new Set(UNIVERSAL_FIELDS.map((f) => f.key));

export interface CsvMappingRequest {
  headers: string[];
  /** A handful of data rows, each aligned to `headers`. */
  sampleRows: string[][];
}

export const CSV_MAPPING_SYSTEM_PROMPT =
  `You are a data-mapping assistant for SwingVantage, a launch-monitor analysis app. ` +
  `You are given the column headers and a few sample rows from a golf launch-monitor CSV export ` +
  `(it may be from FlightScope, TrackMan, Foresight, SkyTrak, Garmin, Rapsodo, Uneekor, or a custom sheet). ` +
  `Map each column to SwingVantage's universal field key when there is a clear match.\n\n` +
  `RULES YOU MUST FOLLOW:\n` +
  `1. Output ONLY a single JSON object: {"mapping": {"<universal_field_key>": "<exact_column_header>"}, "notes": "<one short sentence>"}.\n` +
  `2. Use ONLY the universal field keys provided. Use each header at most once. Omit fields you cannot confidently map.\n` +
  `3. The header value MUST be copied EXACTLY from the provided headers list — never invent a header.\n` +
  `4. Use the sample values to disambiguate (e.g. ~1.0-1.5 is smash factor; thousands are spin rpm; a club name like "Driver" is the club column).\n` +
  `5. No prose, no markdown fences — return raw JSON only.`;

/** Build the user message describing the file for the model. */
export function buildCsvMappingUserMessage(req: CsvMappingRequest): string {
  const fieldList = UNIVERSAL_FIELDS.map((f) => `- ${f.key}: ${f.hint}`).join('\n');
  const headerLine = req.headers.map((h, i) => `[${i}] ${h}`).join('\n');
  const sample = req.sampleRows
    .slice(0, 8)
    .map((r, i) => `Row ${i + 1}: ${req.headers.map((h, c) => `${h}=${r[c] ?? ''}`).join(' | ')}`)
    .join('\n');

  return (
    `UNIVERSAL FIELD KEYS:\n${fieldList}\n\n` +
    `CSV HEADERS (${req.headers.length}):\n${headerLine}\n\n` +
    `SAMPLE ROWS:\n${sample}\n\n` +
    `Return the JSON mapping now.`
  );
}

/**
 * Strictly parse the model's response into a validated mapping.
 * Drops any key not in UNIVERSAL_FIELDS and any value that is not an
 * actual header. Guarantees no column is used twice.
 */
export function parseCsvMappingResponse(
  text: string,
  headers: string[],
): Record<string, string> {
  const headerSet = new Set(headers);
  const out: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  // Pull the first {...} JSON object out of the response (tolerate fences/prose).
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return out;

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return out;
  }

  const mappingObj =
    parsed && typeof parsed === 'object' && 'mapping' in (parsed as Record<string, unknown>)
      ? (parsed as { mapping?: unknown }).mapping
      : parsed;

  if (!mappingObj || typeof mappingObj !== 'object') return out;

  for (const [key, value] of Object.entries(mappingObj as Record<string, unknown>)) {
    if (!VALID_KEYS.has(key)) continue;
    if (typeof value !== 'string') continue;
    if (!headerSet.has(value)) continue; // never trust a hallucinated header
    if (usedHeaders.has(value)) continue; // one column → one field
    out[key] = value;
    usedHeaders.add(value);
  }

  return out;
}
