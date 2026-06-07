'use client';

import Link from 'next/link';
import {
  Upload,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Video,
  ExternalLink,
  Dumbbell,
  Sun,
  BookOpen,
  Flame,
  CalendarDays,
  Dna,
  Ruler,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FIX_CTA } from '@/lib/coaching/fixFraming';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { ReadinessSummaryCard } from '@/components/bodysync/ReadinessSummaryCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSwingVantageStore, useLatestDiagnosedSession, useOverallScore } from '@/store';
import { DashboardIntelligence } from '@/components/agents/DashboardIntelligence';
import { AthleteGISummary } from '@/components/agi/AthleteGISummary';
import { NextBadgeNudge } from '@/components/community/NextBadgeNudge';
import { DailyNotePrompt } from '@/components/dashboard/DailyNotePrompt';
import { GrowthAgentsPanel } from '@/components/growth';
import { runDiagnosticEngine, computeSwingScores, predictFromDiagnosis, analyzeClubGaps, getRoutineForDiagnosis, type DiagnosisCategory } from '@swingiq/core';
import type { DiagnosisOutput, Shot, ClubGapInput } from '@swingiq/core';
import { format } from 'date-fns';
import { useSport } from '@/contexts/SportContext';
import { useMemo, useState } from 'react';

// ── Quick Actions ─────────────────────────────────────────────

const quickActions = [
  { label: 'Import CSV', href: '/sessions/import', icon: Upload, color: 'bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary/15' },
  { label: 'Diagnose', href: '/diagnose', icon: Target, color: 'bg-success/10 text-success hover:bg-success/15' },
  { label: 'Schedule', href: '/practice', icon: CalendarDays, color: 'bg-primary/10 text-primary hover:bg-primary/15' },
  { label: 'Add Club', href: '/bag', icon: Plus, color: 'bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary/15' },
  { label: 'Upload Video', href: '/video', icon: Video, color: 'bg-warning/10 text-warning hover:bg-warning/15' },
  { label: 'Pre-Round', href: '/pre-round', icon: Sun, color: 'bg-primary/10 text-primary hover:bg-primary/15' },
  { label: 'Training', href: '/training', icon: Dumbbell, color: 'bg-warning/10 text-warning hover:bg-warning/15' },
  { label: 'Drills', href: '/drills', icon: BookOpen, color: 'bg-success/10 text-success hover:bg-success/15' },
];

// ── Player DNA helpers ────────────────────────────────────────

function dnaLabel(val: number | null | undefined, lowLabel: string, highLabel: string, midLabel: string, threshold = 3): string {
  if (val === null || val === undefined) return '—';
  if (val < -threshold) return lowLabel;
  if (val > threshold) return highLabel;
  return midLabel;
}

// ─────────────────────────────────────────────────────────────

export function DashboardContent() {
  const { profile, clubs, sessions, training, recordPractice } = useSwingVantageStore();
  const latestSession = useLatestDiagnosedSession();
  const overallScore = useOverallScore();
  const { isGolf } = useSport();

  const topDiagnosis = latestSession?.diagnoses[0];
  const mostRecentSession = sessions[0];

  // Build real diagnosis display object
  const typedDiagnosis = topDiagnosis as DiagnosisOutput | undefined;
  const activeDiagnosis = typedDiagnosis ? {
    category: typedDiagnosis.rule.id,
    title: typedDiagnosis.rule.name,
    priority: typedDiagnosis.rule.priority,
    summary: typedDiagnosis.rule.likely_cause,
    data_points: (typedDiagnosis.supporting_data ?? []).slice(0, 4).map((d) => ({
      label: d.metric,
      value: typeof d.value === 'number' ? d.value.toFixed(1) + (d.unit ?? '') : String(d.value),
      status: (d.deviation !== null && d.deviation !== undefined && Math.abs(d.deviation) > 3 ? 'danger' : 'warning') as 'danger' | 'warning' | 'good',
    })),
    routine: typedDiagnosis.rule.id,
    youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      typedDiagnosis.rule.name.replace(/\s+/g, '+')
    )}+golf+drill+fix`,
    retest: typedDiagnosis.rule.retest.success_criteria,
  } : null;

  // ── Live stats from most recent session with shots ────────
  const sessionWithShots = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .find((s) => s.shots.length > 0) ?? null;
  }, [sessions]);

  const liveStats = useMemo(() => {
    if (!sessionWithShots || sessionWithShots.shots.length < 3) return null;
    try {
      const result = runDiagnosticEngine(
        sessionWithShots.shots as Shot[],
        sessionWithShots.club_category || 'mid_iron',
        sessionWithShots.id,
        'local',
      );
      const scores = computeSwingScores(result.stats);
      return { stats: result.stats, scores };
    } catch {
      return null;
    }
  }, [sessionWithShots]);

  // Stroke savings from live stats
  const strokeSavings = useMemo(() => {
    if (!liveStats || !typedDiagnosis) return null;
    try {
      return predictFromDiagnosis(typedDiagnosis.rule.id, {
        avg_face_to_path: liveStats.stats.avg_face_to_path,
        avg_lateral_miss: liveStats.stats.avg_lateral_offline,
        avg_smash_factor: liveStats.stats.avg_smash_factor,
      });
    } catch {
      return null;
    }
  }, [liveStats, typedDiagnosis]);

  // Display score
  const swingScore = latestSession?.swing_score ?? null;
  const displayScore = liveStats?.scores.overall ?? swingScore ?? overallScore ?? 0;

  // Avg carry from typed ball_data
  const avgCarry = useMemo(() => {
    const shots = (sessionWithShots?.shots ?? []) as Shot[];
    const carries = shots.map((s) => s.ball_data.carry_distance).filter((v): v is number => typeof v === 'number' && v > 0);
    return carries.length > 0 ? Math.round(carries.reduce((a, b) => a + b, 0) / carries.length) : null;
  }, [sessionWithShots]);

  const clubs3 = clubs.slice(0, 3);

  // Stable mount-time timestamp so date math stays pure across renders.
  const [now] = useState(() => Date.now());

  // Practice reminder — triggered if last practice was 2+ days ago
  const practiceReminder = useMemo(() => {
    if (!training.last_practice_date) return null;
    const daysSince = Math.floor(
      (now - new Date(training.last_practice_date).getTime()) / 86400000
    );
    return daysSince >= 2 ? daysSince : null;
  }, [training.last_practice_date, now]);

  // Training improvement alert
  const improvementAlert = useMemo(() => {
    if (!isGolf || !training.active_session_id) return null;
    const golfSessions = sessions.filter((s) => s.sport === 'golf' || !s.sport);
    const startSession = golfSessions.find((s) => s.id === training.active_session_id);
    const latestScored = [...golfSessions]
      .filter((s) => s.swing_score !== null)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;
    if (!startSession || !latestScored || startSession.id === latestScored.id) return null;
    if (startSession.swing_score === null || latestScored.swing_score === null) return null;
    const delta = latestScored.swing_score - startSession.swing_score;
    if (delta < 5) return null;
    return {
      delta,
      fromScore: startSession.swing_score,
      toScore: latestScored.swing_score,
      diagnosisId: training.active_diagnosis_id,
    };
  }, [sessions, training.active_session_id, training.active_diagnosis_id, isGolf]);

  // Daily Focus drill — picks one drill per day from active routine
  const dailyFocus = useMemo(() => {
    const diagId = (typedDiagnosis?.rule.id ?? training.active_diagnosis_id) as DiagnosisCategory | undefined;
    if (!diagId) return null;
    const routine = getRoutineForDiagnosis(diagId, 'beginner');
    if (!routine?.drill_recommendations.length) return null;
    const startOfYear = new Date(new Date(now).getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((now - startOfYear) / 86400000);
    const drill = routine.drill_recommendations[dayOfYear % routine.drill_recommendations.length]!;
    return { drill, routineName: routine.name };
  }, [typedDiagnosis, training.active_diagnosis_id, now]);

  // Club gap analysis
  const gapAnalysis = useMemo(() => {
    if (clubs.length < 2) return null;
    const inputs: ClubGapInput[] = clubs
      .filter((c) => c.typical_carry !== null)
      .sort((a, b) => (b.typical_carry ?? 0) - (a.typical_carry ?? 0))
      .map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        typical_carry: c.typical_carry,
        sort_order: c.sort_order,
      }));
    if (inputs.length < 2) return null;
    try {
      return analyzeClubGaps(inputs);
    } catch {
      return null;
    }
  }, [clubs]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here is your performance overview and next steps.</p>
        </div>
        <div className="flex items-center gap-3">
          {training.streak_days > 1 && (
            <div className="flex items-center gap-1 text-warning font-bold text-sm">
              <Flame size={16} /> {training.streak_days}-day streak
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full inline-block" />
            {mostRecentSession
              ? `Last session: ${format(new Date(mostRecentSession.created_at), 'MMM d')}`
              : 'No sessions yet'}
          </div>
        </div>
      </div>

      {/* BodySync: today's readiness + recommended session (only when enabled) */}
      <ReadinessSummaryCard />

      {/* Intelligent product layer: Welcome Back / next best step + insights */}
      <DashboardIntelligence />

      {/* Athlete General Intelligence: cross-sport keystone + goal, links to /agi */}
      <AthleteGISummary />

      {/* Goal-gradient: the closest badge left to earn */}
      <NextBadgeNudge />

      {/* Daily check-in: "How did you play today?" → feeds the AI player profile */}
      <DailyNotePrompt />

      {/* Growth agents: churn-aware next step + activation progress + earn-moments */}
      <GrowthAgentsPanel />

      {/* Practice reminder */}
      {practiceReminder !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {practiceReminder === 2 ? "It's been 2 days since your last practice." : `${practiceReminder} days since your last practice.`}
              </p>
              <p className="text-xs text-warning">Consistent practice builds muscle memory faster. Even 15 minutes counts.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/training">
              <Button size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90 whitespace-nowrap">
                Start Training
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={recordPractice} className="border-warning/40 text-warning whitespace-nowrap">
              Log Today
            </Button>
          </div>
        </div>
      )}

      {/* Training improvement alert */}
      {improvementAlert && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-success/10 border border-success/25 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Your training is working — score up {improvementAlert.delta} points!
              </p>
              <p className="text-xs text-success">
                From {improvementAlert.fromScore} when you started training
                {improvementAlert.diagnosisId ? ` on ${improvementAlert.diagnosisId.replace(/_/g, ' ')}` : ''}
                {' '}→ now {improvementAlert.toScore}.
                Keep going.
              </p>
            </div>
          </div>
          <Link href="/progress">
            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 whitespace-nowrap">
              See Progress
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {quickActions.map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${color}`}
          >
            <Icon size={22} />
            <span className="text-xs font-medium text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* Primary content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Diagnosis + Training */}
        <div className="lg:col-span-2 space-y-5">
          {/* Primary Diagnosis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-error" />
                <CardTitle>Primary Diagnosis</CardTitle>
              </div>
              {activeDiagnosis && (
                <Badge variant={activeDiagnosis.priority === 'critical' ? 'critical' : activeDiagnosis.priority === 'high' ? 'warning' : 'info'}>
                  {activeDiagnosis.priority.charAt(0).toUpperCase() + activeDiagnosis.priority.slice(1)}
                </Badge>
              )}
            </CardHeader>
            <CardBody className="space-y-4">
              {activeDiagnosis ? (
                <>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{activeDiagnosis.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{activeDiagnosis.summary}</p>
                  </div>

                  {/* Evidence */}
                  {activeDiagnosis.data_points.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Evidence</p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeDiagnosis.data_points.map((dp) => (
                          <div
                            key={dp.label}
                            className={`rounded-lg px-3 py-2 ${
                              dp.status === 'danger' ? 'bg-error/10 border border-error/30' : 'bg-warning/10 border border-warning/30'
                            }`}
                          >
                            <p className="text-xs text-muted-foreground capitalize">{dp.label}</p>
                            <p className={`font-bold ${dp.status === 'danger' ? 'text-error' : 'text-warning'}`}>
                              {dp.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stroke savings */}
                  {strokeSavings && strokeSavings.total_potential_savings > 0 && (
                    <div className="p-3 bg-success/10 border border-success/25 rounded-lg">
                      <p className="text-xs font-semibold text-success mb-0.5">Stroke Savings Potential</p>
                      <p className="text-sm text-success">{strokeSavings.prioritized_action}</p>
                      <p className="text-xs text-success mt-1 font-medium">
                        ~{strokeSavings.total_potential_savings} strokes/round if fixed
                      </p>
                    </div>
                  )}

                  {/* Action */}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Recommended routine</p>
                      <p className="font-semibold text-foreground text-sm capitalize">
                        {activeDiagnosis.routine.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={activeDiagnosis.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-error hover:underline"
                      >
                        <ExternalLink size={12} />
                        YouTube Drill
                      </a>
                      <Link href="/training">
                        <Button size="sm">View Routine</Button>
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <Target size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-foreground text-sm font-semibold">Let&apos;s find your #1 fix.</p>
                  <p className="text-muted-foreground text-xs mt-1">Upload a swing video, or import launch-monitor data, and we&apos;ll pinpoint the one thing to work on first.</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <Link href="/video" className="inline-block">
                      <Button size="sm">Upload a Swing Video</Button>
                    </Link>
                    <Link href="/diagnose" className="inline-block">
                      <Button size="sm" variant="outline">{FIX_CTA.showMeWhatToFix}</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Retest Protocol */}
          {activeDiagnosis && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" />
                  <CardTitle>Retest Protocol</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-foreground leading-relaxed">{activeDiagnosis.retest}</p>
                <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/25">
                  <p className="text-xs font-semibold text-success mb-1">How to retest</p>
                  <p className="text-xs text-success">
                    Import a new session using the same club after completing your training routine.
                    Compare your diagnosis confidence to see if the pattern has improved.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Daily Focus */}
          {dailyFocus && (
            <Card className="border-accent-secondary/25 bg-accent-secondary/10">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-accent-secondary" />
                  <CardTitle className="text-foreground">Today&apos;s Focus Drill</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-accent-secondary mb-1">From: {dailyFocus.routineName}</p>
                <p className="font-bold text-foreground text-sm">{dailyFocus.drill.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{dailyFocus.drill.why_this_matches}</p>
                {dailyFocus.drill.warning && (
                  <p className="text-xs text-warning mt-1">⚠ {dailyFocus.drill.warning}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <a
                    href={dailyFocus.drill.youtube_search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                  >
                    <ExternalLink size={11} /> Find on YouTube
                  </a>
                  <Link href="/training">
                    <Button size="sm" variant="outline">Full Routine →</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Session */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Session</CardTitle>
              <Link href="/sessions" className="text-xs text-success hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </CardHeader>
            <CardBody>
              {mostRecentSession ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{mostRecentSession.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(mostRecentSession.date || mostRecentSession.created_at), 'MMM d, yyyy')}
                        {' · '}{mostRecentSession.club_name}
                      </p>
                    </div>
                    <Badge variant="info">{mostRecentSession.shots.length} shots</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Avg Carry" value={avgCarry !== null ? `${avgCarry} yds` : '—'} status="neutral" />
                    <MetricCard
                      label="Top Diagnosis"
                      value={mostRecentSession.diagnoses[0]?.rule?.name ?? '—'}
                      status={mostRecentSession.diagnoses.length > 0 ? 'warning' : 'neutral'}
                    />
                    <MetricCard label="Total Sessions" value={String(sessions.length)} status="neutral" />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Upload}
                  title="No sessions yet."
                  description="Import launch-monitor data to see your shots, scores, and trends here."
                  action={{ label: 'Import Your First Session', href: '/sessions/import', variant: 'outline' }}
                  compact
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Scores + Player DNA */}
        <div className="space-y-5">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Swing Scores</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {displayScore > 0 ? (
                <>
                  <div className="flex justify-center">
                    <ScoreRing score={displayScore} size={100} strokeWidth={8} label="Overall" />
                  </div>
                  {liveStats && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Face Control</p>
                        <p className="font-bold text-foreground">{liveStats.scores.face_control}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Strike Quality</p>
                        <p className="font-bold text-foreground">{liveStats.scores.strike_quality}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Path Control</p>
                        <p className="font-bold text-foreground">{liveStats.scores.path_control}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Consistency</p>
                        <p className="font-bold text-foreground">{liveStats.scores.consistency}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    Based on {sessionWithShots?.shots.length ?? 0} shots · {sessionWithShots?.club_name ?? ''}
                  </p>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground text-sm">Import a session to see your swing scores.</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Player DNA */}
          {liveStats && (
            <Card className="border-accent-secondary/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Dna size={16} className="text-accent-secondary" />
                  <CardTitle>Player DNA</CardTitle>
                </div>
              </CardHeader>
              <CardBody className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Typical Miss</span>
                  <span className="font-semibold text-foreground">
                    {dnaLabel(liveStats.stats.avg_lateral_offline, 'Left', 'Right', 'On Line', 5)}
                    {liveStats.stats.avg_lateral_offline !== null && liveStats.stats.avg_lateral_offline !== undefined
                      ? ` (${Math.abs(liveStats.stats.avg_lateral_offline).toFixed(0)} yds)`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Face Tendency</span>
                  <span className="font-semibold text-foreground">
                    {dnaLabel(liveStats.stats.avg_face_to_path, 'Closed (Hook)', 'Open (Slice)', 'Square', 2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Path Tendency</span>
                  <span className="font-semibold text-foreground">
                    {dnaLabel(liveStats.stats.avg_club_path, 'Out-to-In', 'In-to-Out', 'Neutral', 2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Avg Carry</span>
                  <span className="font-semibold text-foreground">
                    {liveStats.stats.avg_carry !== null && liveStats.stats.avg_carry !== undefined
                      ? `${Math.round(liveStats.stats.avg_carry)} yds`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Smash Factor</span>
                  <span className="font-semibold text-foreground">
                    {liveStats.stats.avg_smash_factor?.toFixed(2) ?? '—'}
                  </span>
                </div>
                <Link href="/diagnose" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Full Diagnosis →
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-success" />
                <CardTitle>Progress</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {sessions.length >= 2 ? (
                <>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Sessions logged</span>
                    <span className="text-sm font-semibold text-success">{sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Practice streak</span>
                    <span className="text-sm font-semibold text-warning">
                      {training.streak_days > 0 ? `🔥 ${training.streak_days} days` : '0 days'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">Drills completed</span>
                    <span className="text-sm font-semibold text-success">{Object.keys(training.drills_completed).length}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Log 2+ sessions to track trends.
                </p>
              )}
              <Link href="/progress" className="block mt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Full Progress Report
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Clubs */}
          <Card>
            <CardHeader>
              <CardTitle>Clubs in Bag</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {clubs.length > 0 ? (
                <>
                  {clubs3.map((c) => {
                    const clubSessions = sessions.filter((s) => s.club_name === c.name);
                    return (
                      <div key={c.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.typical_carry ? `~${c.typical_carry} yds` : c.brand ?? c.category}
                            {clubSessions.length > 0 ? ` · ${clubSessions.length} sessions` : ''}
                          </p>
                        </div>
                        <ScoreRing
                          score={clubSessions[0]?.swing_score ?? 0}
                          size={40}
                          strokeWidth={4}
                        />
                      </div>
                    );
                  })}
                  {clubs.length > 3 && (
                    <Link href="/bag" className="text-xs text-success hover:underline block text-center mt-1">
                      +{clubs.length - 3} more clubs →
                    </Link>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No clubs added yet."
                  description="Add the clubs in your bag to unlock gap analysis and per-club scores."
                  action={{ label: 'Add Clubs', href: '/bag', variant: 'outline' }}
                  compact
                />
              )}
            </CardBody>
          </Card>
          {/* Club Gap Analysis */}
          {gapAnalysis && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler size={16} className="text-accent-secondary" />
                    <CardTitle>Club Gaps</CardTitle>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    gapAnalysis.overall_grade === 'A' ? 'bg-success/15 text-success'
                    : gapAnalysis.overall_grade === 'B' ? 'bg-accent-secondary/15 text-accent-secondary'
                    : gapAnalysis.overall_grade === 'C' ? 'bg-warning/15 text-warning'
                    : 'bg-error/15 text-error'
                  }`}>Grade {gapAnalysis.overall_grade}</span>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-muted-foreground mb-3">{gapAnalysis.summary}</p>
                <div className="space-y-1">
                  {gapAnalysis.results.slice(0, 5).map((r) => (
                    <div key={r.club_id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                      <span className="text-foreground font-medium">{r.club_name}</span>
                      <div className="flex items-center gap-2">
                        {r.carry !== null && (
                          <span className="text-muted-foreground">{r.carry} yds</span>
                        )}
                        {r.gap_to_next !== null && (
                          <span className={`font-semibold ${
                            r.gap_status === 'ideal' ? 'text-success'
                            : r.gap_status === 'too_large' ? 'text-error'
                            : r.gap_status === 'too_small' ? 'text-warning'
                            : 'text-muted-foreground'
                          }`}>↕ {r.gap_to_next} yds</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {gapAnalysis.largest_gap && gapAnalysis.largest_gap.gap_status === 'too_large' && (
                  <p className="text-xs text-error mt-2">⚠ Largest gap: {gapAnalysis.largest_gap.club_name} — consider adding a club</p>
                )}
                <Link href="/bag" className="block mt-3">
                  <Button variant="outline" size="sm" className="w-full">Manage Bag →</Button>
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
