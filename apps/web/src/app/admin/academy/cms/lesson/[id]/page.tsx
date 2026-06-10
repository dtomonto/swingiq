'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAcademyCmsStore, type ContentStatus } from '@/lib/academy/cms';
import { getLesson } from '@/lib/academy/content';
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

export default function LessonEditor() {
  const mounted = useMounted();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const cmsLesson = useAcademyCmsStore((s) => (isNew ? undefined : s.lessons[id]));
  const saveLesson = useAcademyCmsStore((s) => s.saveLesson);
  const removeLesson = useAcademyCmsStore((s) => s.removeLesson);

  // Prefill from CMS, else from seed (editing a seed lesson creates an override).
  const seed = !isNew && !cmsLesson ? getLesson(id) : undefined;
  const base = cmsLesson ?? seed;

  const [lessonId] = useState(() => (isNew ? `cms-l-${Math.random().toString(36).slice(2, 8)}` : id));
  const [title, setTitle] = useState(base?.title ?? '');
  const [estMinutes, setEstMinutes] = useState(String(base?.estMinutes ?? 6));
  const [difficulty, setDifficulty] = useState<Difficulty>(base?.difficulty ?? 'foundational');
  const [objectives, setObjectives] = useState((base?.objectives ?? []).join('\n'));
  const [whyItMatters, setWhyItMatters] = useState(base?.whyItMatters ?? '');
  const [walkthrough, setWalkthrough] = useState((base?.walkthrough ?? []).join('\n\n'));
  const [quizId, setQuizId] = useState(base?.quizId ?? '');
  const [challengeId, setChallengeId] = useState(base?.challengeId ?? '');

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const status: ContentStatus = cmsLesson?.status ?? 'draft';

  const save = () => {
    saveLesson({
      id: lessonId,
      title: title.trim() || 'Untitled lesson',
      estMinutes: Number(estMinutes) || 6,
      roleIds: 'all',
      difficulty,
      objectives: objectives.split('\n').map((s) => s.trim()).filter(Boolean),
      whyItMatters: whyItMatters.trim(),
      walkthrough: walkthrough.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      quizId: quizId.trim() || undefined,
      challengeId: challengeId.trim() || undefined,
      version: '1.0-cms',
      status,
      updatedAt: new Date().toISOString(),
    });
    router.push('/admin/academy/cms');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => router.push('/admin/academy/cms')} className="text-sm text-primary hover:underline">← CMS</button>
      <h1 className="text-2xl font-bold text-foreground">{isNew ? 'New lesson' : `Edit: ${base?.title ?? lessonId}`}</h1>
      <p className="text-xs text-muted-foreground">ID <code>{lessonId}</code> · status <strong className="capitalize">{status}</strong>{seed ? ' · overriding a seed lesson on publish' : ''}</p>

      <Field label="Title"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
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
      <Field label="Learning objectives" hint="One per line."><textarea className={inputCls} rows={4} value={objectives} onChange={(e) => setObjectives(e.target.value)} /></Field>
      <Field label="Why this matters"><textarea className={inputCls} rows={3} value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} /></Field>
      <Field label="Walkthrough" hint="Separate paragraphs with a blank line."><textarea className={inputCls} rows={6} value={walkthrough} onChange={(e) => setWalkthrough(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Knowledge-check quiz id" hint="Optional (e.g. q-what-is)"><input className={inputCls} value={quizId} onChange={(e) => setQuizId(e.target.value)} /></Field>
        <Field label="Challenge id" hint="Optional (e.g. ch-upload-sample)"><input className={inputCls} value={challengeId} onChange={(e) => setChallengeId(e.target.value)} /></Field>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={save}>Save lesson</Button>
        {!isNew && cmsLesson && (
          <button onClick={() => { removeLesson(lessonId); router.push('/admin/academy/cms'); }} className="text-xs text-muted-foreground hover:text-error">Delete</button>
        )}
        <span className="text-xs text-muted-foreground">Saved as draft — publish from the CMS list.</span>
      </div>
    </div>
  );
}
