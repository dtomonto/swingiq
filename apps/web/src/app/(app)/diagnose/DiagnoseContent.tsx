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
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { cn, priorityToColor } from '@/lib/utils';
import {
  runDiagnosticEngine,
  buildSessionInsight,
  computeSwingScores,
  getRoutineForDiagnosis,
  type DiagnosisOutput,
  type SkillLevel,
} from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useSwingIQStore } from '@/store';
import { format } from 'date-fns';
import { ShareableReportCard, type ReportData } from '@/components/report/ShareableReportCard';
import { EmailCapture } from '@/components/email/EmailCapture';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';

// ── Diagnosis card ───────────────────────────────────────────

function DiagnosisCard({ diagnosis, rank, skillLevel }: { diagnosis: DiagnosisOutput; rank: number; skillLevel: SkillLevel }) {
  const [expanded, setExpanded] = useState(rank === 1);
  const routine = getRoutineForDiagnosis(diagnosis.rule.id, skillLevel);

  return (
    <Card className={rank === 1 ? 'ring-2 ring-error/40' : ''}>
      <CardHeader>
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
            <span className="font-bold text-foreground">{diagnosis.rule.name}</span>
            <Badge variant={diagnosis.rule.priority as 'critical' | 'high' | 'medium'}>
              {diagnosis.rule.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Confidence: {diagnosis.confidence}%
            </span>
          </div>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
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
                      : 'bg-muted border-border',
                  )}
                >
                  <p className="text-xs text-muted-foreground">{dp.metric}</p>
                  <p className="font-bold text-foreground text-sm">
                    {typeof dp.value === 'number'
                      ? `${dp.value.toFixed(dp.unit === 'rpm' ? 0 : 1)}${dp.unit}`
                      : dp.value}
                  </p>
                  {dp.target_min !== null && dp.target_max !== null && (
                    <p className="text-xs text-muted-foreground">
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
            <p className="text-sm text-foreground leading-relaxed">
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
            <p className="text-sm text-foreground leading-relaxed">
              {diagnosis.rule.what_improvement_looks_like(diagnosis.stats)}
            </p>
          </div>

          {/* Routine + Drills */}
          {routine && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b border-border">
                <p className="font-semibold text-foreground text-sm">{routine.name}</p>
                <p className="text-xs text-muted-foreground">
                  {routine.ball_count} balls · ~{routine.estimated_duration_minutes} min
                </p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {routine.drill_steps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
                {routine.drill_steps.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-7">
                    +{routine.drill_steps.length - 3} more steps in full routine
                  </p>
                )}
              </div>
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {routine.drill_recommendations.map((drill) => (
                    <a
                      key={drill.id}
                      href={drill.youtube_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
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
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Retest Protocol</p>
            <p className="text-sm text-foreground">
              {diagnosis.rule.retest.success_criteria}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
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
  const { sessions, profile } = useSwingIQStore();
  const skillLevel: SkillLevel = (profile?.skill_level ?? 'beginner') as SkillLevel;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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
          <p className="text-muted-foreground text-lg font-medium mb-2">No session data yet</p>
          <p className="text-muted-foreground text-sm mb-6">
            Import a launch-monitor CSV to run your first swing diagnosis.
          </p>
          <Link href="/sessions/import">
            <Button>
              <Upload size={16} /> Import Your First Session
            </Button>
          </Link>
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

          <ScoreRing score={scores.overall} size={64} strokeWidth={6} label="Overall" />
          <ScoreRing score={scores.face_control} size={64} strokeWidth={6} label="Face" />
          <ScoreRing score={scores.strike_quality} size={64} strokeWidth={6} label="Strike" />
        </div>
      </div>

      {/* What to do next */}
      <div className="bg-primary text-primary-foreground rounded-xl p-5 flex items-start gap-4">
        <span className="text-2xl">🎯</span>
        <div className="flex-1">
          <p className="font-semibold text-primary-foreground/80 text-sm mb-0.5">
            What should I do next?
          </p>
          <p className="text-primary-foreground font-bold">{insight.what_do_i_do_next}</p>
        </div>
      </div>

      {/* Stat summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Avg Carry"
          value={result.stats.avg_carry?.toFixed(0) ?? '—'}
          unit="yds"
          status="neutral"
        />
        <MetricCard
          label="Face-to-Path"
          value={result.stats.avg_face_to_path?.toFixed(1) ?? '—'}
          unit="°"
          target="-3° to +3°"
          status={Math.abs(result.stats.avg_face_to_path ?? 0) > 3 ? 'danger' : 'good'}
        />
        <MetricCard
          label="Lateral Miss"
          value={Math.abs(result.stats.avg_lateral_offline ?? 0).toFixed(0)}
          unit={`yds ${(result.stats.avg_lateral_offline ?? 0) > 0 ? 'right' : 'left'}`}
          status={(result.stats.avg_lateral_offline ?? 0) > 15 ? 'danger' : 'warning'}
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
        />
      </div>

      {/* Diagnoses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-muted-foreground" />
          <h2 className="text-lg font-bold text-foreground">
            {result.diagnoses.length} Issue
            {result.diagnoses.length !== 1 ? 's' : ''} Identified
          </h2>
        </div>

        {result.diagnoses.length === 0 && (
          <Card>
            <CardBody className="py-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-success" />
              <p className="font-bold text-foreground">No critical issues detected.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Focus on maintaining consistency. Add more shots for a higher-confidence
                analysis.
              </p>
            </CardBody>
          </Card>
        )}

        {result.diagnoses.map((d, i) => (
          <DiagnosisCard key={d.rule.id} diagnosis={d} rank={i + 1} skillLevel={skillLevel} />
        ))}
      </div>

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
