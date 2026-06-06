'use client';

import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { getPathBySlug, getCourse, getCertification } from '@/lib/academy/content';
import { useAcademyStore } from '@/lib/academy/store';
import { courseProgress, pathProgress, certificationReadiness, isCertified } from '@/lib/academy/engine';
import { useMounted, ProgressBar, DifficultyPill } from '@/components/academy/parts';

export default function PathPage() {
  const mounted = useMounted();
  const { slug } = useParams<{ slug: string }>();
  const progress = useAcademyStore((s) => s.progress);
  const path = getPathBySlug(slug);
  if (!path) return notFound();

  const cert = path.certificationId ? getCertification(path.certificationId) : undefined;
  const pp = mounted ? pathProgress(progress, path) : { percent: 0, done: 0, total: 0 };
  const certReady = mounted && cert ? certificationReadiness(progress, cert) : 0;

  return (
    <div className="space-y-6">
      <Link href="/admin/academy/catalog" className="text-sm text-primary hover:underline">← Catalog</Link>

      <header className="rounded-theme border border-border bg-card p-6">
        <div className="flex items-center gap-3"><span className="text-4xl">{path.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{path.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><DifficultyPill level={path.difficulty} /><span>{path.courseIds.length} courses</span></div>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-muted-foreground">{path.purpose}</p>
        <div className="mt-4 max-w-md"><ProgressBar value={pp.percent} /><p className="mt-1 text-xs text-muted-foreground">{pp.percent}% complete</p></div>
        {cert && (
          <div className="mt-4 rounded-theme border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">{cert.emoji} Grants: {cert.name}</p>
            <p className="text-xs text-muted-foreground">{mounted && isCertified(progress, cert.id) ? 'Earned ✓' : `${certReady}% ready`} · <Link href="/admin/academy/certifications" className="text-primary hover:underline">Certification Center →</Link></p>
          </div>
        )}
      </header>

      <ol className="space-y-3">
        {path.courseIds.map((cid, i) => {
          const c = getCourse(cid);
          if (!c) return null;
          const cp = mounted ? courseProgress(progress, c) : { percent: 0, done: 0, total: 0 };
          return (
            <li key={cid}>
              <Link href={`/admin/academy/course/${c.slug}`} className="group flex items-center gap-4 rounded-theme border border-border bg-card p-4 transition-colors hover:border-primary/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{cp.percent === 100 ? '✓' : i + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{c.title}</h3>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{c.summary}</p>
                </div>
                <div className="w-28 shrink-0"><ProgressBar value={cp.percent} /><p className="mt-1 text-right text-[11px] text-muted-foreground">{cp.percent}%</p></div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
