'use client';

import { useState } from 'react';
import { ExternalLink, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { MetricCard } from '@/components/ui/MetricCard';
import { cn, priorityToColor, formatDegrees, formatYards } from '@/lib/utils';
import {
  runDiagnosticEngine,
  buildSessionInsight,
  computeSwingScores,
  getScoreLabel,
  getRoutineForDiagnosis,
  type DiagnosisOutput,
} from '@swingiq/core';
import type { Shot } from '@swingiq/core';

// ── Sample shots for demo ────────────────────────────────────

const SAMPLE_SHOTS: Shot[] = Array.from({ length: 30 }, (_, i) => ({
  id: `shot-${i}`,
  session_id: 'session-1',
  user_id: 'user-1',
  club_id: 'driver',
  club_name: 'Driver',
  club_category: 'driver',
  shot_number: i + 1,
  date_time: new Date().toISOString(),
  swing_type: 'full',
  intended_shot_shape: 'straight',
  actual_shot_shape: i % 3 === 0 ? 'slice' : 'fade',
  is_outlier: false,
  user_notes: '',
  ball_data: {
    carry_distance: 210 + (Math.random() - 0.5) * 30,
    total_distance: 230 + (Math.random() - 0.5) * 30,
    roll_distance: 20,
    ball_speed: 148 + (Math.random() - 0.5) * 10,
    launch_angle_vertical: 13 + (Math.random() - 0.5) * 3,
    launch_direction_horizontal: 2 + Math.random() * 3,
    spin_rate: 2800 + (Math.random() - 0.5) * 400,
    spin_axis: 8 + (Math.random() - 0.5) * 4,
    apex_height: 95 + (Math.random() - 0.5) * 15,
    descent_angle: 38,
    side_carry: 22 + (Math.random() - 0.5) * 8,
    lateral_offline: 22 + (Math.random() - 0.5) * 8,
    curve: 18,
    flight_time: 6.2,
    shot_shape: i % 3 === 0 ? 'slice' : 'fade',
    smash_factor: 1.44 + (Math.random() - 0.5) * 0.06,
  },
  club_data: {
    club_speed: 103 + (Math.random() - 0.5) * 4,
    attack_angle: 1.5 + (Math.random() - 0.5) * 1.5,
    club_path: -1.5 + (Math.random() - 0.5) * 2,
    face_angle_to_target: 3.2 + (Math.random() - 0.5) * 2,
    face_to_path: 4.8 + (Math.random() - 0.5) * 2,
    dynamic_loft: 14.5 + (Math.random() - 0.5) * 2,
    spin_loft: 13.2 + (Math.random() - 0.5) * 2,
    swing_plane_horizontal: null,
    swing_plane_vertical: null,
    low_point_position: -0.5 + (Math.random() - 0.5) * 1,
    low_point_height: null,
    closure_rate: null,
    swing_direction: null,
    lie_angle_dynamic: null,
  },
  strike_data: {
    impact_location_lateral: -0.18 + (Math.random() - 0.5) * 0.2,
    impact_location_vertical: 0.05 + (Math.random() - 0.5) * 0.1,
  },
  created_at: new Date().toISOString(),
}));

function DiagnosisCard({ diagnosis, rank }: { diagnosis: DiagnosisOutput; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);
  const routine = getRoutineForDiagnosis(diagnosis.rule.id, 'beginner');

  return (
    <Card className={rank === 1 ? 'ring-2 ring-red-300' : ''}>
      <CardHeader>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                rank === 1 ? 'bg-red-500' : rank === 2 ? 'bg-orange-500' : 'bg-yellow-500',
              )}>
                {rank}
              </span>
              <span className="font-bold text-gray-900">{diagnosis.rule.name}</span>
            </div>
            <Badge variant={diagnosis.rule.priority as 'critical' | 'high' | 'medium'}>
              {diagnosis.rule.priority}
            </Badge>
            <span className="text-xs text-gray-500">Confidence: {diagnosis.confidence}%</span>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
      </CardHeader>

      {expanded && (
        <CardBody className="space-y-5">
          {/* Problem */}
          <div className={cn('p-4 rounded-lg border', priorityToColor(diagnosis.rule.priority))}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Problem</p>
            <p className="text-sm leading-relaxed">{diagnosis.rule.primary_issue(diagnosis.stats)}</p>
          </div>

          {/* Evidence */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Evidence</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {diagnosis.supporting_data.slice(0, 6).map((dp) => (
                <div
                  key={dp.metric}
                  className={cn(
                    'rounded-lg p-3 border',
                    dp.deviation !== null && Math.abs(dp.deviation) > 2
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200',
                  )}
                >
                  <p className="text-xs text-gray-500">{dp.metric}</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {typeof dp.value === 'number' ? `${dp.value.toFixed(dp.unit === 'rpm' ? 0 : 1)}${dp.unit}` : dp.value}
                  </p>
                  {dp.target_min !== null && dp.target_max !== null && (
                    <p className="text-xs text-gray-400">Target: {dp.target_min}–{dp.target_max}{dp.unit}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Likely Cause */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">Likely Cause</p>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">{diagnosis.rule.likely_cause}</p>
          </div>

          {/* What improvement looks like */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-xs font-semibold text-green-700">What Improvement Looks Like</p>
            </div>
            <p className="text-sm text-green-800 leading-relaxed">
              {diagnosis.rule.what_improvement_looks_like(diagnosis.stats)}
            </p>
          </div>

          {/* Routine + Drills */}
          {routine && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <p className="font-semibold text-gray-900 text-sm">{routine.name}</p>
                <p className="text-xs text-gray-500">{routine.ball_count} balls · ~{routine.estimated_duration_minutes} min</p>
              </div>
              <div className="px-4 py-3 space-y-2">
                {routine.drill_steps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
                {routine.drill_steps.length > 3 && (
                  <p className="text-xs text-gray-400 pl-7">+{routine.drill_steps.length - 3} more steps in full routine</p>
                )}
              </div>
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {routine.drill_recommendations.map((drill) => (
                    <a
                      key={drill.id}
                      href={drill.youtube_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                    >
                      <ExternalLink size={11} />
                      {drill.name.substring(0, 25)}...
                    </a>
                  ))}
                </div>
                <a href="/training">
                  <Button size="sm">Full Routine</Button>
                </a>
              </div>
            </div>
          )}

          {/* Retest */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-1">Retest Protocol</p>
            <p className="text-sm text-gray-700">{diagnosis.rule.retest.success_criteria}</p>
            <p className="text-xs text-gray-500 mt-1">
              {diagnosis.rule.retest.shot_count} shots · Focus: {diagnosis.rule.retest.focus_metrics.join(', ')}
            </p>
          </div>
        </CardBody>
      )}
    </Card>
  );
}

export function DiagnoseContent() {
  const result = runDiagnosticEngine(SAMPLE_SHOTS, 'driver', 'session-1', 'user-1');
  const insight = buildSessionInsight(result);
  const scores = computeSwingScores(result.stats);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Swing Diagnosis</h1>
          <p className="text-gray-500 text-sm mt-1">
            Based on {result.stats.shot_count} shots · Driver
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={scores.overall} size={64} strokeWidth={6} label="Overall" />
          <ScoreRing score={scores.face_control} size={64} strokeWidth={6} label="Face" />
          <ScoreRing score={scores.strike_quality} size={64} strokeWidth={6} label="Strike" />
        </div>
      </div>

      {/* What do I do next */}
      <div className="bg-golf-dark text-white rounded-xl p-5 flex items-start gap-4">
        <span className="text-2xl">🎯</span>
        <div className="flex-1">
          <p className="font-semibold text-green-300 text-sm mb-0.5">What should I do next?</p>
          <p className="text-white font-bold">{insight.what_do_i_do_next}</p>
        </div>
      </div>

      {/* Stat summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Avg Carry"
          value={result.stats.avg_carry?.toFixed(0) ?? '—'}
          unit="yds"
          status="neutral"
        />
        <MetricCard
          label="Face-to-Path"
          value={result.stats.avg_face_to_path?.toFixed(1) ?? '—'}
          unit="°"
          target="-3° to +3°"
          status={Math.abs(result.stats.avg_face_to_path ?? 0) > 3 ? 'danger' : 'good'}
        />
        <MetricCard
          label="Lateral Miss"
          value={Math.abs(result.stats.avg_lateral_offline ?? 0).toFixed(0)}
          unit={`yds ${(result.stats.avg_lateral_offline ?? 0) > 0 ? 'right' : 'left'}`}
          status={(result.stats.avg_lateral_offline ?? 0) > 15 ? 'danger' : 'warning'}
        />
        <MetricCard
          label="Smash Factor"
          value={result.stats.avg_smash_factor?.toFixed(2) ?? '—'}
          target="1.44–1.50"
          status={
            (result.stats.avg_smash_factor ?? 0) >= 1.44 ? 'good'
            : (result.stats.avg_smash_factor ?? 0) >= 1.38 ? 'warning'
            : 'danger'
          }
        />
      </div>

      {/* Diagnoses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">
            {result.diagnoses.length} Issue{result.diagnoses.length !== 1 ? 's' : ''} Identified
          </h2>
        </div>

        {result.diagnoses.length === 0 && (
          <Card>
            <CardBody className="py-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="font-bold text-gray-900">No critical issues detected.</p>
              <p className="text-gray-500 text-sm mt-1">Focus on maintaining consistency and adding shots to improve baseline accuracy.</p>
            </CardBody>
          </Card>
        )}

        {result.diagnoses.map((d, i) => (
          <DiagnosisCard key={d.rule.id} diagnosis={d} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
