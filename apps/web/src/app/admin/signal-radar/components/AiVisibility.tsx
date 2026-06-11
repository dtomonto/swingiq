'use client';

import { useState } from 'react';
import { Plus, Trash2, Bot } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { AiVisibilityTest } from '@/lib/signal-radar/types';
import { Btn, EmptyState, INPUT_CLS } from './ui';

const STARTERS = [
  'Best AI golf swing analysis app',
  'How can I analyze my tennis swing with AI?',
  'Upload softball swing video for feedback',
  'Best app for baseball swing analysis',
  'AI pickleball stroke analysis',
  'AI padel swing analysis',
  'Sportsbox AI alternative',
  'OnForm alternative',
  'Free golf swing analysis app',
];

function newTest(query: string): AiVisibilityTest {
  return {
    id: `ai_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    query,
    platform: 'ChatGPT',
    resultSummary: '',
    swingVantageAppeared: null,
    competitorsMentioned: [],
    recommendedPage: '',
    priority: 50,
    notes: '',
    status: 'untested',
  };
}

export function AiVisibility({ tests, onUpsert, onRemove }: {
  tests: AiVisibilityTest[];
  onUpsert: (t: AiVisibilityTest) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const add = (q: string) => {
    const t = q.trim();
    if (!t) return;
    onUpsert(newTest(t));
    setQuery('');
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="AI answer-engine visibility"
        description="Track whether SwingVantage shows up when people ask AI tools (ChatGPT, Perplexity, Google AI Overview) the questions that matter. Run a prompt in your AI tool, then record what you saw — manual + auditable by design."
      >
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add a test prompt…" className={INPUT_CLS}
            onKeyDown={(e) => { if (e.key === 'Enter') add(query); }} />
          <Btn tone="primary" disabled={!query.trim()} onClick={() => add(query)}><Plus className="h-4 w-4" /> Add test</Btn>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STARTERS.filter((s) => !tests.some((t) => t.query === s)).map((s) => (
            <button key={s} onClick={() => add(s)} className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300 hover:border-amber-500/40 hover:text-amber-300">
              + {s}
            </button>
          ))}
        </div>
      </SectionCard>

      {tests.length === 0 ? (
        <EmptyState icon={Bot} title="No AI visibility tests yet" hint="Add a prompt above or pick a suggested one to start auditing your AI presence." />
      ) : (
        <ul className="space-y-3">
          {tests.map((t) => (
            <li key={t.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-gray-100">{t.query}</p>
                <button onClick={() => onRemove(t.id)} className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-red-400" aria-label="Delete test"><Trash2 className="h-4 w-4" /></button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-gray-400">Platform
                  <input value={t.platform} onChange={(e) => onUpsert({ ...t, platform: e.target.value })} className={`${INPUT_CLS} mt-1`} />
                </label>
                <label className="text-xs text-gray-400">SwingVantage appeared?
                  <select
                    value={t.swingVantageAppeared === null ? 'unknown' : t.swingVantageAppeared ? 'yes' : 'no'}
                    onChange={(e) => onUpsert({ ...t, swingVantageAppeared: e.target.value === 'unknown' ? null : e.target.value === 'yes', status: e.target.value === 'no' ? 'action_needed' : 'tested' })}
                    className={`${INPUT_CLS} mt-1`}
                  >
                    <option value="unknown">Not tested</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="text-xs text-gray-400 sm:col-span-2">Result summary
                  <textarea value={t.resultSummary} onChange={(e) => onUpsert({ ...t, resultSummary: e.target.value })} rows={2} placeholder="What did the AI answer? Which tools did it name?" className={`${INPUT_CLS} mt-1`} />
                </label>
                <label className="text-xs text-gray-400">Competitors mentioned (comma-sep)
                  <input value={t.competitorsMentioned.join(', ')} onChange={(e) => onUpsert({ ...t, competitorsMentioned: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className={`${INPUT_CLS} mt-1`} />
                </label>
                <label className="text-xs text-gray-400">Recommended page to create/improve
                  <input value={t.recommendedPage} onChange={(e) => onUpsert({ ...t, recommendedPage: e.target.value })} className={`${INPUT_CLS} mt-1`} />
                </label>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <StatusBadge tone={t.swingVantageAppeared === false ? 'danger' : t.swingVantageAppeared ? 'success' : 'neutral'}>
                  {t.status.replace(/_/g, ' ')}
                </StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
