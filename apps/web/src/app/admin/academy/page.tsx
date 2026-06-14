'use client';

import Link from 'next/link';
import { useAcademyStore } from '@/lib/academy/store';
import {
  recommendedPaths, nextRecommendedCourse, advisorMessage,
  masteryLevel, nextMastery, featureFluency, pathProgress,
} from '@/lib/academy/engine';
import { getRole } from '@/lib/academy/content';
import { useMounted, ProgressBar, RoleSelect, DifficultyPill } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

export default function AcademyHome() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);

  const role = progress.roleId ? getRole(progress.roleId) : null;
  const paths = recommendedPaths(progress.roleId);
  const nextCourse = mounted ? nextRecommendedCourse(progress) : null;
  const level = masteryLevel(progress);
  const { next, toNext } = nextMastery(progress);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-theme border border-border bg-gradient-to-br from-primary/10 to-accent-secondary/5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Internal Enablement</p>
        <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">SwingVantage Academy</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Become genuinely fluent in every part of SwingVantage — how it works, why it matters, and how
          to demo, troubleshoot, and explain it. Pick your role to get a tailored path.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <RoleSelect />
          {role && <span className="text-sm text-muted-foreground">Learning as <strong className="text-foreground">{role.emoji} {role.label}</strong></span>}
        </div>
      </section>

      {/* Advisor + momentum */}
      {mounted && (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-theme border border-primary/20 bg-primary/5 p-5 md:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Your AI learning advisor</h2>
            <p className="mt-2 text-foreground">{advisorMessage(progress)}</p>
            {nextCourse && (
              <Link href={`/admin/academy/course/${nextCourse.course.slug}`} className="mt-3 inline-block">
                <Button>Continue: {nextCourse.course.title} →</Button>
              </Link>
            )}
          </div>
          <div className="rounded-theme border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mastery Level</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{level.label}</p>
            <p className="text-xs text-muted-foreground">{progress.points} points · Feature Fluency {featureFluency(progress)}%</p>
            {next && (
              <div className="mt-3">
                <ProgressBar value={(progress.points / next.minPoints) * 100} />
                <p className="mt-1 text-2xs text-muted-foreground">{toNext} pts to {next.label}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommended paths */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{role ? `Recommended for ${role.label}` : 'Featured Vantage Paths'}</h2>
          <Link href="/admin/academy/catalog" className="text-sm text-primary hover:underline">Browse catalog →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => {
            const pp = mounted ? pathProgress(progress, p) : { percent: 0, done: 0, total: 0 };
            return (
              <Link key={p.id} href={`/admin/academy/path/${p.slug}`}
                className="group rounded-theme border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.emoji}</span>
                  <DifficultyPill level={p.difficulty} />
                </div>
                <h3 className="mt-3 font-bold text-foreground group-hover:text-primary">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.purpose}</p>
                <div className="mt-3">
                  <ProgressBar value={pp.percent} />
                  <p className="mt-1 text-2xs text-muted-foreground">{pp.percent}% · {p.courseIds.length} courses</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
