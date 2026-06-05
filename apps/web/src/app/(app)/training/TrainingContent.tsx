'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle, Clock, Target, AlertCircle, Zap, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getRoutineForDiagnosis, runDiagnosticEngine, type DrillRecommendation, type DiagnosisCategory, type SkillLevel } from '@swingiq/core';
import type { Shot } from '@swingiq/core';
import { useSwingVantageStore, useLatestDiagnosedSession } from '@/store';
import { AgentPracticePlanCard } from '@/components/agents/AgentPracticePlanCard';
import { FaultExplanation } from '@/components/faults/FaultExplanation';
import { format } from 'date-fns';

function DrillCard({ drill }: { drill: DrillRecommendation }) {
  return (
    <div className="border rounded-lg p-4 bg-muted hover:bg-muted transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{drill.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{drill.why_this_matches}</p>
          {drill.warning && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle size={11} className="text-warning" />
              <p className="text-xs text-warning">{drill.warning}</p>
            </div>
          )}
        </div>
        <a
          href={drill.youtube_search_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 ml-3 shrink-0"
        >
          <ExternalLink size={11} />
          YouTube
        </a>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Search: <span className="italic">{drill.youtube_search_query}</span>
      </div>
    </div>
  );
}

export function TrainingContent() {
  const { sessions, training, toggleDrillStep, recordPractice, profile } = useSwingVantageStore();
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
          <h1 className="text-2xl font-bold text-foreground">Training Routine</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {hasNoData ? 'Sample routine — import session data for personalized training.' : `Based on: ${routine.name}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {training.streak_days > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">🔥 {training.streak_days}</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold text-success">{progress}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>
      </div>

      {/* Personalized practice plan (agent layer) */}
      <AgentPracticePlanCard />

      {/* Skill level selector */}
      <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-lg">
        <SlidersHorizontal size={15} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground flex-1">Difficulty Level</span>
        <select
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          className="border border-border rounded-lg px-2 py-1 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
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
              ? 'border-success/40 bg-success/10'
              : trainingEffectiveness.verdict === 'regressing'
              ? 'border-error/40 bg-error/10'
              : 'border-border bg-muted'
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className={
                  trainingEffectiveness.verdict === 'improving'
                    ? 'text-success'
                    : trainingEffectiveness.verdict === 'regressing'
                    ? 'text-error'
                    : 'text-muted-foreground'
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
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(trainingEffectiveness.beforeDate), 'MMM d')}
              {' → '}
              {format(new Date(trainingEffectiveness.afterDate), 'MMM d')}
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Overall score tile */}
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground">Overall Score</p>
                <div className="flex items-end gap-2 mt-1">
                  <p className="text-xl font-bold text-foreground">
                    {trainingEffectiveness.scoreAfter ?? '—'}
                  </p>
                  {trainingEffectiveness.scoreDelta !== null && (
                    <p
                      className={`text-sm font-semibold pb-0.5 ${
                        trainingEffectiveness.scoreDelta > 0
                          ? 'text-success'
                          : trainingEffectiveness.scoreDelta < 0
                          ? 'text-error'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {trainingEffectiveness.scoreDelta > 0 ? '+' : ''}
                      {trainingEffectiveness.scoreDelta}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Was {trainingEffectiveness.scoreBefore ?? '—'}
                </p>
              </div>

              {/* Target metric tile */}
              {trainingEffectiveness.metricBefore !== null &&
                trainingEffectiveness.metricAfter !== null && (
                  <div
                    className={`rounded-lg p-3 border ${
                      trainingEffectiveness.metricImproved
                        ? 'bg-success/10 border-success/25'
                        : 'bg-error/10 border-error/30'
                    }`}
                  >
                    <p className="text-xs text-muted-foreground capitalize">
                      {trainingEffectiveness.metricKey.replace(/_/g, ' ')}
                    </p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-xl font-bold text-foreground">
                        {trainingEffectiveness.metricAfter.toFixed(1)}
                      </p>
                      {trainingEffectiveness.metricDelta !== null && (
                        <p
                          className={`text-sm font-semibold pb-0.5 ${
                            trainingEffectiveness.metricImproved
                              ? 'text-success'
                              : 'text-error'
                          }`}
                        >
                          {trainingEffectiveness.metricDelta > 0 ? '+' : ''}
                          {trainingEffectiveness.metricDelta.toFixed(1)}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Was {trainingEffectiveness.metricBefore.toFixed(1)}
                    </p>
                  </div>
                )}
            </div>

            <p
              className={`text-sm font-medium ${
                trainingEffectiveness.verdict === 'improving'
                  ? 'text-success'
                  : trainingEffectiveness.verdict === 'regressing'
                  ? 'text-error'
                  : 'text-muted-foreground'
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
        <Card className="border-warning/30 bg-warning/10">
          <CardBody className="flex items-center gap-3">
            <Zap size={18} className="text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">No personal diagnosis yet</p>
              <p className="text-xs text-warning">Import your launch monitor data to get a training routine built specifically for your swing.</p>
              <Link href="/sessions/import" className="text-xs font-semibold text-success hover:underline mt-1 block">Import your first session →</Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Routine header */}
      <Card className="border-l-4 border-l-error">
        <CardBody className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-error/15 flex items-center justify-center shrink-0">
            <Target size={20} className="text-error" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-foreground text-lg">{routine.name}</h2>
              <Badge variant="critical">Critical Fix</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{routine.goal}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={12} />{routine.estimated_duration_minutes} minutes</span>
              <span>{routine.ball_count} balls</span>
              <span className="capitalize">{routine.intensity} intensity</span>
            </div>
            <div className="mt-3">
              <FaultExplanation faultId={diagnosisId} faultText={routine.name} sport="golf" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Why it matters */}
      <Card>
        <CardHeader><CardTitle>Why This Matters</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-foreground leading-relaxed">{routine.why_it_matters}</p>
          <div className="mt-3 p-3 bg-accent-secondary/10 rounded-lg border border-accent-secondary/25">
            <p className="text-xs font-semibold text-accent-secondary mb-1">Data Point Being Improved</p>
            <p className="text-sm text-foreground">{routine.data_point_being_improved.replace(/_/g, ' ').toUpperCase()}</p>
          </div>
        </CardBody>
      </Card>

      {/* Setup */}
      <Card>
        <CardHeader><CardTitle>Setup</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-foreground leading-relaxed">{routine.setup}</p>
        </CardBody>
      </Card>

      {/* Drill steps — interactive checklist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drill Steps</CardTitle>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all"
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
                completedSteps.has(i) ? 'bg-success/10 border border-success/25' : 'bg-muted border border-border hover:border-success/40'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                completedSteps.has(i) ? 'bg-success' : 'bg-muted'
              }`}>
                {completedSteps.has(i)
                  ? <CheckCircle size={14} className="text-success-foreground" />
                  : <span className="text-xs font-bold text-foreground">{i + 1}</span>
                }
              </div>
              <span className={`text-sm leading-relaxed ${completedSteps.has(i) ? 'text-success line-through' : 'text-foreground'}`}>
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
            <div key={i} className="flex gap-2 text-sm text-foreground">
              <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
              {mistake}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* YouTube Drills */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">▶</span>
            </div>
            <CardTitle>YouTube Drill Links</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
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
      <Card className="border-success/25 bg-success/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-success" />
            <CardTitle>Retest Protocol</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{routine.retest_protocol.notes}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-lg p-3 border border-success/25">
              <p className="text-xs text-muted-foreground">Shot Count</p>
              <p className="font-bold text-foreground">{routine.retest_protocol.shot_count} shots</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-success/25">
              <p className="text-xs text-muted-foreground">Club</p>
              <p className="font-bold text-foreground">{routine.retest_protocol.club}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg p-3 border border-success/25">
            <p className="text-xs text-muted-foreground mb-1">Success Criteria</p>
            <p className="text-sm font-semibold text-success">{routine.retest_protocol.success_criteria}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-success/25">
            <p className="text-xs text-muted-foreground mb-1">Focus Metrics</p>
            <p className="text-sm text-foreground">{routine.retest_protocol.focus_metrics.join(' · ')}</p>
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
