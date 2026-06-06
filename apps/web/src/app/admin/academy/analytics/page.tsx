'use client';

import Link from 'next/link';
import { useAcademyStore } from '@/lib/academy/store';
import {
  catalogCoverage, completionByDifficulty, certReadinessSummary, weakQuizzes, progressExport,
} from '@/lib/academy/analytics';
import { masteryLevel, featureFluency, currentStreak, momentumScore } from '@/lib/academy/engine';
import { getQuiz } from '@/lib/academy/content';
import { useMounted, ProgressBar, ScoreStat } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function AnalyticsPage() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading analytics…</p>;

  const cov = catalogCoverage(progress);
  const byDiff = completionByDifficulty(progress);
  const certs = certReadinessSummary(progress);
  const weak = weakQuizzes(progress);

  const exportReport = () => {
    const data = JSON.stringify(progressExport(progress), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'swingvantage-academy-progress.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Coverage, completion, certification readiness, and knowledge gaps.</p>
      </div>

      {/* Coverage */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreStat label="Feature Fluency" value={featureFluency(progress)} />
        <div className="rounded-theme border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{cov.lessonsDone}<span className="text-base text-muted-foreground">/{cov.lessonsTotal}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">Lessons completed</p>
        </div>
        <div className="rounded-theme border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{cov.coursesComplete}<span className="text-base text-muted-foreground">/{cov.coursesTotal}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">Courses complete</p>
        </div>
        <div className="rounded-theme border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{cov.pathsComplete}<span className="text-base text-muted-foreground">/{cov.pathsTotal}</span></p>
          <p className="mt-0.5 text-xs text-muted-foreground">Paths complete</p>
        </div>
      </section>

      {/* Completion by difficulty */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Completion by difficulty</h2>
        <div className="space-y-3">
          {byDiff.map((d) => (
            <div key={d.difficulty}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-foreground">{d.difficulty}</span>
                <span className="text-muted-foreground">{d.done}/{d.total} ({pct(d.done, d.total)}%)</span>
              </div>
              <ProgressBar value={pct(d.done, d.total)} />
            </div>
          ))}
        </div>
      </section>

      {/* Certification readiness */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Certification readiness</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {certs.map((c) => (
            <div key={c.id} className="rounded-theme border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.emoji} {c.name}</span>
                <span className="text-xs text-muted-foreground">{c.earned ? 'Earned ✓' : `${c.ready}%`}</span>
              </div>
              <div className="mt-2"><ProgressBar value={c.earned ? 100 : c.ready} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Knowledge gaps */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Knowledge gaps</h2>
        {weak.length === 0 ? (
          <p className="text-sm text-muted-foreground">No failed knowledge checks. 👏</p>
        ) : (
          <ul className="space-y-2">
            {weak.map((w) => {
              const q = getQuiz(w.id);
              return (
                <li key={w.id} className="flex items-center justify-between gap-3 rounded-theme border border-warning/30 bg-warning/5 p-3 text-sm">
                  <span className="text-foreground">{q?.title ?? w.id}</span>
                  <span className="text-xs text-muted-foreground">best {w.bestScore}% · {w.attempts} attempt(s)</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Manager / Exec */}
      <section className="rounded-theme border border-border bg-muted/30 p-5">
        <h2 className="text-lg font-bold text-foreground">Manager &amp; Executive view</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-learner and department rollups (team completion, readiness by role, overdue training) aggregate
          per-learner records and require the cloud backend — that lands in a later phase. Today this dashboard
          reflects <strong>this device’s learner</strong>. You can export this learner’s progress report now.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={exportReport}>Export progress report (JSON)</Button>
          <span className="text-xs text-muted-foreground">
            {masteryLevel(progress).label} · {progress.points} pts · 🔥 {currentStreak(progress)}-day · momentum {momentumScore(progress)}%
          </span>
        </div>
      </section>

      <Link href="/admin/academy/dashboard" className="inline-block text-sm text-primary hover:underline">← My Learning</Link>
    </div>
  );
}
