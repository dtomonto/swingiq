import { RecordAssistAnalytics, scoreBand } from '../engines/analytics-engine';
import type { RecordAssistAnalyticsEvent } from '../types';

describe('AnalyticsInstrumentationEngine', () => {
  it('bands scores honestly', () => {
    expect(scoreBand(10)).toBe('not_usable');
    expect(scoreBand(50)).toBe('needs_adjustment');
    expect(scoreBand(80)).toBe('usable');
    expect(scoreBand(95)).toBe('excellent');
  });

  it('emits the documented events through the injected sink', () => {
    const calls: Array<{ event: RecordAssistAnalyticsEvent; props?: Record<string, unknown> }> = [];
    const a = new RecordAssistAnalytics((event, props) => calls.push({ event, props }));

    a.started('golf', 'driver');
    a.permission(true);
    a.permission(false);
    a.athleteDetection(true, 'golf');
    a.readinessChanged(88, 'golf');
    a.readinessPassed(88, 'golf');
    a.recordingStarted('golf', 'driver', 88);
    a.recordingCompleted('golf', 'driver', 4.2);
    a.retakeRecommended(['feet_cut', 'low_light']);
    a.angleSelected('golf', 'driver', 'down_the_line');

    const names = calls.map((c) => c.event);
    expect(names).toEqual([
      'record_assist_started',
      'camera_permission_granted',
      'camera_permission_denied',
      'athlete_detected',
      'readiness_score_changed',
      'readiness_score_passed',
      'recording_started',
      'recording_completed',
      'retake_recommended',
      'angle_preset_selected',
    ]);
  });

  it('passes banded (non-private) props', () => {
    const calls: Array<{ event: string; props?: Record<string, unknown> }> = [];
    const a = new RecordAssistAnalytics((event, props) => calls.push({ event, props }));
    a.readinessChanged(80, 'tennis');
    expect(calls[0].props).toEqual({ band: 'usable', sport: 'tennis' });
  });

  it('never throws even if the sink throws', () => {
    const a = new RecordAssistAnalytics(() => {
      throw new Error('boom');
    });
    expect(() => a.started('golf', 'iron')).not.toThrow();
  });

  it('joins retake reason codes', () => {
    const calls: Array<{ props?: Record<string, unknown> }> = [];
    const a = new RecordAssistAnalytics((_e, props) => calls.push({ props }));
    a.retakeRecommended(['a', 'b', 'c']);
    expect(calls[0].props?.reasons).toBe('a,b,c');
  });
});
