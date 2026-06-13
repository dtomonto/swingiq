'use client';

// ============================================================
// DeterministicIntake — a couple of pre-AI sharpening questions
// ------------------------------------------------------------
// Shows up to two HIGH-VALUE intake questions for the sport. Each answer maps
// onto a symptom the engine understands; the parent re-runs the deterministic
// diagnosis with the added symptoms, raising confidence (or surfacing a
// contradiction) BEFORE any AI is offered. Token-free, honest, and short.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { getIntakeQuestions, intakeAnswerSymptoms } from '@/lib/intelligence/intake';
import { trackDeterministicIntake } from '@/lib/intelligence/analytics';

export function DeterministicIntake({
  sport,
  knownSymptoms,
  onSymptomsChange,
}: {
  sport: SportId;
  /** Symptoms already reported, so we don't re-ask what's known. */
  knownSymptoms?: string[];
  /** Called with the symptoms chosen via intake (excludes "not sure"). */
  onSymptomsChange: (symptoms: string[]) => void;
}) {
  // Pick the questions once so they stay stable as the athlete answers.
  const questions = useMemo(
    () => getIntakeQuestions(sport, { knownSymptoms, max: 2 }),
    [sport, knownSymptoms],
  );
  const [answers, setAnswers] = useState<Record<string, string | undefined>>({});

  const symptoms = useMemo(() => intakeAnswerSymptoms(answers), [answers]);
  useEffect(() => {
    onSymptomsChange(symptoms);
  }, [symptoms, onSymptomsChange]);

  if (questions.length === 0) return null;

  function choose(questionId: string, optionLabel: string, symptom: string | undefined) {
    setAnswers((prev) => ({ ...prev, [questionId]: symptom }));
    trackDeterministicIntake(sport, questionId, Boolean(symptom), 0);
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <HelpCircle size={16} className="text-primary" aria-hidden="true" />
        A couple of quick questions
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Answer what you know to sharpen this read — no video needed. Skip anything you&apos;re unsure of.
      </p>

      <div className="mt-3 space-y-4">
        {questions.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-foreground">{q.prompt}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.options.map((o) => {
                const isThis = Object.prototype.hasOwnProperty.call(answers, q.id) && answers[q.id] === o.symptom;
                return (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={isThis}
                    onClick={() => choose(q.id, o.label, o.symptom)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isThis
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/60'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
