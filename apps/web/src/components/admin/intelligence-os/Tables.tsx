'use client';

// Client tables for the Intelligence OS list pages. Built on the shared admin
// DataTable (search / sort / pagination / row links / mobile cards). Server
// pages pass plain serializable rows; columns + render fns live here so the
// function props never cross the server/client boundary.

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { severityTone } from '@/lib/intelligence-os/types';
import type {
  ActionTask, AiActivityEvent, KnowledgeItem, CanonicalAnswer, PatternMemory,
} from '@/lib/intelligence-os/types';

const num = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString());
const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 100)}%`);

function DemoTag({ source }: { source: string }) {
  if (source === 'real') return null;
  const label = source === 'demo' ? 'demo' : source === 'manual' ? 'manual' : 'pending';
  return <span className="ml-2 rounded bg-muted px-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>;
}

// ── Tasks ─────────────────────────────────────────────────────
export function TasksTable({ rows }: { rows: ActionTask[] }) {
  const columns: Column<ActionTask>[] = [
    {
      key: 'title', header: 'Task',
      render: (t) => (
        <div className="font-medium text-foreground">
          {t.title}
          <DemoTag source={t.dataSource} />
          <div className="text-xs text-muted-foreground">{t.category} · {t.affectedRoute ?? t.affectedFeature ?? '—'}</div>
        </div>
      ),
      sortValue: (t) => t.title,
    },
    { key: 'severity', header: 'Severity', render: (t) => <StatusBadge tone={severityTone(t.severity)}>{t.severity}</StatusBadge>, sortValue: (t) => t.severity },
    { key: 'status', header: 'Status', render: (t) => <span className="text-sm">{t.status}</span>, sortValue: (t) => t.status },
    { key: 'occurrenceCount', header: 'Seen', render: (t) => <span className="tabular-nums">{t.occurrenceCount}×</span>, sortValue: (t) => t.occurrenceCount },
    { key: 'confidenceScore', header: 'Conf.', render: (t) => <span className="tabular-nums">{pct(t.confidenceScore)}</span>, sortValue: (t) => t.confidenceScore ?? 0 },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(t) => t.id}
      searchText={(t) => `${t.title} ${t.category} ${t.affectedRoute} ${t.status} ${t.severity}`}
      searchPlaceholder="Search tasks…"
      rowHref={(t) => `/admin/intelligence-os/tasks/${t.id}`}
      initialSortKey="severity"
      emptyState="No tasks yet."
    />
  );
}

// ── AI Activity ───────────────────────────────────────────────
export function ActivityTable({ rows }: { rows: AiActivityEvent[] }) {
  const columns: Column<AiActivityEvent>[] = [
    {
      key: 'promptSummary', header: 'Request',
      render: (e) => (
        <div className="font-medium text-foreground">
          {e.promptSummary}
          <DemoTag source={e.dataSource} />
          <div className="text-xs text-muted-foreground">{e.sourceSystem} · {e.feature}{e.sport ? ` · ${e.sport}` : ''}</div>
        </div>
      ),
      sortValue: (e) => e.promptSummary,
    },
    { key: 'provider', header: 'Provider', render: (e) => <span className="text-sm">{e.provider ?? '—'}{e.model ? ` / ${e.model}` : ''}</span>, sortValue: (e) => e.provider ?? '' },
    { key: 'estimatedCost', header: 'Cost', render: (e) => <span className="tabular-nums">{e.estimatedCost == null ? '—' : `$${e.estimatedCost.toFixed(3)}`}</span>, sortValue: (e) => e.estimatedCost ?? 0 },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge tone={e.status === 'error' ? 'critical' : e.status === 'fallback' ? 'warning' : 'routine'}>{e.status}</StatusBadge>, sortValue: (e) => e.status },
    { key: 'reusePotential', header: 'Reuse', render: (e) => <span className="tabular-nums">{pct(e.reusePotential)}</span>, sortValue: (e) => e.reusePotential ?? 0 },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(e) => e.id}
      searchText={(e) => `${e.promptSummary} ${e.sourceSystem} ${e.feature} ${e.provider} ${e.model}`}
      searchPlaceholder="Search AI activity…"
      initialSortKey="estimatedCost"
      emptyState="No AI activity captured yet. Instrument a feature with resolveWithFirstPartyIntelligence()."
    />
  );
}

// ── Knowledge ─────────────────────────────────────────────────
export function KnowledgeTable({ rows }: { rows: KnowledgeItem[] }) {
  const columns: Column<KnowledgeItem>[] = [
    {
      key: 'title', header: 'Knowledge',
      render: (k) => (
        <div className="font-medium text-foreground">
          {k.title}
          <DemoTag source={k.dataSource} />
          <div className="text-xs text-muted-foreground">{k.knowledgeType}{k.sport ? ` · ${k.sport}` : ''}</div>
        </div>
      ),
      sortValue: (k) => k.title,
    },
    { key: 'validationStatus', header: 'Status', render: (k) => <StatusBadge tone={k.validationStatus === 'Approved' ? 'routine' : k.validationStatus === 'Rejected' ? 'critical' : 'warning'}>{k.validationStatus}</StatusBadge>, sortValue: (k) => k.validationStatus },
    { key: 'usageCount', header: 'Used', render: (k) => <span className="tabular-nums">{k.usageCount}×</span>, sortValue: (k) => k.usageCount },
    { key: 'confidenceScore', header: 'Conf.', render: (k) => <span className="tabular-nums">{pct(k.confidenceScore)}</span>, sortValue: (k) => k.confidenceScore ?? 0 },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(k) => k.id}
      searchText={(k) => `${k.title} ${k.knowledgeType} ${k.topic} ${k.tags.join(' ')}`}
      searchPlaceholder="Search knowledge…"
      initialSortKey="usageCount"
      emptyState="No knowledge items yet."
    />
  );
}

// ── Canonical answers ─────────────────────────────────────────
export function CanonicalTable({ rows }: { rows: CanonicalAnswer[] }) {
  const columns: Column<CanonicalAnswer>[] = [
    {
      key: 'canonicalQuestion', header: 'Canonical answer',
      render: (c) => (
        <div className="font-medium text-foreground">
          {c.canonicalQuestion}
          <DemoTag source={c.dataSource} />
          <div className="text-xs text-muted-foreground">{c.answerFormat}{c.sport ? ` · ${c.sport}` : ''} · {c.sensitivity}</div>
        </div>
      ),
      sortValue: (c) => c.canonicalQuestion,
    },
    { key: 'allowedAutoServe', header: 'Auto-serve', render: (c) => <StatusBadge tone={c.allowedAutoServe ? 'routine' : 'warning'}>{c.allowedAutoServe ? 'on' : 'review'}</StatusBadge>, sortValue: (c) => (c.allowedAutoServe ? 1 : 0) },
    { key: 'aiCallsAvoided', header: 'Calls avoided', render: (c) => <span className="tabular-nums">{num(c.aiCallsAvoided)}</span>, sortValue: (c) => c.aiCallsAvoided },
    { key: 'estimatedCostSaved', header: 'Saved', render: (c) => <span className="tabular-nums">${c.estimatedCostSaved.toFixed(2)}</span>, sortValue: (c) => c.estimatedCostSaved },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(c) => c.id}
      searchText={(c) => `${c.canonicalQuestion} ${c.topic} ${c.triggerPhrases.join(' ')}`}
      searchPlaceholder="Search canonical answers…"
      initialSortKey="aiCallsAvoided"
      emptyState="No canonical answers yet."
    />
  );
}

// ── Patterns ──────────────────────────────────────────────────
export function PatternsTable({ rows }: { rows: PatternMemory[] }) {
  const columns: Column<PatternMemory>[] = [
    {
      key: 'patternTitle', header: 'Pattern',
      render: (p) => (
        <div className="font-medium text-foreground">
          {p.patternTitle}
          <DemoTag source={p.dataSource} />
          <div className="text-xs text-muted-foreground">{p.patternType}</div>
        </div>
      ),
      sortValue: (p) => p.patternTitle,
    },
    { key: 'occurrenceCount', header: 'Seen', render: (p) => <span className="tabular-nums">{p.occurrenceCount}×</span>, sortValue: (p) => p.occurrenceCount },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge tone={p.status === 'Open' ? 'warning' : p.status === 'Resolved' ? 'routine' : 'watch'}>{p.status}</StatusBadge>, sortValue: (p) => p.status },
    { key: 'confidenceScore', header: 'Conf.', render: (p) => <span className="tabular-nums">{pct(p.confidenceScore)}</span>, sortValue: (p) => p.confidenceScore ?? 0 },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(p) => p.id}
      searchText={(p) => `${p.patternTitle} ${p.patternType} ${p.tags.join(' ')}`}
      searchPlaceholder="Search patterns…"
      rowHref={(p) => `/admin/intelligence-os/patterns/${p.id}`}
      initialSortKey="occurrenceCount"
      emptyState="No patterns detected yet."
    />
  );
}
