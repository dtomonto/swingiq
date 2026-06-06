'use client';

import Link from 'next/link';
import { useAcademyStore } from '@/lib/academy/store';
import { PATHS, BADGES, CERTIFICATIONS, getBadge } from '@/lib/academy/content';
import {
  masteryLevel, nextMastery, featureFluency, demoReadiness, supportReadiness,
  pathProgress, recommendedPaths, nextRecommendedCourse, advisorMessage,
  certificationReadiness, isCertified,
} from '@/lib/academy/engine';
import { useMounted, ProgressBar, ScoreStat, RoleSelect } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading your progress…</p>;

  const level = masteryLevel(progress);
  const { next, toNext } = nextMastery(progress);
  const inProgress = recommendedPaths(progress.roleId)
    .map((p) => ({ path: p, pct: pathProgress(progress, p).percent }))
    .filter((x) => x.pct > 0 && x.pct < 100);
  const earnedBadgeCount = Object.keys(progress.earnedBadges).length;
  const nextCourse = nextRecommendedCourse(progress);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Learning</h1>
          <p className="text-muted-foreground">Your progress, readiness scores, and what to do next.</p>
        </div>
        <RoleSelect />
      </div>

      {/* Scores */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreStat label="Feature Fluency" value={featureFluency(progress)} />
        <ScoreStat label="Demo Readiness" value={demoReadiness(progress)} />
        <ScoreStat label="Support Readiness" value={supportReadiness(progress)} />
        <div className="rounded-theme border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{level.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{progress.points} pts · {earnedBadgeCount} badges</p>
          {next && <div className="mt-2"><ProgressBar value={(progress.points / next.minPoints) * 100} /><p className="mt-1 text-[11px] text-muted-foreground">{toNext} pts to {next.label}</p></div>}
        </div>
      </section>

      {/* Advisor */}
      <section className="rounded-theme border border-primary/20 bg-primary/5 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Recommended next</h2>
        <p className="mt-2 text-foreground">{advisorMessage(progress)}</p>
        {nextCourse && <Link href={`/admin/academy/course/${nextCourse.course.slug}`} className="mt-3 inline-block"><Button>{nextCourse.course.title} →</Button></Link>}
      </section>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-foreground">Continue your paths</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {inProgress.map(({ path, pct }) => (
              <Link key={path.id} href={`/admin/academy/path/${path.slug}`} className="rounded-theme border border-border bg-card p-4 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between"><span className="font-semibold text-foreground">{path.emoji} {path.title}</span><span className="text-xs text-muted-foreground">{pct}%</span></div>
                <div className="mt-2"><ProgressBar value={pct} /></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Certifications snapshot */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Certifications</h2>
          <Link href="/admin/academy/certifications" className="text-sm text-primary hover:underline">Certification Center →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICATIONS.map((c) => {
            const earned = isCertified(progress, c.id);
            const ready = certificationReadiness(progress, c);
            return (
              <div key={c.id} className="rounded-theme border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{c.emoji} {c.name}</p>
                <div className="mt-2"><ProgressBar value={earned ? 100 : ready} /></div>
                <p className="mt-1 text-[11px] text-muted-foreground">{earned ? 'Earned ✓' : `${ready}% ready`}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Badges */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Recent badges</h2>
          <Link href="/admin/academy/badges" className="text-sm text-primary hover:underline">All badges →</Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {BADGES.filter((b) => progress.earnedBadges[b.id]).map((b) => (
            <span key={b.id} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">{b.emoji} {b.name}</span>
          ))}
          {earnedBadgeCount === 0 && <p className="text-sm text-muted-foreground">No badges yet — complete a course to earn your first.</p>}
        </div>
      </section>

      <div className="border-t border-border pt-4">
        <button onClick={() => useAcademyStore.getState().reset()} className="text-xs text-muted-foreground hover:text-error">Reset my Academy progress</button>
      </div>
    </div>
  );
}
