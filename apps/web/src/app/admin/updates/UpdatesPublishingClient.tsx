'use client';

// Publishing manager for the auto-generated changelog. Reads the draft/live
// state from props (server-read from the data files), toggles via the guarded
// API route, and records every change in the local-first audit log.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Lock, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SectionCard } from '@/components/admin/SectionCard';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import type { PublishRow, PublishKind } from '@/lib/admin/updates-store';

/** Per-row quality info fetched from GET /api/admin/updates. */
interface QualityInfo {
  score: number;
  needsHumanReview: boolean;
  valid: boolean;
  errorCount: number;
  warningCount: number;
}

const PUBLIC_HREF: Partial<Record<PublishKind, string>> = {
  product: '/updates',
  dev: '/dev-updates',
  blog: '/blog',
};

export function UpdatesPublishingClient({
  product,
  dev,
  seo,
  blog,
  writable,
  actor,
}: {
  product: PublishRow[];
  dev: PublishRow[];
  seo: PublishRow[];
  blog: PublishRow[];
  writable: boolean;
  actor: string;
}) {
  const [rows, setRows] = useState<Record<PublishKind, PublishRow[]>>({ product, dev, seo, blog });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [quality, setQuality] = useState<Record<string, QualityInfo>>({});

  // Pull per-row quality scores so the table shows them BEFORE publishing.
  useEffect(() => {
    let active = true;
    fetch('/api/admin/updates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.product) return;
        const map: Record<string, QualityInfo> = {};
        for (const q of data.product as Array<QualityInfo & { id: string }>) map[q.id] = q;
        setQuality(map);
      })
      .catch(() => {/* scores are advisory — ignore fetch failures */});
    return () => {
      active = false;
    };
  }, []);

  async function toggle(row: PublishRow) {
    if (!writable || busy) return;
    const next = !row.published;
    setBusy(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: row.kind, id: row.id, action: next ? 'publish' : 'unpublish' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || data?.error || 'Could not save the change.');
        return;
      }
      setRows((s) => ({
        ...s,
        [row.kind]: s[row.kind].map((r) => (r.id === row.id ? { ...r, published: next } : r)),
      }));
      if (next && typeof data?.qualityScore === 'number') {
        const parts = [`Quality score ${data.qualityScore}/100`];
        if (data.needsHumanReview) parts.push('flagged for human review');
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          parts.push(data.warnings.join(' '));
        }
        setNotice(`Published “${row.title}” — ${parts.join(' · ')}.`);
      }
      recordAudit({
        actor,
        action: 'update.publish',
        entityType: 'update',
        entityId: `${row.kind}:${row.id}`,
        summary: `${next ? 'Published' : 'Unpublished'} ${row.kind} update “${row.title}”`,
        severity: next ? 'info' : 'warning',
      });
    } catch {
      setError('Network error — the change was not saved.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {!writable && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This legacy screen edits a versioned data file, which the production filesystem can&apos;t
            write — so toggles here are local-only. Production publishing is no longer a dead-end:{' '}
            <Link href="/admin/publishing" className="font-medium underline hover:no-underline">
              open PublishingOS
            </Link>{' '}
            to publish durably (database-backed, revalidated live, with rollback &amp; an audit trail) —
            no commit, push or deploy required.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{notice}</p>
        </div>
      )}

      <PublishSection
        kind="product"
        label="Product updates"
        sublabel="Shown on the public /updates changelog for athletes."
        rows={rows.product}
        writable={writable}
        busy={busy}
        onToggle={toggle}
        quality={quality}
      />
      <PublishSection
        kind="dev"
        label="Developer updates"
        sublabel="Shown on the public /dev-updates engineering log."
        rows={rows.dev}
        writable={writable}
        busy={busy}
        onToggle={toggle}
      />
      <PublishSection
        kind="seo"
        label="SEO / answer-engine pages"
        sublabel="Drafts are not routed, indexed, or in the sitemap."
        rows={rows.seo}
        writable={writable}
        busy={busy}
        onToggle={toggle}
      />
      <PublishSection
        kind="blog"
        label="Blog posts"
        sublabel="Drafts are hidden from /blog, the post URL (404), and the sitemap."
        rows={rows.blog}
        writable={writable}
        busy={busy}
        onToggle={toggle}
      />
    </div>
  );
}

function QualityChip({ info }: { info: QualityInfo }) {
  if (!info.valid) {
    return (
      <StatusBadge tone="danger">
        Won&apos;t publish · {info.errorCount} error{info.errorCount === 1 ? '' : 's'}
      </StatusBadge>
    );
  }
  const tone = info.needsHumanReview ? 'warning' : 'success';
  return (
    <StatusBadge tone={tone}>
      Quality {info.score}/100{info.needsHumanReview ? ' · review' : ''}
    </StatusBadge>
  );
}

function PublishSection({
  kind,
  label,
  sublabel,
  rows,
  writable,
  busy,
  onToggle,
  quality,
}: {
  kind: PublishKind;
  label: string;
  sublabel: string;
  rows: PublishRow[];
  writable: boolean;
  busy: string | null;
  onToggle: (row: PublishRow) => void;
  quality?: Record<string, QualityInfo>;
}) {
  const live = rows.filter((r) => r.published).length;
  const drafts = rows.length - live;
  const href = PUBLIC_HREF[kind];

  return (
    <SectionCard
      title={label}
      description={`${sublabel} ${live} live · ${drafts} draft${drafts === 1 ? '' : 's'}.`}
    >
      {href && (
        <div className="mb-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
          >
            View public page <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No entries yet
          {kind === 'product' || kind === 'dev'
            ? ' — they appear after a commit with an Update:/Dev-Update: trailer.'
            : '.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-gray-100">{row.title}</p>
                  <StatusBadge tone={row.published ? 'success' : 'neutral'}>
                    {row.published ? 'Live' : 'Draft'}
                  </StatusBadge>
                  {quality?.[row.id] && <QualityChip info={quality[row.id]} />}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-gray-600">
                  {[row.date, row.category, row.sourceCommit].filter(Boolean).join(' · ')}
                </p>
              </div>

              <button
                role="switch"
                aria-checked={row.published}
                aria-label={`${row.published ? 'Unpublish' : 'Publish'} ${row.title}`}
                disabled={!writable || busy === row.id}
                onClick={() => onToggle(row)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                  row.published ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    row.published ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
