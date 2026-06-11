// SportChip token mapping — the one bit of logic worth locking down:
// a SportId must resolve to the matching `--sport-<id>` CSS variable that
// actually exists in globals.css (underscores become dashes).

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { sportAccentVar } from '../sport-accent';
import type { SportId } from '@swingiq/core';

const SPORTS: SportId[] = [
  'golf',
  'tennis',
  'baseball',
  'softball_slow',
  'softball_fast',
  'pickleball',
  'padel',
];

describe('sportAccentVar', () => {
  it('maps underscores to dashes', () => {
    expect(sportAccentVar('golf')).toBe('--sport-golf');
    expect(sportAccentVar('softball_slow')).toBe('--sport-softball-slow');
    expect(sportAccentVar('softball_fast')).toBe('--sport-softball-fast');
  });

  it('every sport resolves to a token defined in globals.css', () => {
    const css = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf8');
    for (const sport of SPORTS) {
      const v = sportAccentVar(sport);
      // both the accent and its AA-paired foreground must exist
      expect(css.includes(`${v}:`)).toBe(true);
      expect(css.includes(`${v}-foreground:`)).toBe(true);
    }
  });
});
