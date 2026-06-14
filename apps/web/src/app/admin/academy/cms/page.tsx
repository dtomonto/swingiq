'use client';

import Link from 'next/link';
import { useAcademyCmsStore, STATUS_NEXT, type ContentStatus } from '@/lib/academy/cms';
import { useMounted } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<ContentStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/15 text-warning',
  approved: 'bg-accent-secondary/15 text-accent-secondary',
  published: 'bg-success/15 text-success',
  deprecated: 'bg-warning/10 text-warning',
  archived: 'bg-muted text-muted-foreground line-through',
};

function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-2xs font-medium capitalize', STATUS_STYLE[status])}>{status}</span>;
}

export default function CmsDashboard() {
  const mounted = useMounted();
  const lessons = useAcademyCmsStore((s) => s.lessons);
  const courses = useAcademyCmsStore((s) => s.courses);
  const audit = useAcademyCmsStore((s) => s.audit);
  const setLessonStatus = useAcademyCmsStore((s) => s.setLessonStatus);
  const setCourseStatus = useAcademyCmsStore((s) => s.setCourseStatus);

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading CMS…</p>;

  const lessonList = Object.values(lessons).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const courseList = Object.values(courses).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const reviewQueue = [
    ...lessonList.filter((l) => l.status === 'review').map((l) => ({ kind: 'lesson' as const, id: l.id, title: l.title })),
    ...courseList.filter((c) => c.status === 'review').map((c) => ({ kind: 'course' as const, id: c.id, title: c.title })),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground">Author courses & lessons, move them through review, and publish.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/academy/cms/lesson/new"><Button>+ New lesson</Button></Link>
          <Link href="/admin/academy/cms/course/new"><Button variant="outline">+ New course</Button></Link>
          <Link href="/admin/academy/cms/generate"><Button variant="outline">⚡ From release note</Button></Link>
        </div>
      </div>

      <p className="rounded-theme border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        The built-in seed library is the baseline (already published). Items you create here are drafts until you
        publish them — published items then appear in the catalog and lessons alongside the seed content.
      </p>

      {/* Review queue */}
      {reviewQueue.length > 0 && (
        <section className="rounded-theme border border-warning/30 bg-warning/5 p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-warning">Review queue ({reviewQueue.length})</h2>
          <ul className="space-y-2">
            {reviewQueue.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{item.kind === 'lesson' ? '📄' : '📚'} {item.title}</span>
                <Button size="sm" onClick={() => item.kind === 'lesson' ? setLessonStatus(item.id, 'approved') : setCourseStatus(item.id, 'approved')}>Approve</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Lessons */}
      <CmsList
        title="Lessons" emptyHint="No authored lessons yet."
        items={lessonList.map((l) => ({ id: l.id, title: l.title, status: l.status, editHref: `/admin/academy/cms/lesson/${l.id}` }))}
        onStatus={setLessonStatus}
      />

      {/* Courses */}
      <CmsList
        title="Courses" emptyHint="No authored courses yet."
        items={courseList.map((c) => ({ id: c.id, title: c.title, status: c.status, editHref: `/admin/academy/cms/course/${c.id}` }))}
        onStatus={setCourseStatus}
      />

      {/* Audit log */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-foreground">Audit log</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {audit.slice(0, 20).map((a, i) => (
              <li key={i}><span className="text-foreground">{a.action}</span> · {a.target} · {new Date(a.at).toLocaleString()}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CmsList({
  title, emptyHint, items, onStatus,
}: {
  title: string; emptyHint: string;
  items: { id: string; title: string; status: ContentStatus; editHref: string }[];
  onStatus: (id: string, status: ContentStatus) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-theme border border-border bg-card p-3">
              <Link href={item.editHref} className="font-medium text-foreground hover:text-primary">{item.title}</Link>
              <StatusBadge status={item.status} />
              <code className="text-2xs text-muted-foreground">{item.id}</code>
              <div className="ml-auto flex flex-wrap gap-1">
                {STATUS_NEXT[item.status].map((next) => (
                  <button key={next} onClick={() => onStatus(item.id, next)}
                    className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    → {next}
                  </button>
                ))}
                <Link href={item.editHref} className="rounded-lg border border-border px-2 py-1 text-xs text-primary hover:underline">Edit</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
