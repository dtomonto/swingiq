'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getBadge } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { useAcademyCmsStore } from '@/lib/academy/cms';
import { resolveCourseBySlug, resolveLesson } from '@/lib/academy/overlay';
import { courseProgress } from '@/lib/academy/engine';
import { useMounted, ProgressBar, DifficultyPill, AssignControl } from '@/components/academy/parts';

export default function CoursePage() {
  const mounted = useMounted();
  const { slug } = useParams<{ slug: string }>();
  const progress = useAcademyStore((s) => s.progress);
  const cmsCourses = useAcademyCmsStore((s) => s.courses);
  const cmsLessons = useAcademyCmsStore((s) => s.lessons);
  const completed = progress.completedLessonIds;
  const course = resolveCourseBySlug(slug, cmsCourses);
  if (!course) return notFound();

  const cp = mounted ? courseProgress(progress, course) : { percent: 0, done: 0, total: 0 };
  const badge = course.badgeId ? getBadge(course.badgeId) : undefined;

  return (
    <div className="space-y-6">
      <Link href="/admin/academy/catalog" className="text-sm text-primary hover:underline">← Catalog</Link>

      <header className="rounded-theme border border-border bg-card p-6">
        <div className="flex items-center gap-3"><span className="text-4xl">{course.emoji ?? '📘'}</span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><DifficultyPill level={course.difficulty} /><span>⏱ {course.estMinutes} min</span></div>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-muted-foreground">{course.summary}</p>
        <div className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">You will be able to</h2>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">{course.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
        <div className="mt-4 max-w-md"><ProgressBar value={cp.percent} /><p className="mt-1 text-xs text-muted-foreground">{cp.done}/{cp.total} lessons · {cp.percent}%</p></div>
        <div className="mt-3"><AssignControl targetType="course" targetId={course.id} /></div>
        {badge && (
          <p className="mt-3 text-sm text-muted-foreground">{badge.emoji} Earn the <strong className="text-foreground">{badge.name}</strong> badge by completing this course.</p>
        )}
      </header>

      {course.modules.map((m) => (
        <section key={m.id}>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{m.title}</h2>
          <ol className="space-y-2">
            {m.lessonIds.map((lid, i) => {
              const l = resolveLesson(lid, cmsLessons);
              if (!l) return null;
              const done = mounted && completed.includes(lid);
              return (
                <li key={lid}>
                  <Link href={`/admin/academy/lesson/${lid}`} className="group flex items-center gap-4 rounded-theme border border-border bg-card p-4 transition-colors hover:border-primary/50">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary'}`}>{done ? '✓' : i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground group-hover:text-primary">{l.title}</h3>
                      <p className="text-xs text-muted-foreground">⏱ {l.estMinutes} min{l.quizId ? ' · knowledge check' : ''}{l.challengeId ? ' · hands-on' : ''}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
