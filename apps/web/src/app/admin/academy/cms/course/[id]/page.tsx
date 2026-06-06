'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAcademyCmsStore, type ContentStatus } from '@/lib/academy/cms';
import { getCourse, courseLessonIds } from '@/lib/academy/content';
import type { Difficulty } from '@/lib/academy/types';
import { useMounted } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

const inputCls = 'w-full rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="mb-1 block text-xs text-muted-foreground">{hint}</span>}
      {children}
    </label>
  );
}

export default function CourseEditor() {
  const mounted = useMounted();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const cmsCourse = useAcademyCmsStore((s) => (isNew ? undefined : s.courses[id]));
  const saveCourse = useAcademyCmsStore((s) => s.saveCourse);
  const removeCourse = useAcademyCmsStore((s) => s.removeCourse);

  const seed = !isNew && !cmsCourse ? getCourse(id) : undefined;
  const base = cmsCourse ?? seed;

  const [courseId] = useState(isNew ? `cms-c-${Math.random().toString(36).slice(2, 8)}` : id);
  const [title, setTitle] = useState(base?.title ?? '');
  const [slug, setSlug] = useState(base?.slug ?? '');
  const [summary, setSummary] = useState(base?.summary ?? '');
  const [emoji, setEmoji] = useState(base?.emoji ?? '📘');
  const [estMinutes, setEstMinutes] = useState(String(base?.estMinutes ?? 10));
  const [difficulty, setDifficulty] = useState<Difficulty>(base?.difficulty ?? 'foundational');
  const [objectives, setObjectives] = useState((base?.objectives ?? []).join('\n'));
  const [lessonIds, setLessonIds] = useState((base ? courseLessonIds(base) : []).join('\n'));
  const [badgeId, setBadgeId] = useState(base?.badgeId ?? '');

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const status: ContentStatus = cmsCourse?.status ?? 'draft';
  const autoSlug = slug.trim() || title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const save = () => {
    const ids = lessonIds.split('\n').map((s) => s.trim()).filter(Boolean);
    saveCourse({
      id: courseId,
      slug: autoSlug || courseId,
      title: title.trim() || 'Untitled course',
      summary: summary.trim(),
      roleIds: 'all',
      difficulty,
      estMinutes: Number(estMinutes) || 10,
      objectives: objectives.split('\n').map((s) => s.trim()).filter(Boolean),
      modules: [{ id: `${courseId}-m`, title: 'Lessons', lessonIds: ids }],
      badgeId: badgeId.trim() || undefined,
      emoji: emoji.trim() || '📘',
      status,
      updatedAt: new Date().toISOString(),
    });
    router.push('/admin/academy/cms');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => router.push('/admin/academy/cms')} className="text-sm text-primary hover:underline">← CMS</button>
      <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New course' : `Edit: ${base?.title ?? courseId}`}</h1>
      <p className="text-xs text-muted-foreground">ID <code>{courseId}</code> · status <strong className="capitalize">{status}</strong>{seed ? ' · overriding a seed course on publish' : ''}</p>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Emoji"><input className={`${inputCls} w-20 text-center`} value={emoji} onChange={(e) => setEmoji(e.target.value)} /></Field>
      </div>
      <Field label="Slug" hint={`URL: /admin/academy/course/${autoSlug || '…'}`}><input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug} /></Field>
      <Field label="Summary"><textarea className={inputCls} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Est. minutes"><input className={inputCls} type="number" min={1} value={estMinutes} onChange={(e) => setEstMinutes(e.target.value)} /></Field>
        <Field label="Difficulty">
          <select className={inputCls} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="foundational">Foundational</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>
      </div>
      <Field label="Objectives" hint="One per line."><textarea className={inputCls} rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} /></Field>
      <Field label="Lesson ids" hint="One per line. Use seed ids (e.g. l-upload) or your authored lesson ids."><textarea className={inputCls} rows={5} value={lessonIds} onChange={(e) => setLessonIds(e.target.value)} /></Field>
      <Field label="Badge id" hint="Optional (e.g. b-product-tour)"><input className={inputCls} value={badgeId} onChange={(e) => setBadgeId(e.target.value)} /></Field>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={save}>Save course</Button>
        {!isNew && cmsCourse && (
          <button onClick={() => { removeCourse(courseId); router.push('/admin/academy/cms'); }} className="text-xs text-muted-foreground hover:text-error">Delete</button>
        )}
        <span className="text-xs text-muted-foreground">Saved as draft — publish from the CMS list.</span>
      </div>
    </div>
  );
}
