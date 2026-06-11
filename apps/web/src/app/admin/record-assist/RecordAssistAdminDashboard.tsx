'use client';

// ============================================================
// RecordAssist admin console (client). Drives the REAL engines so the
// QA simulator and catalogs always reflect shipping behavior.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { isFlagEnabled, useFeatureFlags } from '@/lib/admin/stores/feature-flags';
import {
  actionsForSport,
  getPreset,
  allPresets,
  RECORD_ASSIST_SPORTS,
} from '@/lib/record-assist/engines/sport-preset-engine';
import { DEFAULT_WEIGHTS } from '@/lib/record-assist/engines/readiness-score-engine';
import { evaluateFrameQuality } from '@/lib/record-assist/engines/frame-quality-engine';
import { computeReadiness } from '@/lib/record-assist/engines/readiness-score-engine';
import { selectGuidance } from '@/lib/record-assist/engines/voice-guidance-engine';
import { evaluateRetake } from '@/lib/record-assist/engines/retake-engine';
import { SCENARIOS, buildScenarioFrame, buildScenarioSwingTrack, type ScenarioId } from '@/lib/record-assist/sim';
import { analyzeRecording } from '@/lib/record-assist/biomechanics';
import { RECORD_ASSIST_SPORT_META } from '@/lib/record-assist/sports';
import type { RecordAssistSport, CameraOrientation } from '@/lib/record-assist/types';

const INSTRUMENTED_EVENTS = [
  'record_assist_started', 'camera_permission_granted', 'camera_permission_denied',
  'athlete_detected', 'voice_guidance_played', 'readiness_score_changed',
  'readiness_score_passed', 'recording_started', 'recording_completed',
  'retake_recommended', 'retake_accepted', 'retake_skipped',
  'analysis_started_after_guided_recording', 'sport_preset_selected',
  'angle_preset_selected', 'saved_angle_preset_created', 'retest_same_angle_started',
  'motion_insights_computed', 'frame_step_used', 'clip_comparison_viewed',
  'camera_shake_proxy_enabled',
];

const STATE_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  excellent: 'success', usable: 'success', needs_adjustment: 'warning', not_usable: 'danger',
};

export function RecordAssistAdminDashboard() {
  const enabled = useSyncExternalStore(
    (cb) => useFeatureFlags.subscribe(cb),
    () => isFlagEnabled('record_assist.enabled'),
    () => true,
  );

  const [sport, setSport] = useState<RecordAssistSport>('golf');
  const [action, setAction] = useState(() => actionsForSport('golf')[0]?.action ?? '');
  const [scenario, setScenario] = useState<ScenarioId>('ideal');
  const [orientation, setOrientation] = useState<CameraOrientation>('landscape');

  const actions = actionsForSport(sport);
  const preset = getPreset(sport, action);

  const sim = useMemo(() => {
    if (!preset) return null;
    const frame = buildScenarioFrame(scenario, orientation);
    const quality = evaluateFrameQuality(frame, preset);
    const readiness = computeReadiness(quality, preset);
    const voice = selectGuidance(quality, readiness, preset);
    const retake = evaluateRetake({
      quality,
      readiness: readiness.score,
      detectionRate: quality.personDetected ? 0.9 : 0.1,
      durationSeconds: 4,
    });
    return { quality, readiness, voice, retake };
  }, [preset, scenario, orientation]);

  // Phase 3: run the REAL biomechanics bridge on a synthetic swing track.
  const insights = useMemo(() => {
    if (!preset) return null;
    return analyzeRecording(buildScenarioSwingTrack(), preset)?.insights ?? null;
  }, [preset]);

  return (
    <div className="space-y-6">
      {/* Status */}
      <SectionCard title="Status" description="The kill-switch lives in Feature Flags; this reflects the effective state on this device.">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={enabled ? 'success' : 'danger'}>
            {enabled ? 'RecordAssist is ON' : 'RecordAssist is OFF'}
          </StatusBadge>
          <Link href="/admin/feature-flags" className="text-sm text-link hover:underline">
            Manage in Feature Flags →
          </Link>
          <Link href="/record-assist" className="text-sm text-link hover:underline">
            Open the live experience →
          </Link>
        </div>
      </SectionCard>

      {/* Readiness model */}
      <SectionCard title="Frame Readiness model" description="Component weights (sum to 100) and the state thresholds the score maps to.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => (
                  <tr key={k} className="border-b border-border">
                    <td className="py-1.5 capitalize text-foreground">{k.replace(/_/g, ' ')}</td>
                    <td className="py-1.5 text-right font-mono text-foreground">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-1.5 text-sm text-foreground">
            <li><span className="font-mono text-error-text">0–39</span> · Not usable</li>
            <li><span className="font-mono text-link">40–69</span> · Needs adjustment</li>
            <li><span className="font-mono text-success-text">70–84</span> · Usable</li>
            <li><span className="font-mono text-success-text">85–100</span> · Excellent</li>
            <li className="pt-2 text-xs text-muted-foreground">
              Per-sport presets can nudge these weights (renormalized back to 100). Recording is never
              blocked — low scores warn but allow proceed.
            </li>
          </ul>
        </div>
      </SectionCard>

      {/* QA simulator */}
      <SectionCard
        title="QA simulator"
        description="Runs the real engines against a synthetic frame for each documented state — no camera required."
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Sport">
            <select
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
              value={sport}
              onChange={(e) => {
                const s = e.target.value as RecordAssistSport;
                setSport(s);
                setAction(actionsForSport(s)[0]?.action ?? '');
              }}
            >
              {RECORD_ASSIST_SPORTS.map((s) => (
                <option key={s} value={s}>{RECORD_ASSIST_SPORT_META[s].name}</option>
              ))}
            </select>
          </Field>
          <Field label="Action">
            <select className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none" value={action} onChange={(e) => setAction(e.target.value)}>
              {actions.map((a) => (
                <option key={a.action} value={a.action}>{a.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Scenario">
            <select className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none" value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId)}>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Orientation">
            <select className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none" value={orientation} onChange={(e) => setOrientation(e.target.value as CameraOrientation)}>
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
          </Field>
        </div>

        {sim && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Readiness</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{sim.readiness.score}</p>
              <StatusBadge tone={STATE_TONE[sim.readiness.state]}>
                {sim.readiness.state.replace(/_/g, ' ')}
              </StatusBadge>
              <p className="mt-2 text-xs text-muted-foreground">Confidence: {sim.readiness.confidence}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top voice cue</p>
              <p className="mt-1 text-sm text-foreground">{sim.voice ? `“${sim.voice.text}”` : 'Silent (frame is good)'}</p>
              {sim.voice && <p className="mt-1 text-xs text-muted-foreground">id: {sim.voice.id} · {sim.voice.category}</p>}
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Retake verdict</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {sim.retake.recommended ? 'Retake recommended' : 'Clip accepted'}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {sim.retake.reasons.map((r) => <li key={r.id}>• {r.reason}</li>)}
              </ul>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Motion insights (Phase 3) */}
      <SectionCard
        title="Motion insights (Phase 3)"
        description="Runs the real biomechanics bridge (reusing the Motion Lab engine) on a synthetic swing track — no camera required. Single-view reads are proxies, capped at medium confidence."
      >
        {insights ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Overall confidence: <span className="font-mono text-foreground">{insights.confidence}</span>
              {' · '}tracked frames: <span className="font-mono text-foreground">{insights.trackedFrames}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.metrics.map((m) => (
                <div key={m.key} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.label}</p>
                    <code className="text-xs text-link">{m.confidence}</code>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-foreground">{m.display}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{m.read}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a sport/action to compute insights.</p>
        )}
      </SectionCard>

      {/* Voice catalog */}
      <SectionCard title="Voice guidance catalog" description="The prioritized cues the engine can speak, with i18n keys for future translation.">
        <VoiceCatalog sport={sport} action={action} />
      </SectionCard>

      {/* Preset catalog */}
      <SectionCard title="Sport preset catalog" description={`${allPresets().length} presets across ${RECORD_ASSIST_SPORTS.length} sports.`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Sport</th><th>Action</th><th>Orientation</th><th>View</th><th>Implement risk</th>
              </tr>
            </thead>
            <tbody>
              {allPresets().map((p) => (
                <tr key={`${p.sport}-${p.action}`} className="border-t border-border text-foreground">
                  <td className="py-1.5 capitalize">{p.sport}</td>
                  <td>{p.label}</td>
                  <td>{p.recommendedOrientation}</td>
                  <td>{p.recommendedView.replace(/_/g, ' ')}</td>
                  <td>{p.implementRiskBaseline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Instrumentation */}
      <SectionCard title="Analytics instrumentation" description="Events the guided-recording funnel emits through the central analytics layer. Adoption/quality dashboards read these from your analytics provider (e.g. PostHog).">
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTED_EVENTS.map((e) => (
            <code key={e} className="rounded bg-muted px-2 py-1 text-xs text-link">{e}</code>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Props carry only non-private capture metadata (sport, action, view, readiness band, reason
          codes, device tier) — never the video, landmarks, or biometric values.
        </p>
      </SectionCard>

      <HelpPanel>
        <p>
          RecordAssist guides solo athletes to a usable clip before analysis. It runs on-device pose
          detection, scores the frame (0–100), and coaches position with voice + captions.
        </p>
        <p>
          To turn it off entirely, flip <code>record_assist.enabled</code> in Feature Flags. To tune
          presets or thresholds, edit <code>lib/record-assist/engines</code>. The simulator above lets
          you validate every documented state without a camera.
        </p>
      </HelpPanel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function VoiceCatalog({ sport, action }: { sport: RecordAssistSport; action: string }) {
  const preset = getPreset(sport, action);
  const cues = useMemo(() => {
    if (!preset) return [];
    const seen = new Map<string, { id: string; text: string; category: string }>();
    for (const s of SCENARIOS) {
      const frame = buildScenarioFrame(s.id, preset.recommendedOrientation);
      const quality = evaluateFrameQuality(frame, preset);
      const readiness = computeReadiness(quality, preset);
      const msg = selectGuidance(quality, readiness, preset);
      if (msg && !seen.has(msg.id)) seen.set(msg.id, { id: msg.id, text: msg.text, category: msg.category });
    }
    return [...seen.values()];
  }, [preset]);

  return (
    <ul className="space-y-1.5 text-sm">
      {cues.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 border-b border-border pb-1.5">
          <span className="text-foreground">“{c.text}”</span>
          <code className="shrink-0 text-xs text-muted-foreground">{c.category}</code>
        </li>
      ))}
    </ul>
  );
}
