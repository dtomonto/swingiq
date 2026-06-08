// ============================================================
// /admin/qa — QA & Testing
// ------------------------------------------------------------
// A read-only, generated manual-QA checklist. Scenarios are derived from
// the real registries (admin sections, the agent registry, sports) plus
// the cross-cutting concerns every release should re-check — so coverage
// tracks the app as it grows instead of going stale in a doc.
// ============================================================

import type { Metadata } from 'next';
import { ListChecks, ShieldAlert, CircleDot, Database } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NAV_ITEMS } from '@/lib/admin/nav';
import { AGENT_REGISTRY } from '@/lib/admin/agent-registry';
import { buildQaChecklist, type QaPriority } from '@/lib/admin/qa/scenarios';

export const metadata: Metadata = { title: 'QA & Testing | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SPORTS = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast', 'pickleball', 'padel'];

const PRIORITY_META: Record<QaPriority, { tone: BadgeTone; label: string }> = {
  p0: { tone: 'danger', label: 'P0 · must-pass' },
  p1: { tone: 'warning', label: 'P1 · important' },
  p2: { tone: 'info', label: 'P2 · polish' },
};

export default function AdminQaPage() {
  const checklist = buildQaChecklist(
    NAV_ITEMS.map((n) => ({ id: n.id, label: n.label, href: n.href, built: n.built, permission: n.permission })),
    AGENT_REGISTRY.map((a) => ({ id: a.id, name: a.name, family: a.family, runtime: a.runtime, safety: a.safety })),
    SPORTS,
  );
  const { stats } = checklist;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="QA & Testing"
        icon={ListChecks}
        description="A generated manual-QA checklist that tracks the app as it grows. Scenarios are derived from your real admin sections, AI agents and sports — plus the accessibility, responsiveness, theming and SEO checks every release should re-run. Work P0 first."
        actions={<StatusBadge tone="info">{stats.scenarios} scenarios</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Scenarios" icon={ListChecks} value={String(stats.scenarios)} hint="to verify" />
        <MetricStat label="Check steps" icon={CircleDot} value={String(stats.steps)} hint="total" />
        <MetricStat label="P0 must-pass" icon={ShieldAlert} value={String(stats.byPriority.p0)} hint="blockers" />
        <MetricStat label="P1 important" icon={CircleDot} value={String(stats.byPriority.p1)} hint="" />
        <MetricStat label="Categories" icon={Database} value={String(stats.categories)} hint="areas" />
      </div>

      {checklist.categories.map((cat) => (
        <SectionCard
          key={cat.id}
          title={
            <span className="flex items-center gap-2">
              {cat.label}
              <span className="text-xs font-normal text-gray-500">({cat.scenarios.length})</span>
            </span>
          }
          description={cat.description}
        >
          <ul className="space-y-3">
            {cat.scenarios.map((s) => (
              <li key={s.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-100">{s.title}</span>
                  <StatusBadge tone={PRIORITY_META[s.priority].tone}>{PRIORITY_META[s.priority].label}</StatusBadge>
                </div>
                <ul className="space-y-1">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span aria-hidden className="mt-0.5 text-gray-600">☐</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A living QA checklist. Instead of a stale
          test-plan doc, the scenarios are regenerated from your real registries every load — add an admin
          section, an agent or a sport and its checks appear here automatically.
        </p>
        <p>
          <strong className="text-gray-300">How to use it.</strong> Before a release, work top-down by
          priority: <strong>P0</strong> are blockers (a broken or unguarded admin route, a safety guardrail
          that fails), <strong>P1</strong> are important flows and accessibility, <strong>P2</strong> are
          polish. Tick each box as you verify it manually.
        </p>
        <p>
          <strong className="text-gray-300">Automated tests.</strong> This complements (does not replace) the
          unit suites in <code>src/**/__tests__</code> run by Jest in CI. A future iteration could record
          pass/fail per scenario and surface the last QA run here.
        </p>
      </HelpPanel>
    </div>
  );
}
