// ============================================================
// /admin/sports/[sport] — single sport configuration
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { getSportConfig, ALL_SPORTS_INCLUDING_GOLF, type SportId } from '@swingiq/core';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { titleize } from '@/lib/admin/format';

export const metadata: Metadata = { title: 'Sport | Admin', robots: 'noindex, nofollow' };

const CAMERA_LABELS: Record<string, string> = {
  face_on: 'Face-on', down_the_line: 'Down the line', rear: 'From behind',
};

function phaseText(def: unknown): { name: string; description?: string } {
  if (def && typeof def === 'object') {
    const o = def as Record<string, unknown>;
    const name = (typeof o.name === 'string' && o.name) || (typeof o.label === 'string' && o.label) || '';
    const description =
      (typeof o.description === 'string' && o.description) ||
      (typeof o.summary === 'string' && o.summary) || undefined;
    return { name: name || '', description };
  }
  return { name: '' };
}

export default async function AdminSportDetailPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const display = ALL_SPORTS_INCLUDING_GOLF.find((s) => s.id === sport);

  const back = (
    <Link href="/admin/sports" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
      <ArrowLeft className="h-3.5 w-3.5" /> All sports
    </Link>
  );

  if (!display) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {back}
        <SectionCard><p className="py-6 text-center text-sm text-gray-400">Unknown sport.</p></SectionCard>
      </div>
    );
  }

  const config = getSportConfig(sport as SportId); // null for golf

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {back}
      <PageHeader
        title={`${display.emoji} ${display.name}`}
        icon={Trophy}
        description={display.tagline}
        actions={config ? <StatusBadge tone="neutral">benchmarks v{config.benchmark_version}</StatusBadge> : null}
      />

      <SectionCard title="Overview">
        <p className="text-sm text-gray-300">{display.description}</p>
      </SectionCard>

      {config ? (
        <>
          <SectionCard title="Swing phases" description="The ordered phases the AI evaluates.">
            <ol className="space-y-2">
              {config.phase_sequence.map((key, i) => {
                const { name, description } = phaseText((config.phases as Record<string, unknown>)[key]);
                return (
                  <li key={key} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[11px] text-gray-400">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-200">{name || titleize(key)}</p>
                      {description && <p className="text-xs text-gray-500">{description}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard title="Camera guidance" description="What users are told for each angle.">
            <ul className="space-y-2">
              {Object.entries(config.camera_angle_guidance).map(([angle, text]) => (
                <li key={angle} className="text-sm">
                  <span className="font-medium text-amber-300">{CAMERA_LABELS[angle] ?? titleize(angle)}:</span>{' '}
                  <span className="text-gray-400">{String(text)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Benchmarks" description={`Version ${config.benchmark_version}.`}>
            <p className="text-sm text-gray-400">
              {Object.keys(config.benchmarks ?? {}).length} benchmark metric group(s) configured.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.keys(config.benchmarks ?? {}).slice(0, 24).map((k) => (
                <code key={k} className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-300">
                  {k}
                </code>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">{config.evidence_note}</p>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Golf analysis">
          <p className="text-sm text-gray-400">
            Golf uses the dedicated launch-monitor and video-analysis engines rather than the multi-sport
            registry, so its phases and benchmarks are configured in the <code>video-analysis</code> module.
            The marketing-facing description and tagline above are the display config.
          </p>
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> The full analysis setup for {display.name}:
          the phases evaluated, how each camera angle is described to users, and the benchmark version plus the
          evidence statement that keeps SwingVantage&apos;s claims honest.
        </p>
        <p>
          <strong className="text-gray-300">What good looks like.</strong> The evidence note should accurately
          describe how confident the benchmarks are. If the science changes, bump the benchmark version in the
          registry so users see it&apos;s current.
        </p>
      </HelpPanel>
    </div>
  );
}
