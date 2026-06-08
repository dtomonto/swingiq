import {
  schemaFingerprint,
  mappingConfidence,
  makeSavedMapping,
  mergeSavedMapping,
  sameMapping,
} from '../mapping-memory';

describe('schemaFingerprint', () => {
  it('is stable regardless of column order, case, units, punctuation', () => {
    const a = schemaFingerprint(['Club', 'Carry (yds)', 'Ball Speed (mph)']);
    const b = schemaFingerprint(['ball_speed', 'CLUB', 'carry']);
    expect(a).toBe(b);
  });

  it('differs when the column set differs', () => {
    const a = schemaFingerprint(['Club', 'Carry']);
    const b = schemaFingerprint(['Club', 'Carry', 'Spin Rate']);
    expect(a).not.toBe(b);
  });

  it('encodes the column count', () => {
    expect(schemaFingerprint(['Club', 'Carry'])).toMatch(/^2-/);
    expect(schemaFingerprint([])).toBe('empty');
  });
});

describe('mappingConfidence', () => {
  it('is low when a required field is missing', () => {
    expect(mappingConfidence({ carry_distance: 'Carry' })).toBe('low'); // no club
    expect(mappingConfidence({ club: 'Club' })).toBe('low'); // no carry
  });

  it('is high when required + most recommended are mapped', () => {
    expect(
      mappingConfidence({
        club: 'Club', carry_distance: 'Carry', ball_speed: 'BS', club_speed: 'CS',
        launch_angle: 'LA', spin_rate: 'Spin', face_to_path: 'F2P', club_path: 'Path',
      }),
    ).toBe('high');
  });

  it('is medium when required mapped but few recommended', () => {
    expect(mappingConfidence({ club: 'Club', carry_distance: 'Carry' })).toBe('medium');
  });
});

describe('SavedMapping helpers', () => {
  it('makeSavedMapping starts at useCount 0', () => {
    const m = makeSavedMapping({
      fingerprint: 'fp', sourceId: 'trackman',
      mapping: { club: 'Club' }, headers: ['Club'], now: '2026-01-01T00:00:00Z',
    });
    expect(m.useCount).toBe(0);
    expect(m.corrected).toBe(false);
    expect(m.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('mergeSavedMapping bumps useCount, preserves createdAt, keeps corrected sticky', () => {
    const base = makeSavedMapping({
      fingerprint: 'fp', sourceId: 'trackman', mapping: { club: 'Club' },
      headers: ['Club'], corrected: true, now: '2026-01-01T00:00:00Z',
    });
    const merged = mergeSavedMapping(base, {
      mapping: { club: 'Club', carry_distance: 'Carry' },
      headers: ['Club', 'Carry'], corrected: false, now: '2026-02-01T00:00:00Z',
    });
    expect(merged.useCount).toBe(1);
    expect(merged.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(merged.updatedAt).toBe('2026-02-01T00:00:00Z');
    expect(merged.corrected).toBe(true); // sticky
    expect(merged.mapping.carry_distance).toBe('Carry');
  });

  it('sameMapping ignores empty values and order', () => {
    expect(sameMapping({ club: 'C', carry_distance: 'Y' }, { carry_distance: 'Y', club: 'C' })).toBe(true);
    expect(sameMapping({ club: 'C', spin_rate: '' }, { club: 'C' })).toBe(true);
    expect(sameMapping({ club: 'C' }, { club: 'D' })).toBe(false);
  });
});
