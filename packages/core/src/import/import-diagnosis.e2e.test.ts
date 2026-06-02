// ============================================================
// SwingIQ — End-to-End: CSV import → diagnosis
// ------------------------------------------------------------
// Exercises the REAL pipeline a user hits when importing launch-monitor
// data: raw CSV text → parseCSV → detectColumnMapping → normalizeRow →
// assemble Shot[] → runDiagnosticEngine. No mocks of the normalizer or
// engine — only the thin Shot-assembly glue the app also performs.
// ============================================================

import {
  parseCSV,
  detectColumnMapping,
  normalizeRow,
  getMissingCriticalFields,
  type NormalizedShot,
} from './normalizer';
import { runDiagnosticEngine, buildSessionInsight } from '../diagnostic/engine';
import type { Shot, ClubCategory } from '../types';

// ── Helpers ───────────────────────────────────────────────────

/** Build a FlightScope-style CSV from row objects. */
function buildCsv(rows: Record<string, string | number>[]): string {
  const headers = [
    'Club',
    'Carry',
    'Ball Speed',
    'Spin Rate',
    'Spin Axis',
    'Face To Path',
    'Club Path',
    'Attack Angle',
    'Smash Factor',
    'Side Distance (yds)',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => String(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

/** Map a NormalizedShot into a full Shot (the same glue the import wizard does). */
function toShot(n: NormalizedShot, i: number, clubCategory: ClubCategory): Shot {
  return {
    id: `shot-${i}`,
    session_id: 's1',
    user_id: 'u1',
    club_id: null,
    club_name: n.club_name,
    club_category: clubCategory,
    shot_number: i + 1,
    date_time: new Date().toISOString(),
    swing_type: 'full',
    intended_shot_shape: null,
    actual_shot_shape: null,
    is_outlier: false,
    user_notes: '',
    ball_data: n.ball_data,
    club_data: n.club_data,
    strike_data: n.strike_data,
    created_at: new Date().toISOString(),
  };
}

/** Run the full CSV → Shot[] pipeline. */
function importCsvToShots(csv: string, clubCategory: ClubCategory): Shot[] {
  const { headers, rows } = parseCSV(csv);
  const mapping = detectColumnMapping(headers, 'flightscope');
  // Sanity: a real launch-monitor export must map the critical fields.
  expect(getMissingCriticalFields(mapping)).toEqual([]);
  return rows.map((row, i) => toShot(normalizeRow(row, mapping, 'flightscope'), i, clubCategory));
}

// Deterministic pseudo-random so the test is stable but not flat.
function seeded(i: number): number {
  return (Math.sin(i * 12.9898) + 1) / 2; // 0..1
}

// ── Tests ─────────────────────────────────────────────────────

describe('CSV import → diagnosis (e2e)', () => {
  test('a slice-pattern driver export is diagnosed as an open-face / slice', () => {
    const rows = Array.from({ length: 15 }, (_, i) => {
      const jitter = seeded(i);
      return {
        Club: 'Driver',
        Carry: (245 + jitter * 8).toFixed(1),
        'Ball Speed': (150 + jitter * 4).toFixed(1),
        'Spin Rate': (2600 + jitter * 200).toFixed(0),
        'Spin Axis': (8 + jitter * 4).toFixed(1), // > 8 → slice axis
        'Face To Path': (6 + jitter * 1.2).toFixed(2), // > 6 → strong open face
        'Club Path': (1 + jitter).toFixed(2),
        'Attack Angle': (2 + jitter).toFixed(2),
        'Smash Factor': (1.48 + jitter * 0.02).toFixed(3),
        'Side Distance (yds)': (22 + jitter * 8).toFixed(1), // > 15 right
      };
    });

    const shots = importCsvToShots(buildCsv(rows), 'driver');
    expect(shots).toHaveLength(15);

    const result = runDiagnosticEngine(shots, 'driver', 's1', 'u1');
    expect(result.primary).not.toBeNull();
    expect(result.primary?.rule.id).toBe('slice_weak_fade');
    expect(result.primary?.confidence).toBeGreaterThanOrEqual(40);

    const insight = buildSessionInsight(result);
    expect(insight.what_do_i_do_next).toBeTruthy();
    expect(insight.primary_diagnosis?.rule.id).toBe('slice_weak_fade');
  });

  test('a clean, well-struck iron export raises no critical diagnosis', () => {
    const rows = Array.from({ length: 15 }, (_, i) => {
      const jitter = seeded(i + 100);
      return {
        Club: '7 Iron',
        Carry: (165 + jitter * 6).toFixed(1),
        'Ball Speed': (118 + jitter * 3).toFixed(1),
        'Spin Rate': (6800 + jitter * 400).toFixed(0),
        'Spin Axis': (jitter - 0.5).toFixed(1), // ~0
        'Face To Path': (jitter - 0.5).toFixed(2), // ~0
        'Club Path': (-1 + jitter).toFixed(2),
        'Attack Angle': (-4 + jitter).toFixed(2),
        'Smash Factor': (1.37 + jitter * 0.02).toFixed(3),
        'Side Distance (yds)': (jitter * 4 - 2).toFixed(1), // small miss
      };
    });

    const shots = importCsvToShots(buildCsv(rows), 'mid_iron');
    const result = runDiagnosticEngine(shots, 'mid_iron', 's1', 'u1');
    const critical = result.diagnoses.filter((d) => d.rule.priority === 'critical');
    expect(critical).toHaveLength(0);
  });

  test('the normalizer maps real-world brand headers to the universal schema', () => {
    const { headers } = parseCSV(buildCsv([{ Club: 'Driver', Carry: '250' }]));
    const mapping = detectColumnMapping(headers, 'flightscope');
    expect(mapping.club).toBeDefined();
    expect(mapping.carry_distance).toBeDefined();
    expect(mapping.face_to_path).toBeDefined();
    expect(mapping.spin_axis).toBeDefined();
  });
});
