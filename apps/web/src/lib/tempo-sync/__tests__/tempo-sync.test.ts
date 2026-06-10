// ============================================================
// SwingVantage — Tempo Sync: pure math tests
// ============================================================

import type { TemporalIntelligence } from '@/lib/motion-lab';
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

describe('repsPerMinute', () => {
  it('accounts for the rest gap between reps', () => {
    const t = customTiming(1000, 3);
    expect(repsPerMinute(t, 1000)).toBe(30); // 2s cycle → 30/min
    expect(repsPerMinute(t, 0)).toBe(60);
  });
});
