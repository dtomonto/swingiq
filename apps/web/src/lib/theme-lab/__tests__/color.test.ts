import {
  parseHslTriple,
  formatHslTriple,
  hslToHex,
  hexToHsl,
  tripleToHex,
  hexToTriple,
} from '../color';

describe('theme-lab/color', () => {
  it('parses a bare triple and an hsl() wrapper', () => {
    expect(parseHslTriple('142 71% 45%')).toEqual({ h: 142, s: 71, l: 45 });
    expect(parseHslTriple('hsl(142 71% 45%)')).toEqual({ h: 142, s: 71, l: 45 });
    expect(parseHslTriple('  210 20% 98%  ')).toEqual({ h: 210, s: 20, l: 98 });
  });

  it('rejects malformed values', () => {
    expect(parseHslTriple('')).toBeNull();
    expect(parseHslTriple('not a color')).toBeNull();
    expect(parseHslTriple('#22c55e')).toBeNull();
  });

  it('formats a triple back to the token form', () => {
    expect(formatHslTriple({ h: 142, s: 71, l: 45 })).toBe('142 71% 45%');
    expect(formatHslTriple({ h: 142.4, s: 70.6, l: 45.2 })).toBe('142 71% 45%');
  });

  it('normalizes 3-digit hex and strips #', () => {
    expect(hexToHsl('#000')).toEqual({ h: 0, s: 0, l: 0 });
    expect(hexToHsl('fff')).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl('bad')).not.toBeNull(); // 'bad' is valid 3-hex (b,a,d)
    expect(hexToHsl('nothex')).toBeNull();
  });

  it('hsl→hex for known anchors', () => {
    expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000');
    expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff');
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000');
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00');
    expect(hslToHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff');
  });

  it('round-trips hex → triple → hex within rounding tolerance', () => {
    for (const hex of ['#22c55e', '#0b0f0c', '#f6f4ee', '#1e90ff']) {
      const triple = hexToTriple(hex);
      expect(triple).not.toBeNull();
      const back = tripleToHex(triple!);
      // Allow ±2/255 per channel for HSL rounding.
      const close = (a: string, b: string) =>
        [1, 3, 5].every(
          (i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 2,
        );
      expect(close(back!, hex)).toBe(true);
    }
  });

  it('convenience helpers are null-safe', () => {
    expect(tripleToHex('garbage')).toBeNull();
    expect(hexToTriple('garbage')).toBeNull();
  });
});
