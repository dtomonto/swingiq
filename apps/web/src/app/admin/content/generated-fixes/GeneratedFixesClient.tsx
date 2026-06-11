'use client';

// Generated-fix review queue. Operator enters a query (from a user
// search or an AI-detected issue); it's classified + scored by the pure
// gate, then approved / rejected / merged. Local-first; audit-logged.

import { useEffect, useMemo, useState } from 'react';
import { Wand2, Check, X, GitMerge, Trash2 } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { useContentReview } from '@/lib/admin/stores/content-review';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import {
  scoreFixCandidate, classifyFixQuery, recommendFix,
  type FixSource, type FixStatus, type FixScores,
} from '@/lib/admin/generated-fixes';

const SOURCES: { value: FixSource; label: string }[] = [
  { value: 'user_search', label: 'User search' },
  { value: 'ai_video', label: 'AI video analysis' },
  { value: 'ai_image', label: 'AI image analysis' },
  { value: 'manual', label: 'Manual' },
];

const STATUS_TONE: Record<FixStatus, BadgeTone> = {
  needs_review: 'warning', approved: 'success', rejected: 'danger', merged: 'info', published: 'accent',
};

const REC_TONE = { approve: 'success', review: 'warning', reject: 'danger' } as const;

function ScoreBar({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value < 50 : value >= 60;
  const mid = value >= 40 && value < 60;
  const color = good ? 'bg-success/70' : mid ? 'bg-primary/70' : 'bg-error/70';
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-7 shrink-0 text-right tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

export function GeneratedFixesClient({ existingKeywords }: { existingKeywords: string[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const candidates = useContentReview((s) => s.candidates);
  const addCandidate = useContentReview((s) => s.addCandidate);
  const setStatus = useContentReview((s) => s.setStatus);
  const remove = useContentReview((s) => s.remove);

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<FixSource>('user_search');
  const [preview, setPreview] = useState<FixScores | null>(null);

  // Live score preview as the operator types.
  useEffect(() => {
    if (query.trim().length < 3) return setPreview(null);
    setPreview(scoreFixCandidate(query, { existingKeywords }));
  }, [query, existingKeywords]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const x of candidates) c[x.status] = (c[x.status] ?? 0) + 1;
    return c;
  }, [candidates]);

  function add() {
    const q = query.trim();
    if (q.length < 3) return;
    const scores = scoreFixCandidate(q, { existingKeywords });
    const { sport } = classifyFixQuery(q);
    const c = addCandidate({ query: q, sport, source, scores });
    recordAudit({
      actor: 'admin', action: 'fix.add', entityType: 'generated-fix', entityId: c.id,
      summary: `Queued fix candidate "${q}"`,
    });
    setQuery('');
    setPreview(null);
  }

  function act(id: string, status: FixStatus, query: string) {
    setStatus(id, status);
    recordAudit({
      actor: 'admin', action: `fix.${status}`, entityType: 'generated-fix', entityId: id,
      summary: `Marked fix "${query}" as ${status.replace('_', ' ')}`,
      severity: status === 'rejected' ? 'warning' : 'info',
    });
  }

  if (!mounted) return <p className="text-sm text-muted-foreground">Loading review queue…</p>;

  return (
    <div className="space-y-5">
      {/* Add / score */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Score a fix opportunity</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Enter a user search or an AI-detected issue. It&apos;s classified and scored before anything is created.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder='e.g. "how to stop topping the golf ball"'
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as FixSource)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button
            onClick={add}
            disabled={query.trim().length < 3}
            className="rounded-lg bg-warning px-3 py-2 text-sm font-medium text-foreground hover:bg-warning disabled:opacity-40"
          >
            Score &amp; queue
          </button>
        </div>

        {preview && (
          <div className="mt-3 grid gap-1.5 rounded-lg border border-border bg-background p-3 sm:grid-cols-2">
            <ScoreBar label="Relevance" value={preview.relevance} />
            <ScoreBar label="Quality" value={preview.quality} />
            <ScoreBar label="Duplication" value={preview.duplication} invert />
            <ScoreBar label="SEO opp." value={preview.seoOpportunity} />
            <ScoreBar label="Safety risk" value={preview.safetyRisk} invert />
            <div className="flex items-center sm:justify-end">
              <StatusBadge tone={REC_TONE[recommendFix(preview).action]}>
                Gate: {recommendFix(preview).action}
              </StatusBadge>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {candidates.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(['needs_review', 'approved', 'rejected', 'merged'] as FixStatus[]).map((st) => (
            <span key={st} className="rounded-lg border border-border bg-card px-2.5 py-1">
              <span className="capitalize text-muted-foreground">{st.replace('_', ' ')}</span>{' '}
              <span className="font-semibold tabular-nums text-foreground">{counts[st] ?? 0}</span>
            </span>
          ))}
        </div>
      )}

      {/* Queue */}
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <Wand2 className="mx-auto h-7 w-7 text-link" />
          <p className="mt-2 text-sm font-medium text-foreground">No candidates in the queue</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add a query above to run it through the relevance gate. When the generation pipeline is wired to
            auto-feed user searches and AI-detected issues, they&apos;ll land here for the same review.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {candidates.map((c) => {
            const rec = recommendFix(c.scores);
            return (
              <li key={c.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{c.query}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.sport ?? 'general'} · {c.source.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={REC_TONE[rec.action]}>gate: {rec.action}</StatusBadge>
                    <StatusBadge tone={STATUS_TONE[c.status]}>{c.status.replace('_', ' ')}</StatusBadge>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  <ScoreBar label="Relevance" value={c.scores.relevance} />
                  <ScoreBar label="Quality" value={c.scores.quality} />
                  <ScoreBar label="Duplication" value={c.scores.duplication} invert />
                  <ScoreBar label="SEO opp." value={c.scores.seoOpportunity} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{rec.reason}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => act(c.id, 'approved', c.query)} className="inline-flex items-center gap-1 rounded-md bg-success/80 px-2 py-1 text-xs font-medium text-white hover:bg-success">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => act(c.id, 'merged', c.query)} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted">
                    <GitMerge className="h-3.5 w-3.5" /> Merge
                  </button>
                  <button onClick={() => act(c.id, 'rejected', c.query)} className="inline-flex items-center gap-1 rounded-md border border-error/40 px-2 py-1 text-xs text-error-text hover:bg-error/10">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button onClick={() => remove(c.id)} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
