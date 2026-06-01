'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendingUp, TrendingDown, Minus, Activity, Upload } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSwingIQStore, type LocalSession } from '@/store';
import { runDiagnosticEngine, computeSwingScores } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import type { ProfessionalSwingReference } from '@swingiq/core';
import { format } from 'date-fns';
import { ReferenceBrowser } from './ReferenceBrowser';
import { SwingComparison } from './SwingComparison';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface SessionAnalysis {
  id: string;
  name: string;
  date: string;
  club_name: string;
  shot_count: number;
  overall: number;
  face_control: number;
  path_control: number;
  strike_quality: number;
  consistency: number;
  avg_carry: number | null;
  avg_ball_speed: number | null;
  avg_face_to_path: number | null;
  avg_club_path: number | null;
  avg_spin_rate: number | null;
  avg_smash_factor: number | null;
  avg_lateral_offline: number | null;
  primary_issue: string | null;
}

function analyzeSession(session: LocalSession): SessionAnalysis {
  let overall = session.swing_score ?? 0;
  let face_control = 0;
  let path_control = 0;
  let strike_quality = 0;
  let consistency = 0;
  let avg_carry: number | null = null;
  let avg_ball_speed: number | null = null;
  let avg_face_to_path: number | null = null;
  let avg_club_path: number | null = null;
  let avg_spin_rate: number | null = null;
  let avg_smash_factor: number | null = null;
  let avg_lateral_offline: number | null = null;

  if (session.shots.length >= 3) {
    try {
      const result = runDiagnosticEngine(
        session.shots as Shot[],
        session.club_category || 'mid_iron',
        session.id,
        'local',
      );
      const scores = computeSwingScores(result.stats);
      overall = scores.overall;
      face_control = scores.face_control;
      path_control = scores.path_control;
      strike_quality = scores.strike_quality;
      consistency = scores.consistency;
      avg_carry = result.stats.avg_carry ?? null;
      avg_ball_speed = result.stats.avg_ball_speed ?? null;
      avg_face_to_path = result.stats.avg_face_to_path ?? null;
      avg_club_path = result.stats.avg_club_path ?? null;
      avg_spin_rate = result.stats.avg_spin_rate ?? null;
      avg_smash_factor = result.stats.avg_smash_factor ?? null;
      avg_lateral_offline = result.stats.avg_lateral_offline ?? null;
    } catch {
      // fall back to stored score
    }
  }

  return {
    id: session.id,
    name: session.name,
    date: session.created_at,
    club_name: session.club_name,
    shot_count: session.shots.length,
    overall,
    face_control,
    path_control,
    strike_quality,
    consistency,
    avg_carry,
    avg_ball_speed,
    avg_face_to_path,
    avg_club_path,
    avg_spin_rate,
    avg_smash_factor,
    avg_lateral_offline,
    primary_issue: session.diagnoses[0]?.rule?.name ?? null,
  };
}

// ──────────────────────────────────────────────────────────────
// Delta & MetricRow (session comparison helpers)
// ──────────────────────────────────────────────────────────────

function Delta({ before, after, unit = '', higherIsBetter = true }: {
  before: number | null;
  after: number | null;
  unit?: string;
  higherIsBetter?: boolean;
}) {
  if (before === null || after === null) return <span className="text-gray-300">—</span>;
  const change = after - before;
  const improved = higherIsBetter ? change > 0 : change < 0;
  const neutral = Math.abs(change) < 0.5;

  if (neutral) return (
    <span className="flex items-center gap-0.5 text-xs text-gray-400">
      <Minus size={10} /> 0{unit}
    </span>
  );

  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', improved ? 'text-green-600' : 'text-red-600')}>
      {improved ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {change > 0 ? '+' : ''}{change.toFixed(1)}{unit}
    </span>
  );
}

function MetricRow({ label, a, b, unit = '', higherIsBetter = true, format: fmt }: {
  label: string;
  a: number | null;
  b: number | null;
  unit?: string;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) {
  const fmtVal = (v: number | null) => {
    if (v === null) return '—';
    return fmt ? fmt(v) : `${v.toFixed(1)}${unit}`;
  };

  const change = a !== null && b !== null ? b - a : null;
  const improved = change !== null ? (higherIsBetter ? change > 0 : change < 0) : null;

  return (
    <div className={cn(
      'grid grid-cols-3 items-center py-2 border-b last:border-0 text-sm',
      improved === true ? 'bg-green-50/50' : improved === false ? 'bg-red-50/50' : '',
    )}>
      <span className="text-gray-600">{label}</span>
      <span className="text-center font-medium text-gray-700">{fmtVal(a)}</span>
      <div className="text-center flex items-center justify-center gap-2">
        <span className="font-medium text-gray-900">{fmtVal(b)}</span>
        <Delta before={a} after={b} unit={unit} higherIsBetter={higherIsBetter} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Session comparison tab content
// ──────────────────────────────────────────────────────────────

function SessionComparisonTab() {
  const { sessions } = useSwingIQStore();

  const sorted = useMemo(() =>
    [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [sessions],
  );

  const [sessionAId, setSessionAId] = useState<string>(sorted[1]?.id ?? '');
  const [sessionBId, setSessionBId] = useState<string>(sorted[0]?.id ?? '');

  const sessionA = sorted.find((s) => s.id === sessionAId) ?? null;
  const sessionB = sorted.find((s) => s.id === sessionBId) ?? null;

  const analysisA = useMemo(() => sessionA ? analyzeSession(sessionA) : null, [sessionA]);
  const analysisB = useMemo(() => sessionB ? analyzeSession(sessionB) : null, [sessionB]);

  if (sorted.length < 2) {
    return (
      <div className="text-center py-20">
        <Activity size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-400 text-lg font-medium mb-2">Need 2+ sessions to compare</p>
        <p className="text-gray-500 text-sm mb-6">
          Import at least two sessions to see how your swing has changed.
        </p>
        <Link href="/sessions/import">
          <Button><Upload size={16} /> Import Session</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Session A (Before)
          </label>
          <select
            value={sessionAId}
            onChange={(e) => setSessionAId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
          >
            {sorted.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === sessionBId}>
                {s.name} — {format(new Date(s.created_at), 'MMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
            Session B (After)
          </label>
          <select
            value={sessionBId}
            onChange={(e) => setSessionBId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-hidden"
          >
            {sorted.map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === sessionAId}>
                {s.name} — {format(new Date(s.created_at), 'MMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Score comparison */}
      {analysisA && analysisB && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Session A summary */}
            <Card className="border-blue-200">
              <CardBody className="text-center py-5">
                <Badge variant="info" className="mb-3">Session A</Badge>
                <p className="font-bold text-gray-900 text-lg mb-0.5">{analysisA.name}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {format(new Date(analysisA.date), 'MMM d, yyyy')} · {analysisA.shot_count} shots · {analysisA.club_name}
                </p>
                <ScoreRing score={analysisA.overall} size={80} strokeWidth={7} label="Overall" />
                {analysisA.primary_issue && (
                  <Badge variant="warning" className="mt-3 text-xs">{analysisA.primary_issue}</Badge>
                )}
              </CardBody>
            </Card>

            {/* Session B summary */}
            <Card className="border-green-200">
              <CardBody className="text-center py-5">
                <Badge variant="default" className="mb-3 bg-green-100 text-green-700">Session B</Badge>
                <p className="font-bold text-gray-900 text-lg mb-0.5">{analysisB.name}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {format(new Date(analysisB.date), 'MMM d, yyyy')} · {analysisB.shot_count} shots · {analysisB.club_name}
                </p>
                <ScoreRing score={analysisB.overall} size={80} strokeWidth={7} label="Overall" />
                {analysisB.primary_issue && (
                  <Badge variant="warning" className="mt-3 text-xs">{analysisB.primary_issue}</Badge>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Scores comparison */}
          <Card>
            <CardHeader>
              <div className="grid grid-cols-3 text-sm font-semibold text-gray-500">
                <span>Metric</span>
                <span className="text-center text-blue-600">Session A</span>
                <span className="text-center text-green-600">Session B</span>
              </div>
            </CardHeader>
            <CardBody className="p-0 px-4">
              <MetricRow label="Overall Score" a={analysisA.overall} b={analysisB.overall} format={(v) => String(Math.round(v))} />
              <MetricRow label="Face Control" a={analysisA.face_control} b={analysisB.face_control} format={(v) => String(Math.round(v))} />
              <MetricRow label="Path Control" a={analysisA.path_control} b={analysisB.path_control} format={(v) => String(Math.round(v))} />
              <MetricRow label="Strike Quality" a={analysisA.strike_quality} b={analysisB.strike_quality} format={(v) => String(Math.round(v))} />
              <MetricRow label="Consistency" a={analysisA.consistency} b={analysisB.consistency} format={(v) => String(Math.round(v))} />
            </CardBody>
          </Card>

          {/* Raw stats comparison */}
          <Card>
            <CardHeader><CardTitle>Ball &amp; Club Data</CardTitle></CardHeader>
            <CardBody className="p-0 px-4">
              <MetricRow label="Avg Carry" a={analysisA.avg_carry} b={analysisB.avg_carry} unit=" yds" higherIsBetter={true} format={(v) => `${Math.round(v)} yds`} />
              <MetricRow label="Ball Speed" a={analysisA.avg_ball_speed} b={analysisB.avg_ball_speed} unit=" mph" higherIsBetter={true} format={(v) => `${v.toFixed(0)} mph`} />
              <MetricRow label="Smash Factor" a={analysisA.avg_smash_factor} b={analysisB.avg_smash_factor} higherIsBetter={true} />
              <MetricRow label="Spin Rate" a={analysisA.avg_spin_rate} b={analysisB.avg_spin_rate} unit=" rpm" higherIsBetter={false} format={(v) => `${Math.round(v)} rpm`} />
              <MetricRow label="Face-to-Path" a={analysisA.avg_face_to_path != null ? Math.abs(analysisA.avg_face_to_path) : null} b={analysisB.avg_face_to_path != null ? Math.abs(analysisB.avg_face_to_path) : null} unit="°" higherIsBetter={false} />
              <MetricRow label="Club Path" a={analysisA.avg_club_path} b={analysisB.avg_club_path} unit="°" higherIsBetter={false} format={(v) => `${v.toFixed(1)}°`} />
              <MetricRow label="Lateral Miss" a={analysisA.avg_lateral_offline != null ? Math.abs(analysisA.avg_lateral_offline) : null} b={analysisB.avg_lateral_offline != null ? Math.abs(analysisB.avg_lateral_offline) : null} unit=" yds" higherIsBetter={false} format={(v) => `${v.toFixed(0)} yds`} />
            </CardBody>
          </Card>

          {/* Verdict */}
          <Card className={cn(
            'border-2',
            analysisB.overall > analysisA.overall ? 'border-green-400 bg-green-50' : analysisB.overall < analysisA.overall ? 'border-red-300 bg-red-50' : 'border-gray-200',
          )}>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Verdict</p>
              {analysisB.overall > analysisA.overall ? (
                <div>
                  <p className="font-bold text-green-700 text-lg">
                    Improved by {analysisB.overall - analysisA.overall} points
                  </p>
                  <p className="text-sm text-green-600 mt-0.5">
                    Session B shows meaningful improvement. Keep working on the same routine.
                  </p>
                </div>
              ) : analysisB.overall < analysisA.overall ? (
                <div>
                  <p className="font-bold text-red-700 text-lg">
                    Score dropped by {analysisA.overall - analysisB.overall} points
                  </p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {analysisB.primary_issue
                      ? `Primary issue in Session B: ${analysisB.primary_issue}. Focus the next training block on this.`
                      : "Review Session B's diagnosis for the main culprit."}
                  </p>
                </div>
              ) : (
                <p className="font-bold text-gray-700">No change in overall score. Check specific sub-scores for micro-trends.</p>
              )}
            </CardBody>
          </Card>

          {/* Links */}
          <div className="flex gap-3">
            <Link href={`/sessions/${analysisA.id}`} className="flex-1">
              <Button variant="outline" className="w-full">View Session A</Button>
            </Link>
            <Link href={`/sessions/${analysisB.id}`} className="flex-1">
              <Button className="w-full">View Session B</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────

type Tab = 'browse' | 'compare';

export default function ComparePage() {
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [selectedReference, setSelectedReference] = useState<ProfessionalSwingReference | null>(null);

  // Determine active sport — default to golf for now
  // This could be wired to a global sport context in the future
  const activeSport = 'golf' as const;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'browse', label: 'Browse References' },
    { id: 'compare', label: 'Side-by-Side Comparison' },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse professional references and compare your swing side by side, or compare two of your own sessions.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {tab.label}
              {tab.id === 'compare' && selectedReference && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                  1
                </span>
              )}
            </button>
          ))}

          {/* Session comparison link */}
          <div className="ml-auto flex items-center pb-1">
            <button
              onClick={() => setActiveTab('browse')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Session vs Session
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'browse' ? (
          <div className="space-y-6">
            <ReferenceBrowser
              activeSport={activeSport}
              selectedReference={selectedReference}
              onSelectReference={(ref) => {
                setSelectedReference(ref);
                setActiveTab('compare');
              }}
            />

            {/* Session comparison section below the browser */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Session vs Session</h2>
              <SessionComparisonTab />
            </div>
          </div>
        ) : (
          <SwingComparison
            selectedReference={selectedReference}
            onClearReference={() => setSelectedReference(null)}
            onBrowseReferences={() => setActiveTab('browse')}
          />
        )}
      </div>
    </AppShell>
  );
}
