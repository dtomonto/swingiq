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
import { useSport } from '@/contexts/SportContext';
import { NonGolfProgress } from './NonGolfProgress';
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

// ── SVG score trend line chart ───────────────────────────────

interface SparkSnapshot {
  overall: number;
  date: string;
  name: string;
}

function ScoreTrendChart({ snapshots }: { snapshots: SparkSnapshot[] }) {
  if (snapshots.length < 2) return null;

  // Oldest → newest (left to right)
  const ordered = [...snapshots].reverse();

  const W = 600;
  const H = 170;
  const pad = { top: 24, bottom: 32, left: 36, right: 16 };

  const scores = ordered.map((s) => s.overall);
  const minS = Math.max(0, Math.min(...scores) - 8);
  const maxS = Math.min(100, Math.max(...scores) + 8);

  const toX = (i: number) =>
    pad.left + (i / Math.max(1, ordered.length - 1)) * (W - pad.left - pad.right);
  const toY = (score: number) =>
    pad.top + (1 - (score - minS) / (maxS - minS)) * (H - pad.top - pad.bottom);

  const pts = ordered.map((s, i) => ({
    x: toX(i),
    y: toY(s.overall),
    score: s.overall,
    date: s.date,
    name: s.name,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillPath = `${linePath} L${pts.at(-1)!.x},${H - pad.bottom} L${pts[0]!.x},${H - pad.bottom} Z`;

  const trend = pts.at(-1)!.score - pts[0]!.score;
  const lineColor = trend >= 0 ? '#22c55e' : '#ef4444';

  // Grid scores
  const gridScores = [25, 50, 75].filter((v) => v > minS && v < maxS);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: H }}
      aria-label="Score trend over time"
    >
      {/* Grid */}
      {gridScores.map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line
              x1={pad.left}
              y1={y}
              x2={W - pad.right}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            <text x={pad.left - 4} y={y + 3} fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="end">
              {v}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={fillPath} fill={`${lineColor}18`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots + score labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="hsl(var(--card))" stroke={lineColor} strokeWidth="2.5" />
          <text
            x={p.x}
            y={p.y - 9}
            fontSize="9.5"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontWeight="bold"
          >
            {p.score}
          </text>
          <text
            x={p.x}
            y={H - 6}
            fontSize="8.5"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
          >
            {format(new Date(p.date), 'MMM d')}
          </text>
          <title>{`${p.name}: ${p.score}`}</title>
        </g>
      ))}
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────

function TrendBadge({ change }: { change: number }) {
  if (change > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-success">
        <TrendingUp size={12} /> +{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-semibold text-error">
        <TrendingDown size={12} /> {change}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
      <Minus size={12} /> 0
    </span>
  );
}

export default function ProgressPage() {
  const { isGolf } = useSport();
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

  // Personal bests across ALL sessions (not just last 6)
  const allSnapshots = useMemo<SessionSnapshot[]>(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return sorted.filter((s) => s.shots.length > 0).map((s) => {
      let overall = s.swing_score ?? 0;
      let face_control = 0, path_control = 0, strike_quality = 0;
      let avg_carry: number | null = null, avg_smash: number | null = null, avg_face_to_path: number | null = null;
      try {
        const result = runDiagnosticEngine(s.shots as Shot[], s.club_category || 'mid_iron', s.id, 'local');
        const scores = computeSwingScores(result.stats);
        overall = scores.overall; face_control = scores.face_control;
        path_control = scores.path_control; strike_quality = scores.strike_quality;
        avg_carry = result.stats.avg_carry ?? null;
        avg_smash = result.stats.avg_smash_factor ?? null;
        avg_face_to_path = result.stats.avg_face_to_path ?? null;
      } catch { /* use stored */ }
      return { id: s.id, name: s.name, date: s.created_at, overall, face_control, path_control, strike_quality, shot_count: s.shot_count, club_name: s.club_name, primary_issue: s.diagnoses[0]?.rule?.name ?? null, avg_carry, avg_smash, avg_face_to_path };
    });
  }, [sessions]);

  const bests = useMemo(() => ({
    score: allSnapshots.reduce((b, s) => s.overall > b ? s.overall : b, 0),
    carry: allSnapshots.reduce((b: number | null, s) => (s.avg_carry !== null && (b === null || s.avg_carry > b)) ? s.avg_carry : b, null as number | null),
    smash: allSnapshots.reduce((b: number | null, s) => (s.avg_smash !== null && (b === null || s.avg_smash > b)) ? s.avg_smash : b, null as number | null),
    ftp: allSnapshots.reduce((b: number | null, s) => (s.avg_face_to_path !== null && (b === null || Math.abs(s.avg_face_to_path) < Math.abs(b))) ? s.avg_face_to_path : b, null as number | null),
  }), [allSnapshots]);

  // Rough handicap estimate based on swing score
  function handicapRange(score: number): string {
    if (score >= 85) return 'Scratch / 0–5';
    if (score >= 70) return '6–14';
    if (score >= 55) return '15–25';
    if (score >= 40) return '26–36';
    return '36+';
  }

  // Most improved sub-score
  const improvements = [
    { label: 'Overall Score', change: overallChange },
    { label: 'Face Control', change: faceChange },
    { label: 'Path Control', change: pathChange },
    { label: 'Strike Quality', change: strikeChange },
  ];
  const mostImproved = [...improvements].sort((a, b) => b.change - a.change)[0]!;
  const needsWork = [...improvements].sort((a, b) => a.change - b.change)[0]!;

  // Non-golf: all hooks have already run above, safe to return now
  if (!isGolf) return <NonGolfProgress />;

  // ── Empty state ─────────────────────────────────────────────
  if (!sessions.length) {
    return (
      <AppShell>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="text-center py-20">
            <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium mb-2">No sessions yet</p>
            <p className="text-muted-foreground text-sm mb-6">
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
          <h1 className="text-2xl font-bold text-foreground">Progress Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">{periodLabel}</p>
        </div>

        {/* Score snapshots — show last 4 */}
        <div className={`grid gap-4 ${snapshots.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : snapshots.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : snapshots.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {[...snapshots].reverse().slice(-4).map((snap, idx, arr) => (
            <Card
              key={snap.id}
              className={idx === arr.length - 1 ? 'ring-2 ring-success/50' : ''}
            >
              <CardBody className="text-center py-5">
                <p className="text-xs text-muted-foreground mb-1 truncate">
                  {idx === arr.length - 1 ? 'Latest' : format(new Date(snap.date), 'MMM d')}
                </p>
                <p className="text-xs text-muted-foreground mb-3 truncate">{snap.club_name}</p>
                <ScoreRing score={snap.overall} size={70} strokeWidth={6} label="Overall" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Face</p>
                    <p className="font-bold text-sm text-foreground">{snap.face_control}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Strike</p>
                    <p className="font-bold text-sm text-foreground">{snap.strike_quality}</p>
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

        {/* Score trend chart */}
        {snapshots.length > 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-success" />
                  <CardTitle>Score Over Time</CardTitle>
                </div>
                {overallChange !== 0 && (
                  <TrendBadge change={overallChange} />
                )}
              </div>
            </CardHeader>
            <CardBody>
              <ScoreTrendChart snapshots={snapshots} />
            </CardBody>
          </Card>
        )}

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
                      <p className="text-sm text-foreground font-medium">{metric}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {before} → {after}
                        </span>
                        <TrendBadge change={change} />
                      </div>
                    </div>
                    <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                      {/* Baseline bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-muted rounded-full"
                        style={{ width: `${before}%` }}
                      />
                      {/* Current bar */}
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                          change >= 0 ? 'bg-success' : 'bg-error'
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
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Avg Carry</p>
                    <div className="text-lg font-bold text-foreground">{Math.round(newest!.avg_carry!)} yds</div>
                    {(() => {
                      const delta = newest!.avg_carry! - oldest!.avg_carry!;
                      return delta !== 0 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta > 0 ? 'text-success' : 'text-error'}`}>
                          {delta > 0 ? '+' : ''}{Math.round(delta)} yds vs first
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
                {newest?.avg_smash !== null && oldest?.avg_smash !== null && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Smash Factor</p>
                    <div className="text-lg font-bold text-foreground">{newest!.avg_smash!.toFixed(2)}</div>
                    {(() => {
                      const delta = newest!.avg_smash! - oldest!.avg_smash!;
                      return Math.abs(delta) > 0.005 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta > 0 ? 'text-success' : 'text-error'}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(3)} vs first
                        </p>
                      ) : null;
                    })()}
                  </div>
                )}
                {newest?.avg_face_to_path !== null && oldest?.avg_face_to_path !== null && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Face-to-Path</p>
                    <div className="text-lg font-bold text-foreground">{Math.abs(newest!.avg_face_to_path!).toFixed(1)}°</div>
                    {(() => {
                      const delta = Math.abs(newest!.avg_face_to_path!) - Math.abs(oldest!.avg_face_to_path!);
                      return Math.abs(delta) > 0.2 ? (
                        <p className={`text-xs font-semibold mt-0.5 ${delta < 0 ? 'text-success' : 'text-error'}`}>
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

        {/* Personal Bests + Handicap Estimate */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>🏆 Personal Bests</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Best Score</span>
                <span className="font-bold text-success">{bests.score > 0 ? bests.score : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Best Carry</span>
                <span className="font-bold text-foreground">{bests.carry !== null ? `${Math.round(bests.carry)} yds` : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Best Smash Factor</span>
                <span className="font-bold text-foreground">{bests.smash !== null ? bests.smash.toFixed(2) : '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Squarest Face-to-Path</span>
                <span className="font-bold text-foreground">{bests.ftp !== null ? `${Math.abs(bests.ftp).toFixed(1)}°` : '—'}</span>
              </div>
            </CardBody>
          </Card>

          <Card className="border-accent-secondary/25 bg-accent-secondary/10">
            <CardHeader>
              <CardTitle className="text-foreground">📊 Handicap Estimate</CardTitle>
            </CardHeader>
            <CardBody>
              {newest && newest.overall > 0 ? (
                <>
                  <p className="text-3xl font-black text-accent-secondary">{handicapRange(newest.overall)}</p>
                  <p className="text-xs text-accent-secondary mt-1">estimated handicap range</p>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Based on your latest swing score of <strong>{newest.overall}</strong>.
                    This is a heuristic estimate from your recent swing scores — not an official WHS calculation.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Import sessions to estimate your handicap range.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Most improved / needs work */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs text-muted-foreground mb-1">Most Improved</p>
              {mostImproved.change > 0 ? (
                <>
                  <p className="text-lg font-bold text-success">{mostImproved.label}</p>
                  <p className="text-sm text-muted-foreground">+{mostImproved.change} points</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Import more sessions to track improvement.</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-muted-foreground mb-1">Current Priority</p>
              {newest?.primary_issue ? (
                <>
                  <p className="text-lg font-bold text-error leading-tight">{newest.primary_issue}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Latest session · {newest.club_name}
                  </p>
                </>
              ) : needsWork.change < 0 ? (
                <>
                  <p className="text-lg font-bold text-error">{needsWork.label}</p>
                  <p className="text-sm text-muted-foreground">{needsWork.change} points — needs attention</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No issues flagged in latest session. Keep going!</p>
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
                  className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted px-1 rounded-sm transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{snap.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(snap.date), 'MMM d, yyyy')} · {snap.shot_count} shots ·{' '}
                      {snap.club_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{snap.overall}</span>
                    <span className="text-xs text-muted-foreground">Score</span>
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
