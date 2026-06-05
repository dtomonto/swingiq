// ============================================================
// SwingVantage — Image → data extraction tests
// ------------------------------------------------------------
// Proves the pure half of the "photo of your launch monitor" feature
// is bullet-proof: the prompt teaches the right contract, and the
// parser survives the messy JSON real vision models actually return
// (code fences, trailing prose, ragged rows, numeric cells), then maps
// cleanly onto the universal diagnostic schema.
// ============================================================

import {
  buildImageExtractionPrompt,
  buildExtractionRepairPrompt,
  parseExtractedTable,
  summarizeFieldCoverage,
  sourceToBrand,
  tableToRecords,
  IMAGE_EXTRACTION_JSON_CONTRACT,
} from './image-data-extraction';
import { normalizeRow, detectColumnMapping } from './normalizer';

describe('buildImageExtractionPrompt', () => {
  test('embeds the JSON contract, canonical metrics, and the source', () => {
    const { system, userText } = buildImageExtractionPrompt({ source: 'TrackMan', sport: 'golf' });
    expect(system).toContain(IMAGE_EXTRACTION_JSON_CONTRACT);
    expect(system).toContain('Carry Distance');
    expect(system).toContain('never estimate');
    expect(userText).toContain('TrackMan');
  });

  test('repair prompt restates the contract and includes the prior error', () => {
    const { system, userText } = buildExtractionRepairPrompt('{bad', 'Response was not valid JSON.');
    expect(system).toContain(IMAGE_EXTRACTION_JSON_CONTRACT);
    expect(userText).toContain('Response was not valid JSON.');
    expect(userText).toContain('{bad');
  });
});

describe('parseExtractedTable — robustness', () => {
  test('parses a clean single-shot reply', () => {
    const raw = JSON.stringify({
      layout: 'single_shot',
      club: '7 Iron',
      headers: ['Club', 'Carry Distance', 'Ball Speed', 'Spin Rate'],
      rows: [['7 Iron', '172', '118', '6400']],
      confidence: 'high',
      unitsDetected: 'yards / mph',
      warnings: [],
    });
    const res = parseExtractedTable(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.table.layout).toBe('single_shot');
    expect(res.table.club).toBe('7 Iron');
    expect(res.table.headers).toHaveLength(4);
    expect(res.table.rows[0]).toEqual(['7 Iron', '172', '118', '6400']);
    expect(res.table.confidence).toBe('high');
  });

  test('strips ```json code fences and trailing prose', () => {
    const raw =
      'Here is the data you asked for:\n```json\n' +
      '{"headers":["Carry","Ball Speed"],"rows":[["245","152"]],"confidence":"medium"}' +
      '\n```\nLet me know if you need anything else.';
    const res = parseExtractedTable(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.table.headers).toEqual(['Carry', 'Ball Speed']);
    expect(res.table.rows).toEqual([['245', '152']]);
    expect(res.table.confidence).toBe('medium');
  });

  test('rectangularises ragged rows (pads short, truncates long)', () => {
    const raw = JSON.stringify({
      headers: ['Club', 'Carry', 'Ball Speed'],
      rows: [
        ['Driver', '275'], // short -> padded
        ['7 Iron', '172', '118', 'EXTRA'], // long -> truncated
      ],
      confidence: 'low',
    });
    const res = parseExtractedTable(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.table.rows[0]).toEqual(['Driver', '275', '']);
    expect(res.table.rows[1]).toEqual(['7 Iron', '172', '118']);
    // >1 data row and no explicit layout -> inferred "table"
    expect(res.table.layout).toBe('table');
  });

  test('coerces numeric cells to strings and drops fully-empty rows', () => {
    const raw = JSON.stringify({
      headers: ['Carry', 'Spin'],
      rows: [[245, 2400], ['', ''], [null, undefined]],
      confidence: 'high',
    });
    const res = parseExtractedTable(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.table.rows).toEqual([['245', '2400']]);
  });

  test('returns ok:false on non-JSON so the caller can run the repair pass', () => {
    expect(parseExtractedTable('I could not read the image, sorry.').ok).toBe(false);
    expect(parseExtractedTable('{ not valid json ').ok).toBe(false);
    expect(parseExtractedTable(JSON.stringify({ rows: [] })).ok).toBe(false); // missing headers
  });

  test('a no-data reply is a valid soft result (empty headers/rows, low confidence)', () => {
    const raw = JSON.stringify({ headers: [], rows: [], confidence: 'low', warnings: ['too blurry'] });
    const res = parseExtractedTable(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.table.headers).toHaveLength(0);
    expect(res.table.rows).toHaveLength(0);
    expect(res.table.warnings).toContain('too blurry');
  });
});

describe('field coverage + downstream mapping', () => {
  test('recognises canonical headers and flags missing critical fields', () => {
    const cov = summarizeFieldCoverage(
      ['Club', 'Carry Distance', 'Ball Speed', 'Club Speed', 'Spin Rate', 'Launch Angle'],
      'trackman',
    );
    expect(cov.recognizedFields).toEqual(
      expect.arrayContaining(['club', 'carry_distance', 'ball_speed', 'club_speed', 'spin_rate', 'launch_angle']),
    );
    expect(cov.missingCritical).toHaveLength(0); // club + carry both present
  });

  test('reports missing critical fields when carry is absent', () => {
    const cov = summarizeFieldCoverage(['Ball Speed', 'Spin Rate'], 'generic');
    expect(cov.missingCritical).toContain('club');
    expect(cov.missingCritical).toContain('carry_distance');
  });

  test('extracted table -> records -> normalizeRow yields a usable shot', () => {
    const res = parseExtractedTable(
      JSON.stringify({
        layout: 'single_shot',
        headers: ['Club', 'Carry Distance', 'Ball Speed', 'Club Speed', 'Spin Rate', 'Club Path', 'Face Angle'],
        rows: [['7 Iron', '172', '118', '88', '6400', '-2.1', '1.3']],
        confidence: 'high',
      }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const records = tableToRecords(res.table);
    expect(records).toHaveLength(1);
    const mapping = detectColumnMapping(res.table.headers, 'trackman');
    const shot = normalizeRow(records[0]!, mapping, 'trackman');
    expect(shot.club_name).toBe('7 Iron');
    expect(shot.ball_data.carry_distance).toBe(172);
    expect(shot.ball_data.ball_speed).toBe(118);
    expect(shot.club_data.club_speed).toBe(88);
    expect(shot.ball_data.spin_rate).toBe(6400);
    expect(shot.club_data.club_path).toBe(-2.1);
    // smash factor derived from ball/club speed when not supplied
    expect(shot.ball_data.smash_factor).toBeCloseTo(1.34, 1);
  });
});

describe('sourceToBrand', () => {
  test('maps known sources and falls back to manual', () => {
    expect(sourceToBrand('trackman')).toBe('trackman');
    expect(sourceToBrand('flightscope')).toBe('flightscope');
    expect(sourceToBrand('foresight')).toBe('foresight');
    expect(sourceToBrand('blast_motion')).toBe('manual');
    expect(sourceToBrand(undefined)).toBe('manual');
  });
});
