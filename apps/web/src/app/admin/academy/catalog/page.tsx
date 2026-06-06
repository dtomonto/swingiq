'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PATHS } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { useAcademyCmsStore } from '@/lib/academy/cms';
import { mergedCourses } from '@/lib/academy/overlay';
import { courseProgress, pathProgress } from '@/lib/academy/engine';
import { useMounted, ProgressBar, DifficultyPill } from '@/components/academy/parts';
import type { Difficulty } from '@/lib/academy/types';

const DIFFS: (Difficulty | 'all')[] = ['all', 'foundational', 'intermediate', 'advanced'];

export default function CatalogPage() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);
  const cmsCourses = useAcademyCmsStore((s) => s.courses);
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');

  const ql = q.trim().toLowerCase();
  const matchPath = (t: string, p: string) => !ql || t.toLowerCase().includes(ql) || p.toLowerCase().includes(ql);

  const allCourses = mounted ? mergedCourses(cmsCourses) : mergedCourses({});
  const paths = PATHS.filter((p) => (diff === 'all' || p.difficulty === diff) && matchPath(p.title, p.purpose));
  const courses = allCourses.filter((c) => (diff === 'all' || c.difficulty === diff) && matchPath(c.title, c.summary));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catalog</h1>
        <p className="text-muted-foreground">Every Vantage Path and course in the Academy.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses & paths…"
          className="w-full max-w-xs rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
        <div className="flex gap-1">
          {DIFFS.map((d) => (
            <button key={d} onClick={() => setDiff(d)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${diff === d ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Vantage Paths</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => {
            const pp = mounted ? pathProgress(progress, p).percent : 0;
            return (
              <Link key={p.id} href={`/admin/academy/path/${p.slug}`} className="group rounded-theme border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between"><span className="text-2xl">{p.emoji}</span><DifficultyPill level={p.difficulty} /></div>
                <h3 className="mt-2 font-bold text-foreground group-hover:text-primary">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.purpose}</p>
                <div className="mt-3"><ProgressBar value={pp} /><p className="mt-1 text-[11px] text-muted-foreground">{pp}% · {p.courseIds.length} courses</p></div>
              </Link>
            );
          })}
          {paths.length === 0 && <p className="text-sm text-muted-foreground">No paths match.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Courses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const cp = mounted ? courseProgress(progress, c).percent : 0;
            return (
              <Link key={c.id} href={`/admin/academy/course/${c.slug}`} className="group rounded-theme border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between"><span className="text-2xl">{c.emoji ?? '📘'}</span><DifficultyPill level={c.difficulty} /></div>
                <h3 className="mt-2 font-bold text-foreground group-hover:text-primary">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                <div className="mt-3"><ProgressBar value={cp} /><p className="mt-1 text-[11px] text-muted-foreground">{cp}% · {c.estMinutes} min</p></div>
              </Link>
            );
          })}
          {courses.length === 0 && <p className="text-sm text-muted-foreground">No courses match.</p>}
        </div>
      </section>
    </div>
  );
}
