'use client';

// Feedback workspace + feedback→roadmap workflow. Local-first; audited.

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { useSupport, type FeedbackType, type FeedbackStatus } from '@/lib/admin/stores/support';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { formatRelativeTime } from '@/lib/admin/format';

const TYPES: FeedbackType[] = ['ai_result', 'page', 'tutorial', 'video', 'bug', 'feature', 'ux'];
const STATUSES: FeedbackStatus[] = ['new', 'triaged', 'planned', 'done', 'dismissed'];
const STATUS_TONE: Record<FeedbackStatus, BadgeTone> = { new: 'warning', triaged: 'info', planned: 'accent', done: 'success', dismissed: 'neutral' };

export function FeedbackClient({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const feedback = useSupport((s) => s.feedback);
  const addFeedback = useSupport((s) => s.addFeedback);
  const setStatus = useSupport((s) => s.setFeedbackStatus);
  const remove = useSupport((s) => s.removeFeedback);

  const [type, setType] = useState<FeedbackType>('ai_result');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('');
  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all');

  if (!mounted) return <p className="text-sm text-gray-500">Loading feedback…</p>;

  function add() {
    if (!summary.trim()) return;
    const f = addFeedback({ type, summary: summary.trim(), source: source.trim() });
    recordAudit({ actor, action: 'feedback.create', entityType: 'feedback', entityId: f.id, summary: `Logged ${type} feedback` });
    setSummary('');
    setSource('');
  }

  const shown = feedback.filter((f) => filter === 'all' || f.status === filter);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:grid-cols-[10rem_1fr_10rem_auto]">
        <select value={type} onChange={(e) => setType(e.target.value as FeedbackType)} className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200">
          {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="What did they say?" className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100" />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (page/user)" className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100" />
        <button onClick={add} disabled={!summary.trim()} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-gray-950 hover:bg-amber-400 disabled:opacity-40">Add</button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-lg border px-2.5 py-1 capitalize ${filter === s ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-gray-800 bg-gray-900 text-gray-400'}`}>{s}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center text-sm text-gray-500">
          {feedback.length === 0 ? 'No feedback logged yet. Capture AI-result, page, tutorial, bug, feature and UX feedback here, then move it through to the roadmap.' : 'Nothing matches this filter.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((f) => (
            <li key={f.id} className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
              <StatusBadge tone="accent">{f.type.replace('_', ' ')}</StatusBadge>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200">{f.summary}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{f.source || '—'} · {formatRelativeTime(f.createdAt)}</p>
              </div>
              <select
                value={f.status}
                onChange={(e) => { setStatus(f.id, e.target.value as FeedbackStatus); recordAudit({ actor, action: 'feedback.status', entityType: 'feedback', entityId: f.id, summary: `Feedback → ${e.target.value}` }); }}
                className="rounded border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <StatusBadge tone={STATUS_TONE[f.status]}>{f.status}</StatusBadge>
              <button onClick={() => remove(f.id)} className="text-gray-500 hover:text-red-400" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
