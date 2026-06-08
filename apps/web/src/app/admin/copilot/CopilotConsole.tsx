'use client';

// ============================================================
// Admin Copilot — console (client)
// ------------------------------------------------------------
// Suggested-question chips + a free-text box that ask the read-only
// /api/admin/copilot endpoint and render grounded, labeled answers.
// Every answer shows HOW it was produced ("Computed from your data" vs
// "AI-assisted"), its confidence, its data sources, and the next steps
// that link back into the existing tools.
// ============================================================

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, Send, Loader2, ArrowUpRight, ShieldCheck, Database, Cpu, AlertTriangle,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import type { CopilotAnswer } from '@/lib/admin/copilot/types';
import type { CopilotIntent } from '@/lib/admin/copilot/questions';

interface Suggested {
  id: CopilotIntent;
  question: string;
}

interface Turn {
  id: string;
  question: string;
  answer: CopilotAnswer | null; // null while loading
  error?: string;
}

const CONFIDENCE_TONE: Record<CopilotAnswer['confidence'], BadgeTone> = {
  high: 'success',
  medium: 'info',
  low: 'warning',
};

export function CopilotConsole({
  initialAnswer,
  suggested,
  meta,
}: {
  initialAnswer: CopilotAnswer;
  suggested: Suggested[];
  meta: { generatedAt: string; connected: boolean };
}) {
  const [turns, setTurns] = useState<Turn[]>([
    { id: 'opening', question: 'What should I improve next?', answer: initialAnswer },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  async function ask(payload: { query?: string; intent?: CopilotIntent }, label: string) {
    if (busy) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTurns((t) => [...t, { id, question: label, answer: null }]);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const message =
          res.status === 401 || res.status === 403
            ? 'Not authorized to use the Copilot.'
            : data?.message || 'Something went wrong answering that.';
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: message } : x)));
      } else {
        setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer: data.answer as CopilotAnswer } : x)));
      }
    } catch {
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: 'Network error — please try again.' } : x)));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');
    void ask({ query: q }, q);
  }

  return (
    <div className="space-y-4">
      {/* Safety / provenance banner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="h-4 w-4" /> Read-only — never publishes, emails or deletes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Database className="h-4 w-4 text-gray-500" /> Answers computed from your live admin data
        </span>
        <span className="inline-flex items-center gap-1.5">
          <StatusBadge tone={meta.connected ? 'success' : 'warning'}>
            {meta.connected ? 'Live data' : 'Local mode'}
          </StatusBadge>
        </span>
      </div>

      {/* Suggested questions */}
      <div className="flex flex-wrap gap-2">
        {suggested.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busy}
            onClick={() => ask({ intent: s.id }, s.question)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-amber-500/50 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            {s.question}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="space-y-4">
        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            {/* Question */}
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-amber-500/10 px-4 py-2 text-sm text-amber-100 ring-1 ring-amber-500/20">
                {turn.question}
              </p>
            </div>
            {/* Answer */}
            {turn.error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{turn.error}</span>
              </div>
            ) : turn.answer ? (
              <AnswerCard answer={turn.answer} />
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" /> Thinking…
              </div>
            )}
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <label htmlFor="copilot-input" className="sr-only">
          Ask the Admin Copilot a question
        </label>
        <input
          id="copilot-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your platform…"
          maxLength={500}
          autoComplete="off"
          className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Ask
        </button>
      </form>
    </div>
  );
}

function AnswerCard({ answer }: { answer: CopilotAnswer }) {
  const isAi = answer.generatedBy === 'ai';
  return (
    <SectionCard>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-100">{answer.title}</h3>
        <div className="flex items-center gap-1.5">
          <StatusBadge tone={isAi ? 'accent' : 'neutral'}>
            {isAi ? (
              <>
                <Cpu className="h-3 w-3" /> AI-assisted
              </>
            ) : (
              <>
                <Database className="h-3 w-3" /> Computed from your data
              </>
            )}
          </StatusBadge>
          <StatusBadge tone={CONFIDENCE_TONE[answer.confidence]}>{answer.confidence} confidence</StatusBadge>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-gray-300">{answer.summary}</p>

      {answer.bullets.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {answer.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/70" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {answer.caveat && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-300/90 ring-1 ring-amber-500/20">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{answer.caveat}</span>
        </p>
      )}

      {answer.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {answer.actions.map((a, i) =>
            a.built ? (
              <Link
                key={i}
                href={a.href}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-amber-500/50 hover:text-amber-300"
              >
                {a.label}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-500"
              >
                {a.label} (soon)
              </span>
            ),
          )}
        </div>
      )}

      {answer.sources.length > 0 && (
        <p className="mt-3 text-[11px] text-gray-500">
          Sources:{' '}
          {answer.sources.map((sourceItem, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {sourceItem.href ? (
                <Link href={sourceItem.href} className="text-gray-400 hover:text-amber-300 hover:underline">
                  {sourceItem.label}
                </Link>
              ) : (
                <span className="text-gray-400">{sourceItem.label}</span>
              )}
            </span>
          ))}
        </p>
      )}
    </SectionCard>
  );
}
