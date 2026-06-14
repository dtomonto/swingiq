'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAcademyStore } from '@/lib/academy/store';
import { advisorPlan } from '@/lib/academy/advisor';
import { advisorMessage } from '@/lib/academy/engine';
import { askTutor, suggestedQuestions, type TutorAnswer } from '@/lib/academy/tutor';
import { useMounted, RoleSelect } from '@/components/academy/parts';
import { Button } from '@/components/ui/Button';

interface ChatTurn { q: string; a: TutorAnswer }

export default function AdvisorPage() {
  const mounted = useMounted();
  const progress = useAcademyStore((s) => s.progress);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  const ask = (q: string) => {
    const query = q.trim();
    if (!query) return;
    setTurns((t) => [{ q: query, a: askTutor(query) }, ...t]);
    setInput('');
  };

  const plan = mounted ? advisorPlan(progress) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Advisor</h1>
          <p className="text-muted-foreground">Personalized next steps and a tutor that answers from approved lessons.</p>
        </div>
        <RoleSelect />
      </div>

      {/* Advisor plan */}
      <section className="rounded-theme border border-primary/20 bg-primary/5 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Your plan</h2>
        <p className="mt-1 text-foreground">{mounted ? advisorMessage(progress) : '…'}</p>
        {plan.length > 0 && (
          <ul className="mt-4 space-y-2">
            {plan.map((item, i) => (
              <li key={i}>
                <Link href={item.href} className="flex items-center justify-between gap-3 rounded-theme border border-border bg-card p-3 transition-colors hover:border-primary/50">
                  <span>
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.reason}</span>
                  </span>
                  <span className="text-xs text-primary">Go →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tutor */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-foreground">Ask the Academy tutor</h2>
        <p className="mb-3 text-xs text-muted-foreground">Answers come only from approved Academy lessons, with citations. It won’t guess outside that content.</p>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How do I explain AI feedback to a beginner?"
            className="flex-1 rounded-theme border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
          <Button type="submit">Ask</Button>
        </form>

        {turns.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedQuestions().map((q) => (
              <button key={q} onClick={() => ask(q)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">{q}</button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-4">
          {turns.map((t, i) => (
            <div key={i} className="rounded-theme border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{t.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{t.a.answer}</p>
              {t.a.citations.length > 0 && (
                <div className="mt-3">
                  <p className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">Sources</p>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {t.a.citations.map((c) => (
                      <li key={c.lessonId}>
                        <Link href={`/admin/academy/lesson/${c.lessonId}`} className="text-primary hover:underline">{c.title} ↗</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {t.a.followups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.a.followups.map((f) => (
                    <button key={f} onClick={() => ask(f)} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">{f}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
