// ============================================================
// SwingVantage — RecordAssist: AnalyticsInstrumentationEngine
// ------------------------------------------------------------
// A thin, typed instrumentation layer for the guided-recording funnel.
// It takes an injected `emit` sink so this module stays pure and unit-
// testable WITHOUT importing the app's analytics (which pulls in
// @swingiq/core). The hook wiring passes the real `track`.
//
// Privacy: props carry ONLY non-private capture metadata (sport, action,
// score band, reason codes) — never the video, landmarks, or biometrics.
// ============================================================

import type { RecordAssistAnalyticsEvent } from '../types';

export type AnalyticsProps = Record<string, string | number | boolean | null>;
export type EmitFn = (event: RecordAssistAnalyticsEvent, props?: AnalyticsProps) => void;

/** Bucket a 0–100 readiness score into an honest, low-cardinality band. */
export function scoreBand(score: number): string {
  if (score <= 39) return 'not_usable';
  if (score <= 69) return 'needs_adjustment';
  if (score <= 84) return 'usable';
  return 'excellent';
}

export class RecordAssistAnalytics {
  constructor(private emit: EmitFn) {}

  private send(event: RecordAssistAnalyticsEvent, props?: AnalyticsProps): void {
    try {
      this.emit(event, props);
    } catch {
      // Never let instrumentation break the capture flow.
    }
  }

  started(sport: string, action: string): void {
    this.send('record_assist_started', { sport, action });
  }

  permission(granted: boolean): void {
    this.send(granted ? 'camera_permission_granted' : 'camera_permission_denied', {});
  }

  athleteDetection(detected: boolean, sport: string): void {
    this.send(detected ? 'athlete_detected' : 'athlete_not_detected', { sport });
  }

  voicePlayed(messageId: string, category: string): void {
    this.send('voice_guidance_played', { message_id: messageId, category });
  }

  readinessChanged(score: number, sport: string): void {
    this.send('readiness_score_changed', { band: scoreBand(score), sport });
  }

  readinessPassed(score: number, sport: string): void {
    this.send('readiness_score_passed', { band: scoreBand(score), sport });
  }

  recordingStarted(sport: string, action: string, readiness: number): void {
    this.send('recording_started', { sport, action, band: scoreBand(readiness) });
  }

  recordingCompleted(sport: string, action: string, durationSeconds: number): void {
    this.send('recording_completed', { sport, action, duration_s: Math.round(durationSeconds) });
  }

  autoTrimApplied(beforeSeconds: number, afterSeconds: number): void {
    this.send('auto_trim_applied', {
      before_s: Math.round(beforeSeconds),
      after_s: Math.round(afterSeconds),
    });
  }

  retakeRecommended(reasonIds: string[]): void {
    this.send('retake_recommended', { reasons: reasonIds.join(',') });
  }

  retakeAccepted(): void {
    this.send('retake_accepted', {});
  }

  retakeSkipped(): void {
    this.send('retake_skipped', {});
  }

  analysisStarted(sport: string): void {
    this.send('analysis_started_after_guided_recording', { sport });
  }

  analysisFailedQuality(sport: string): void {
    this.send('analysis_failed_due_to_video_quality', { sport });
  }

  sportSelected(sport: string): void {
    this.send('sport_preset_selected', { sport });
  }

  angleSelected(sport: string, action: string, view: string): void {
    this.send('angle_preset_selected', { sport, action, view });
  }

  muteEnabled(): void {
    this.send('mute_voice_enabled', {});
  }

  captionsEnabled(): void {
    this.send('accessibility_caption_enabled', {});
  }

  unsupportedBrowser(reason: string): void {
    this.send('unsupported_browser_detected', { reason });
  }

  compatibilityWarning(tier: string): void {
    this.send('device_compatibility_warning_shown', { tier });
  }

  savedAnglePreset(sport: string, action: string): void {
    this.send('saved_angle_preset_created', { sport, action });
  }

  retestSameAngle(sport: string, action: string): void {
    this.send('retest_same_angle_started', { sport, action });
  }
}
