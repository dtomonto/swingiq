'use client';

// ============================================================
// Internal-link recommendations — review + act (client).
// Approve / Auto-apply (safe only) / Reject, calling the apply API. The full
// record is sent so a live-computed rec persists on first action. Mirrors the
// GrowthOS admin-secret retry pattern.
// ============================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InternalLinkRecommendation } from '@/lib/growth/types';

const SECRET_KEY = 'growthos.adminSecret';
type Action = 'approve' | 'reject' | 'auto-apply';

function statusClass(status: string): string {
  if (status === 'approved' || status === 'applied' || status === 'auto-applied') return 'text-success-text bg-success/10 border-success/30';
  if (status === 'rejected') return 'text-error-text bg-error/10 border-error/30';
  if (status === 'snoozed') return 'text-muted-foreground bg-muted/10 border-border/30';
  return 'text-link bg-primary/10 border-primary/30';
}

function scoreClass(score: number): string {
  if (score >= 70) return 'text-success-text';
  if (score >= 45) return 'text-link';
  return 'text-error-text';
}

export function InternalLinksRecs({ recs: initial }: { recs: InternalLinkRecommendation[] }) {
  const router = useRouter();
  const [recs, setRecs] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'pending' | 'auto-safe' | 'actioned'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => recs.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'auto-safe') return r.autoSafe && r.status === 'pending';
    if (filter === 'actioned') return r.status !== 'pending';
    return true;
  }), [recs, filter]);

  async function act(rec: InternalLinkRecommendation, action: Action, retrySecret?: string): Promise<void> {
    setBusy(rec.id + action);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = retrySecret ?? window.sessionStorage.getItem(SECRET_KEY);
    if (secret) headers['x-admin-secret'] = secret;
    try {
      const res = await fetch('/api/growth/link-intelligence/apply', {
        method: 'POST', headers, body: JSON.stringify({ id: rec.id, action, record: rec }),
      });
      if (res.status === 401) {
        const entered = window.prompt('Enter ADMIN_SECRET to act (required in production):');
        if (entered) { window.sessionStorage.setItem(SECRET_KEY, entered); setBusy(null); return act(rec, action, entered); }
        setBusy(null); return;
      }
      if (res.ok) {
        const { record } = await res.json();
        setRecs((prev) => prev.map((x) => (x.id === rec.id ? { ...x, status: record?.status ?? x.status } : x)));
        router.refresh();
      }
    } catch { /* keep UI; user can retry */ } finally { setBusy(null); }
  }

  const tabs: { id: typeof filter; label: string }[] = [
    { id: 'all', label: `All (${recs.length})` },
    { id: 'pending', label: `Pending (${recs.filter((r) => r.status === 'pending').length})` },
    { id: 'auto-safe', label: `Auto-safe (${recs.filter((r) => r.autoSafe && r.status === 'pending').length})` },
    { id: 'actioned', label: `Actioned (${recs.filter((r) => r.status !== 'pending').length})` },
  ];

  if (recs.length === 0) {
    return <p className="text-sm text-muted-foreground">No internal-link recommendations right now — run the agent or check back after new content ships.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={cn('text-xs px-2.5 py-1 rounded-lg border transition-colors',
              filter === t.id ? 'bg-success border-success text-white' : 'bg-card border-border text-muted-foreground hover:border-border')}>
            {t.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((rec) => (
          <li key={rec.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-sm font-semibold', scoreClass(rec.score))}>{rec.score}</span>
                  <span className="text-sm text-foreground truncate">{rec.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{rec.contextSentence}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-2xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">{rec.sourceUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                  <span className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">{rec.destinationUrl}</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted border border-border">anchor: {rec.anchorKind}</span>
                  <span className={cn('px-1.5 py-0.5 rounded border', statusClass(rec.status))}>{rec.status}</span>
                </div>
              </div>
            </div>

            {rec.status === 'pending' && (
              <div className="mt-2.5 flex items-center gap-2">
                {rec.autoSafe ? (
                  <button onClick={() => act(rec, 'auto-apply')} disabled={busy === rec.id + 'auto-apply'}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-success hover:bg-success text-white font-semibold disabled:opacity-60">
                    {busy === rec.id + 'auto-apply' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Auto-apply
                  </button>
                ) : (
                  <button onClick={() => act(rec, 'approve')} disabled={busy === rec.id + 'approve'}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted border border-border text-foreground hover:border-border disabled:opacity-60">
                    {busy === rec.id + 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                  </button>
                )}
                <button onClick={() => act(rec, 'reject')} disabled={busy === rec.id + 'reject'}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-error-text hover:border-error/40 disabled:opacity-60">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
                {!rec.autoSafe && <span className="text-2xs text-muted-foreground/70">Manual review (not auto-safe).</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-2xs text-muted-foreground/70">
        &ldquo;Auto-apply&rdquo; records the accepted decision and is gated to safe, high-confidence, natural-anchor links.
        It doesn&apos;t edit page source at runtime — insert via your content workflow. Everything is reversible.
      </p>
    </div>
  );
}
