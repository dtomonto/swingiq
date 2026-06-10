import { detectMotionWindow, detectMotionWindowSeconds, type MotionSample } from '../engines/auto-trim-engine';

/** Build samples: quiet → burst of motion → quiet. */
function clip(): MotionSample[] {
  const s: MotionSample[] = [];
  for (let t = 0; t <= 4000; t += 100) {
    // Motion burst between 1500ms and 2500ms.
    const energy = t >= 1500 && t <= 2500 ? 1 : 0.02;
    s.push({ tMs: t, energy });
  }
  return s;
}

describe('AutoTrimEngine', () => {
  it('returns null with too few samples', () => {
    expect(detectMotionWindow([{ tMs: 0, energy: 1 }], 1000)).toBeNull();
  });

  it('returns null when there is no motion', () => {
    const flat: MotionSample[] = Array.from({ length: 20 }, (_, i) => ({ tMs: i * 100, energy: 0 }));
    expect(detectMotionWindow(flat, 2000)).toBeNull();
  });

  it('finds the active window around the motion burst (with padding)', () => {
    const w = detectMotionWindow(clip(), 4000, { paddingMs: 300 });
    expect(w).not.toBeNull();
    // Burst 1500–2500, padded by 300 → ~1200–2800.
    expect(w!.startMs).toBeGreaterThanOrEqual(1100);
    expect(w!.startMs).toBeLessThanOrEqual(1300);
    expect(w!.endMs).toBeGreaterThanOrEqual(2700);
    expect(w!.endMs).toBeLessThanOrEqual(2900);
  });

  it('returns null when motion already spans the whole clip', () => {
    const all: MotionSample[] = Array.from({ length: 20 }, (_, i) => ({ tMs: i * 100, energy: 1 }));
    expect(detectMotionWindow(all, 1900, { paddingMs: 300 })).toBeNull();
  });

  it('enforces a minimum window for a single spike', () => {
    const s: MotionSample[] = Array.from({ length: 40 }, (_, i) => ({
      tMs: i * 100,
      energy: i === 20 ? 1 : 0.01,
    }));
    const w = detectMotionWindow(s, 4000, { minWindowMs: 800, paddingMs: 0 });
    expect(w).not.toBeNull();
    expect(w!.endMs - w!.startMs).toBeGreaterThanOrEqual(800);
  });

  it('exposes a seconds helper', () => {
    const w = detectMotionWindowSeconds(clip(), 4000);
    expect(w).not.toBeNull();
    expect(w!.start).toBeGreaterThan(1);
    expect(w!.end).toBeLessThan(3);
  });
});
