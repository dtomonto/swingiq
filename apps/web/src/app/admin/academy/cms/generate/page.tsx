'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateFromRelease, type GeneratedTraining } from '@/lib/academy/generate';
import { useAcademyCmsStore } from '@/lib/academy/cms';
import { Button } from '@/components/ui/Button';

const inputCls = 'w-full rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground';

export default function GeneratePage() {
  const router = useRouter();
  const saveLesson = useAcademyCmsStore((s) => s.saveLesson);
  const saveCourse = useAcademyCmsStore((s) => s.saveCourse);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState<GeneratedTraining | null>(null);

  const generate = () => setDraft(generateFromRelease({ title, body }));
  const saveDrafts = () => {
    if (!draft) return;
    saveLesson(draft.lesson);
    saveCourse(draft.course);
    router.push('/admin/academy/cms');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={() => router.push('/admin/academy/cms')} className="text-sm text-primary hover:underline">← CMS</button>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Generate training from a release note</h1>
        <p className="text-muted-foreground">Paste a release note to scaffold draft training. Everything is created as a <strong>draft</strong> for human review — nothing publishes automatically.</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Feature / release title</span>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Smartwatch readiness in Coach Mode" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Release note</span>
        <span className="mb-1 block text-xs text-muted-foreground">Bullet lines become objectives; paragraphs become the walkthrough.</span>
        <textarea className={inputCls} rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'- Coaches can now see a readiness score per athlete\n- Tap a player to view today’s readiness\n\nReadiness is an estimate from optional wellness inputs, not a medical assessment.'} />
      </label>

      <div className="flex gap-3">
        <Button onClick={generate} disabled={!title.trim() && !body.trim()}>Generate draft</Button>
        {draft && <Button variant="outline" onClick={saveDrafts}>Save drafts to CMS →</Button>}
      </div>

      {draft && (
        <div className="space-y-4 rounded-theme border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Preview (draft)</p>
          <div>
            <h2 className="font-bold text-foreground">{draft.course.title}</h2>
            <p className="text-sm text-muted-foreground">{draft.course.summary}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{draft.lesson.title}</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Objectives</p>
            <ul className="list-disc pl-5 text-sm text-foreground">{draft.lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul>
            <p className="mt-2 text-sm text-foreground">{draft.lesson.walkthrough.join(' ')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['support', 'sales', 'qa', 'admin'] as const).map((role) => (
              <div key={role}>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{role} checklist</p>
                <ul className="list-disc pl-5 text-sm text-foreground">{draft.checklists[role].map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Saving adds these as <strong>draft</strong> items in the CMS — edit, then move through review → publish.</p>
        </div>
      )}
    </div>
  );
}
