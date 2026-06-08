// ============================================================
// /admin/ai-quality — AI Output Quality
// ------------------------------------------------------------
// A read-only, keyless audit of the coaching/AI prose the product ships.
// It scores the trust-and-safety dimensions (no medical claims, no
// overpromising, honest confidence, clarity) over the real coaching text
// in the SEO content registry, and surfaces anything that needs a human
// edit. Complements the structural Data Quality board.
// ============================================================

import type { Metadata } from 'next';
import { BadgeCheck, AlertTriangle, ShieldAlert, Gauge } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { SEO_PAGES } from '@/content/seoPages';
import { scoreCorpus, type QualityLevel, type CorpusInput } from '@/lib/admin/ai-quality/score';

export const metadata: Metadata = { title: 'AI Output Quality | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const GRADE_TONE: Record<QualityLevel, BadgeTone> = { good: 'success', warn: 'warning', fail: 'danger' };

export default function AdminAiQualityPage() {
  // Score the coaching-prose fields the product actually ships.
  const corpus: CorpusInput[] = [];
  for (const p of SEO_PAGES) {
    if (p.directAnswer?.trim()) corpus.push({ id: `${p.slug}:direct`, label: `${p.slug} · direct answer`, text: p.directAnswer });
    if (p.whenToWorkWithCoach?.trim()) corpus.push({ id: `${p.slug}:coach`, label: `${p.slug} · when to see a coach`, text: p.whenToWorkWithCoach });
  }
  const report = scoreCorpus(corpus);
  const { stats } = report;
  const flagged = report.items
    .filter((i) => i.result.grade !== 'good')
    .sort((a, b) => a.result.score - b.result.score);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="AI Output Quality"
        icon={BadgeCheck}
        description="A keyless audit of the coaching prose the product ships. It scores each piece for safety (no medical claims, referral when pain/injury is mentioned), honesty (no overpromising), confidence calibration and clarity — so unsafe or hype-y copy is caught before a user reads it. Read-only."
        actions={
          <StatusBadge tone={stats.safetyFails > 0 ? 'danger' : stats.fail > 0 ? 'warning' : 'success'}>
            {stats.safetyFails > 0 ? `${stats.safetyFails} safety issue${stats.safetyFails === 1 ? '' : 's'}` : `avg ${stats.avgScore}/100`}
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="Texts scored" icon={Gauge} value={String(stats.count)} hint="coaching prose" />
        <MetricStat label="Avg score" icon={Gauge} value={`${stats.avgScore}`} hint="out of 100" />
        <MetricStat label="Good" icon={BadgeCheck} value={String(stats.good)} hint="≥85" />
        <MetricStat label="Needs edit" icon={AlertTriangle} tone={stats.warn + stats.fail ? 'default' : 'muted'} value={String(stats.warn + stats.fail)} hint="warn + fail" />
        <MetricStat label="Safety fails" icon={ShieldAlert} tone={stats.safetyFails ? 'default' : 'muted'} value={String(stats.safetyFails)} hint="medical claims" />
      </div>

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            Flagged for review
            <span className="text-xs font-normal text-gray-500">({flagged.length})</span>
          </span>
        }
        description="Coaching text scoring below “good”, worst first. Good items are hidden."
      >
        {flagged.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-400">
            <BadgeCheck className="h-4 w-4" /> Every scored text is clear, honest and safe. Nice.
          </p>
        ) : (
          <ul className="space-y-3">
            {flagged.slice(0, 40).map((item) => (
              <li key={item.id} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-amber-300/90">{item.label}</code>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge tone={GRADE_TONE[item.result.grade]}>{item.result.grade}</StatusBadge>
                    <StatusBadge tone="neutral">{item.result.score}/100</StatusBadge>
                  </div>
                </div>
                <ul className="space-y-1">
                  {item.result.findings.filter((f) => f.level !== 'good').map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <StatusBadge tone={GRADE_TONE[f.level]}>{f.dimension}</StatusBadge>
                      <span>{f.message}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {flagged.length > 40 && <li className="text-xs text-gray-500">+ {flagged.length - 40} more…</li>}
          </ul>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A content-quality auditor focused on the
          words, not the structure. Where <em>Data Quality</em> checks slugs and metadata, this reads the
          coaching prose and scores it for the things that build (or break) trust: safety, honesty, calibrated
          confidence and plain-English clarity.
        </p>
        <p>
          <strong className="text-gray-300">Keyless.</strong> The scorer is fully deterministic — no model
          calls, no AI spend. It is the same kind of check you would want a reviewer to run, encoded once and
          applied to every piece. It can later be pointed at live AI swing-analysis outputs as that data lands.
        </p>
        <p>
          <strong className="text-gray-300">How to act.</strong> Work safety fails first (a medical/diagnostic
          claim is never acceptable — coaching is performance-only), then honesty (remove guarantees/hype),
          then clarity. Edit the source text in the SEO/content registry and re-check here.
        </p>
      </HelpPanel>
    </div>
  );
}
