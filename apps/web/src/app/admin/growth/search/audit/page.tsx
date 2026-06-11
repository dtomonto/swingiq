// ============================================================
// /admin/growth/search/audit — Site Audit (§2.7)
// ------------------------------------------------------------
// Severity-ranked technical SEO issues with evidence, recommended fix, fix
// complexity, expected impact, confidence, auto-fix availability, and whether
// admin approval is required. Grouped by category, ordered by priority.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Bot } from 'lucide-react';
import { runSearchIntel } from '@/lib/growth/search-intelligence';
import { humanize } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, KpiCard, Badge } from '../../_components/ui';
import { SeverityBadge, Pill } from '../_ui';
import { ExportCsvButton } from '../ExportCsvButton';
import type { CsvValue } from '@/lib/growth/search-intelligence';

export const metadata: Metadata = { title: 'Site Audit | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function SiteAuditPage() {
  const r = runSearchIntel();
  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  for (const i of r.issues) counts[i.severity] += 1;

  // Group by category, ordered by the highest-priority issue in each group.
  const byCategory = new Map<string, typeof r.issues>();
  for (const i of r.issues) {
    const arr = byCategory.get(i.category) ?? [];
    arr.push(i);
    byCategory.set(i.category, arr);
  }
  const groups = [...byCategory.entries()]
    .map(([cat, items]) => ({ cat, items: items.sort((a, b) => b.priorityScore - a.priorityScore) }))
    .sort((a, b) => (b.items[0]?.priorityScore ?? 0) - (a.items[0]?.priorityScore ?? 0));

  const exportRows: Record<string, CsvValue>[] = r.issues.map((i) => ({
    severity: i.severity,
    category: i.category,
    issue_type: i.issueType,
    title: i.title,
    url: i.url,
    affected_urls: i.affectedUrls.join(' | '),
    evidence: i.evidence,
    recommended_fix: i.recommendedFix,
    expected_impact: i.expectedImpact,
    fix_complexity: i.fixComplexity,
    confidence: i.confidence,
    priority: i.priorityScore,
    auto_fix_available: i.autoFixAvailable,
    requires_approval: i.requiresApproval,
  }));

  return (
    <div className="space-y-6">
      <ModuleHeader icon={AlertTriangle} title="Site Audit" description="Technical SEO issues with severity, evidence, and a recommended fix.">
        <div className="flex items-center gap-2">
          <ExportCsvButton rows={exportRows} filename="swingvantage-site-audit.csv" />
          <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
        </div>
      </ModuleHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Critical" value={counts.critical} accent={counts.critical ? 'text-error-text' : 'text-success-text'} source="real" />
        <KpiCard label="High" value={counts.high} accent={counts.high ? 'text-warning-text' : 'text-success-text'} source="real" />
        <KpiCard label="Medium" value={counts.medium} accent="text-link" source="real" />
        <KpiCard label="Low" value={counts.low} accent="text-link" source="real" />
        <KpiCard label="Total" value={r.issues.length} source="real" />
      </div>

      {groups.length === 0 ? (
        <SectionCard title="No issues" icon={AlertTriangle}><p className="text-sm text-muted-foreground">Clean audit — nothing to fix right now. 🎉</p></SectionCard>
      ) : groups.map(({ cat, items }) => (
        <SectionCard key={cat} title={`${humanize(cat)} · ${items.length}`} icon={AlertTriangle}>
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground">{i.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SeverityBadge severity={i.severity} />
                    <Badge className="bg-muted border-border text-muted-foreground">P{i.priorityScore}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
                <p className="text-xs text-muted-foreground mt-1"><span className="text-muted-foreground/70">Fix:</span> {i.recommendedFix}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Pill>impact {i.expectedImpact}</Pill>
                  <Pill>effort {i.fixComplexity}</Pill>
                  <Pill>{i.confidence}% conf.</Pill>
                  {i.autoFixAvailable ? <Pill tone="green"><Bot className="w-2.5 h-2.5" /> auto-fixable</Pill> : null}
                  {i.requiresApproval ? <Pill tone="amber">needs approval</Pill> : null}
                  {i.url ? <Link href={`/admin/growth/search/page-intel?url=${encodeURIComponent(i.url)}`} className="text-[11px] text-success-text hover:text-success-text font-mono truncate">{i.affectedUrls.length > 1 ? `${i.affectedUrls.length} pages` : i.url}</Link> : null}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}
