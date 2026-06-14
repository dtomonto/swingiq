'use client';

import { useState, useMemo } from 'react';
import {
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Upload,
  Activity,
  Dumbbell,
  Sparkles,
  FileText,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { GradeCard } from '@/components/grading/GradeCard';
import { DataQualityBadge } from '@/components/diagnose/DataQualityBadge';
import { cn, priorityToColor } from '@/lib/utils';
import {
  runDiagnosticEngine,
  buildSessionInsight,
  computeSwingScores,
  getRoutineForDiagnosis,
  MIN_DIAGNOSIS_SHOTS,
  FULL_CONFIDENCE_SHOTS,
  type DiagnosisOutput,
  type SkillLevel,
} from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useSwingVantageStore } from '@/store';
import { format } from 'date-fns';
import { ShareableReportCard, type ReportData } from '@/components/report/ShareableReportCard';
import { DiagnosisFixSheet } from '@/components/report/DiagnosisFixSheet';
import { BeforeAfter } from '@/components/ui/BeforeAfter';
import { ProgressTimeline } from '@/components/ui/ProgressTimeline';
import { EmailCapture } from '@/components/email/EmailCapture';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { TierInvite } from '@/components/intelligence/TierInvite';
import { useDesignV2 } from '@/lib/design-v2-client';

// ── Diagnosis card ───────────────────────────────────────────

function DiagnosisCard({
  diagnosis,
  rank,
  skillLevel,
  paper = false,
}: {
  diagnosis: DiagnosisOutput;
  rank: number;
  skillLevel: SkillLevel;
  /** Render on the light document/report sheet (Design V2 paper body). */
  paper?: boolean;
}) {
  const [expanded, setExpanded] = useState(rank === 1);
  const routine = getRoutineForDiagnosis(diagnosis.rule.id, skillLevel);

  // Flag-aware ink. Each `false` branch is the original theme class, so the
  // OFF (paper=false) render is byte-identical. Severity tints (error/warning/
  // success/accent-secondary washes) are kept — they read on the light sheet.
  const ink = paper ? 'text-document-fg' : 'text-foreground';
  const muted = paper ? 'text-document-fg/60' : 'text-muted-foreground';
  const accent = paper ? 'text-document-accent' : 'text-primary';
  const subtleCard = paper ? 'border-document-fg/15 bg-document-fg/[0.04]' : 'border-border bg-muted';
  const restBorder = paper ? 'border-document-fg/15' : 'border-border';
  const numBadge = paper ? 'bg-document-accent/10 text-document-accent' : 'bg-primary/15 text-primary';

  return (
    <Card
      className={cn(
        rank === 1 && 'ring-2 ring-error/40',
        paper && 'border-document-fg/15 bg-document text-document-fg',
      )}
    >
      <CardHeader className={paper ? 'border-document-fg/15' : undefined}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                rank === 1
                  ? 'bg-error text-error-foreground'
                  : 'bg-warning text-warning-foreground',
              )}
            >
              {rank}
            </span>
            <span className={cn('font-bold', ink)}>{diagnosis.rule.name}</span>
            <Badge variant={diagnosis.rule.priority as 'critical' | 'high' | 'medium'}>
              {diagnosis.rule.priority}
            </Badge>
            <span className={cn('text-xs', muted)}>
              Confidence: {diagnosis.confidence}%
            </span>
          </div>
          {expanded ? (
            <ChevronUp size={16} className={muted} />
          ) : (
            <ChevronDown size={16} className={muted} />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardBody className="space-y-5">
          {/* Problem */}
          <div className={cn('p-4 rounded-lg border', priorityToColor(diagnosis.rule.priority))}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Problem</p>
            <p className="text-sm leading-relaxed">
              {diagnosis.rule.primary_issue(diagnosis.stats)}
            </p>
          </div>

          {/* Evidence */}
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-wide mb-2', muted)}>
              Evidence
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {diagnosis.supporting_data.slice(0, 6).map((dp) => (
                <div
                  key={dp.metric}
                  className={cn(
                    'rounded-lg p-3 border',
                    dp.deviation !== null && Math.abs(dp.deviation) > 2
                      ? 'bg-error/10 border-error/30'
                      : subtleCard,
                  )}
                >
                  <p className={cn('text-xs', muted)}>{dp.metric}</p>
                  <p className={cn('font-bold text-sm', ink)}>
                    {typeof dp.value === 'number'
                      ? `${dp.value.toFixed(dp.unit === 'rpm' ? 0 : 1)}${dp.unit}`
                      : dp.value}
                  </p>
                  {dp.target_min !== null && dp.target_max !== null && (
                    <p className={cn('text-xs', muted)}>
                      Target: {dp.target_min}–{dp.target_max}
                      {dp.unit}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Likely Cause */}
          <div className="p-4 bg-accent-secondary/10 rounded-lg border border-accent-secondary/25">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-accent-secondary" />
              <p className="text-xs font-semibold text-accent-secondary">Likely Cause</p>
            </div>
            <p className={cn('text-sm leading-relaxed', ink)}>
              {diagnosis.rule.likely_cause}
            </p>
          </div>

          {/* What improvement looks like */}
          <div className="p-4 bg-success/10 rounded-lg border border-success/25">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-success" />
              <p className="text-xs font-semibold text-success">
                What Improvement Looks Like
              </p>
            </div>
            <p className={cn('text-sm leading-relaxed', ink)}>
              {diagnosis.rule.what_improvement_looks_like(diagnosis.stats)}
            </p>
          </div>

          {/* Routine + Drills */}
          {routine && (
            <div className={cn('border rounded-lg overflow-hidden', restBorder)}>
              <div className={cn('px-4 py-3 border-b', subtleCard)}>
                <p className={cn('font-semibold text-sm', ink)}>{routine.name}</p>
                <p className={cn('text-xs', muted)}>
                  {routine.ball_count} balls · ~{routine.estimated_duration_minutes} min
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {routine.drill_steps.slice(0, 3).map((step, i) => (
                  <div key={i} className={cn('flex gap-2 text-sm', ink)}>
                    <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5', numBadge)}>
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
                {routine.drill_steps.length > 3 && (
                  <p className={cn('text-xs pl-7', muted)}>
                    +{routine.drill_steps.length - 3} more steps in full routine
                  </p>
                )}
              </div>
              <div className={cn('border-t px-4 py-3 flex items-center justify-between', restBorder)}>
                <div className="flex gap-2 flex-wrap">
                  {routine.drill_recommendations.map((drill) => (
                    <a
                      key={drill.id}
                      href={drill.youtube_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn('flex items-center gap-1 text-xs hover:underline', accent)}
                    >
                      <ExternalLink size={11} />
                      {drill.name.length > 25 ? drill.name.substring(0, 25) + '…' : drill.name}
                    </a>
                  ))}
                </div>
                <Link href="/training">
                  <Button size="sm">Full Routine</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Retest */}
          <div className={cn('p-4 rounded-lg border', subtleCard)}>
            <p className={cn('text-xs font-semibold mb-1', muted)}>Retest Protocol</p>
            <p className={cn('text-sm', ink)}>
              {diagnosis.rule.retest.success_criteria}
            </p>
            <p className={cn('text-xs mt-1', muted)}>
              {diagnosis.rule.retest.shot_count} shots · Focus:{' '}
              {diagnosis.rule.retest.focus_metrics.join(', ')}
            </p>
          </div>
        </CardBody>
      )}
    </Card>
  );
}

// ── Main component ───────────────────────────────────────────

export function DiagnoseContent() {
  const { sessions, profile } = useSwingVantageStore();
  const skillLevel: SkillLevel = (profile?.skill_level ?? 'beginner') as SkillLevel;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  // Design V2 flag — gates the "report is paper" hero treatment below. Called
  // before any early return so the hook order is stable (rules-of-hooks).
  const designV2 = useDesignV2();

  // Sessions newest-first
  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [sessions],
  );

  const activeSession =
    sorted.find((s) => s.id === selectedSessionId) ?? sorted[0] ?? null;

  const shots = useMemo(() => (activeSession?.shots ?? []) as Shot[], [activeSession]);

  const result = useMemo(() => {
    if (!shots.length || !activeSession) return null;
    return runDiagnosticEngine(
      shots,
      activeSession.club_category || 'mid_iron',
      activeSession.id,
      'local',
    );
  }, [shots, activeSession]);

  const insight = useMemo(() => (result ? buildSessionInsight(result) : null), [result]);
  const scores = useMemo(() => (result ? computeSwingScores(result.stats) : null), [result]);

  // Design V2 report-body primitives — REAL data only (no fabrication):
  // the saved swing-score history across sessions, and the most recent prior
  // scored session for an honest "vs last session" delta. Computed before the
  // early returns so the hook order stays stable.
  const scoreHistory = useMemo(
    () =>
      [...sorted]
        .filter((s): s is typeof s & { swing_score: number } => typeof s.swing_score === 'number')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((s) => ({ label: format(new Date(s.date || s.created_at), 'MMM d'), score: s.swing_score })),
    [sorted],
  );
  const prevScored = useMemo(() => {
    if (!activeSession) return null;
    const at = new Date(activeSession.created_at).getTime();
    return (
      [...sorted]
        .filter(
          (s) =>
            s.id !== activeSession.id &&
            typeof s.swing_score === 'number' &&
            new Date(s.created_at).getTime() < at,
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
    );
  }, [sorted, activeSession]);

  // Privacy-safe shareable summary built from the top diagnosis.
  const reportData = useMemo<ReportData | null>(() => {
    if (!result || !insight || result.diagnoses.length === 0) return null;
    const top = result.diagnoses[0];
    const routine = getRoutineForDiagnosis(top.rule.id, skillLevel);
    const drills = routine?.drill_recommendations.map((d) => d.name).slice(0, 3)
      ?? routine?.drill_steps.slice(0, 3)
      ?? [];
    return {
      sport: 'Golf',
      topIssue: top.rule.name,
      confidence: `${top.confidence}%`,
      drills,
      planSummary: insight.what_do_i_do_next,
    };
  }, [result, insight, skillLevel]);

  // ── Empty state ──────────────────────────────────────────────
  if (!sessions.length) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-20">
          <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground text-lg font-semibold mb-2">Let&apos;s run your first diagnosis</p>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Import a launch-monitor CSV for the most precise read — or, if you don&apos;t have launch-monitor
            data yet, start with a guided quick check or a swing video.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/sessions/import">
              <Button>
                <Upload size={16} /> Import Your First Session
              </Button>
            </Link>
            <Link href="/start">
              <Button variant="outline">Try the quick start</Button>
            </Link>
            <Link href="/video">
              <Button variant="outline">Upload a swing video</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !insight || !scores || !activeSession) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground mt-8 text-center">
          This session has no shot data — try importing another session.
        </p>
      </div>
    );
  }

  // Honest "what is this based on" inputs for the transparency panel.
  const topConfidencePct = result.diagnoses[0]?.confidence ?? null;
  const transparencyConfidence = {
    level: (topConfidencePct == null
      ? 'low'
      : topConfidencePct >= 70
      ? 'high'
      : topConfidencePct >= 40
      ? 'medium'
      : 'low') as 'high' | 'medium' | 'low',
    score: topConfidencePct ?? 30,
    reason: `based on ${result.stats.shot_count} shots${
      activeSession.launch_monitor && activeSession.launch_monitor !== 'manual'
        ? ` from ${activeSession.launch_monitor}`
        : ' you entered'
    }`,
  };
  const transparencyBasedOn = [
    `${result.stats.shot_count} shots from this session`,
    activeSession.launch_monitor && activeSession.launch_monitor !== 'manual'
      ? `Launch-monitor data (${activeSession.launch_monitor})`
      : 'Manually entered shot data',
    `Club: ${activeSession.club_name}`,
  ];
  const transparencyWhatImproves = [
    'Add more shots for a higher-confidence read',
    activeSession.launch_monitor === 'manual'
      ? 'Import launch-monitor data for measured numbers'
      : 'Keep conditions consistent across sessions',
    'Retest after a few practice sessions to confirm the change',
    'Have a qualified coach validate the top priority',
  ];

  // Design V2 report hero inputs — the single priority fix on document paper.
  // Pure reads of data already computed above; nothing new is calculated.
  const topDiagnosis = result.diagnoses[0] ?? null;
  const heroRoutine = topDiagnosis ? getRoutineForDiagnosis(topDiagnosis.rule.id, skillLevel) : null;
  const heroDrills = heroRoutine?.drill_steps.slice(0, 3) ?? [];

  // ── Full diagnosis view ──────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Swing Diagnosis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {result.stats.shot_count} shots ·{' '}
            {activeSession.club_name}
            {activeSession.launch_monitor && activeSession.launch_monitor !== 'manual' && (
              <span className="capitalize"> · {activeSession.launch_monitor}</span>
            )}
          </p>
          <div className="mt-2"><DataQualityBadge quality={result.quality} /></div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Session selector */}
          {sorted.length > 1 && (
            <select
              value={activeSession.id}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-ring outline-hidden bg-card text-foreground"
              aria-label="Select session to diagnose"
            >
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {format(new Date(s.created_at), 'MMM d')}
                </option>
              ))}
            </select>
          )}

          <ScoreRing score={scores.overall} size={64} strokeWidth={6} label="Overall" glow />
          <ScoreRing score={scores.face_control} size={64} strokeWidth={6} label="Face" glow />
          <ScoreRing score={scores.strike_quality} size={64} strokeWidth={6} label="Strike" glow />
        </div>
      </div>

      {/* What to do next — the one priority fix.
          Design V2: rendered as a FixCard on the light "document" surface
          ("the report is paper") with first-move DrillCards + a gradient retest
          CTA. Flag OFF keeps the original flat primary banner exactly. */}
      {designV2 ? (
        <DiagnosisFixSheet
          fix={topDiagnosis?.rule.name ?? insight.what_do_i_do_next}
          whatToDoNext={insight.what_do_i_do_next}
          confidencePct={topConfidencePct}
          confidenceNote={transparencyConfidence.reason}
          drills={heroDrills}
          retestCriteria={topDiagnosis?.rule.retest.success_criteria}
          retestShots={topDiagnosis?.rule.retest.shot_count}
        />
      ) : (
        <div className="bg-primary text-primary-foreground rounded-xl p-5 flex items-start gap-4">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <p className="font-semibold text-primary-foreground/80 text-sm mb-0.5">
              What should I do next?
            </p>
            <p className="text-primary-foreground font-bold">{insight.what_do_i_do_next}</p>
          </div>
        </div>
      )}

      {/* Stat summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Avg Carry"
          value={result.stats.avg_carry?.toFixed(0) ?? '—'}
          unit="yds"
          status="neutral"
          description="How far the ball flies in the air."
        />
        <MetricCard
          label="Face-to-Path"
          value={result.stats.avg_face_to_path?.toFixed(1) ?? '—'}
          unit="°"
          target="-3° to +3°"
          status={Math.abs(result.stats.avg_face_to_path ?? 0) > 3 ? 'danger' : 'good'}
          description="Clubface aim vs. swing path — the main cause of curve."
        />
        <MetricCard
          label="Lateral Miss"
          value={Math.abs(result.stats.avg_lateral_offline ?? 0).toFixed(0)}
          unit={`yds ${(result.stats.avg_lateral_offline ?? 0) > 0 ? 'right' : 'left'}`}
          status={(result.stats.avg_lateral_offline ?? 0) > 15 ? 'danger' : 'warning'}
          description="How far offline your shots finish, on average."
        />
        <MetricCard
          label="Smash Factor"
          value={result.stats.avg_smash_factor?.toFixed(2) ?? '—'}
          target="1.44–1.50"
          status={
            (result.stats.avg_smash_factor ?? 0) >= 1.44
              ? 'good'
              : (result.stats.avg_smash_factor ?? 0) >= 1.38
              ? 'warning'
              : 'danger'
          }
          description="Ball speed vs. club speed — how cleanly you struck it."
        />
      </div>

      {/* Profile-aware grade (Phase 10) — graded against the player's level. */}
      <GradeCard scores={scores} />

      {/* Diagnoses — Design V2: the report body on the light "document" sheet
          (the report is paper), led by the real score trend + last-session
          delta. Flag OFF keeps the original theme section byte-identical. */}
      <div
        className={cn(
          'space-y-4',
          designV2 && 'rounded-2xl bg-document p-5 text-document-fg shadow-theme-lg sm:p-6',
        )}
      >
        {/* Real progress on paper: score trend (≥2 scored sessions) + honest
            "vs last session" delta. Self-hides when there's no history yet. */}
        {designV2 && (scoreHistory.length >= 2 || prevScored) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {scoreHistory.length >= 2 && (
              <div className="rounded-xl border border-document-fg/15 bg-document-fg/[0.03] p-4">
                <p className="mb-1 text-2xs font-semibold uppercase tracking-[0.05em] text-document-fg/60">
                  Your score trend
                </p>
                <ProgressTimeline onPaper points={scoreHistory} height={84} />
              </div>
            )}
            {prevScored && (
              <BeforeAfter
                onPaper
                label="Overall swing score vs last session"
                before={prevScored.swing_score as number}
                after={scores.overall}
                better={scores.overall >= (prevScored.swing_score as number)}
                note={`${scores.overall - (prevScored.swing_score as number) >= 0 ? '+' : ''}${
                  scores.overall - (prevScored.swing_score as number)
                }`}
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <AlertCircle size={18} className={designV2 ? 'text-document-fg/60' : 'text-muted-foreground'} />
          <h2 className={cn('text-lg font-bold', designV2 ? 'text-document-fg' : 'text-foreground')}>
            {result.diagnoses.length} Issue
            {result.diagnoses.length !== 1 ? 's' : ''} Identified
          </h2>
        </div>

        {result.diagnoses.length === 0 && (
          result.stats.shot_count < MIN_DIAGNOSIS_SHOTS ? (
            // Too few shots to diagnose at all — be honest, don't imply a clean
            // bill of health. The engine returns no diagnoses below the minimum,
            // so a reassuring "no issues" here would be a false positive.
            <Card>
              <CardBody className="py-10 text-center">
                <Info size={40} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-bold text-foreground">Not enough shots to diagnose yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  A read needs at least {MIN_DIAGNOSIS_SHOTS} shots — and about {FULL_CONFIDENCE_SHOTS} for a
                  confident one. You have {result.stats.shot_count}. Log a few more and SwingVantage will find
                  your top thing to work on.
                </p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-10 text-center">
                <CheckCircle size={40} className="mx-auto mb-3 text-success" />
                <p className="font-bold text-foreground">No critical issues detected.</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Based on {result.stats.shot_count} shots, nothing stands out as critical. Focus on maintaining
                  consistency — add more shots for an even higher-confidence read.
                </p>
              </CardBody>
            </Card>
          )
        )}

        {result.diagnoses.map((d, i) => (
          <DiagnosisCard key={d.rule.id} diagnosis={d} rank={i + 1} skillLevel={skillLevel} paper={designV2} />
        ))}
      </div>

      {/* Next steps (Phase 6) — clear, low-friction actions after a diagnosis. */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">What next?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Link href="/training">
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
              <Dumbbell size={15} /> Practice plan
            </Button>
          </Link>
          <Link href="/retest">
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
              <RotateCcw size={15} /> Retest
            </Button>
          </Link>
          <Link href="/sessions/import">
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
              <Upload size={15} /> Import another
            </Button>
          </Link>
          <Link href="/fix">
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
              <Sparkles size={15} /> Quick fix
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" size="sm" className="w-full justify-start gap-1.5">
              <FileText size={15} /> Full report
            </Button>
          </Link>
        </div>
      </div>

      {/* Calm, admin-controlled early-access invitation (renders only when enabled). */}
      <TierInvite slot="post-diagnosis" />

      {/* How this diagnosis was produced */}
      <AnalysisTransparency
        resultNoun="diagnosis"
        basedOn={transparencyBasedOn}
        videoAnalyzed={false}
        confidence={transparencyConfidence}
        whatImproves={transparencyWhatImproves}
      />

      {/* Share + save your plan */}
      {reportData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Share or save your plan</h2>
          </div>
          <ShareableReportCard data={reportData} />
          <EmailCapture
            source="launch_monitor"
            heading="Email me this plan + a retest reminder"
            subheading="We'll send your top priority, drills, and a reminder to retest. No spam."
            meta={{ sport: 'golf', issue: reportData.topIssue }}
          />
        </div>
      )}
    </div>
  );
}
