// Tests for the PURE WebGL-walk math (no three.js needed). Guards the
// floor-plan → world mapping and camera poses that the 3D walk relies on.

import { LAB_STATIONS, type StationAccent } from '@/content/swinglab';
import { STATION_LAYOUT } from '../labLayout';
import { RECOMMENDED_PATH } from '../labLayout';
import {
  ACCENT_HEX,
  EYE_HEIGHT,
  LAB_FLOOR_HALF,
  PANEL_HEIGHT,
  VIEW_DISTANCE,
  clamp,
  easeInOutCubic,
  hexToCss,
  journeyWorldPath,
  stationToWorld,
  viewingPose,
} from '../labScene3d';

describe('stationToWorld', () => {
  it('maps the floor-plan centre to the world origin', () => {
    expect(stationToWorld({ left: 50, top: 50 })).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('maps the corners to the floor half-extent', () => {
    expect(stationToWorld({ left: 100, top: 50 }).x).toBeCloseTo(LAB_FLOOR_HALF);
    expect(stationToWorld({ left: 0, top: 50 }).x).toBeCloseTo(-LAB_FLOOR_HALF);
    expect(stationToWorld({ left: 50, top: 100 }).z).toBeCloseTo(LAB_FLOOR_HALF);
    expect(stationToWorld({ left: 50, top: 0 }).z).toBeCloseTo(-LAB_FLOOR_HALF);
  });

  it('keeps y on the floor', () => {
    expect(stationToWorld({ left: 27, top: 62 }).y).toBe(0);
  });
});

describe('viewingPose', () => {
  it('stands VIEW_DISTANCE in front (+z) of the kiosk at eye height, looking at the screen', () => {
    const pos = { x: 2, y: 0, z: -1 };
    const { eye, target } = viewingPose(pos);
    expect(eye).toEqual({ x: 2, y: EYE_HEIGHT, z: -1 + VIEW_DISTANCE });
    expect(target).toEqual({ x: 2, y: PANEL_HEIGHT, z: -1 });
  });

  it('keeps a constant horizontal standing distance for every station', () => {
    for (const s of LAB_STATIONS) {
      const place = STATION_LAYOUT[s.id];
      expect(place).toBeDefined();
      const world = stationToWorld(place);
      const { eye, target } = viewingPose(world);
      const horizontal = Math.hypot(eye.x - target.x, eye.z - target.z);
      expect(horizontal).toBeCloseTo(VIEW_DISTANCE);
      expect(Number.isFinite(eye.x) && Number.isFinite(eye.z)).toBe(true);
    }
  });
});

describe('journeyWorldPath', () => {
  it('maps the recommended path to one floor point per known station', () => {
    const pts = journeyWorldPath(RECOMMENDED_PATH, STATION_LAYOUT, 0.06);
    expect(pts).toHaveLength(RECOMMENDED_PATH.length);
    for (const p of pts) {
      expect(p.y).toBe(0.06);
      expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
    }
  });

  it('skips ids that are not in the layout', () => {
    const pts = journeyWorldPath(['entry-atrium', 'not-a-real-station'], STATION_LAYOUT);
    expect(pts).toHaveLength(1);
  });
});

describe('ACCENT_HEX', () => {
  it('has a finite color for every accent used by the stations', () => {
    for (const s of LAB_STATIONS) {
      const hex = ACCENT_HEX[s.accent as StationAccent];
      expect(typeof hex).toBe('number');
      expect(hex).toBeGreaterThanOrEqual(0);
      expect(hex).toBeLessThanOrEqual(0xffffff);
    }
  });

  it('renders to a 6-digit css hex string', () => {
    expect(hexToCss(0x34d399)).toBe('#34d399');
    expect(hexToCss(0x000000)).toBe('#000000');
    expect(hexToCss(0xffffff)).toBe('#ffffff');
  });
});

describe('easing + clamp', () => {
  it('easeInOutCubic pins the endpoints and midpoint', () => {
    expect(easeInOutCubic(0)).toBeCloseTo(0);
    expect(easeInOutCubic(1)).toBeCloseTo(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('clamp bounds values', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.3, 0, 1)).toBe(0.3);
  });
});
