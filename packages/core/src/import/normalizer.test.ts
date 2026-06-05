// ============================================================
// SwingVantage — Normalizer robustness tests
// ------------------------------------------------------------
// Proves the parser survives REAL-WORLD messy launch-monitor
// exports: preamble/metadata rows, alternate delimiters, a units
// row under the header, appended summary rows, and brand column
// names that only match after canonicalisation. This is the
// regression guard for the "crazy CSV couldn't be deciphered" bug.
// ============================================================

import {
  parseCSV,
  detectColumnMapping,
  normalizeRow,
  getMissingCriticalFields,
} from './normalizer';

describe('parseCSV — messy real-world exports', () => {
  test('skips metadata preamble, detects semicolons, drops units + summary rows', () => {
    const csv = [
      'TrackMan Performance Report',
      'Player: Test Golfer  Date: 2026-06-01',
      'Units: Imperial',
      '',
      'Club;Carry Distance (yds);Ball Speed (mph);Spin Rate (rpm);Attack Angle (deg);Club Path (deg);Face To Path (deg);Dynamic Loft (deg);Swing Direction (deg);Dynamic Lie (deg)',
      ';yds;mph;rpm;deg;deg;deg;deg;deg;deg',
      'Driver;245.3;150.1;2600;2.1;1.2;6.0;12.5;0.8;0.2',
      '7 Iron;165.0;118.0;6800;-4.0;-1.0;0.2;24.0;-0.5;0.1',
      'Average;205.1;134.0;4700;-1.0;0.1;3.1;18.2;0.1;0.1',
    ].join('\n');

    const parsed = parseCSV(csv);

    expect(parsed.delimiter).toBe(';');
    expect(parsed.preamble).toHaveLength(3); // the 3 metadata lines
    expect(parsed.unitsRow).not.toBeNull(); // ;yds;mph;... was skipped
    expect(parsed.droppedSummaryRows).toBe(1); // the Average row
    expect(parsed.rows).toHaveLength(2); // Driver + 7 Iron only
    expect(parsed.headers[0]).toBe('Club');
  });

  test('maps the full TrackMan data-point set including the newly-added fields', () => {
    const csv = [
      'Club;Carry Distance (yds);Ball Speed (mph);Spin Rate (rpm);Attack Angle (deg);Club Path (deg);Face To Path (deg);Dynamic Loft (deg);Swing Direction (deg);Dynamic Lie (deg)',
      'Driver;245.3;150.1;2600;2.1;1.2;6.0;12.5;0.8;0.2',
    ].join('\n');

    const { headers, rows } = parseCSV(csv);
    const mapping = detectColumnMapping(headers, 'trackman');

    expect(getMissingCriticalFields(mapping)).toEqual([]);
    expect(mapping.swing_direction).toBeDefined();
    expect(mapping.dynamic_lie).toBeDefined();
    expect(mapping.dynamic_loft).toBeDefined();

    const shot = normalizeRow(rows[0]!, mapping, 'trackman');
    expect(shot.ball_data.carry_distance).toBeCloseTo(245.3, 1);
    expect(shot.club_data.swing_direction).toBeCloseTo(0.8, 1);
    expect(shot.club_data.lie_angle_dynamic).toBeCloseTo(0.2, 1);
    expect(shot.club_data.dynamic_loft).toBeCloseTo(12.5, 1);
  });

  test('canonical matching tolerates units, underscores, and punctuation', () => {
    const csv = [
      'Club_Name,Carry_Distance(yds),BALL SPEED,Club Speed (mph),Spin Axis',
      'Driver,250,151,113,7.5',
    ].join('\n');

    const { headers } = parseCSV(csv);
    const mapping = detectColumnMapping(headers, 'manual');

    expect(mapping.club).toBe('Club_Name');
    expect(mapping.carry_distance).toBe('Carry_Distance(yds)');
    expect(mapping.ball_speed).toBe('BALL SPEED');
    expect(mapping.club_speed).toBe('Club Speed (mph)');
    expect(mapping.spin_axis).toBe('Spin Axis');
  });

  test('handles tab-delimited files and quoted fields', () => {
    const csv = [
      'Club\tCarry\t"Ball Speed"',
      '"Pitching Wedge"\t135\t102',
    ].join('\n');

    const parsed = parseCSV(csv);
    expect(parsed.delimiter).toBe('\t');
    expect(parsed.rows[0]!['Club']).toBe('Pitching Wedge');
    expect(parsed.rows[0]!['Carry']).toBe('135');
  });

  test('a single-column / unparseable file returns empty rather than throwing', () => {
    expect(parseCSV('').rows).toEqual([]);
    expect(parseCSV('just one line').rows).toEqual([]);
  });
});
