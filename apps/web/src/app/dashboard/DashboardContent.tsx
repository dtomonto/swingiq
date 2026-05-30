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
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { useSwingIQStore, useLatestDiagnosedSession, useOverallScore } from '@/store';
import type { DiagnosisOutput } from '@swingiq/core';
import { format } from 'date-fns';
import { useSport } from '@/contexts/SportContext';

// ── "What do I do next?" helper ──────────────────────────────

function WhatNextBanner({ step }: { step: 'no_profile' | 'no_bag' | 'no_data' | 'no_diagnosis' | 'has_diagnosis' }) {
  const steps = {
    no_profile: {
      icon: '👤',
      title: 'Create your golfer profile first.',
      body: 'This tells the app your handicap, scoring goals, common miss, practice setup, and launch monitor. The diagnostic engine uses this to personalize every recommendation.',
      action: { label: 'Create Profile', href: '/profile' },
    },
    no_bag: {
      icon: '🏌️',
      title: 'Add your clubs next.',
      body: 'The app needs your club list so it can compare your driver, woods, irons, wedges, and short-game swings separately. Add at least 3 clubs to start.',
      action: { label: 'Add Clubs', href: '/bag' },
    },
    no_data: {
      icon: '📊',
      title: 'Enter or import your first session.',
      body: 'Start with one club — such as your 7-iron or driver. Import a CSV from your launch monitor, or enter shots manually. The app needs at least 5 shots to build a swing profile.',
      action: { label: 'Import Data', href: '/sessions/import' },
    },
    no_diagnosis: {
      icon: '🔍',
      title: 'Run the diagnostic engine.',
      body: 'The app will compare your swing data to target windows and identify the biggest improvement opportunity. This usually takes under 10 seconds.',
      action: { label: 'Diagnose My Swing', href: '/diagnose' },
    },
    has_diagnosis: {
      icon: '🎯',
      title: 'Start your recommended training routine.',
      body: 'Focus on one issue at a time. Complete the drill plan, then retest with the same club. Small improvements in the right metric can save 2+ strokes per round.',
      action: { label: 'View Training Plan', href: '/training' },
    },
  };

  const s = steps[step];

  return (
    <div className="bg-golf-dark text-white rounded-xl p-5 flex items-start gap-4">
      <span className="text-2xl">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-green-300 text-sm mb-0.5">What should I do next?</p>
        <p className="font-bold text-base mb-1">{s.title}</p>
        <p className="text-green-200 text-sm leading-relaxed">{s.body}</p>
      </div>
      <Link href={s.action.href}>
        <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white whitespace-nowrap">
          {s.action.label}
          <ChevronRight size={14} />
        </Button>
      </Link>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────

const quickActions = [
  { label: 'Import CSV', href: '/sessions/import', icon: Upload, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Diagnose', href: '/diagnose', icon: Target, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { label: 'Add Club', href: '/bag', icon: Plus, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { label: 'Upload Video', href: '/video', icon: Video, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { label: 'Pre-Round', href: '/pre-round', icon: Sun, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { label: 'Training', href: '/training', icon: Dumbbell, color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  { label: 'Drills', href: '/drills', icon: BookOpen, color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
];

// ─────────────────────────────────────────────────────────────

export function DashboardContent() {
  // Real data from localStorage store
  const { profile, clubs, sessions, training } = useSwingIQStore();
  const latestSession = useLatestDiagnosedSession();
  const overallScore = useOverallScore();
  const { activeSport } = useSport();

  const hasProfile = !!profile;
  const hasBag = clubs.length > 0;
  const hasData = sessions.length > 0;
  const hasDiagnosis = !!latestSession;

  const nextStep = !hasProfile ? 'no_profile'
    : !hasBag ? 'no_bag'
    : !hasData ? 'no_data'
    : !hasDiagnosis ? 'no_diagnosis'
    : 'has_diagnosis';

  const topDiagnosis = latestSession?.diagnoses[0];
  const mostRecentSession = sessions[0];

  // Build real diagnosis display object using correct DiagnosisOutput type
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

  // Scores: swing_score is a single aggregate number per session
  const swingScore = latestSession?.swing_score ?? null;
  const displayScore = swingScore ?? overallScore ?? 0;

  // Compute avg carry for most recent session
  const sessionShots = mostRecentSession?.shots ?? [];
  const carryValues = sessionShots
    .map((s) => (s as { carry?: number }).carry)
    .filter((v): v is number => typeof v === 'number' && v > 0);
  const avgCarry = carryValues.length > 0
    ? Math.round(carryValues.reduce((a, b) => a + b, 0) / carryValues.length)
    : null;

  // Clubs with session data
  const clubsWithSessions = clubs
    .filter((c) => sessions.some((s) => s.club_name === c.name))
    .slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here is your performance overview and next steps.</p>
        </div>
        <div className="flex items-center gap-3">
          {training.streak_days > 1 && (
            <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
              <Flame size={16} /> {training.streak_days}-day streak
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
            {mostRecentSession
              ? `Last session: ${format(new Date(mostRecentSession.created_at), 'MMM d')}`
              : 'No sessions yet'}
          </div>
        </div>
      </div>

      {/* What do I do next */}
      <WhatNextBanner step={nextStep} />

      {/* Quick Actions */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
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
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Diagnosis + Training */}
        <div className="col-span-2 space-y-5">
          {/* Primary Diagnosis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
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
                    <h3 className="font-bold text-gray-900 text-lg">{activeDiagnosis.title}</h3>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{activeDiagnosis.summary}</p>
                  </div>

                  {/* Evidence */}
                  {activeDiagnosis.data_points.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeDiagnosis.data_points.map((dp) => (
                          <div
                            key={dp.label}
                            className={`rounded-lg px-3 py-2 ${
                              dp.status === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                            }`}
                          >
                            <p className="text-xs text-gray-500 capitalize">{dp.label}</p>
                            <p className={`font-bold ${dp.status === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                              {dp.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="border-t pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Recommended routine</p>
                      <p className="font-semibold text-gray-900 text-sm capitalize">
                        {activeDiagnosis.routine.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={activeDiagnosis.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
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
                  <Target size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No diagnosis yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Import a session and run the diagnostic engine to see your #1 fix.</p>
                  <Link href="/diagnose" className="mt-3 inline-block">
                    <Button size="sm" variant="outline">Run Diagnosis</Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Retest Protocol */}
          {activeDiagnosis && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <CardTitle>Retest Protocol</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 leading-relaxed">{activeDiagnosis.retest}</p>
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-800 mb-1">How to retest</p>
                  <p className="text-xs text-green-700">
                    Import a new session using the same club after completing your training routine.
                    Compare your diagnosis confidence to see if the pattern has improved.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Session */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Session</CardTitle>
              <Link href="/sessions" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </CardHeader>
            <CardBody>
              {mostRecentSession ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{mostRecentSession.name}</p>
                      <p className="text-xs text-gray-500">
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
                      value={
                        mostRecentSession.diagnoses[0]?.rule?.name ?? '—'
                      }
                      status={mostRecentSession.diagnoses.length > 0 ? 'warning' : 'neutral'}
                    />
                    <MetricCard label="Total Sessions" value={String(sessions.length)} status="neutral" />
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-sm">No sessions yet.</p>
                  <Link href="/sessions/import" className="mt-2 inline-block">
                    <Button size="sm" variant="outline">Import Your First Session</Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Scores */}
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
                  <p className="text-xs text-center text-gray-500">
                    Based on {sessions.filter((s) => s.swing_score !== null).length} scored sessions
                  </p>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-400 text-sm">Import a session to see your swing scores.</p>
                </div>
              )}
              {swingScore !== null && (
                <p className="text-xs text-gray-400 text-center">
                  Last session: {mostRecentSession?.shots.length ?? 0} shots · {mostRecentSession?.name}
                </p>
              )}
            </CardBody>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <CardTitle>Progress</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {sessions.length >= 2 ? (
                <>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">Sessions logged</span>
                    <span className="text-sm font-semibold text-green-600">{sessions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">Practice streak</span>
                    <span className="text-sm font-semibold text-orange-500">
                      {training.streak_days > 0 ? `🔥 ${training.streak_days} days` : '0 days'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-600">Drills completed</span>
                    <span className="text-sm font-semibold text-green-600">{Object.keys(training.drills_completed).length}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">
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

          {/* Clubs Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle>Clubs in Bag</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {clubs.length > 0 ? (
                <>
                  {clubs.slice(0, 3).map((c) => {
                    const clubSessions = sessions.filter((s) => s.club_name === c.name);
                    return (
                      <div key={c.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">
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
                    <Link href="/bag" className="text-xs text-green-600 hover:underline block text-center mt-1">
                      +{clubs.length - 3} more clubs →
                    </Link>
                  )}
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-400 text-sm">No clubs added yet.</p>
                  <Link href="/bag" className="mt-2 inline-block">
                    <Button size="sm" variant="outline">Add Clubs</Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
