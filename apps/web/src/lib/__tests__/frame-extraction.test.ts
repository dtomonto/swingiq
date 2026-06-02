// Unit tests for the pure (DOM-free) frame-selection helpers.
import {
  frameDifference,
  motionProfile,
  findSwingWindow,
  selectFrameIndices,
} from '../frame-extraction';

describe('frameDifference', () => {
  test('identical signatures -> 0', () => {
    expect(frameDifference([10, 20, 30], [10, 20, 30])).toBe(0);
  });
  test('max contrast -> 1', () => {
    expect(frameDifference([0, 0], [255, 255])).toBeCloseTo(1, 5);
  });
});

describe('motionProfile', () => {
  test('first entry is 0 and spikes track change', () => {
    const sigs = [
      [0, 0],
      [0, 0],
      [255, 255],
      [255, 255],
    ];
    const m = motionProfile(sigs);
    expect(m[0]).toBe(0);
    expect(m[1]).toBeCloseTo(0, 5);
    expect(m[2]).toBeCloseTo(1, 5);
    expect(m[3]).toBeCloseTo(0, 5);
  });
});

describe('findSwingWindow', () => {
  test('locates a clear motion peak with padding', () => {
    const motion = [0, 0.01, 0.02, 0.5, 0.6, 0.55, 0.05, 0.01, 0, 0.01];
    const w = findSwingWindow(motion);
    expect(w).not.toBeNull();
    // Peak at idx 3-5; padded one each side.
    expect(w!.start).toBeLessThanOrEqual(3);
    expect(w!.end).toBeGreaterThanOrEqual(5);
    expect(w!.start).toBeGreaterThanOrEqual(0);
    expect(w!.end).toBeLessThanOrEqual(9);
  });

  test('returns null for a static clip (no motion)', () => {
    expect(findSwingWindow([0, 0, 0, 0, 0, 0])).toBeNull();
  });

  test('returns null for uniformly busy footage (no clear peak)', () => {
    expect(findSwingWindow([0.5, 0.5, 0.5, 0.5, 0.5, 0.5])).toBeNull();
  });
});

describe('selectFrameIndices', () => {
  test('returns all indices when count >= n', () => {
    expect(selectFrameIndices(5, 6, null)).toEqual([0, 1, 2, 3, 4]);
  });

  test('even sampling when there is no window', () => {
    const idx = selectFrameIndices(10, 6, null);
    expect(idx).toHaveLength(6);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(9);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx); // sorted, unique
  });

  test('concentrates inside the swing window but keeps setup + finish', () => {
    const idx = selectFrameIndices(10, 6, { start: 2, end: 6 });
    expect(idx).toContain(0); // setup
    expect(idx).toContain(9); // finish
    // Majority of the remaining picks fall inside [2,6].
    const inWindow = idx.filter((i) => i >= 2 && i <= 6).length;
    expect(inWindow).toBeGreaterThanOrEqual(3);
    expect(new Set(idx).size).toBe(idx.length); // unique
    expect(idx.length).toBeLessThanOrEqual(6);
  });
});
