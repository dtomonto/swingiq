// ============================================================
// SwingVantage — Tempo Sync: pure math tests
// ============================================================

import type { TemporalIntelligence } from '@/lib/motion-lab';
import { scoreRhythm, SCORE_TOLERANCE_MS } from '../scoring';
import { tempoTrend, type TempoEntry } from '../storage';
import {
  REFERENCE_FPS,
  FULL_SWING_PRESETS,
  PUTT_PRESET,
  TEMPO_PRESETS,
  getPreset,
  framesToMs,
  presetTiming,
  customTiming,
  scaleTiming,
  beatSchedule,
  tempoVerdict,
  nearestFullSwingPreset,
  syncFromTemporal,
  tempoFromTaps,
  repsPerMinute,
  idealRatioForPreset,
} from '../tempo';

describe('tempo math', () => {
  it('converts frames to ms at the reference fps', () => {
    expect(framesToMs(REFERENCE_FPS)).toBe(1000);
    expect(framesToMs(21)).toBeCloseTo(700, 5);
  });

  it('all full-swing presets hold a 3:1 ratio', () => {
    for (const p of FULL_SWING_PRESETS) {
      expect(presetTiming(p).ratio).toBeCloseTo(3, 5);
      expect(idealRatioForPreset(p)).toBe(3);
    }
  });

  it('the putting preset is 2:1', () => {
    expect(presetTiming(PUTT_PRESET).ratio).toBeCloseTo(2, 5);
    expect(idealRatioForPreset(PUTT_PRESET)).toBe(2);
  });

  it('preset timing splits total into back + down', () => {
    const t = presetTiming(getPreset('tour-21-7'));
    expect(t.backMs).toBeCloseTo(700, 5);
    expect(t.downMs).toBeCloseTo(233.33, 1);
    expect(t.totalMs).toBeCloseTo(t.backMs + t.downMs, 5);
  });

  it('getPreset falls back to a real preset for unknown ids', () => {
    expect(TEMPO_PRESETS).toContain(getPreset('does-not-exist'));
  });
});

describe('customTiming', () => {
  it('produces the requested ratio and total', () => {
    const t = customTiming(1000, 3);
    expect(t.totalMs).toBe(1000);
    expect(t.ratio).toBeCloseTo(3, 5);
    expect(t.backMs).toBeCloseTo(750, 5);
    expect(t.downMs).toBeCloseTo(250, 5);
  });

  it('guards against zero / negative inputs', () => {
    const t = customTiming(0, 0);
    expect(t.totalMs).toBeGreaterThan(0);
    expect(t.ratio).toBeGreaterThan(0);
  });
});

describe('scaleTiming', () => {
  const base = presetTiming(getPreset('tour-21-7'));

  it('preserves the ratio', () => {
    expect(scaleTiming(base, 130).ratio).toBeCloseTo(base.ratio, 5);
    expect(scaleTiming(base, 70).ratio).toBeCloseTo(base.ratio, 5);
  });

  it('faster percentages shorten the swing, slower lengthen it', () => {
    expect(scaleTiming(base, 130).totalMs).toBeLessThan(base.totalMs);
    expect(scaleTiming(base, 70).totalMs).toBeGreaterThan(base.totalMs);
    expect(scaleTiming(base, 100).totalMs).toBeCloseTo(base.totalMs, 5);
  });

  it('clamps out-of-range percentages', () => {
    expect(scaleTiming(base, 500).totalMs).toEqual(scaleTiming(base, 130).totalMs);
    expect(scaleTiming(base, 1).totalMs).toEqual(scaleTiming(base, 70).totalMs);
  });
});

describe('beatSchedule', () => {
  it('emits Set → Top → Strike in order at the right times', () => {
    const t = presetTiming(getPreset('tour-21-7'));
    const beats = beatSchedule(t);
    expect(beats.map((b) => b.kind)).toEqual(['takeaway', 'top', 'impact']);
    expect(beats[0].at).toBe(0);
    expect(beats[1].at).toBeCloseTo(t.backMs, 5);
    expect(beats[2].at).toBeCloseTo(t.totalMs, 5);
    // strictly increasing
    expect(beats[1].at).toBeGreaterThan(beats[0].at);
    expect(beats[2].at).toBeGreaterThan(beats[1].at);
  });
});

describe('tempoVerdict', () => {
  it('flags a rushed downswing below the ideal', () => {
    expect(tempoVerdict(2.0, 3).tone).toBe('rushed');
  });
  it('flags a loose, drifty backswing above the ideal', () => {
    expect(tempoVerdict(4.2, 3).tone).toBe('loose');
  });
  it('passes an on-rhythm tempo near the ideal', () => {
    expect(tempoVerdict(3.0, 3).tone).toBe('smooth');
    expect(tempoVerdict(2.6, 3).tone).toBe('smooth');
  });
});

describe('nearestFullSwingPreset', () => {
  it('matches the closest preset by total duration', () => {
    const tour = presetTiming(getPreset('tour-21-7'));
    expect(nearestFullSwingPreset(tour.totalMs).id).toBe('tour-21-7');
    // very long total → the slowest preset
    expect(nearestFullSwingPreset(5000).id).toBe('smooth-27-9');
    // very short total → the quickest preset
    expect(nearestFullSwingPreset(100).id).toBe('quick-18-6');
  });

  it('never recommends the putting preset for a full swing', () => {
    expect(nearestFullSwingPreset(900).sport).toBe('golf');
  });
});

function temporal(partial: Partial<TemporalIntelligence>): TemporalIntelligence {
  return {
    totalMs: 1000,
    tempoRatio: 3,
    loadDurationMs: 750,
    transitionDurationMs: null,
    accelerationDurationMs: null,
    phaseDurations: [],
    peakSpeedTimePct: null,
    contactWindowStability: null,
    decelerationControl: null,
    rushedTransition: false,
    flags: [],
    summary: '',
    basis: 'estimated',
    confidence: 0.8,
    disclaimer: null,
    ...partial,
  };
}

describe('syncFromTemporal', () => {
  it('returns null when the clip was not timeable', () => {
    expect(syncFromTemporal(temporal({ tempoRatio: null }))).toBeNull();
    expect(syncFromTemporal(temporal({ totalMs: 0 }))).toBeNull();
  });

  it('passes the measured numbers through and derives through-time', () => {
    const r = syncFromTemporal(temporal({ totalMs: 1000, loadDurationMs: 750, tempoRatio: 3 }))!;
    expect(r.measuredRatio).toBe(3);
    expect(r.measuredBackMs).toBe(750);
    expect(r.measuredThroughMs).toBe(250);
    expect(r.idealRatio).toBe(3);
    expect(r.verdict.tone).toBe('smooth');
  });

  it('recommends a full-swing preset matched to the athlete speed', () => {
    const r = syncFromTemporal(temporal({ totalMs: 933, loadDurationMs: 700, tempoRatio: 3 }))!;
    expect(r.recommended.sport).toBe('golf');
    expect(r.recommended.id).toBe('tour-21-7');
  });

  it('calls out a rushed real swing', () => {
    const r = syncFromTemporal(temporal({ tempoRatio: 1.8 }))!;
    expect(r.verdict.tone).toBe('rushed');
  });
});

describe('tempoFromTaps', () => {
  it('measures back/down/ratio from three in-order taps', () => {
    const r = tempoFromTaps(1000, 1750, 2000)!; // 750 back, 250 down
    expect(r.backMs).toBe(750);
    expect(r.downMs).toBe(250);
    expect(r.totalMs).toBe(1000);
    expect(r.ratio).toBeCloseTo(3, 5);
    expect(r.verdict.tone).toBe('smooth');
    expect(r.recommended.sport).toBe('golf');
  });

  it('flags a rushed tapped tempo', () => {
    const r = tempoFromTaps(0, 600, 1000)!; // 600 back, 400 down → 1.5:1
    expect(r.ratio).toBeCloseTo(1.5, 5);
    expect(r.verdict.tone).toBe('rushed');
  });

  it('returns null for out-of-order or degenerate taps', () => {
    expect(tempoFromTaps(1000, 900, 2000)).toBeNull(); // top before set
    expect(tempoFromTaps(0, 500, 500)).toBeNull(); // no downswing
    expect(tempoFromTaps(0, 0, 0)).toBeNull();
  });
});

describe('repsPerMinute', () => {
  it('accounts for the rest gap between reps', () => {
    const t = customTiming(1000, 3);
    expect(repsPerMinute(t, 1000)).toBe(30); // 2s cycle → 30/min
    expect(repsPerMinute(t, 0)).toBe(60);
  });
});

describe('scoreRhythm', () => {
  it('returns null with no taps', () => {
    expect(scoreRhythm([])).toBeNull();
  });

  it('scores dead-on taps as a perfect A', () => {
    const s = scoreRhythm([0, 0, 0])!;
    expect(s.accuracy).toBe(100);
    expect(s.grade).toBe('A');
    expect(s.tendencyMs).toBe(0);
  });

  it('uses absolute error for accuracy but signed mean for tendency', () => {
    const s = scoreRhythm([100, 120, 80])!; // consistently late
    expect(s.tendencyMs).toBeGreaterThan(0);
    expect(s.note).toMatch(/late/i);
    expect(s.accuracy).toBeLessThan(100);
  });

  it('detects an early tendency', () => {
    const s = scoreRhythm([-90, -110, -100])!;
    expect(s.tendencyMs).toBeLessThan(0);
    expect(s.note).toMatch(/early/i);
  });

  it('floors accuracy at zero beyond the tolerance', () => {
    const s = scoreRhythm([SCORE_TOLERANCE_MS * 2, SCORE_TOLERANCE_MS * 2])!;
    expect(s.accuracy).toBe(0);
    expect(s.grade).toBe('D');
  });

  it('reports the worst single error', () => {
    expect(scoreRhythm([10, -200, 30])!.worstErrorMs).toBe(200);
  });
});

function entry(ratio: number, at: number): TempoEntry {
  const total = 1000;
  const downMs = total / (ratio + 1);
  return { id: `e${at}`, at, source: 'tap', totalMs: total, backMs: total - downMs, downMs, ratio };
}

describe('tempoTrend', () => {
  it('returns null on an empty history', () => {
    expect(tempoTrend([])).toBeNull();
  });

  it('reads one entry as n/a direction', () => {
    const t = tempoTrend([entry(2.4, 3)])!;
    expect(t.count).toBe(1);
    expect(t.direction).toBe('n/a');
  });

  it('flags improvement when the latest ratio is nearer the ideal', () => {
    // newest-first: latest 2.9 (close to 3), oldest 1.8 (far)
    const t = tempoTrend([entry(2.9, 3), entry(2.3, 2), entry(1.8, 1)])!;
    expect(t.direction).toBe('improving');
    expect(t.bestRatio).toBe(2.9);
  });

  it('flags drift when the latest ratio is further from the ideal', () => {
    const t = tempoTrend([entry(1.8, 3), entry(2.4, 2), entry(2.9, 1)])!;
    expect(t.direction).toBe('drifting');
  });

  it('reads small changes as steady and averages the ratios', () => {
    const t = tempoTrend([entry(3.0, 3), entry(2.95, 2), entry(3.05, 1)])!;
    expect(t.direction).toBe('steady');
    expect(t.avgRatio).toBeCloseTo(3, 1);
  });
});
