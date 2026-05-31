'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle, Clock, Target, AlertCircle, ChevronDown, ChevronUp, Zap, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getRoutineForDiagnosis, runDiagnosticEngine, type TrainingRoutine, type DrillRecommendation, type DiagnosisCategory, type SkillLevel } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useSwingIQStore, useLatestDiagnosedSession } from '@/store';
import { format } from 'date-fns';

function DrillCard({ drill }: { drill: DrillRecommendation }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{drill.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{drill.why_this_matches}</p>
          {drill.warning && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle size={11} className="text-yellow-600" />
              <p className="text-xs text-yellow-700">{drill.warning}</p>
            </div>
          )}
        </div>
        <a
          href={drill.youtube_search_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 ml-3 flex-shrink-0"
        >
          <ExternalLink size={11} />
          YouTube
        </a>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Search: <span className="italic">{drill.youtube_search_query}</span>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? steps : steps.slice(0, 3);

  return (
    <div className="space-y-2">
      {visible.map((step, i) => (
        <div key={i} className="flex gap-3 text-sm text-gray-700">
          <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </div>
      ))}
      {steps.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-xs text-green-600 hover:underline ml-9"
        >
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showAll ? 'Show less' : `Show ${steps.length - 3} more steps`}
        </button>
      )}
    </div>
  );
}

export function TrainingContent() {
  const { sessions, training, toggleDrillStep, recordPractice, profile } = useSwingIQStore();
  const latestSession = useLatestDiagnosedSession();

  // Use active diagnosis from store, or fall back to latest session's diagnosis
  const diagnosisId: DiagnosisCategory = (
    training.active_diagnosis_id
    ?? latestSession?.diagnoses[0]?.rule?.id
    ?? 'slice_weak_fade'
  ) as DiagnosisCategory;

  // Skill level — default from profile, user can override
  const profileSkill = (profile?.skill_level ?? 'beginner') as SkillLevel;
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(profileSkill);

  const routine = getRoutineForDiagnosis(diagnosisId, skillLevel)
    ?? getRoutineForDiagnosis('slice_weak_fade', skillLevel)!;

  const completedSteps = new Set(training.completed_steps);

  const toggleStep = (i: number) => {
    toggleDrillStep(i);
    if (!completedSteps.has(i)) recordPractice();
  };

  const progress = routine.drill_steps.length
    ? Math.round((training.completed_steps.length / routine.drill_steps.length) * 100)
    : 0;

  const hasNoData = !latestSession && !training.active_diagnosis_id;

  // ── Training Effectiveness ────────────────────────────────────
  const trainingEffectiveness = useMemo(() => {
    if (!sessions.length) return null;

    const sorted = [...sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // "After" = most recent session with shots
    const afterSession = sorted.find((s) => s.shots.length > 0);
    // "Before" = session when training started, or oldest session with shots
    const beforeSession = training.active_session_id
      ? sessions.find((s) => s.id === training.active_session_id)
      : [...sorted].reverse().find((s) => s.shots.length > 0);

    if (!beforeSession || !afterSession || beforeSession.id === afterSession.id) return null;
    if (!beforeSession.shots.length || !afterSession.shots.length) return null;

    const scoreBefore = beforeSession.swing_score;
    const scoreAfter = afterSession.swing_score;
    const scoreDelta =
      scoreBefore !== null && scoreAfter !== null ? scoreAfter - scoreBefore : null;

    const metricKey = routine.data_point_being_improved;

    type StatGetter = (s: ReturnType<typeof runDiagnosticEngine>['stats']) => number | undefined;
    const statMap: Record<string, StatGetter> = {
      face_to_path: (s) => s.avg_face_to_path,
      club_path: (s) => s.avg_club_path,
      attack_angle: (s) => s.avg_attack_angle,
      spin_rate: (s) => s.avg_spin_rate,
      smash_factor: (s) => s.avg_smash_factor,
      carry_distance: (s) => s.avg_carry,
      lateral_miss: (s) => s.avg_lateral_offline,
    };

    let metricBefore: number | null = null;
    let metricAfter: number | null = null;

    try {
      const rBefore = runDiagnosticEngine(
        beforeSession.shots as Shot[],
        beforeSession.club_category || 'mid_iron',
        beforeSession.id,
        'local',
      );
      const rAfter = runDiagnosticEngine(
        afterSession.shots as Shot[],
        afterSession.club_category || 'mid_iron',
        afterSession.id,
        'local',
      );
      const getter = statMap[metricKey];
      if (getter) {
        metricBefore = getter(rBefore.stats) ?? null;
        metricAfter = getter(rAfter.stats) ?? null;
      }
    } catch {
      // stats unavailable
    }

    // Determine direction (lower absolute = better for these)
    const lowerAbsIsBetter = new Set(['face_to_path', 'club_path', 'lateral_miss', 'spin_rate']);
    const isLowerAbs = lowerAbsIsBetter.has(metricKey);

    let metricDelta: number | null = null;
    let metricImproved: boolean | null = null;
    if (metricBefore !== null && metricAfter !== null) {
      metricDelta = metricAfter - metricBefore;
      metricImproved = isLowerAbs
        ? Math.abs(metricAfter) < Math.abs(metricBefore)
        : metricAfter > metricBefore;
    }

    const verdict =
      metricImproved === true
        ? 'improving'
        : metricImproved === false
        ? 'regressing'
        : scoreDelta !== null && scoreDelta >= 3
        ? 'improving'
        : scoreDelta !== null && scoreDelta <= -3
        ? 'regressing'
        : 'neutral';

    return {
      scoreBefore,
      scoreAfter,
      scoreDelta,
      metricKey,
      metricBefore,
      metricAfter,
      metricDelta,
      metricImproved,
      isLowerAbs,
      verdict,
      beforeDate: beforeSession.created_at,
      afterDate: afterSession.created_at,
    };
  }, [sessions, training.active_session_id, routine.data_point_being_improved]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Routine</h1>
          <p className="text-gray-500 text-sm mt-1">
            {hasNoData ? 'Sample routine — import session data for personalized training.' : `Based on: ${routine.name}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {training.streak_days > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">🔥 {training.streak_days}</p>
              <p className="text-xs text-gray-500">day streak</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{progress}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>
      </div>

      {/* Skill level selector */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <SlidersHorizontal size={15} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 flex-1">Difficulty Level</span>
        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {/* ── Training Effectiveness ─────────────────────────────── */}
      {trainingEffectiveness && (
        <Card
          className={
            trainingEffectiveness.verdict === 'improving'
              ? 'border-green-300 bg-green-50'
              : trainingEffectiveness.verdict === 'regressing'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-200 bg-gray-50'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className={
                  trainingEffectiveness.verdict === 'improving'
                    ? 'text-green-600'
                    : trainingEffectiveness.verdict === 'regressing'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }
              />
              <CardTitle>Is My Training Working?</CardTitle>
              <span className="text-lg">
                {trainingEffectiveness.verdict === 'improving'
                  ? '✅'
                  : trainingEffectiveness.verdict === 'regressing'
                  ? '📉'
                  : '→'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(trainingEffectiveness.beforeDate), 'MMM d')}
              {' → '}
              {format(new Date(trainingEffectiveness.afterDate), 'MMM d')}
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Overall score tile */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500">Overall Score</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    {trainingEffectiveness.scoreAfter ?? '—'}
                  </p>
                  {trainingEffectiveness.scoreDelta !== null && (
                    <p
                      className={`text-sm font-semibold pb-0.5 ${
                        trainingEffectiveness.scoreDelta > 0
                          ? 'text-green-600'
                          : trainingEffectiveness.scoreDelta < 0
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {trainingEffectiveness.scoreDelta > 0 ? '+' : ''}
                      {trainingEffectiveness.scoreDelta}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Was {trainingEffectiveness.scoreBefore ?? '—'}
                </p>
              </div>

              {/* Target metric tile */}
              {trainingEffectiveness.metricBefore !== null &&
                trainingEffectiveness.metricAfter !== null && (
                  <div
                    className={`rounded-lg p-3 border ${
                      trainingEffectiveness.metricImproved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="text-xs text-gray-500 capitalize">
                      {trainingEffectiveness.metricKey.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-xl font-bold text-gray-900">
                        {trainingEffectiveness.metricAfter.toFixed(1)}
                      </p>
                      {trainingEffectiveness.metricDelta !== null && (
                        <p
                          className={`text-sm font-semibold pb-0.5 ${
                            trainingEffectiveness.metricImproved
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {trainingEffectiveness.metricDelta > 0 ? '+' : ''}
                          {trainingEffectiveness.metricDelta.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Was {trainingEffectiveness.metricBefore.toFixed(1)}
                    </p>
                  </div>
                )}
            </div>

            <p
              className={`text-sm font-medium ${
                trainingEffectiveness.verdict === 'improving'
                  ? 'text-green-700'
                  : trainingEffectiveness.verdict === 'regressing'
                  ? 'text-red-700'
                  : 'text-gray-600'
              }`}
            >
              {trainingEffectiveness.verdict === 'improving'
                ? '✅ Your training is paying off — keep going!'
                : trainingEffectiveness.verdict === 'regressing'
                ? "📉 The numbers are moving the wrong way. Review your technique or try a different drill."
                : '→ No clear change yet. Import more sessions to sharpen this picture.'}
            </p>
          </CardBody>
        </Card>
      )}

      {hasNoData && (
        <Card className="border-amber-200 bg-amber-50">
          <CardBody className="flex items-center gap-3">
            <Zap size={18} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">No personal diagnosis yet</p>
              <p className="text-xs text-amber-600">Import your launch monitor data to get a training routine built specifically for your swing.</p>
              <Link href="/sessions/import" className="text-xs font-semibold text-green-700 hover:underline mt-1 block">Import your first session →</Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Routine header */}
      <Card className="border-l-4 border-l-red-500">
        <CardBody className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <Target size={20} className="text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-gray-900 text-lg">{routine.name}</h2>
              <Badge variant="critical">Critical Fix</Badge>
            </div>
            <p className="text-sm text-gray-600">{routine.goal}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock size={12} />{routine.estimated_duration_minutes} minutes</span>
              <span>{routine.ball_count} balls</span>
              <span className="capitalize">{routine.intensity} intensity</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Why it matters */}
      <Card>
        <CardHeader><CardTitle>Why This Matters</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-gray-700 leading-relaxed">{routine.why_it_matters}</p>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">Data Point Being Improved</p>
            <p className="text-sm text-blue-800">{routine.data_point_being_improved.replace(/_/g, ' ').toUpperCase()}</p>
          </div>
        </CardBody>
      </Card>

      {/* Setup */}
      <Card>
        <CardHeader><CardTitle>Setup</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-gray-700 leading-relaxed">{routine.setup}</p>
        </CardBody>
      </Card>

      {/* Drill steps — interactive checklist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drill Steps</CardTitle>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {routine.drill_steps.map((step, i) => (
            <button
              key={i}
              onClick={() => toggleStep(i)}
              className={`w-full flex gap-3 text-left p-3 rounded-lg transition-colors ${
                completedSteps.has(i) ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200 hover:border-green-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                completedSteps.has(i) ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {completedSteps.has(i)
                  ? <CheckCircle size={14} className="text-white" />
                  : <span className="text-xs font-bold text-white">{i + 1}</span>
                }
              </div>
              <span className={`text-sm leading-relaxed ${completedSteps.has(i) ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {step}
              </span>
            </button>
          ))}
        </CardBody>
      </Card>

      {/* Common mistakes */}
      <Card>
        <CardHeader><CardTitle>Common Mistakes to Avoid</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {routine.common_mistakes.map((mistake, i) => (
            <div key={i} className="flex gap-2 text-sm text-gray-700">
              <AlertCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              {mistake}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* YouTube Drills */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">▶</span>
            </div>
            <CardTitle>YouTube Drill Links</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Click any link to find the best matching drills on YouTube. Save the ones that help.
          </p>
        </CardHeader>
        <CardBody className="space-y-3">
          {routine.drill_recommendations.map((drill) => (
            <DrillCard key={drill.id} drill={drill} />
          ))}
        </CardBody>
      </Card>

      {/* Retest */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <CardTitle>Retest Protocol</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{routine.retest_protocol.notes}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-xs text-gray-500">Shot Count</p>
              <p className="font-bold text-gray-900">{routine.retest_protocol.shot_count} shots</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-xs text-gray-500">Club</p>
              <p className="font-bold text-gray-900">{routine.retest_protocol.club}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-gray-500 mb-1">Success Criteria</p>
            <p className="text-sm font-semibold text-green-800">{routine.retest_protocol.success_criteria}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-xs text-gray-500 mb-1">Focus Metrics</p>
            <p className="text-sm text-gray-700">{routine.retest_protocol.focus_metrics.join(' · ')}</p>
          </div>
        </CardBody>
      </Card>

      <div className="flex gap-3">
        <Link href="/sessions/import" className="flex-1">
          <Button variant="outline" className="w-full">Import Retest Session</Button>
        </Link>
        <Link href="/diagnose" className="flex-1">
          <Button className="w-full">Run New Diagnosis</Button>
        </Link>
      </div>
    </div>
  );
}
