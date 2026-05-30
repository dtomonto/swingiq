'use client';

import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, Upload, Activity } from 'lucide-react';
import Link from 'next/link';
import { useSwingIQStore } from '@/store';
import { computeSwingScores, runDiagnosticEngine } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { format } from 'date-fns';

interface SessionSnapshot {
  id: string;
  name: string;
  date: string;
  overall: number;
  face_control: number;
  path_control: number;
  strike_quality: number;
  shot_count: number;
  club_name: string;
  primary_issue: string | null;
  avg_carry: number | null;
  avg_smash: number | null;
  avg_face_to_path: number | null;
}

function TrendBadge({ change }: { change: number }) {
  if (change > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
        <TrendingUp size={12} /> +{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600">
        <TrendingDown size={12} /> {change}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-400">
      <Minus size={12} /> 0
    </span>
  );
}

export default function ProgressPage() {
  const { sessions } = useSwingIQStore();

  // Build snapshots from scored sessions (newest-first)
  const snapshots = useMemo<SessionSnapshot[]>(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return sorted
      .filter((s) => s.shots.length > 0)
      .slice(0, 6) // keep up to 6 most recent
      .map((s) => {
        // If already scored and diagnosed, use stored score; else re-run engine
        let overall = s.swing_score ?? 0;
        let face_control = 0;
        let path_control = 0;
        let strike_quality = 0;
        let avg_carry: number | null = null;
        let avg_smash: number | null = null;
        let avg_face_to_path: number | null = null;

        try {
          const result = runDiagnosticEngine(
            s.shots as Shot[],
            s.club_category || 'mid_iron',
            s.id,
            'local',
          );
          const scores = computeSwingScores(result.stats);
          overall = scores.overall;
          face_control = scores.face_control;
          path_control = scores.path_control;
          strike_quality = scores.strike_quality;
          avg_carry = result.stats.avg_carry ?? null;
          avg_smash = result.stats.avg_smash_factor ?? null;
          avg_face_to_path = result.stats.avg_face_to_path ?? null;
        } catch {
          // fall back to stored swing_score
        }

        return {
          id: s.id,
          name: s.name,
          date: s.created_at,
          overall,
          face_control,
          path_control,
          strike_quality,
          shot_count: s.shot_count,
          club_name: s.club_name,
          primary_issue: s.diagnoses[0]?.rule?.name ?? null,
          avg_carry,
          avg_smash,
          avg_face_to_path,
        };
      });
  }, [sessions]);

  // Trend: compare newest vs oldest in window
  const newest = snapshots[0] ?? null;
  const oldest = snapshots[snapshots.length - 1] ?? null;
  const overallChange = newest && oldest && newest.id !== oldest.id
    ? newest.overall - oldest.overall
    : 0;
  const faceChange = newest && oldest && newest.id !== oldest.id
    ? newest.face_control - oldest.face_control
    : 0;
  const pathChange = newest && oldest && newest.id !== oldest.id
    ? newest.path_control - oldest.path_control
    : 0;
  const strikeChange = newest && oldest && newest.id !== oldest.id
    ? newest.strike_quality - oldest.strike_quality
    : 0;

  // Most improved sub-score
  const improvements = [
    { label: 'Overall Score', change: overallChange },
    { label: 'Face Control', change: faceChange },
    { label: 'Path Control', change: pathChange },
    { label: 'Strike Quality', change: strikeChange },
  ];
  const mostImproved = [...improvements].sort((a, b) => b.change - a.change)[0]!;
  const needsWork = [...improvements].sort((a, b) => a.change - b.change)[0]!;

  // ── Empty state ─────────────────────────────────────────────
  if (!sessions.length) {
    return (
      <AppShell>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="text-center py-20">
            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">No sessions yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Import sessions to track your progress over time.
            </p>
            <Link href="/sessions/import">
              <Button>
                <Upload size={16} /> Import Your First Session
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const periodLabel =
    snapshots.length > 1
      ? `${snapshots.length} sessions · ${format(new Date(oldest!.date), 'MMM d')} → ${format(new Date(newest!.date), 'MMM d, yyyy')}`
      : 'First session';

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">{periodLabel}</p>
        </div>

        {/* Score snapshots — show last 4 */}
        <div className={`grid gap-4 ${snapshots.length >= 4 ? 'grid-cols-4' : snapshots.length === 3 ? 'grid-cols-3' : snapshots.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {[...snapshots].reverse().slice(-4).map((snap, idx, arr) => (
            <Card
              key={snap.id}
              className={idx === arr.length - 1 ? 'ring-2 ring-green-400' : ''}
            >
              <CardBody className="text-center py-5">
                <p className="text-xs text-gray-500 mb-1 truncate">
                  {idx === arr.length - 1 ? 'Latest' : format(new Date(snap.date), 'MMM d')}
                </p>
                <p className="text-xs text-gray-400 mb-3 truncate">{snap.club_name}</p>
                <ScoreRing score={snap.overall} size={70} strokeWidth={6} label="Overall" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Face</p>
                    <p className="font-bold text-sm text-gray-900">{snap.face_control}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Strike</p>
                    <p className="font-bold text-sm text-gray-900">{snap.strike_quality}</p>
                  </div>
                </div>
                {snap.primary_issue && (
                  <Badge variant="warning" className="mt-2 text-xs truncate max-w-full">
                    {snap.primary_issue.length > 20
                      ? snap.primary_issue.substring(0, 20) + '…'
                      : snap.primary_issue}
                  </Badge>
                )}
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Improvements summary */}
        {snapshots.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Score Changes ({snapshots.length} sessions)</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {[
                  { metric: 'Overall Score', before: oldest!.overall, after: newest!.overall, change: overallChange },
                  { metric: 'Face Control', before: oldest!.face_control, after: newest!.face_control, change: faceChange },
                  { metric: 'Path Control', before: oldest!.path_control, after: newest!.path_control, change: pathChange },
                  { metric: 'Strike Quality', before: oldest!.strike_quality, after: newest!.strike_quality, change: strikeChange },
                ].map(({ metric, before, after, change }) => (
                  <div key={metric} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700 font-medium">{metric}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {before} → {after}
                        </span>
                        <TrendBadge change={change} />
                      </div>
                    </div>
                    <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      {/* Baseline bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
                        style={{ width: `${before}%` }}
                      />
                      {/* Current bar */}
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                          change >= 0 ? 'bg-green-500' : 'bg-red-400'
                        }`}
                        style={{ width: `${after}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Physical stats trend */}
        {snapshots.length > 1 && (newest?.avg_carry !== null || newest?.avg_smash !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>Ball Data Trend</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-3 gap-4">
                {newest?.avg_carry !== null && oldest?.avg_carry !== null && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Avg Carry</p>
                    <div className="text-lg font-bold text-gray-900">{Math.round(newest!.avg_carry!)} yds</div>
                    {(() => {
                      const delta = newest!.avg_carry! - oldest!.avg_carry!;
                      return delta !== 0 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {delta > 0 ? '+' : ''}{Math.round(delta)} yds vs first
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
                {newest?.avg_smash !== null && oldest?.avg_smash !== null && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Smash Factor</p>
                    <div className="text-lg font-bold text-gray-900">{newest!.avg_smash!.toFixed(2)}</div>
                    {(() => {
                      const delta = newest!.avg_smash! - oldest!.avg_smash!;
                      return Math.abs(delta) > 0.005 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(3)} vs first
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
                {newest?.avg_face_to_path !== null && oldest?.avg_face_to_path !== null && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Face-to-Path</p>
                    <div className="text-lg font-bold text-gray-900">{Math.abs(newest!.avg_face_to_path!).toFixed(1)}°</div>
                    {(() => {
                      const delta = Math.abs(newest!.avg_face_to_path!) - Math.abs(oldest!.avg_face_to_path!);
                      return Math.abs(delta) > 0.2 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta < 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}° vs first
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Most improved / needs work */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Most Improved</p>
              {mostImproved.change > 0 ? (
                <>
                  <p className="text-lg font-bold text-green-600">{mostImproved.label}</p>
                  <p className="text-sm text-gray-600">+{mostImproved.change} points</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Import more sessions to track improvement.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Current Priority</p>
              {newest?.primary_issue ? (
                <>
                  <p className="text-lg font-bold text-red-600 leading-tight">{newest.primary_issue}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Latest session · {newest.club_name}
                  </p>
                </>
              ) : needsWork.change < 0 ? (
                <>
                  <p className="text-lg font-bold text-red-600">{needsWork.label}</p>
                  <p className="text-sm text-gray-600">{needsWork.change} points — needs attention</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 mt-1">No issues flagged in latest session. Keep going!</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Session history list */}
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <Link
                  key={snap.id}
                  href={`/sessions/${snap.id}`}
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 px-1 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{snap.name}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(snap.date), 'MMM d, yyyy')} · {snap.shot_count} shots ·{' '}
                      {snap.club_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{snap.overall}</span>
                    <span className="text-xs text-gray-400">Score</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
