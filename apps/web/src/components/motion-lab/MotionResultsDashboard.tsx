'use client';

// ============================================================
// SwingVantage — Motion Lab: Results Dashboard
// Composes the 3D viewer, phases, scoreboard, metrics, coaching
// report, drills, and comparison into one premium results experience.
// ============================================================

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, BarChart3, ClipboardList, Dumbbell, GitCompareArrows, Download,
  FileText, RotateCcw, Trash2, Lightbulb, Trophy, Repeat, Sparkles,
} from 'lucide-react';
import type { MotionSession, MotionPhaseSegment } from '@/lib/motion-lab';
import { downloadSessionJson, downloadSessionCsv, printSessionReport, getSport, skillLabel, computeRepeatability } from '@/lib/motion-lab';
import { Motion3DViewer } from './Motion3DViewer';
import { VideoOverlayLab } from './VideoOverlayLab';
import { PhaseTimeline } from './PhaseTimeline';
import { MotionScoreboard } from './MotionScoreboard';
import { MetricsPanel } from './MetricsPanel';
import { CoachingReport } from './CoachingReport';
import { MotionCoachNarrativeCard } from './MotionCoachNarrativeCard';
import { DrillPlan } from './DrillPlan';
import { CameraQualityCheck } from './CameraQualityCheck';
import { ImplementPathCard } from './ImplementPathCard';
import { KineticChainCard } from './KineticChainCard';
import { TemporalCard } from './TemporalCard';
import { TempoSyncTrainer } from '@/components/tempo-sync/TempoSyncTrainer';
import { TempoTrendCard } from './TempoTrendCard';
import { ContinuousMovementSummary } from './ContinuousMovementSummary';
import { RetestProtocolCard } from './RetestProtocolCard';
import { AnalysisDebugPanel } from './AnalysisDebugPanel';
import { MotionComparisonPanel } from './MotionComparisonPanel';
import { MotionAIVisionPanel } from './MotionAIVisionPanel';

// The avatar viewer pulls in three.js (WebGL) — load it only when the user
// switches to Avatar mode, and never on the server.
const MotionAvatarViewer = dynamic(
  () => import('./MotionAvatarViewer').then((m) => m.MotionAvatarViewer),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-stage h-[420px] flex items-center justify-center text-sm text-stage-foreground">
        Loading 3D avatar…
      </div>
    ),
  },
);
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Film, Box as BoxIcon, PersonStanding } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

type Tab = 'viewer' | 'scores' | 'metrics' | 'coaching' | 'drills' | 'compare' | 'ai';

const BASE_TABS: Array<{ id: Tab; label: string; icon: typeof Box }> = [
  { id: 'viewer', label: '3D & Phases', icon: Box },
  { id: 'scores', label: 'Scores', icon: BarChart3 },
  { id: 'metrics', label: 'Metrics', icon: ClipboardList },
  { id: 'coaching', label: 'Coaching', icon: FileText },
  { id: 'drills', label: 'Drills', icon: Dumbbell },
  { id: 'compare', label: 'Compare', icon: GitCompareArrows },
];
// The AI vision review needs the in-memory clip (fresh single-view analysis
// only), so the tab appears only when that File is on hand.
const AI_TAB = { id: 'ai' as Tab, label: 'AI Vision', icon: Sparkles };

interface Props {
  session: MotionSession;
  priorSessions: MotionSession[];
  saved: boolean;
  /**
   * In-memory object URL of the clip just analysed (the live wizard session).
   * Present only for a fresh analysis — saved sessions never retain the video,
   * so this is null when reopening from the library and the viewer falls back
   * to the 3D reconstruction.
   */
  videoUrl?: string | null;
  /**
   * In-memory File of the freshly-analysed clip — powers the optional AI vision
   * review (sampled frames → AI provider). Present only for a fresh single-view
   * analysis; null for saved/sample sessions, which hides the AI Vision tab.
   */
  videoFile?: File | null;
  /** True for a built-in demo session (synthetic motion, real engine). */
  isSample?: boolean;
  onNewMotion: () => void;
  onDelete?: () => void;
}

export function MotionResultsDashboard({ session, priorSessions, saved, videoUrl = null, videoFile = null, isSample = false, onNewMotion, onDelete }: Props) {
  const tabs = useMemo(() => (videoFile ? [...BASE_TABS, AI_TAB] : BASE_TABS), [videoFile]);
  const [tab, setTab] = useState<Tab>('viewer');
  // Default to the slow-mo video lab when the real clip is available.
  const [viewerMode, setViewerMode] = useState<'video' | '3d' | 'avatar'>(videoUrl ? 'video' : '3d');
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(priorSessions[0]?.id ?? null);
  const accent = getSport(session.capture.sport).accent;

  const compareSession = useMemo(
    () => priorSessions.find((s) => s.id === compareId) ?? null,
    [priorSessions, compareId],
  );

  const weakest = useMemo(
    () => session.metrics.filter((m) => m.normalizedScore != null).sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))[0],
    [session],
  );
  const strongest = useMemo(
    () => session.metrics.filter((m) => m.normalizedScore != null).sort((a, b) => (b.normalizedScore ?? 0) - (a.normalizedScore ?? 0))[0],
    [session],
  );

  const repeatability = useMemo(
    () => computeRepeatability([session, ...priorSessions]),
    [session, priorSessions],
  );

  const ghostTrack = tab === 'compare' && compareSession ? compareSession.poseTrack : null;
  const onPhaseSelect = (p: MotionPhaseSegment) => setActivePhase((k) => (k === p.key ? null : p.key));

  // Viewer modes — the real clip + overlays (fresh single-view analysis only),
  // the line skeleton, and the rigged 3D avatar. All driven by the same pose
  // track, so the skeleton + avatar are available even for saved sessions.
  const viewerModes = useMemo<Array<{ id: 'video' | '3d' | 'avatar'; label: string; icon: typeof Box }>>(
    () => [
      ...(videoUrl ? [{ id: 'video' as const, label: 'Video + overlays', icon: Film }] : []),
      { id: '3d' as const, label: '3D skeleton', icon: BoxIcon },
      { id: 'avatar' as const, label: '3D avatar', icon: PersonStanding },
    ],
    [videoUrl],
  );

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{session.emoji}</span>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              {session.sportLabel} · {session.motionLabel}
              {isSample && (
                <span className="text-3xs font-bold uppercase tracking-wide bg-primary/15 text-primary rounded-full px-2 py-0.5">Sample</span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isSample
                ? 'Demo · synthetic motion run through the real analysis engine'
                : `${new Date(session.createdAt).toLocaleString()} · ${skillLabel(session.capture.skillLevel ?? 'intermediate')} · ${session.keyFault}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { downloadSessionJson(session); track(ANALYTICS_EVENTS.MOTION_LAB_REPORT_EXPORTED, { format: 'json' }); }}>
            <Download className="w-4 h-4" /> JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => { downloadSessionCsv(session); track(ANALYTICS_EVENTS.MOTION_LAB_REPORT_EXPORTED, { format: 'csv' }); }}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => { printSessionReport(session); track(ANALYTICS_EVENTS.MOTION_LAB_REPORT_EXPORTED, { format: 'pdf' }); }}>
            <FileText className="w-4 h-4" /> PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={onNewMotion}>
            <RotateCcw className="w-4 h-4" /> New motion
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-muted-foreground hover:text-error">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* At-a-glance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-primary/5 border-primary/30">
          <CardBody>
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Executive summary</p>
            <p className="text-sm text-foreground mt-1 leading-relaxed">{session.report.executiveSummary}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Biggest opportunity</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{weakest?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{weakest?.recommendedFix}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key strength</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{strongest?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Keep this — don’t trade it away.</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border -mx-1 px-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />{t.label}
              {t.id === 'compare' && priorSessions.length > 0 && (
                <span className="ml-0.5 text-3xs bg-primary/15 text-primary rounded-full px-1.5">{priorSessions.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'viewer' && (
        <div className="space-y-4">
          {/* Video lab (real clip + overlays) · line skeleton · rigged 3D avatar.
              The video lab is only available for a freshly-analysed clip — saved
              sessions keep the pose track but never the video, by design — while
              the skeleton and avatar are reconstructed from the pose track. */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
            {viewerModes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setViewerMode(id); track(ANALYTICS_EVENTS.MOTION_LAB_VIEW_MODE_CHANGED, { mode: id }); }}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 transition-colors',
                  viewerMode === id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
          {viewerMode === 'avatar' ? (
            <MotionAvatarViewer track={session.poseTrack} phases={session.phases} accent={accent} />
          ) : videoUrl && viewerMode === 'video' ? (
            <VideoOverlayLab
              key={videoUrl}
              videoUrl={videoUrl}
              track={session.poseTrack}
              phases={session.phases}
              objectTracking={session.objectTracking ?? null}
              handedness={session.capture.handedness}
              sport={session.capture.sport}
              accent={accent}
            />
          ) : (
            <Motion3DViewer track={session.poseTrack} phases={session.phases} accent={accent} implement={session.objectTracking ?? null} />
          )}
          {/* Rally sports: how you prepared, moved, contacted, recovered and got
              ready for the next ball — the half the discrete swing read misses. */}
          {session.continuousMovement && (
            <ContinuousMovementSummary summary={session.continuousMovement} accent={accent} />
          )}
          <PhaseTimeline phases={session.phases} accent={accent} activeKey={activePhase} onSelect={onPhaseSelect} />
          {activePhase && (
            <Card>
              <CardBody>
                {session.phases.filter((p) => p.key === activePhase).map((p) => (
                  <div key={p.key}>
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.interpretation}</p>
                    <p className="text-2xs text-muted-foreground mt-1">Confidence {Math.round(p.confidence * 100)}% · estimated window</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          {session.objectTracking?.available && (
            <ImplementPathCard tracking={session.objectTracking} accent={accent} />
          )}
          <CameraQualityCheck report={session.quality} />

          {/* Developer / transparency / AI-validation panel */}
          <AnalysisDebugPanel session={session} />
        </div>
      )}

      {tab === 'scores' && (
        <div className="space-y-4">
          <MotionScoreboard scoreboard={session.scoreboard} accent={accent} />
          {session.kineticChain && session.kineticChain.comparableLinks > 0 && (
            <KineticChainCard chain={session.kineticChain} accent={accent} />
          )}
          {session.temporal && <TemporalCard temporal={session.temporal} accent={accent} />}
          {session.temporal && session.temporal.tempoRatio != null && (
            <TempoSyncTrainer temporal={session.temporal} variant="embedded" accent={accent} />
          )}
        </div>
      )}
      {tab === 'metrics' && <MetricsPanel metrics={session.metrics} />}
      {tab === 'coaching' && (
        <div className="space-y-4">
          <MotionCoachNarrativeCard session={session} />
          <CoachingReport report={session.report} />
          <RetestProtocolCard session={session} accent={accent} />
        </div>
      )}
      {tab === 'drills' && <DrillPlan plan={session.drills} />}

      {tab === 'ai' && videoFile && (
        <MotionAIVisionPanel
          file={videoFile}
          capture={session.capture}
          sportLabel={session.sportLabel}
          emoji={session.emoji}
        />
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          <TempoTrendCard sessions={[session, ...priorSessions]} accent={accent} />
          {repeatability.available && repeatability.score != null && (
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" style={{ color: accent }} />
                  <p className="text-sm font-semibold text-foreground">
                    Repeatability — consistency across {repeatability.sessionCount} sessions
                  </p>
                  <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: accent }}>
                    {repeatability.score}/100
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{repeatability.summary}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
                  {repeatability.mostConsistent && (
                    <span>Most repeatable: <b className="text-foreground">{repeatability.mostConsistent.name}</b> ({repeatability.mostConsistent.consistency}/100)</span>
                  )}
                  {repeatability.leastConsistent && repeatability.leastConsistent.id !== repeatability.mostConsistent?.id && (
                    <span>Least: <b className="text-foreground">{repeatability.leastConsistent.name}</b> ({repeatability.leastConsistent.consistency}/100)</span>
                  )}
                </div>
                {repeatability.basis !== 'measured' && (
                  <p className="text-3xs text-muted-foreground/80">Estimated from single-camera sessions — directional, not a lab measurement.</p>
                )}
              </CardBody>
            </Card>
          )}
          {priorSessions.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <GitCompareArrows className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No earlier sessions to compare yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Analyse this motion again later and Motion Lab will overlay a 3D ghost and track every metric.
                </p>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="motion-compare-select" className="text-xs text-muted-foreground">Compare against:</label>
                <select
                  id="motion-compare-select"
                  value={compareId ?? ''}
                  onChange={(e) => setCompareId(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-card px-2 py-1 text-foreground"
                >
                  {priorSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.createdAt).toLocaleDateString()} · {s.scoreboard.overall}/100
                    </option>
                  ))}
                </select>
              </div>
              <Motion3DViewer track={session.poseTrack} phases={session.phases} accent={accent} ghost={ghostTrack} />
              <p className="text-2xs text-muted-foreground -mt-2">Solid skeleton = this session · grey ghost = the session you’re comparing to.</p>
              {compareSession && <MotionComparisonPanel base={session} compare={compareSession} />}
            </>
          )}
        </div>
      )}

      {/* Footer note — honest about measured (multi-view) vs estimated (single-view) */}
      <p className="text-2xs text-muted-foreground text-center pt-2">
        {saved ? 'Saved to this device only (analysis + a compact pose track — never your video). ' : 'Not saved. '}
        {session.poseTrack.basis === 'measured'
          ? 'Measured 3D triangulated from two calibrated views (confidence from real reprojection error). No medical or injury claims.'
          : 'Estimated 3D analysis from a single camera — directional, not a lab measurement. No medical or injury claims.'}
      </p>
    </div>
  );
}
