// Theme contrast auditor — pure tests.
// Verifies the WCAG colour math against known reference values and that
// the auditor flags an unreadable (white-on-white) theme.

import {
  parseColor,
  contrastRatio,
  gradeRatio,
  auditSwatches,
  auditThemes,
  type SwatchSet,
  type ThemeLike,
} from '../accessibility/contrast';

describe('parseColor', () => {
  it('parses hsl and hex', () => {
    expect(parseColor('hsl(0 0% 100%)')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('hsl(0 0% 0%)')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('returns null for garbage', () => {
    expect(parseColor('not-a-color')).toBeNull();
  });
});

describe('contrastRatio (known WCAG values)', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('hsl(0 0% 0%)', 'hsl(0 0% 100%)')).toBe(21);
  });
  it('white on white is 1:1', () => {
    expect(contrastRatio('#fff', '#ffffff')).toBe(1);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#000', '#fff')).toBe(contrastRatio('#fff', '#000'));
  });
});

describe('gradeRatio', () => {
  it('grades to WCAG bands', () => {
    expect(gradeRatio(21)).toBe('AAA');
    expect(gradeRatio(5)).toBe('AA');
    expect(gradeRatio(3.2)).toBe('AA-large');
    expect(gradeRatio(1.5)).toBe('fail');
  });
});

describe('auditSwatches', () => {
  const good: SwatchSet = {
    bg: 'hsl(0 0% 98%)', surface: 'hsl(0 0% 100%)', text: 'hsl(222 22% 14%)',
    primary: 'hsl(142 64% 30%)', accent: 'hsl(188 72% 32%)',
  };
  const bad: SwatchSet = {
    bg: 'hsl(0 0% 100%)', surface: 'hsl(0 0% 100%)', text: 'hsl(0 0% 96%)', // near-white text on white
    primary: 'hsl(0 0% 95%)', accent: 'hsl(0 0% 94%)',
  };

  it('passes a readable theme', () => {
    const a = auditSwatches({ id: 'good', name: 'Good', category: 'light' }, good);
    expect(a.fails).toBe(0);
    expect(a.pairs.find((p) => p.label === 'Body text on page')!.passes).toBe(true);
  });

  it('flags an unreadable (white-on-white) theme', () => {
    const a = auditSwatches({ id: 'bad', name: 'Bad', category: 'light' }, bad);
    expect(a.fails).toBeGreaterThan(0);
    expect(a.worstRatio).toBeLessThan(4.5);
    expect(a.pairs.find((p) => p.label === 'Body text on card')!.grade).toBe('fail');
  });
});

describe('auditThemes', () => {
  const themes: ThemeLike[] = [
    { id: 'a', name: 'A', category: 'light', swatches: { bg: 'hsl(0 0% 98%)', surface: '#fff', text: '#111', primary: 'hsl(142 64% 30%)', accent: 'hsl(188 72% 32%)' } },
    { id: 'b', name: 'B', category: 'light', swatches: { bg: '#fff', surface: '#fff', text: '#f4f4f4', primary: '#eee', accent: '#eee' } },
  ];
  it('rolls up failing themes and pairs', () => {
    const r = auditThemes(themes);
    expect(r.stats.themes).toBe(2);
    expect(r.stats.failingThemes).toBe(1);
    expect(r.stats.failingPairs).toBeGreaterThan(0);
    expect(r.stats.pairsChecked).toBe(8); // 4 pairs x 2 themes
  });
});
