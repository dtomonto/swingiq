'use client';

// SwingVantage Academy — knowledge-check quiz runner.
import { useEffect, useState } from 'react';
import type { Quiz } from '@/lib/academy/types';
import { Button } from '@/components/ui/Button';
import { useAcademyStore } from '@/lib/academy/store';
import { cn } from '@/lib/utils';

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const record = useAcademyStore((s) => s.recordQuizAttempt);
  const prior = useAcademyStore((s) => s.progress.quizAttempts[quiz.id]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  // Question order — shuffled client-side after mount (avoids SSR mismatch).
  const [order, setOrder] = useState<number[]>(() => quiz.questions.map((_, i) => i));
  useEffect(() => {
    if (!quiz.shuffle) return;
    setOrder(() => {
      const a = quiz.questions.map((_, i) => i);
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    });
  }, [quiz.id, quiz.shuffle, quiz.questions]);

  const toggle = (qid: string, idx: number, multi: boolean) =>
    setAnswers((a) => {
      if (submitted) return a;
      const cur = a[qid] ?? [];
      if (multi) return { ...a, [qid]: cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx] };
      return { ...a, [qid]: [idx] };
    });

  const submit = () => {
    const correct = quiz.questions.filter((q) => sameSet(answers[q.id] ?? [], q.correct)).length;
    const sc = Math.round((correct / quiz.questions.length) * 100);
    setScore(sc);
    setSubmitted(true);
    record(quiz.id, sc, sc >= quiz.passingScore);
  };

  const reset = () => { setAnswers({}); setSubmitted(false); setScore(0); };
  const passed = submitted && score >= quiz.passingScore;
  const allAnswered = quiz.questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  return (
    <div className="rounded-theme border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{quiz.title}</h3>
        <span className="text-xs text-muted-foreground">
          Pass: {quiz.passingScore}%{prior?.passed ? ' · ✓ passed' : prior ? ` · best ${prior.bestScore}%` : ''}
        </span>
      </div>

      <ol className="space-y-5">
        {order.map((qIndex, qi) => {
          const q = quiz.questions[qIndex];
          const multi = q.kind === 'multi-select';
          const chosen = answers[q.id] ?? [];
          return (
            <li key={q.id}>
              <p className="mb-2 text-sm font-medium text-foreground">
                {qi + 1}. {q.prompt}
                {multi && <span className="ml-2 text-xs text-muted-foreground">(select all)</span>}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen.includes(oi);
                  const isCorrect = q.correct.includes(oi);
                  const showState = submitted && (isChosen || isCorrect);
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => toggle(q.id, oi, multi)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        !submitted && isChosen && 'border-primary bg-primary/10',
                        !submitted && !isChosen && 'border-border hover:border-primary/50',
                        showState && isCorrect && 'border-success bg-success/10 text-foreground',
                        submitted && isChosen && !isCorrect && 'border-error bg-error/10 text-foreground',
                        submitted && !isChosen && !isCorrect && 'border-border opacity-60',
                      )}
                    >
                      <span className="text-xs">{submitted ? (isCorrect ? '✓' : isChosen ? '✕' : '•') : isChosen ? '◉' : '○'}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center gap-3">
        {!submitted ? (
          <Button onClick={submit} disabled={!allAnswered}>Submit answers</Button>
        ) : (
          <>
            <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', passed ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>
              {passed ? `Passed — ${score}%` : `Scored ${score}% — keep going`}
            </span>
            <Button variant="outline" onClick={reset}>{passed ? 'Retake' : 'Try again'}</Button>
          </>
        )}
        {!allAnswered && !submitted && <span className="text-xs text-muted-foreground">Answer every question to submit.</span>}
      </div>
    </div>
  );
}
