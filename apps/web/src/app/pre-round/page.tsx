'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore, useLatestDiagnosedSession } from '@/store';
import { generatePreRoundRoutine } from '@swingiq/core';
import { useMemo, useState } from 'react';
import { CheckCircle, Circle, Clock, ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';
import { NonGolfWarmUp } from './NonGolfWarmUp';
import { useSport } from '@/contexts/SportContext';

export default function PreRoundPage() {
  const { isGolf } = useSport();

  // Non-golf: sport-specific warm-up
  if (!isGolf) {
    return <AppShell><NonGolfWarmUp /></AppShell>;
  }

  // Golf: original content continues below...
  const latestSession = useLatestDiagnosedSession();
  const { training } = useSwingIQStore();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const diagnosisId = training.active_diagnosis_id ?? latestSession?.diagnoses[0]?.rule?.id ?? 'default';
  const diagnosisName = latestSession?.diagnoses[0]?.rule?.name ?? 'General Warm-Up';

  const routine = useMemo(
    () => generatePreRoundRoutine(diagnosisId, diagnosisName),
    [diagnosisId, diagnosisName]
  );

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
    mobility: 'bg-blue-100 text-blue-700',
    putting: 'bg-green-100 text-green-700',
    chipping: 'bg-yellow-100 text-yellow-700',
    irons: 'bg-purple-100 text-purple-700',
    driver: 'bg-orange-100 text-orange-700',
    mental: 'bg-pink-100 text-pink-700',
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pre-Round Warm-Up</h1>
            <p className="text-gray-500 text-sm mt-1">Personalized for your diagnosis: <span className="font-medium text-gray-700">{diagnosisName}</span></p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{progress}%</p>
            <p className="text-xs text-gray-500">Complete</p>
          </div>
        </div>

        {!latestSession && (
          <Card className="border-amber-200 bg-amber-50">
            <CardBody className="flex items-center gap-3">
              <Zap size={18} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">No diagnosis yet</p>
                <p className="text-xs text-amber-600">Import a session and run the diagnostic engine to get a personalized warm-up.</p>
                <Link href="/diagnose" className="text-xs font-semibold text-green-700 hover:underline mt-1 block">Diagnose my swing →</Link>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Routine header */}
        <Card className="border-green-200 bg-green-50">
          <CardBody className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-700">{routine.total_minutes}</p>
              <p className="text-xs text-green-600">minutes total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{routine.exercises.length}</p>
              <p className="text-xs text-green-600">exercises</p>
            </div>
            <div>
              <p className="text-sm font-bold text-green-700 leading-tight">{routine.key_thought.slice(0, 30)}{routine.key_thought.length > 30 ? '…' : ''}</p>
              <p className="text-xs text-green-600">key thought</p>
            </div>
          </CardBody>
        </Card>

        {/* Key thought */}
        <Card className="border-l-4 border-l-golf-fairway">
          <CardBody>
            <p className="text-xs text-gray-500 mb-1">Key Thought for Today</p>
            <p className="font-bold text-gray-900">{routine.key_thought}</p>
          </CardBody>
        </Card>

        {/* Exercises */}
        <div className="space-y-3">
          {routine.exercises.map((ex, i) => (
            <Card key={i} className={completed.has(i) ? 'bg-green-50 border-green-200' : ''}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggle(i)} className="mt-0.5 flex-shrink-0">
                    {completed.has(i)
                      ? <CheckCircle size={22} className="text-green-500" />
                      : <Circle size={22} className="text-gray-300 hover:text-gray-400" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-sm ${completed.has(i) ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                        {ex.order}. {ex.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ex.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{ex.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={11} /> {ex.duration_seconds}s</span>
                      {ex.reps && <span>× {ex.reps} reps</span>}
                      {ex.equipment !== 'None' && <span>🎯 {ex.equipment}</span>}
                    </div>
                    <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 italic">
                      &ldquo;{ex.coaching_cue}&rdquo;
                    </p>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.youtube_search_query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
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
            <p className="text-xs text-green-300 mb-1">On-Course Reminder</p>
            <p className="font-semibold text-green-100">{routine.on_course_reminder}</p>
          </CardBody>
        </Card>

        {progress === 100 && (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🎯</p>
            <p className="font-bold text-green-600 text-lg">Warm-up complete — go shoot your best round!</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
