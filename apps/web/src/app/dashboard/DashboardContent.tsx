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
  Box,
  ExternalLink,
  Dumbbell,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';

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
  { label: 'Add Club', href: '/bag?action=add', icon: Plus, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { label: 'Upload Video', href: '/video', icon: Video, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { label: '3D Avatar', href: '/avatar', icon: Box, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { label: 'Training', href: '/training', icon: Dumbbell, color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
];

// ── Sample data (replace with real Supabase queries) ─────────

const sampleDiagnosis = {
  category: 'slice_weak_fade',
  title: 'Open Face / Slice Pattern',
  priority: 'critical' as const,
  summary: 'Your last 30 driver swings show an average face-to-path of +4.8° and an average lateral miss of 26 yards right. Face control is your #1 priority.',
  data_points: [
    { label: 'Face-to-Path', value: '+4.8°', status: 'danger' as const },
    { label: 'Club Path', value: '-1.2°', status: 'warning' as const },
    { label: 'Lateral Miss', value: '26 yds R', status: 'danger' as const },
    { label: 'Smash Factor', value: '1.42', status: 'warning' as const },
  ],
  routine: 'Face Control — Block Practice',
  youtube_url: 'https://www.youtube.com/results?search_query=golf+face+control+drill+open+clubface+slice+fix',
  retest: 'Hit 30 driver shots. Target face-to-path under +2.5°.',
};

const sampleScores = {
  overall: 58,
  driver: 42,
  iron: 65,
  wedge: 71,
  face_control: 38,
  path_control: 62,
  strike_quality: 70,
  consistency: 55,
};

const recentSession = {
  name: 'Range Session — Driver',
  date: 'Today, 2:30 PM',
  shots: 30,
  carry_avg: 218,
  primary_miss: '26 yds right',
};

export function DashboardContent() {
  // In production: fetch from Supabase. Using sample data for MVP.
  const hasProfile = true;
  const hasBag = true;
  const hasData = true;
  const hasDiagnosis = true;

  const nextStep = !hasProfile ? 'no_profile'
    : !hasBag ? 'no_bag'
    : !hasData ? 'no_data'
    : !hasDiagnosis ? 'no_diagnosis'
    : 'has_diagnosis';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here is your performance overview and next steps.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
          Last session: {recentSession.date}
        </div>
      </div>

      {/* What do I do next */}
      <WhatNextBanner step={nextStep} />

      {/* Quick Actions */}
      <div className="grid grid-cols-6 gap-3">
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
              <Badge variant="critical">Critical</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{sampleDiagnosis.title}</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{sampleDiagnosis.summary}</p>
              </div>

              {/* Evidence */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
                <div className="grid grid-cols-2 gap-2">
                  {sampleDiagnosis.data_points.map((dp) => (
                    <div
                      key={dp.label}
                      className={`rounded-lg px-3 py-2 ${
                        dp.status === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <p className="text-xs text-gray-500">{dp.label}</p>
                      <p className={`font-bold ${dp.status === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                        {dp.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Recommended routine</p>
                  <p className="font-semibold text-gray-900 text-sm">{sampleDiagnosis.routine}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={sampleDiagnosis.youtube_url}
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
            </CardBody>
          </Card>

          {/* Retest Protocol */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <CardTitle>Retest Protocol</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-700 leading-relaxed">{sampleDiagnosis.retest}</p>
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">Success criteria</p>
                <p className="text-xs text-green-700">Face-to-path under +2.5°. Lateral miss under 10 yards right. Spin axis moves toward 0°.</p>
              </div>
            </CardBody>
          </Card>

          {/* Recent Session */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Session</CardTitle>
              <Link href="/sessions" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{recentSession.name}</p>
                  <p className="text-xs text-gray-500">{recentSession.date}</p>
                </div>
                <Badge variant="info">{recentSession.shots} shots</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Avg Carry" value={recentSession.carry_avg} unit="yds" status="neutral" />
                <MetricCard label="Primary Miss" value={recentSession.primary_miss} status="danger" />
                <MetricCard label="Sessions Total" value="8" status="neutral" />
              </div>
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
              <div className="flex justify-center">
                <ScoreRing score={sampleScores.overall} size={100} strokeWidth={8} label="Overall" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ScoreRing score={sampleScores.driver} size={64} label="Driver" />
                <ScoreRing score={sampleScores.iron} size={64} label="Irons" />
                <ScoreRing score={sampleScores.wedge} size={64} label="Wedges" />
                <ScoreRing score={sampleScores.face_control} size={64} label="Face" />
              </div>
            </CardBody>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <CardTitle>30-Day Trend</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              {[
                { label: 'Face Control', before: 28, after: 38, change: '+10' },
                { label: 'Strike Quality', before: 62, after: 70, change: '+8' },
                { label: 'Carry Avg', before: 208, after: 218, change: '+10 yds', positive: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-green-600">{item.change}</span>
                </div>
              ))}
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
              <CardTitle>Clubs Needing Work</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {[
                { club: 'Driver', issue: 'Open face', score: 42 },
                { club: '6-Iron', issue: 'High spin', score: 51 },
                { club: 'PW', issue: 'Inconsistent carry', score: 55 },
              ].map((c) => (
                <div key={c.club} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.club}</p>
                    <p className="text-xs text-gray-500">{c.issue}</p>
                  </div>
                  <ScoreRing score={c.score} size={40} strokeWidth={4} />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
