'use client';

// ============================================================
// securityOS — findings list (CLIENT)
// ------------------------------------------------------------
// Applies the owner overlay, then filters/sorts and exports. Links to the
// per-finding detail page where the full status workflow lives.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Search, ChevronRight } from 'lucide-react';
import { SeverityPill } from '@/components/security-os/SecurityUI';
import { useSecurityOS } from '@/lib/security-os/useSecurityOS';
import { applyFindingOverrides, sortFindings } from '@/lib/security-os/findings';
import {
  CATEGORY_LABEL,
  FINDING_STATUS_LABEL,
  OPEN_FINDING_STATUSES,
  SEVERITY_RANK,
  type FindingStatus,
  type ScoreCategoryId,
  type SecurityFinding,
  type Severity,
} from '@/lib/security-os/types';

interface Props {
  actor: string;
  findings: SecurityFinding[];
  generatedAt: string;
}

type SeverityFilter = Severity | 'all';
type StatusFilter = FindingStatus | 'all' | 'open';
type SortKey = 'severity' | 'risk' | 'date';

export function FindingsClient({ actor, findings, generatedAt }: Props) {
  const sec = useSecurityOS();
  useEffect(() => {
    if (actor) sec.setActor(actor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [category, setCategory] = useState<ScoreCategoryId | 'all'>('all');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [sort, setSort] = useState<SortKey>('severity');
  const [q, setQ] = useState('');

  const views = useMemo(
    () => applyFindingOverrides(findings, sec.overrides, generatedAt),
    [findings, sec.overrides, generatedAt],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = views.filter((v) => {
      if (severity !== 'all' && v.severity !== severity) return false;
      if (category !== 'all' && v.category !== category) return false;
      if (status === 'open' && !OPEN_FINDING_STATUSES.includes(v.status)) return false;
      else if (status !== 'open' && status !== 'all' && v.status !== status) return false;
      if (needle && !`${v.title} ${v.description} ${v.riskDomain}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    out = out.sort((a, b) => {
      if (sort === 'risk') return b.riskScore - a.riskScore || sortFindings(a, b);
      if (sort === 'date') return b.createdAt.localeCompare(a.createdAt) || sortFindings(a, b);
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.riskScore - a.riskScore;
    });
    return out;
  }, [views, severity, category, status, sort, q]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securityos-findings-${generatedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sec.recordAudit({ action: 'findings.export', entityType: 'security-finding', summary: `Exported ${filtered.length} findings` });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search findings…"
            className="w-44 rounded-lg border border-border bg-background py-1.5 pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
        </div>
        <Select value={severity} onChange={(v) => setSeverity(v as SeverityFilter)} options={[['all', 'All severities'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low'], ['informational', 'Info']]} />
        <Select value={category} onChange={(v) => setCategory(v as ScoreCategoryId | 'all')} options={[['all', 'All categories'], ...Object.entries(CATEGORY_LABEL)]} />
        <Select value={status} onChange={(v) => setStatus(v as StatusFilter)} options={[['open', 'Open'], ['all', 'All statuses'], ...Object.entries(FINDING_STATUS_LABEL)]} />
        <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={[['severity', 'Sort: severity'], ['risk', 'Sort: risk'], ['date', 'Sort: date']]} />
        <button onClick={exportJson} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} finding{filtered.length === 1 ? '' : 's'}</p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No findings match these filters.</p>
          <p className="mt-1 text-xs text-muted-foreground/70">A clean filter here is good news — try &ldquo;All statuses&rdquo; to see resolved items.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/security-os/findings/${encodeURIComponent(v.id)}`}
                className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-border"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityPill severity={v.severity} />
                    <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{CATEGORY_LABEL[v.category]}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{v.source}</span>
                    {v.overdue && <span className="rounded bg-error/15 px-1.5 py-0.5 text-[10px] font-semibold text-error-text">Overdue</span>}
                    {!OPEN_FINDING_STATUSES.includes(v.status) && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{FINDING_STATUS_LABEL[v.status]}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{v.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{v.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-lg font-bold tabular-nums text-foreground">{v.riskScore}</span>
                  <span className="text-[10px] text-muted-foreground/70">risk</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
