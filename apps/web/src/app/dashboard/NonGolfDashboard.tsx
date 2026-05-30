'use client';

// ============================================================
// SwingIQ — Non-Golf Sport Dashboard
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
  ExternalLink,
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
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { SportId } from '@swingiq/core';
import { SPORT_QUICK_ACTIONS, SPORT_NAV_LABELS } from '@swingiq/core';
import {
  getSportConfig,
  ALL_SPORTS_INCLUDING_GOLF,
} from '@swingiq/core';

// ── Sport-specific "What to do next" banner ───────────────────

interface NextStep {
  icon: string;
  title: string;
  body: string;
  action: { label: string; href: string };
}

function getNextStep(
  sport: SportId,
  hasProfile: boolean,
  hasVideoAnalysis: boolean,
  hasTrainingPlan: boolean,
): NextStep {
  const sportConfig = getSportConfig(sport);
  const sportEmojis: Record<string, string> = {
    tennis: '🎾', baseball: '⚾', softball_slow: '🥎', softball_fast: '🥎',
  };
  const emoji = sportEmojis[sport] ?? '🏃';

  if (!hasProfile) {
    return {
      icon: '👤',
      title: `Create your ${sportConfig?.name ?? 'sport'} profile first.`,
      body: 'Your profile tells SwingIQ your skill level, goals, equipment, and tendencies so every analysis and drill recommendation is tailored to you.',
      action: { label: 'Create Profile', href: '/profile' },
    };
  }
  if (!hasVideoAnalysis) {
    return {
      icon: emoji,
      title: 'Upload your first video to start analysis.',
      body: `SwingIQ will break down your ${sport === 'tennis' ? 'stroke' : 'swing'} phase by phase, identify your primary issue, and build a drill plan matched to your level. Aim for a side-on or face-on angle for best results.`,
      action: { label: 'Analyze Video', href: '/video' },
    };
  }
  if (!hasTrainingPlan) {
    return {
      icon: '🎯',
      title: `Start your recommended training routine.`,
      body: 'Your video analysis identified a priority issue. Focus on one thing at a time — complete the drill plan, then re-analyze to see if it improved.',
      action: { label: 'View Training Plan', href: '/training' },
    };
  }
  return {
    icon: '📈',
    title: `Keep training and re-analyze your ${sport === 'tennis' ? 'stroke' : 'swing'}.`,
    body: 'Upload another video after completing your drill plan to track your improvement. Consistent re-testing is what turns analysis into real progress.',
    action: { label: 'Analyze New Video', href: '/video' },
  };
}

function WhatNextBanner({ step }: { step: NextStep }) {
  return (
    <div className="bg-golf-dark text-white rounded-xl p-5 flex items-start gap-4">
      <span className="text-2xl flex-shrink-0">{step.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-green-300 text-sm mb-0.5">What should I do next?</p>
        <p className="font-bold text-base mb-1">{step.title}</p>
        <p className="text-green-200 text-sm leading-relaxed">{step.body}</p>
      </div>
      <Link href={step.action.href}>
        <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap">
          {step.action.label}
          <ChevronRight size={14} />
        </Button>
      </Link>
    </div>
  );
}

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
  const { video_analyses } = useSwingIQStore();
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
            <Video size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm mb-4">No video analyses yet.</p>
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
          <Link href="/sessions" className="text-xs text-green-600 hover:underline flex items-center gap-1">
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
              <p className="text-sm font-medium text-gray-900 truncate">{analysis.file_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">
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
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {analysis.overall_score > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{analysis.overall_score}</p>
                  <p className="text-xs text-gray-400">Score</p>
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
  const { video_analyses } = useSwingIQStore();
  const latest = useMemo(
    () =>
      video_analyses
        .filter((v) => v.sport === sport && v.primary_issue)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null,
    [video_analyses, sport],
  );

  const sportConfig = getSportConfig(sport);
  const sportName = sportConfig?.name ?? 'Your sport';

  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-gray-400" />
            <CardTitle>Primary Issue</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="py-4 text-center">
            <Target size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No analysis yet.</p>
            <p className="text-gray-400 text-xs mt-1">
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
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <CardTitle>Primary Issue</CardTitle>
          </div>
          <Badge variant="warning" className="text-xs">Latest Analysis</Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{latest.primary_issue}</h3>
          <p className="text-gray-500 text-xs mt-1">
            Detected in: {latest.file_name} · {format(new Date(latest.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info size={14} className="text-blue-600" />
            <p className="text-xs font-semibold text-blue-700">Video-derived analysis</p>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
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
  );
}

// ── Sport overview stats card ─────────────────────────────────

function SportStatsCard({ sport }: { sport: SportId }) {
  const { video_analyses, training, sessions } = useSwingIQStore();
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
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{sportAnalyses.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Videos Analyzed</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{sportSessions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Sessions Logged</p>
          </div>
          {latestScore !== null && (
            <div className="text-center p-3 bg-green-50 rounded-lg col-span-2">
              <p className="text-3xl font-bold text-green-700">{latestScore}</p>
              <p className="text-xs text-gray-500 mt-0.5">Latest Analysis Score</p>
            </div>
          )}
        </div>
        {training.streak_days > 0 && (
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-gray-600">Practice streak</span>
            <span className="text-sm font-semibold text-orange-500 flex items-center gap-1">
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
  const { profile, sportProfiles } = useSwingIQStore();
  const sportProfile = (sportProfiles as Record<string, unknown>)[sport];
  const { video_analyses } = useSwingIQStore();
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
          <span className="text-sm font-bold text-green-600">{pct}%</span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2 text-sm">
              {check.done ? (
                <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
              )}
              <span className={check.done ? 'text-gray-700' : 'text-gray-400'}>{check.label}</span>
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
    <Card className="border-dashed border-gray-300 bg-gray-50">
      <CardBody>
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">About benchmarks: </span>
          {config.evidence_note}
        </p>
      </CardBody>
    </Card>
  );
}

// ── Main NonGolfDashboard ─────────────────────────────────────

export function NonGolfDashboard() {
  const { activeSport, sportEmoji, sportName, sportLabels } = useSport();
  const { profile, sportProfiles } = useSwingIQStore();
  const { video_analyses, training } = useSwingIQStore();

  const hasProfile = !!profile || !!(sportProfiles as Record<string, unknown>)[activeSport];
  const hasVideoAnalysis = video_analyses.some((v) => v.sport === activeSport);
  const hasTrainingPlan = !!training.active_diagnosis_id;

  const nextStep = getNextStep(activeSport, hasProfile, hasVideoAnalysis, hasTrainingPlan);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {sportEmoji} Welcome back!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {sportName} performance overview and next steps.
          </p>
        </div>
        {training.streak_days > 1 && (
          <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
            <Flame size={16} /> {training.streak_days}-day streak
          </div>
        )}
      </div>

      {/* What to do next */}
      <WhatNextBanner step={nextStep} />

      {/* Quick actions */}
      <QuickActions sport={activeSport} />

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Primary issue + Recent analyses */}
        <div className="col-span-2 space-y-5">
          <PrimaryIssueCard sport={activeSport} />
          <RecentAnalyses sport={activeSport} />
        </div>

        {/* Right: Stats + Setup progress + Benchmarks note */}
        <div className="space-y-5">
          <SportStatsCard sport={activeSport} />
          <DataCompletenessCard sport={activeSport} />

          {/* Practice reminder */}
          {training.streak_days === 0 && hasVideoAnalysis && (
            <Card className="border-amber-200 bg-amber-50">
              <CardBody>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  No practice logged yet
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Log a practice session to start your streak and track consistency.
                </p>
                <Link href="/training">
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                    Start Training
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* AI Coach CTA */}
          <Card className="border-purple-200 bg-purple-50">
            <CardBody>
              <p className="text-sm font-bold text-purple-900 mb-1">AI Coach</p>
              <p className="text-xs text-purple-700 mb-3">
                Ask anything about your {sportName.toLowerCase()} development — technique, drills, timing, or next steps.
              </p>
              <Link href="/ai-coach">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white w-full">
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
