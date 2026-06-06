'use client';

// SwingVantage Academy — full lesson renderer (template + quiz + challenge).
import { useState } from 'react';
import Link from 'next/link';
import type { Lesson } from '@/lib/academy/types';
import { getQuiz, getChallenge } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { Button } from '@/components/ui/Button';
import { QuizRunner } from './QuizRunner';
import { DifficultyPill } from './parts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

export function LessonContent({ lesson }: { lesson: Lesson }) {
  const completed = useAcademyStore((s) => s.progress.completedLessonIds.includes(lesson.id));
  const quizPassed = useAcademyStore((s) => (lesson.quizId ? !!s.progress.quizAttempts[lesson.quizId]?.passed : true));
  const challengeDone = useAcademyStore((s) => (lesson.challengeId ? !!s.progress.challengeSubmissions[lesson.challengeId] : true));
  const complete = useAcademyStore((s) => s.completeLesson);
  const submitChallenge = useAcademyStore((s) => s.submitChallenge);

  const quiz = lesson.quizId ? getQuiz(lesson.quizId) : undefined;
  const challenge = lesson.challengeId ? getChallenge(lesson.challengeId) : undefined;
  const [showSolution, setShowSolution] = useState(false);

  const canComplete = quizPassed && challengeDone;

  return (
    <article>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <DifficultyPill level={lesson.difficulty} />
        <span>⏱ {lesson.estMinutes} min</span>
        {completed && <span className="rounded-full bg-success/15 px-2 py-0.5 font-medium text-success">✓ Completed</span>}
        <span className="ml-auto">v{lesson.version}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-foreground">{lesson.title}</h1>

      <Section title="Learning objectives">
        <ul className="list-disc space-y-1 pl-5">{lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
      </Section>

      <Section title="Why this matters">
        <div className="rounded-theme border border-primary/20 bg-primary/5 p-3">{lesson.whyItMatters}</div>
      </Section>

      <Section title="Walkthrough">
        {lesson.walkthrough.map((p, i) => <p key={i}>{p}</p>)}
      </Section>

      {lesson.scenario && (
        <Section title="Real-world scenario">
          <div className="rounded-theme border border-border bg-muted/40 p-3 italic">{lesson.scenario}</div>
        </Section>
      )}

      {lesson.steps && lesson.steps.length > 0 && (
        <Section title="Step by step">
          <ol className="space-y-2">
            {lesson.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <span><strong className="text-foreground">{s.label}</strong>{s.detail ? <> — {s.detail}</> : null}</span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {(lesson.commonMistakes?.length || lesson.bestPractices?.length) ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {lesson.commonMistakes?.length ? (
            <div className="rounded-theme border border-error/20 bg-error/5 p-3">
              <h3 className="mb-1 text-sm font-bold text-error">Common mistakes</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">{lesson.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          ) : null}
          {lesson.bestPractices?.length ? (
            <div className="rounded-theme border border-success/20 bg-success/5 p-3">
              <h3 className="mb-1 text-sm font-bold text-success">Best practices</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">{lesson.bestPractices.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {lesson.supportNotes && (
        <Section title="Support notes">
          <div className="rounded-theme border border-accent-secondary/20 bg-accent-secondary/5 p-3">{lesson.supportNotes}</div>
        </Section>
      )}

      {quiz && (
        <Section title="Knowledge check">
          <QuizRunner quiz={quiz} />
        </Section>
      )}

      {challenge && (
        <Section title="Hands-on challenge">
          <div className="rounded-theme border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{challenge.title}</h3>
              <span className="text-xs capitalize text-muted-foreground">{challenge.kind} · {challenge.estMinutes} min</span>
            </div>
            <p className="mt-2 text-sm text-foreground">{challenge.prompt}</p>
            {challenge.scenario && <div className="mt-2 rounded-theme border border-border bg-muted/40 p-3 text-sm italic text-foreground">{challenge.scenario}</div>}
            <h4 className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Success criteria</h4>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">{challenge.successCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {challengeDone ? (
                <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">✓ Submitted</span>
              ) : (
                <Button onClick={() => submitChallenge(challenge.id)}>Mark challenge complete</Button>
              )}
              {challenge.sampleSolution && (
                <Button variant="outline" onClick={() => setShowSolution((v) => !v)}>
                  {showSolution ? 'Hide' : 'Show'} model answer
                </Button>
              )}
            </div>
            {showSolution && challenge.sampleSolution && (
              <div className="mt-3 rounded-theme border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">{challenge.sampleSolution}</div>
            )}
          </div>
        </Section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
        {completed ? (
          <span className="rounded-full bg-success/15 px-4 py-2 text-sm font-semibold text-success">✓ Lesson complete</span>
        ) : (
          <Button size="lg" disabled={!canComplete} onClick={() => complete(lesson.id)}>Mark lesson complete</Button>
        )}
        {!completed && !canComplete && (
          <span className="text-xs text-muted-foreground">
            {!quizPassed ? 'Pass the knowledge check' : ''}{!quizPassed && !challengeDone ? ' and ' : ''}{!challengeDone ? 'complete the challenge' : ''} to finish.
          </span>
        )}
        {lesson.completionCriteria && <span className="text-xs text-muted-foreground">{lesson.completionCriteria}</span>}
      </div>

      {(lesson.relatedFeatures?.length || lesson.docLinks?.length) ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {lesson.relatedFeatures?.length ? (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Related features</h3>
              <ul className="space-y-1 text-sm">
                {lesson.relatedFeatures.map((f, i) => (
                  <li key={i}><Link href={f.route} target="_blank" className="text-primary hover:underline">{f.label} ↗</Link></li>
                ))}
              </ul>
            </div>
          ) : null}
          {lesson.docLinks?.length ? (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Documentation</h3>
              <ul className="space-y-1 text-sm">
                {lesson.docLinks.map((d, i) => (
                  <li key={i}><Link href={d.href} target="_blank" className="text-primary hover:underline">{d.label} ↗</Link></li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
