// ============================================================
// SwingIQ — AI CSV mapping: response validation
// ------------------------------------------------------------
// The model's output is never trusted directly. These tests
// pin the guarantees: only known field keys, only real headers,
// one column per field, and tolerance of fenced/prose responses.
// ============================================================

import {
  parseCsvMappingResponse,
  buildCsvMappingUserMessage,
  UNIVERSAL_FIELDS,
} from './ai-mapping';

const HEADERS = ['Club', 'Carry yds', 'BS', 'Spin', 'AoA'];

describe('parseCsvMappingResponse', () => {
  test('keeps valid field→header pairs', () => {
    const text = JSON.stringify({
      mapping: { club: 'Club', carry_distance: 'Carry yds', ball_speed: 'BS', spin_rate: 'Spin', attack_angle: 'AoA' },
      notes: 'looks like a custom sheet',
    });
    expect(parseCsvMappingResponse(text, HEADERS)).toEqual({
      club: 'Club',
      carry_distance: 'Carry yds',
      ball_speed: 'BS',
      spin_rate: 'Spin',
      attack_angle: 'AoA',
    });
  });

  test('drops unknown field keys and hallucinated headers', () => {
    const text = JSON.stringify({
      mapping: {
        club: 'Club',
        not_a_real_field: 'Carry yds', // unknown key → dropped
        carry_distance: 'Total Distance', // header not in file → dropped
      },
    });
    expect(parseCsvMappingResponse(text, HEADERS)).toEqual({ club: 'Club' });
  });

  test('never maps two fields to the same column', () => {
    const text = JSON.stringify({
      mapping: { carry_distance: 'Carry yds', total_distance: 'Carry yds' },
    });
    const result = parseCsvMappingResponse(text, HEADERS);
    expect(Object.values(result)).toEqual(['Carry yds']);
    expect(result.carry_distance).toBe('Carry yds');
    expect(result.total_distance).toBeUndefined();
  });

  test('tolerates markdown fences / surrounding prose', () => {
    const text = 'Here is the mapping:\n```json\n{ "mapping": { "club": "Club" } }\n```\nDone.';
    expect(parseCsvMappingResponse(text, HEADERS)).toEqual({ club: 'Club' });
  });

  test('returns empty object on unparseable output', () => {
    expect(parseCsvMappingResponse('I could not determine the mapping.', HEADERS)).toEqual({});
    expect(parseCsvMappingResponse('', HEADERS)).toEqual({});
  });
});

describe('buildCsvMappingUserMessage', () => {
  test('includes headers, sample values, and the universal field keys', () => {
    const msg = buildCsvMappingUserMessage({
      headers: HEADERS,
      sampleRows: [['Driver', '250', '151', '2600', '2.1']],
    });
    expect(msg).toContain('Club');
    expect(msg).toContain('Driver');
    expect(msg).toContain('carry_distance');
    // every universal key is offered to the model
    for (const f of UNIVERSAL_FIELDS) expect(msg).toContain(f.key);
  });
});
