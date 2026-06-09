import {
  parseAnyFile,
  analyzeFile,
  normalizedToShot,
  primaryClubOf,
} from '../process';
import { schemaFingerprint, makeSavedMapping } from '../mapping-memory';
import type { NormalizedShot } from '@swingiq/core';

const CSV = `Club,Carry,Ball Speed,Club Speed,Launch Angle,Spin Rate,Swing Direction,Spin Loft
Driver,260,167,118,12.5,2400,1.2,11
Driver,255,165,117,13.0,2500,0.8,12
7 Iron,165,120,88,18,6500,-1.0,28`;

describe('parseAnyFile', () => {
  it('parses CSV into headers + rows', () => {
    const p = parseAnyFile('range.csv', CSV);
    expect(p).not.toBeNull();
    expect(p!.headers).toContain('Club');
    expect(p!.rows).toHaveLength(3);
    expect(p!.meta.format).toBe('csv');
  });

  it('parses a JSON array of shot objects', () => {
    const p = parseAnyFile('shots.json', JSON.stringify([
      { Club: 'Driver', Carry: 260, 'Ball Speed': 167 },
      { Club: 'Driver', Carry: 255, 'Ball Speed': 165 },
    ]));
    expect(p).not.toBeNull();
    expect(p!.meta.format).toBe('json');
    expect(p!.headers).toEqual(expect.arrayContaining(['Club', 'Carry', 'Ball Speed']));
    expect(p!.rows).toHaveLength(2);
  });

  it('parses a JSON object with a shots array', () => {
    const p = parseAnyFile('export.json', JSON.stringify({ shots: [{ Club: 'PW', Carry: 130 }] }));
    expect(p!.rows).toHaveLength(1);
    expect(p!.rows[0]!.Club).toBe('PW');
  });

  it('returns null for unusable content', () => {
    expect(parseAnyFile('x.csv', 'not really data')).toBeNull();
    expect(parseAnyFile('x.json', '{}')).toBeNull();
  });
});

describe('analyzeFile', () => {
  it('detects source, maps required fields, normalizes shots', () => {
    const a = analyzeFile('trackman_range.csv', CSV);
    expect(a.ok).toBe(true);
    expect(a.detectedSourceId).toBe('trackman');
    expect(a.brand).toBe('trackman');
    expect(a.mapping.club).toBe('Club');
    expect(a.mapping.carry_distance).toBe('Carry');
    expect(a.normalizedShots).toHaveLength(3);
    expect(a.normalizedShots[0]!.ball_data.carry_distance).toBe(260);
    expect(a.reusedSavedMapping).toBe(false);
  });

  it('reuses a remembered mapping for the same layout (no remap)', () => {
    const fp = schemaFingerprint(['Club', 'Carry', 'Ball Speed', 'Club Speed', 'Launch Angle', 'Spin Rate', 'Swing Direction', 'Spin Loft']);
    const saved = makeSavedMapping({
      fingerprint: fp, sourceId: 'trackman',
      mapping: { club: 'Club', carry_distance: 'Carry', ball_speed: 'Ball Speed' },
      headers: [], corrected: true,
    });
    const a = analyzeFile('again.csv', CSV, { lookupSaved: (f) => (f === fp ? saved : undefined) });
    expect(a.reusedSavedMapping).toBe(true);
    expect(a.mapping).toEqual(saved.mapping);
  });

  it('reports an error for an unreadable file', () => {
    const a = analyzeFile('bad.csv', 'garbage');
    expect(a.ok).toBe(false);
    expect(a.error).toBeTruthy();
  });
});

describe('dedupe + helpers', () => {
  it('shotsSignature is stable for the same content, differs otherwise', () => {
    const a = analyzeFile('a.csv', CSV);
    const b = analyzeFile('b.csv', CSV); // same content, different filename
    expect(a.signature).toBe(b.signature);

    const altered = analyzeFile('c.csv', CSV.replace('260', '270'));
    expect(altered.signature).not.toBe(a.signature);
  });

  it('normalizedToShot + primaryClubOf produce a usable session', () => {
    const a = analyzeFile('range.csv', CSV);
    const shots = a.normalizedShots.map((ns: NormalizedShot, i) => normalizedToShot(ns, i));
    expect(shots).toHaveLength(3);
    expect(shots[0]!.club_category).toBe('driver');
    expect(primaryClubOf(shots)).toBe('Driver');
  });
});
