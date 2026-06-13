'use client';

// ============================================================
// SwingVantage — Non-Golf Sport Dashboard
// Renders sport-specific dashboard for tennis, baseball,
// slow pitch softball, and fast pitch softball.
// Golf uses DashboardContent.tsx (unchanged).
// ============================================================

import Link from 'next/link';
import {
  Upload,
  Video,
  Target,
  TrendingUp,
  MessageSquare,
  Dumbbell,
  Sun,
  CalendarDays,
  BookOpen,
  ChevronRight,
  Flame,
  Activity,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { DashboardIntelligence } from '@/components/agents/DashboardIntelligence';
import { AthleteGISummary } from '@/components/agi/AthleteGISummary';
import { NextBadgeNudge } from '@/components/community/NextBadgeNudge';
import { DailyNotePrompt } from '@/components/dashboard/DailyNotePrompt';
import { GrowthAgentsPanel } from '@/components/growth';
import { ReadinessSummaryCard } from '@/components/bodysync/ReadinessSummaryCard';
import { RetestNudge } from '@/components/dashboard/RetestNudge';
import { DeterministicWhyPanel } from '@/components/report/DeterministicWhyPanel';
import { analyzeDeterministicSession } from '@/lib/intelligence/diagnose';
import { format } from 'date-fns';
import { useMemo, type ReactNode } from 'react';
import type { SportId } from '@swingiq/core';
import { SPORT_QUICK_ACTIONS } from '@swingiq/core';
import { getSportConfig } from '@swingiq/core';

// ── Sport-specific quick actions ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Video,
  Upload,
  Target,
  Dumbbell,
  Sun,
  CalendarDays,
  BookOpen,
  TrendingUp,
  MessageSquare,
  ChevronRight,
};

function QuickActions({ sport }: { sport: SportId }) {
  const actions = SPORT_QUICK_ACTIONS[sport] ?? SPORT_QUICK_ACTIONS.golf;
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {actions.map(({ id, label, href, color, icon_name }) => {
        const Icon = ICON_MAP[icon_name] ?? Activity;
        return (
          <Link
            key={id}
            href={href}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${color}`}
          >
            <Icon size={22} />
            <span className="text-xs font-medium text-center">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

// ── Recent video analyses for this sport ─────────────────────

function RecentAnalyses({ sport }: { sport: SportId }) {
  const { video_analyses } = useSwingVantageStore();
  const sportAnalyses = useMemo(
    () =>
      video_analyses
        .filter((v) => v.sport === sport)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [video_analyses, sport],
  );

  if (sportAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <Video size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm mb-4">No video analyses yet.</p>
            <Link href="/video">
              <Button size="sm">
                <Video size={14} /> Analyze Your First Video
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Analyses</CardTitle>
          <Link href="/sessions" className="text-xs text-success-text hover:underline flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        {sportAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{analysis.file_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                </p>
                <Badge variant="info" className="text-xs capitalize">
                  {analysis.camera_angle?.replace('_', ' ')}
                </Badge>
                {analysis.primary_issue && (
                  <Badge variant="warning" className="text-xs truncate max-w-[120px]">
                    ⚠ {analysis.primary_issue}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {analysis.overall_score > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{analysis.overall_score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div className="pt-2">
          <Link href="/video">
            <Button variant="outline" size="sm" className="w-full">
              <Video size={14} /> Analyze New Video
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Primary issue from latest analysis ───────────────────────

function PrimaryIssueCard({ sport }: { sport: SportId }) {
  const { video_analyses } = useSwingVantageStore();
  const latest = useMemo(
    () =>
      video_analyses
        .filter((v) => v.sport === sport && v.primary_issue)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null,
    [video_analyses, sport],
  );

  // Token-free explainable read of the video-detected issue: likely cause,
  // evidence, alternatives, and an honest "deeper look" call. Only when the
  // engine confidently matches a curated cause for this sport.
  const diagnosis = useMemo(() => {
    if (!latest?.primary_issue) return null;
    const d = analyzeDeterministicSession({ sport, issue: latest.primary_issue });
    return d.primary.generated ? null : d;
  }, [latest, sport]);

  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-muted-foreground" />
            <CardTitle>Primary Issue</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="py-4 text-center">
            <Target size={28} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No analysis yet.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Upload a video to identify your #1 priority.
            </p>
            <Link href="/video" className="mt-3 inline-block">
              <Button size="sm" variant="outline">Analyze Video</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
    <Card className="border-l-4 border-l-error">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-error-text" />
            <CardTitle>Primary Issue</CardTitle>
          </div>
          <Badge variant="warning" className="text-xs">Latest Analysis</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div>
          <h3 className="font-bold text-foreground text-lg">{latest.primary_issue}</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Detected in: {latest.file_name} · {format(new Date(latest.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="p-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} className="text-accent-secondary" />
            <p className="text-xs font-semibold text-accent-secondary">Video-derived analysis</p>
          </div>
          <p className="text-xs text-accent-secondary leading-relaxed">
            This detection is based on estimated pose analysis. Confidence is moderate —
            upload additional angles or consult your coach to confirm.
          </p>
        </div>
        <div className="border-t pt-3 flex gap-2">
          <Link href="/training" className="flex-1">
            <Button size="sm" className="w-full">View Drill Plan</Button>
          </Link>
          <Link href="/video" className="flex-1">
            <Button size="sm" variant="outline" className="w-full">Re-Analyze</Button>
          </Link>
        </div>
      </CardBody>
    </Card>
    {diagnosis && (
      <DeterministicWhyPanel
        diagnosis={diagnosis}
        footerNote="This explains the likely cause behind your video-detected issue — confirm it with another angle or your coach."
      />
    )}
    </div>
  );
}

// ── Sport overview stats card ─────────────────────────────────

function SportStatsCard({ sport }: { sport: SportId }) {
  const { video_analyses, training, sessions } = useSwingVantageStore();
  const sportAnalyses = video_analyses.filter((v) => v.sport === sport);
  const sportSessions = sessions.filter((s) => s.sport === sport);

  const latestScore = sportAnalyses
    .filter((v) => v.overall_score > 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    ?.overall_score ?? null;

  return (
    <Card>
      <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">{sportAnalyses.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Videos Analyzed</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">{sportSessions.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sessions Logged</p>
          </div>
          {latestScore !== null && (
            <div className="text-center p-3 bg-success/10 rounded-lg col-span-2">
              <p className="text-3xl font-bold text-success-text">{latestScore}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Latest Analysis Score</p>
            </div>
          )}
        </div>
        {training.streak_days > 0 && (
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Practice streak</span>
            <span className="text-sm font-semibold text-warning-text flex items-center gap-1">
              <Flame size={14} /> {training.streak_days} days
            </span>
          </div>
        )}
        <Link href="/progress">
          <Button variant="outline" size="sm" className="w-full">Full Progress Report</Button>
        </Link>
      </CardBody>
    </Card>
  );
}

// ── Data completeness indicator ───────────────────────────────

function DataCompletenessCard({ sport }: { sport: SportId }) {
  const { profile, sportProfiles } = useSwingVantageStore();
  const sportProfile = (sportProfiles as Record<string, unknown>)[sport];
  const { video_analyses } = useSwingVantageStore();
  const hasAnalysis = video_analyses.some((v) => v.sport === sport);

  const checks = [
    { label: 'Athlete profile', done: !!profile || !!sportProfile },
    { label: 'Video analyzed', done: hasAnalysis },
    { label: 'Training plan active', done: false }, // simplified
  ];

  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Setup Progress</CardTitle>
          <span className="text-sm font-bold text-success-text">{pct}%</span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="w-full h-2 bg-muted rounded-full mb-3">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2 text-sm">
              {check.done ? (
                <CheckCircle2 size={15} className="text-success-text shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
              )}
              <span className={check.done ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ── Sport benchmarks disclaimer ───────────────────────────────

function BenchmarksDisclaimerCard({ sport }: { sport: SportId }) {
  const config = getSportConfig(sport);
  if (!config) return null;
  return (
    <Card className="border-dashed border-border bg-muted">
      <CardBody>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-muted-foreground">About benchmarks: </span>
          {config.evidence_note}
        </p>
      </CardBody>
    </Card>
  );
}

// ── Main NonGolfDashboard ─────────────────────────────────────

export function NonGolfDashboard({ children }: { children?: ReactNode }) {
  const { activeSport, sportEmoji, sportName } = useSport();
  const { video_analyses, training } = useSwingVantageStore();

  const hasVideoAnalysis = video_analyses.some((v) => v.sport === activeSport);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} Welcome back!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {sportName} performance overview and next steps.
          </p>
        </div>
        {training.streak_days > 1 && (
          <div className="flex items-center gap-1 text-warning-text font-bold text-sm">
            <Flame size={16} /> {training.streak_days}-day streak
          </div>
        )}
      </div>

      {/* Slotted directly under the greeting: Founding-Member progress, then the
          intent front door and first-week plan (passed from the page). */}
      {children}

      {/* BodySync: today's readiness + recommended session (only when enabled) */}
      <ReadinessSummaryCard />

      {/* Intelligent product layer: Welcome Back / next best step + insights */}
      <DashboardIntelligence />

      {/* Close the loop: newest retest result + the most-urgent "go retest"
          reminder. Self-hides until there's something due or a result to show. */}
      <RetestNudge />

      {/* Athlete General Intelligence: cross-sport keystone + goal, links to /agi */}
      <AthleteGISummary />

      {/* Goal-gradient: the closest badge left to earn */}
      <NextBadgeNudge />

      {/* Daily check-in: "How did you play today?" → feeds the AI player profile */}
      <DailyNotePrompt />

      {/* Growth agents: churn-aware next step + activation progress + earn-moments */}
      <GrowthAgentsPanel />

      {/* Quick actions */}
      <QuickActions sport={activeSport} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Primary issue + Recent analyses */}
        <div className="lg:col-span-2 space-y-5">
          <PrimaryIssueCard sport={activeSport} />
          <RecentAnalyses sport={activeSport} />
        </div>

        {/* Right: Stats + Setup progress + Benchmarks note */}
        <div className="space-y-5">
          <SportStatsCard sport={activeSport} />
          <DataCompletenessCard sport={activeSport} />

          {/* Practice reminder */}
          {training.streak_days === 0 && hasVideoAnalysis && (
            <Card className="border-warning/30 bg-warning/10">
              <CardBody>
                <p className="text-sm font-medium text-warning-text mb-1">
                  No practice logged yet
                </p>
                <p className="text-xs text-warning-text mb-3">
                  Log a practice session to start your streak and track consistency.
                </p>
                <Link href="/training">
                  <Button size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90 w-full">
                    Start Training
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* AI Coach CTA */}
          <Card className="border-accent-secondary/25 bg-accent-secondary/10">
            <CardBody>
              <p className="text-sm font-bold text-foreground mb-1">AI Coach</p>
              <p className="text-xs text-accent-secondary mb-3">
                Ask anything about your {sportName.toLowerCase()} development — technique, drills, timing, or next steps.
              </p>
              <Link href="/ai-coach">
                <Button size="sm" className="bg-accent-secondary text-accent-secondary-foreground hover:bg-accent-secondary/90 w-full">
                  <MessageSquare size={14} /> Ask AI Coach
                </Button>
              </Link>
            </CardBody>
          </Card>

          <BenchmarksDisclaimerCard sport={activeSport} />
        </div>
      </div>
    </div>
  );
}
