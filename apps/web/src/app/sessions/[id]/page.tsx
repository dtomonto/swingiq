'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useSwingIQStore } from '@/store';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { ScoreRing } from '@/components/ui/ScoreRing';
import {
  ArrowLeft, Target, TrendingUp, AlertCircle, ExternalLink,
  Calendar, Layers, ChevronRight, Info, Edit2, Check, X as XIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  runDiagnosticEngine,
  computeSwingScores,
  buildSessionInsight,
  getRoutineForDiagnosis,
  shotsToDispersionPoints,
  computeDispersion,
  predictFromDiagnosis,
} from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useMemo, useState, useEffect, useRef } from 'react';
import { DispersionChart } from '@/components/charts/DispersionChart';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, updateSession, setActiveDiagnosis, profile } = useSwingIQStore();

  const session = sessions.find((s) => s.id === id);

  const analysis = useMemo(() => {
    if (!session || session.shots.length < 3) return null;
    const shots = session.shots as Shot[];
    const clubCategory = session.club_category || 'mid_iron';
    const result = runDiagnosticEngine(shots, clubCategory, session.id, 'local');
    const scores = computeSwingScores(result.stats);
    const insight = buildSessionInsight(result);
    return { diagnoses: result.diagnoses, stats: result.stats, scores, insight };
  }, [session]);

  const dispersion = useMemo(() => {
    if (!session || session.shots.length < 3) return null;
    const pts = shotsToDispersionPoints(
      (session.shots as Shot[]).map((s) => ({ ball_data: s.ball_data as unknown as Record<string, unknown> }))
    );
    return pts.length >= 3 ? computeDispersion(pts) : null;
  }, [session]);

  const strokePrediction = useMemo(() => {
    if (!analysis?.diagnoses.length) return null;
    const top = analysis.diagnoses[0]!;
    const stats = analysis.stats;
    return predictFromDiagnosis(top.rule.id, {
      avg_face_to_path: stats.avg_face_to_path,
      avg_lateral_miss: stats.avg_lateral_offline,
      avg_smash_factor: stats.avg_smash_factor,
    });
  }, [analysis]);

  // Within-session shot trend: compare first half vs second half
  const shotTrend = useMemo(() => {
    const shots = (session?.shots ?? []) as Shot[];
    if (shots.length < 6) return null; // Need at least 6 to split meaningfully
    const mid = Math.floor(shots.length / 2);
    const firstHalf = shots.slice(0, mid);
    const secondHalf = shots.slice(mid);

    function avg(arr: (number | null)[]): number | null {
      const vals = arr.filter((v): v is number => v !== null && !isNaN(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }

    const f = {
      carry: avg(firstHalf.map((s) => s.ball_data.carry_distance)),
      smash: avg(firstHalf.map((s) => s.ball_data.smash_factor)),
      ftp: avg(firstHalf.map((s) => s.club_data.face_to_path)),
    };
    const l = {
      carry: avg(secondHalf.map((s) => s.ball_data.carry_distance)),
      smash: avg(secondHalf.map((s) => s.ball_data.smash_factor)),
      ftp: avg(secondHalf.map((s) => s.club_data.face_to_path)),
    };

    const carryDelta = f.carry !== null && l.carry !== null ? l.carry - f.carry : null;
    const smashDelta = f.smash !== null && l.smash !== null ? l.smash - f.smash : null;
    const ftpDelta = f.ftp !== null && l.ftp !== null ? Math.abs(l.ftp) - Math.abs(f.ftp) : null;

    const warmingUp = (carryDelta !== null && carryDelta > 2) || (smashDelta !== null && smashDelta > 0.02);
    const fatiguing = (carryDelta !== null && carryDelta < -3) || (smashDelta !== null && smashDelta < -0.03);
    const consistent = !warmingUp && !fatiguing;

    return { f, l, carryDelta, smashDelta, ftpDelta, warmingUp, fatiguing, consistent, midPoint: mid };
  }, [session]);

  // Save diagnoses + swing score back to session on first analysis.
  // Runs as a post-render effect (never during render) and is guarded by a
  // ref so it persists at most once per session id — otherwise a session that
  // yields zero diagnoses would keep `diagnoses.length === 0` and update on
  // every render, causing an infinite update loop.
  const persistedSessionId = useRef<string | null>(null);
  useEffect(() => {
    if (!session || !analysis) return;
    if (session.diagnoses.length > 0) return;
    if (persistedSessionId.current === id) return;
    persistedSessionId.current = id;
    updateSession(id, {
      diagnoses: analysis.diagnoses,
      swing_score: analysis.scores.overall,
    });
  }, [analysis, session, id, updateSession]);

  if (!session) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Session not found.</p>
          <Link href="/sessions">
            <Button variant="outline" className="mt-4">
              <ArrowLeft size={14} /> Back
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const topDiagnosis = analysis?.diagnoses[0];
  const skillLevel = (profile?.skill_level ?? 'beginner') as 'beginner' | 'intermediate' | 'advanced' | 'elite';
  const routine = topDiagnosis ? getRoutineForDiagnosis(topDiagnosis.rule.id, skillLevel) : null;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft size={14} /> Sessions
            </button>
            <h1 className="text-2xl font-bold text-foreground">{session.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(new Date(session.created_at), 'MMMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{session.shot_count} shots</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground capitalize">{session.club_name}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {topDiagnosis && (
              <Button
                onClick={() => {
                  setActiveDiagnosis(topDiagnosis.rule.id, session.id);
                  router.push('/training');
                }}
              >
                <Target size={14} /> Start Training
              </Button>
            )}
          </div>
        </div>

        {/* Session notes */}
        {session.notes && session.notes.trim() && (
          <div className="flex items-start gap-2 p-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-lg">
            <Info size={15} className="text-accent-secondary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{session.notes}</p>
          </div>
        )}

        {session.shots.length < 3 ? (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-muted-foreground">
                This session has fewer than 3 shots — not enough for analysis.
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Score overview */}
            {analysis && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {(
                  [
                    ['Overall', analysis.scores.overall],
                    ['Face', analysis.scores.face_control],
                    ['Path', analysis.scores.path_control],
                    ['Strike', analysis.scores.strike_quality],
                    ['Dispersion', analysis.scores.dispersion],
                  ] as [string, number][]
                ).map(([key, val]) => (
                  <Card key={key}>
                    <CardBody className="text-center py-3">
                      <ScoreRing score={val} size={56} strokeWidth={5} />
                      <p className="text-xs text-muted-foreground mt-1">{key}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Primary diagnosis */}
            {topDiagnosis && (
              <Card className="border-l-4 border-l-error">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-error" />
                      <CardTitle>Primary Diagnosis</CardTitle>
                    </div>
                    <Badge variant="critical" className="capitalize">
                      {topDiagnosis.rule.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{topDiagnosis.rule.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{topDiagnosis.rule.likely_cause}</p>
                  </div>
                  {strokePrediction && strokePrediction.estimates.length > 0 && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <p className="text-xs font-semibold text-primary mb-1">
                        Stroke Savings Potential
                      </p>
                      <p className="text-sm text-primary">{strokePrediction.prioritized_action}</p>
                      <p className="text-xs text-primary mt-1">
                        Total potential:{' '}
                        <strong>~{strokePrediction.total_potential_savings} strokes/round</strong>
                        {strokePrediction.estimates[0]?.handicap_improvement_estimate
                          ? ` (est. ${strokePrediction.estimates[0].handicap_improvement_estimate} handicap improvement)`
                          : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{strokePrediction.caveat}</p>
                    </div>
                  )}
                  {routine && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended routine</p>
                        <p className="font-semibold text-sm text-foreground">{routine.name}</p>
                      </div>
                      <div className="flex gap-2">
                        {routine.drill_recommendations[0]?.youtube_search_url && (
                          <a
                            href={routine.drill_recommendations[0].youtube_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-error hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> YouTube
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveDiagnosis(topDiagnosis.rule.id, session.id);
                            router.push('/training');
                          }}
                        >
                          Train <ChevronRight size={12} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* What to do next */}
            {analysis?.insight && (
              <Card className="border-primary/30 bg-primary/10">
                <CardBody className="space-y-2">
                  <p className="text-sm font-semibold text-primary">
                    What do I do next?
                  </p>
                  <p className="text-sm text-primary">{analysis.insight.what_do_i_do_next}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-card rounded-lg p-3 border border-primary/30">
                      <p className="text-xs text-muted-foreground">Technical Focus</p>
                      <p className="text-sm font-semibold text-foreground">
                        {analysis.insight.technical_focus}
                      </p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border border-primary/30">
                      <p className="text-xs text-muted-foreground">Ball Flight</p>
                      <p className="text-sm font-semibold text-foreground">
                        {analysis.insight.ball_flight_focus}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Dispersion Chart */}
            {dispersion && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={18} className="text-accent-secondary" />
                      <CardTitle>Shot Dispersion</CardTitle>
                    </div>
                    <Badge
                      variant={
                        dispersion.consistency_grade === 'A'
                          ? 'success'
                          : dispersion.consistency_grade === 'B'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      Grade {dispersion.consistency_grade} — {dispersion.consistency_label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <MetricCard
                      label="Mean Lateral"
                      value={`${dispersion.mean_lateral > 0 ? '+' : ''}${dispersion.mean_lateral} yds`}
                      status={Math.abs(dispersion.mean_lateral) > 10 ? 'danger' : 'neutral'}
                    />
                    <MetricCard
                      label="Lateral StdDev"
                      value={`${dispersion.std_lateral} yds`}
                      status={
                        dispersion.std_lateral > 15
                          ? 'danger'
                          : dispersion.std_lateral > 8
                          ? 'warning'
                          : 'good'
                      }
                    />
                    <MetricCard
                      label="On Target"
                      value={`${dispersion.pct_on_target}%`}
                      status={dispersion.pct_on_target > 60 ? 'good' : 'warning'}
                    />
                    <MetricCard
                      label="Carry Range"
                      value={`${dispersion.carry_range} yds`}
                      status={dispersion.carry_range > 40 ? 'danger' : 'neutral'}
                    />
                  </div>
                  <DispersionChart stats={dispersion} height={280} />
                </CardBody>
              </Card>
            )}

            {/* Shot shape breakdown */}
            {session.shots.length >= 3 && (
              <ShotShapeBreakdown shots={session.shots as Shot[]} />
            )}

            {/* All diagnoses */}
            {analysis && analysis.diagnoses.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-muted-foreground" />
                    <CardTitle>All Diagnosed Patterns</CardTitle>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {analysis.diagnoses.slice(1).map((d, i) => (
                    <div
                      key={d.rule.id}
                      className="flex items-start gap-3 py-2 border-b last:border-0"
                    >
                      <span className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 2}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{d.rule.name}</p>
                        <p className="text-xs text-muted-foreground">{d.rule.likely_cause}</p>
                      </div>
                      <Badge variant="info" className="ml-auto shrink-0 capitalize">
                        {d.rule.priority}
                      </Badge>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            {/* Within-session trend */}
            {shotTrend && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={18} className="text-accent-secondary" />
                      <CardTitle>Within-Session Trend</CardTitle>
                    </div>
                    <Badge
                      variant={shotTrend.warmingUp ? 'success' : shotTrend.fatiguing ? 'warning' : 'info'}
                    >
                      {shotTrend.warmingUp ? '📈 Warming Up' : shotTrend.fatiguing ? '📉 Fatiguing' : '→ Consistent'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-xs text-muted-foreground mb-3">
                    First {shotTrend.midPoint} shots vs last {shotTrend.midPoint} shots
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Avg Carry</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-foreground">{shotTrend.f.carry !== null ? `${Math.round(shotTrend.f.carry)}` : '—'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-foreground">{shotTrend.l.carry !== null ? `${Math.round(shotTrend.l.carry)}` : '—'}</span>
                      </div>
                      {shotTrend.carryDelta !== null && (
                        <p className={`text-xs font-semibold mt-0.5 ${shotTrend.carryDelta > 1 ? 'text-primary' : shotTrend.carryDelta < -1 ? 'text-error' : 'text-muted-foreground'}`}>
                          {shotTrend.carryDelta > 0 ? '+' : ''}{Math.round(shotTrend.carryDelta)} yds
                        </p>
                      )}
                    </div>
                    <div className="text-center bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Smash Factor</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-foreground">{shotTrend.f.smash !== null ? shotTrend.f.smash.toFixed(2) : '—'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-foreground">{shotTrend.l.smash !== null ? shotTrend.l.smash.toFixed(2) : '—'}</span>
                      </div>
                      {shotTrend.smashDelta !== null && (
                        <p className={`text-xs font-semibold mt-0.5 ${shotTrend.smashDelta > 0.01 ? 'text-primary' : shotTrend.smashDelta < -0.01 ? 'text-error' : 'text-muted-foreground'}`}>
                          {shotTrend.smashDelta > 0 ? '+' : ''}{shotTrend.smashDelta.toFixed(3)}
                        </p>
                      )}
                    </div>
                    <div className="text-center bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Face-to-Path</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium text-foreground">{shotTrend.f.ftp !== null ? `${Math.abs(shotTrend.f.ftp).toFixed(1)}°` : '—'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-foreground">{shotTrend.l.ftp !== null ? `${Math.abs(shotTrend.l.ftp).toFixed(1)}°` : '—'}</span>
                      </div>
                      {shotTrend.ftpDelta !== null && (
                        <p className={`text-xs font-semibold mt-0.5 ${shotTrend.ftpDelta < -0.3 ? 'text-primary' : shotTrend.ftpDelta > 0.3 ? 'text-error' : 'text-muted-foreground'}`}>
                          FTP: {shotTrend.ftpDelta > 0 ? '+' : ''}{shotTrend.ftpDelta.toFixed(1)}°
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    {shotTrend.warmingUp
                      ? 'Your swing improved as the session progressed — great warm-up effect!'
                      : shotTrend.fatiguing
                      ? 'Performance dropped toward the end — consider shortening sessions or taking more breaks.'
                      : 'Very consistent throughout the session. Good mental focus.'}
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Shot table */}
            <Card>
              <CardHeader>
                <CardTitle>Shot Data ({session.shot_count} shots)</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-right py-2 px-2">Club</th>
                        <th className="text-right py-2 px-2">Carry</th>
                        <th className="text-right py-2 px-2">Ball Spd</th>
                        <th className="text-right py-2 px-2">Launch°</th>
                        <th className="text-right py-2 px-2">Spin</th>
                        <th className="text-right py-2 px-2">F2P</th>
                        <th className="text-right py-2 px-2">Lateral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.shots.slice(0, 30).map((shot) => {
                        const bd = shot.ball_data;
                        const cd = shot.club_data;
                        const lat = bd.lateral_offline ?? 0;
                        return (
                          <tr
                            key={shot.id}
                            className="border-b last:border-0 hover:bg-muted"
                          >
                            <td className="py-1.5 px-2 text-muted-foreground">{shot.shot_number}</td>
                            <td className="py-1.5 px-2 text-right font-medium">
                              {shot.club_name}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              {bd.carry_distance !== null ? Math.round(bd.carry_distance) : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              {bd.ball_speed !== null ? Math.round(bd.ball_speed) : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              {bd.launch_angle_vertical !== null ? bd.launch_angle_vertical.toFixed(1) : '—'}
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              {bd.spin_rate !== null ? Math.round(bd.spin_rate) : '—'}
                            </td>
                            <td
                              className={`py-1.5 px-2 text-right font-medium ${
                                cd.face_to_path !== null && Math.abs(cd.face_to_path) > 3
                                  ? 'text-error'
                                  : ''
                              }`}
                            >
                              {cd.face_to_path !== null
                                ? `${cd.face_to_path > 0 ? '+' : ''}${cd.face_to_path.toFixed(1)}°`
                                : '—'}
                            </td>
                            <td
                              className={`py-1.5 px-2 text-right font-medium ${
                                Math.abs(lat) > 15
                                  ? 'text-error'
                                  : Math.abs(lat) > 8
                                  ? 'text-warning'
                                  : ''
                              }`}
                            >
                              {lat !== 0
                                ? `${lat > 0 ? '+' : ''}${lat.toFixed(0)} yds`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {session.shots.length > 30 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Showing 30 of {session.shots.length} shots
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
            {/* Notes editor */}
            <SessionNotesEditor session={session} onSave={(notes) => updateSession(id, { notes })} />
          </>
        )}
      </div>
    </AppShell>
  );
}

// ── Shot Shape Breakdown ──────────────────────────────────────
interface ShapeCount { shape: string; count: number; pct: number }

const SHAPE_COLORS: Record<string, string> = {
  slice: 'bg-error',
  fade: 'bg-orange-400',
  straight: 'bg-primary',
  draw: 'bg-blue-500',
  hook: 'bg-purple-500',
  push: 'bg-amber-500',
  pull: 'bg-gray-400',
  push_draw: 'bg-cyan-500',
  pull_fade: 'bg-pink-400',
};

const SHAPE_LABELS: Record<string, string> = {
  slice: 'Slice', fade: 'Fade', straight: 'Straight',
  draw: 'Draw', hook: 'Hook', push: 'Push',
  pull: 'Pull', push_draw: 'Push-Draw', pull_fade: 'Pull-Fade',
};

const IDEAL_SHAPES = new Set(['straight', 'draw', 'fade']);

function ShotShapeBreakdown({ shots }: { shots: Shot[] }) {
  const counts: Record<string, number> = {};
  shots.forEach((s) => {
    const shape = s.ball_data.shot_shape;
    if (shape) counts[shape] = (counts[shape] ?? 0) + 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < 3) return null;

  const rows: ShapeCount[] = Object.entries(counts)
    .map(([shape, count]) => ({ shape, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  const idealPct = rows.filter(r => IDEAL_SHAPES.has(r.shape)).reduce((s, r) => s + r.pct, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-primary" />
            <CardTitle>Shot Shape Distribution</CardTitle>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${idealPct >= 70 ? 'bg-primary/15 text-primary' : idealPct >= 50 ? 'bg-warning/15 text-warning' : 'bg-error/15 text-error'}`}>
            {idealPct}% in ideal zone
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-2">
        {rows.map(({ shape, count, pct }) => (
          <div key={shape} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full shrink-0 ${SHAPE_COLORS[shape] ?? 'bg-muted'}`} />
            <span className="text-xs text-muted-foreground w-20 shrink-0">{SHAPE_LABELS[shape] ?? shape}</span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${SHAPE_COLORS[shape] ?? 'bg-gray-400'} ${IDEAL_SHAPES.has(shape) ? 'opacity-100' : 'opacity-60'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground w-12 text-right shrink-0">
              {count} ({pct}%)
            </span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-1">
          Straight, draw, and fade = ideal zone. Slice, hook, push, and pull indicate face/path issues.
        </p>
      </CardBody>
    </Card>
  );
}

function SessionNotesEditor({ session, onSave }: { session: { notes: string }; onSave: (notes: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.notes ?? '');

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-accent-secondary" />
            <CardTitle>Session Notes</CardTitle>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => { setDraft(session.notes ?? ''); setEditing(true); }}>
              <Edit2 size={14} /> {session.notes ? 'Edit' : 'Add Notes'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              placeholder="Add notes about this session — conditions, how you felt, what you tried, what worked..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Check size={14} /> Save Notes</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><XIcon size={14} /> Cancel</Button>
            </div>
          </div>
        ) : session.notes && session.notes.trim() ? (
          <p className="text-sm text-foreground leading-relaxed">{session.notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No notes yet. Click &ldquo;Add Notes&rdquo; to record observations about this session.</p>
        )}
      </CardBody>
    </Card>
  );
}
