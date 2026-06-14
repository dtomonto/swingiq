// Unit tests for the pure (DOM-free) frame-selection helpers.
import {
  frameDifference,
  motionProfile,
  findSwingWindow,
  selectFrameIndices,
  grayStats,
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

describe('grayStats', () => {
  const W = 4;
  const H = 4;

  test('uniform mid-gray -> mid brightness, zero contrast, zero sharpness', () => {
    const flat = new Array(W * H).fill(128);
    const s = grayStats(flat, W, H);
    expect(s.brightness).toBeCloseTo(128 / 255, 2);
    expect(s.contrast).toBe(0);
    expect(s.sharpness).toBe(0);
  });

  test('black vs white buffers bracket brightness', () => {
    const black = grayStats(new Array(W * H).fill(0), W, H);
    const white = grayStats(new Array(W * H).fill(255), W, H);
    expect(black.brightness).toBe(0);
    expect(white.brightness).toBe(1);
  });

  test('a checkerboard reads as high contrast and high sharpness', () => {
    const checker = Array.from({ length: W * H }, (_, i) => {
      const x = i % W;
      const y = Math.floor(i / W);
      return (x + y) % 2 === 0 ? 0 : 255;
    });
    const s = grayStats(checker, W, H);
    expect(s.contrast).toBeGreaterThan(0.8);
    expect(s.sharpness).toBeGreaterThan(0.8);
  });

  test('a soft gradient is far less sharp than a checkerboard', () => {
    const gradient = Array.from({ length: W * H }, (_, i) => Math.round(((i % W) / (W - 1)) * 60) + 90);
    const soft = grayStats(gradient, W, H);
    const checker = grayStats(
      Array.from({ length: W * H }, (_, i) => ((i % W) + Math.floor(i / W)) % 2 === 0 ? 0 : 255),
      W,
      H,
    );
    expect(soft.sharpness).toBeLessThan(checker.sharpness);
  });

  test('empty buffer is safe', () => {
    expect(grayStats([], 0, 0)).toEqual({ brightness: 0, contrast: 0, sharpness: 0 });
  });
});
