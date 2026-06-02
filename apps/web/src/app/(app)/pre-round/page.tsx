'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { useSwingIQStore, useLatestDiagnosedSession } from '@/store';
import { generatePreRoundRoutine } from '@swingiq/core';
import { useMemo, useState } from 'react';
import { CheckCircle, Circle, Clock, ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';
import { NonGolfWarmUp } from './NonGolfWarmUp';
import { useSport } from '@/contexts/SportContext';
import { PreGameStrategyCard } from '@/components/agents/PreGameStrategyCard';

export default function PreRoundPage() {
  const { isGolf } = useSport();

  // All hooks must be called unconditionally before any early return.
  const latestSession = useLatestDiagnosedSession();
  const { training } = useSwingIQStore();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const diagnosisId = training.active_diagnosis_id ?? latestSession?.diagnoses[0]?.rule?.id ?? 'default';
  const diagnosisName = latestSession?.diagnoses[0]?.rule?.name ?? 'General Warm-Up';

  const routine = useMemo(
    () => generatePreRoundRoutine(diagnosisId, diagnosisName),
    [diagnosisId, diagnosisName],
  );

  // Non-golf: sport-specific warm-up (after hooks)
  if (!isGolf) {
    return <AppShell><NonGolfWarmUp /></AppShell>;
  }

  const toggle = (i: number) =>
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const progress = routine.exercises.length
    ? Math.round((completed.size / routine.exercises.length) * 100)
    : 0;

  const CATEGORY_COLORS: Record<string, string> = {
    mobility: 'bg-accent-secondary/15 text-accent-secondary',
    putting: 'bg-primary/15 text-primary',
    chipping: 'bg-warning/15 text-warning',
    irons: 'bg-accent-secondary/15 text-accent-secondary',
    driver: 'bg-warning/15 text-warning',
    mental: 'bg-accent-secondary/15 text-accent-secondary',
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pre-Round Warm-Up</h1>
            <p className="text-muted-foreground text-sm mt-1">Personalized for your diagnosis: <span className="font-medium text-foreground">{diagnosisName}</span></p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{progress}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>

        {!latestSession && (
          <Card className="border-warning/30 bg-warning/10">
            <CardBody className="flex items-center gap-3">
              <Zap size={18} className="text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">No diagnosis yet</p>
                <p className="text-xs text-warning">Import a session and run the diagnostic engine to get a personalized warm-up.</p>
                <Link href="/diagnose" className="text-xs font-semibold text-primary hover:underline mt-1 block">Diagnose my swing →</Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Pre-game strategy (agent layer) — complements the physical warm-up */}
        <PreGameStrategyCard />

        {/* Progress bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Routine header */}
        <Card className="border-primary/30 bg-primary/10">
          <CardBody className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{routine.total_minutes}</p>
              <p className="text-xs text-primary">minutes total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{routine.exercises.length}</p>
              <p className="text-xs text-primary">exercises</p>
            </div>
            <div>
              <p className="text-sm font-bold text-primary leading-tight">{routine.key_thought.slice(0, 30)}{routine.key_thought.length > 30 ? '…' : ''}</p>
              <p className="text-xs text-primary">key thought</p>
            </div>
          </CardBody>
        </Card>

        {/* Key thought */}
        <Card className="border-l-4 border-l-golf-fairway">
          <CardBody>
            <p className="text-xs text-muted-foreground mb-1">Key Thought for Today</p>
            <p className="font-bold text-foreground">{routine.key_thought}</p>
          </CardBody>
        </Card>

        {/* Exercises */}
        <div className="space-y-3">
          {routine.exercises.map((ex, i) => (
            <Card key={i} className={completed.has(i) ? 'bg-primary/10 border-primary/30' : ''}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(i)} className="mt-0.5 shrink-0">
                    {completed.has(i)
                      ? <CheckCircle size={22} className="text-primary" />
                      : <Circle size={22} className="text-muted-foreground hover:text-muted-foreground" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${completed.has(i) ? 'text-primary line-through' : 'text-foreground'}`}>
                        {ex.order}. {ex.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-muted text-muted-foreground'}`}>
                        {ex.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={11} /> {ex.duration_seconds}s</span>
                      {ex.reps && <span>× {ex.reps} reps</span>}
                      {ex.equipment !== 'None' && <span>🎯 {ex.equipment}</span>}
                    </div>
                    <p className="text-xs text-accent-secondary bg-accent-secondary/10 px-2 py-1 rounded-sm mt-2 italic">
                      &ldquo;{ex.coaching_cue}&rdquo;
                    </p>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.youtube_search_query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-sm text-xs hover:bg-red-700"
                  >
                    <ExternalLink size={10} /> YT
                  </a>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* On-course reminder */}
        <Card className="border-golf-dark bg-golf-dark text-white">
          <CardBody>
            <p className="text-xs text-primary-foreground/80 mb-1">On-Course Reminder</p>
            <p className="font-semibold text-primary-foreground/90">{routine.on_course_reminder}</p>
          </CardBody>
        </Card>

        {progress === 100 && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🎯</p>
            <p className="font-bold text-primary text-lg">Warm-up complete — go shoot your best round!</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
