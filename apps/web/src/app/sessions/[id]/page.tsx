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
  Calendar, Layers, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  runDiagnosticEngine,
  computeSessionStats,
  computeSwingScores,
  buildSessionInsight,
  getRoutineForDiagnosis,
  shotsToDispersionPoints,
  computeDispersion,
  predictFromDiagnosis,
} from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useMemo } from 'react';
import { DispersionChart } from '@/components/charts/DispersionChart';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, updateSession, setActiveDiagnosis } = useSwingIQStore();

  const session = sessions.find((s) => s.id === id);

  const analysis = useMemo(() => {
    if (!session || session.shots.length < 3) return null;
    const shots = session.shots as Shot[];
    const clubCategory = session.club_category || 'iron';
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

  // Save diagnoses + swing score back to session on first analysis (avoid infinite loop)
  useMemo(() => {
    if (!session || !analysis || session.diagnoses.length > 0) return;
    updateSession(id, {
      diagnoses: analysis.diagnoses,
      swing_score: analysis.scores.overall,
    });
  }, [analysis, session, id, updateSession]);

  if (!session) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">
          <p className="text-gray-500">Session not found.</p>
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
  const routine = topDiagnosis ? getRoutineForDiagnosis(topDiagnosis.rule.id, 'beginner') : null;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft size={14} /> Sessions
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={13} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                {format(new Date(session.created_at), 'MMMM d, yyyy')}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">{session.shot_count} shots</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500 capitalize">{session.club_name}</span>
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

        {session.shots.length < 3 ? (
          <Card>
            <CardBody className="text-center py-10">
              <p className="text-gray-500">
                This session has fewer than 3 shots — not enough for analysis.
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Score overview */}
            {analysis && (
              <div className="grid grid-cols-5 gap-4">
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
                      <p className="text-xs text-gray-500 mt-1">{key}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}

            {/* Primary diagnosis */}
            {topDiagnosis && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={18} className="text-red-500" />
                      <CardTitle>Primary Diagnosis</CardTitle>
                    </div>
                    <Badge variant="critical" className="capitalize">
                      {topDiagnosis.rule.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{topDiagnosis.rule.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{topDiagnosis.rule.likely_cause}</p>
                  </div>
                  {strokePrediction && strokePrediction.estimates.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-800 mb-1">
                        Stroke Savings Potential
                      </p>
                      <p className="text-sm text-green-700">{strokePrediction.prioritized_action}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Total potential:{' '}
                        <strong>~{strokePrediction.total_potential_savings} strokes/round</strong>
                        {strokePrediction.estimates[0]?.handicap_improvement_estimate
                          ? ` (est. ${strokePrediction.estimates[0].handicap_improvement_estimate} handicap improvement)`
                          : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{strokePrediction.caveat}</p>
                    </div>
                  )}
                  {routine && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <p className="text-xs text-gray-500">Recommended routine</p>
                        <p className="font-semibold text-sm text-gray-900">{routine.name}</p>
                      </div>
                      <div className="flex gap-2">
                        {routine.drill_recommendations[0]?.youtube_search_url && (
                          <a
                            href={routine.drill_recommendations[0].youtube_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-red-600 hover:underline flex items-center gap-1"
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
              <Card className="border-green-200 bg-green-50">
                <CardBody className="space-y-2">
                  <p className="text-sm font-semibold text-green-800">
                    What do I do next?
                  </p>
                  <p className="text-sm text-green-700">{analysis.insight.what_do_i_do_next}</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-500">Technical Focus</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {analysis.insight.technical_focus}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-gray-500">Ball Flight</p>
                      <p className="text-sm font-semibold text-gray-900">
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
                      <Layers size={18} className="text-blue-600" />
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
                  <div className="grid grid-cols-4 gap-3 mb-4">
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

            {/* All diagnoses */}
            {analysis && analysis.diagnoses.length > 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-gray-600" />
                    <CardTitle>All Diagnosed Patterns</CardTitle>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  {analysis.diagnoses.slice(1).map((d, i) => (
                    <div
                      key={d.rule.id}
                      className="flex items-start gap-3 py-2 border-b last:border-0"
                    >
                      <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 2}
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{d.rule.name}</p>
                        <p className="text-xs text-gray-500">{d.rule.likely_cause}</p>
                      </div>
                      <Badge variant="info" className="ml-auto flex-shrink-0 capitalize">
                        {d.rule.priority}
                      </Badge>
                    </div>
                  ))}
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
                      <tr className="border-b text-gray-500">
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
                            className="border-b last:border-0 hover:bg-gray-50"
                          >
                            <td className="py-1.5 px-2 text-gray-400">{shot.shot_number}</td>
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
                                  ? 'text-red-600'
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
                                  ? 'text-red-600'
                                  : Math.abs(lat) > 8
                                  ? 'text-orange-500'
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
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Showing 30 of {session.shots.length} shots
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
