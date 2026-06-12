import { defaultMotionFor, cameraViewFor, captureContextForVideo } from '../sport-motion';
import { getSport } from '@/lib/motion-lab';
import type { SportId, SwingVideoMetadata } from '@swingiq/core';

const ALL_SPORTS: SportId[] = [
  'golf',
  'tennis',
  'pickleball',
  'padel',
  'baseball',
  'softball_slow',
  'softball_fast',
];

const meta = (camera_angle: SwingVideoMetadata['camera_angle']): SwingVideoMetadata => ({
  file_name: 'swing.mp4',
  file_size_bytes: 1,
  mime_type: 'video/mp4',
  duration_seconds: 2,
  width: 1080,
  height: 1920,
  frame_rate_estimated: 30,
  camera_angle,
});

describe('swing-session sport-motion mapping', () => {
  it('returns a motion id the taxonomy actually knows for every sport', () => {
    for (const sport of ALL_SPORTS) {
      const motion = defaultMotionFor(sport);
      const known = getSport(sport).motions.map((m) => m.id);
      expect(known).toContain(motion);
    }
  });

  it('maps the swing-like default per sport', () => {
    expect(defaultMotionFor('golf')).toBe('iron');
    expect(defaultMotionFor('tennis')).toBe('forehand');
    expect(defaultMotionFor('baseball')).toBe('hitting');
  });

  it('passes through known camera views and falls back to unknown', () => {
    expect(cameraViewFor('down_the_line')).toBe('down_the_line');
    expect(cameraViewFor('face_on')).toBe('face_on');
    expect(cameraViewFor('unknown')).toBe('unknown');
    expect(cameraViewFor(null)).toBe('unknown');
    expect(cameraViewFor('something_else')).toBe('unknown');
  });

  it('builds a complete CaptureContext from video metadata', () => {
    const ctx = captureContextForVideo('golf', meta('down_the_line'));
    expect(ctx).toEqual({
      sport: 'golf',
      motionType: 'iron',
      view: 'down_the_line',
      handedness: 'unknown',
    });
  });
});
