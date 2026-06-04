// ============================================================
// /admin/growth/seo — SEO / AEO / GEO (§16)
// ------------------------------------------------------------
// Organic, answer-engine, and generative-search visibility.
// Three capability checklists + the discoverability content pipeline.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, CheckCircle2, Circle, Globe, Sparkles, BookOpen } from 'lucide-react';
import { contentRepo } from '@/lib/growth/repository';
import { ModuleHeader, SectionCard, Badge, MockDataNote } from '../_components/ui';
import { RecordModule } from '../_components/RecordModule';

export const metadata: Metadata = {
  title: 'SEO / AEO / GEO | GrowthOS',
  robots: 'noindex, nofollow',
};

// ── Capability list types ─────────────────────────────────────

interface CapabilityItem {
  label: string;
  /** If set, this capability is already achievable via the AI Strategist using this task key. */
  aiTask?: string;
}

// ── Capability definitions ────────────────────────────────────

const SEO_ITEMS: CapabilityItem[] = [
  { label: 'Keyword cluster planner' },
  { label: 'Search intent classifier' },
  { label: 'Topic cluster builder' },
  { label: 'Content calendar' },
  { label: 'Blog topic generator' },
  { label: 'Landing page idea generator' },
  { label: 'Metadata generator' },
  { label: 'Internal linking suggestions' },
  { label: 'Content refresh tracker' },
  { label: 'Competitor content gap tracker' },
  { label: 'SERP feature opportunity tracker' },
  { label: 'Technical SEO checklist' },
  { label: 'Schema recommendations' },
];

// Mark items that map to AI Strategist tasks
const SEO_ITEMS_FINAL: CapabilityItem[] = SEO_ITEMS.map((item) => {
  if (item.label === 'Keyword cluster planner' || item.label === 'Blog topic generator') {
    return { ...item, aiTask: 'seo-topics' };
  }
  return item;
});

const AEO_ITEMS: CapabilityItem[] = [
  { label: 'Question–answer content builder', aiTask: 'aeo-snippet' },
  { label: 'Featured snippet optimizer', aiTask: 'aeo-snippet' },
  { label: 'FAQ generator' },
  { label: 'Short answer block generator', aiTask: 'aeo-snippet' },
  { label: 'Conversational answer formatter' },
  { label: 'Comparison answer generator' },
  { label: 'How-to answer generator' },
  { label: 'Definition block generator' },
  { label: 'Schema markup recommendations' },
];

const GEO_ITEMS: CapabilityItem[] = [
  { label: 'AI-search-ready brand summaries', aiTask: 'geo-summary' },
  { label: 'Entity-rich product descriptions', aiTask: 'geo-summary' },
  { label: 'Use-case content' },
  { label: 'Comparison content' },
  { label: 'Source-worthy explanations' },
  { label: 'Authority-building content' },
  { label: '"Best for" positioning blocks' },
  { label: 'Citation-worthy brand narratives' },
  { label: 'AI answer-engine visibility checklist' },
  { label: 'Brand consistency review for generative search' },
];

// ── AI Strategist badge (small, inline) ──────────────────────
function AiStratBadge({ taskKey }: { taskKey: string }) {
  return (
    <Link
      href={`/admin/growth/ai-strategist?task=${taskKey}`}
      className="shrink-0"
      title="Draft this now in the AI Strategist"
    >
      <Badge className="bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors gap-1">
        <Sparkles className="w-2.5 h-2.5" />
        via AI Strategist
      </Badge>
    </Link>
  );
}

// ── Capability checklist ──────────────────────────────────────
function CapabilityList({ items }: { items: CapabilityItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5">
          {item.aiTask ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-gray-700 shrink-0" />
          )}
          <span
            className={
              item.aiTask
                ? 'text-sm text-gray-200 flex-1'
                : 'text-sm text-gray-400 flex-1'
            }
          >
            {item.label}
          </span>
          {item.aiTask && <AiStratBadge taskKey={item.aiTask} />}
          {!item.aiTask && (
            <Badge className="bg-gray-800 border-gray-700 text-gray-600">planned</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── Legend note ───────────────────────────────────────────────
function CapabilityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-gray-500">
      <span className="flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
        Draftable today via AI Strategist
      </span>
      <span className="flex items-center gap-1">
        <Circle className="w-3.5 h-3.5 text-gray-700" />
        Planned capability
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function SeoPage() {
  const content = contentRepo.list();

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Search}
        title="SEO / AEO / GEO"
        description="Organic, answer-engine, and generative-search visibility."
      />

      {/* Honest disclaimer */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
        <strong className="text-amber-300">Planning tools + demo content.</strong>{' '}
        These capability checklists are your roadmap — connect Google Search Console, Ahrefs, or Semrush
        later to replace demo content with live keyword rankings, impression data, and real gap analysis.
        Nothing here is presented as a real production metric.
      </div>

      {/* SEO */}
      <SectionCard
        title="SEO — Search Engine Optimisation"
        icon={Search}
        action={<CapabilityLegend />}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Keyword planning, cluster strategy, and content operations for Google organic visibility.
            Items marked{' '}
            <span className="inline-flex items-center gap-1 text-green-400">
              <Sparkles className="w-3 h-3" /> via AI Strategist
            </span>{' '}
            can be drafted immediately — click to open the AI Strategist with that task pre-selected.
          </p>
          <CapabilityList items={SEO_ITEMS_FINAL} />
        </div>
      </SectionCard>

      {/* AEO */}
      <SectionCard
        title="AEO — Answer Engine Optimisation"
        icon={BookOpen}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Structure content for featured snippets, People Also Ask boxes, and zero-click answers.
            The AI Strategist can generate{' '}
            <Link
              href="/admin/growth/ai-strategist?task=aeo-snippet"
              className="text-green-400 hover:text-green-300 underline underline-offset-2"
            >
              AEO answer blocks
            </Link>{' '}
            ready to publish today.
          </p>
          <CapabilityList items={AEO_ITEMS} />
        </div>
      </SectionCard>

      {/* GEO */}
      <SectionCard
        title="GEO — Generative Engine Optimisation"
        icon={Globe}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Optimise for AI-powered search surfaces (ChatGPT, Perplexity, Google AI Overviews).
            The AI Strategist can draft{' '}
            <Link
              href="/admin/growth/ai-strategist?task=geo-summary"
              className="text-green-400 hover:text-green-300 underline underline-offset-2"
            >
              AI-ready brand summaries
            </Link>{' '}
            and entity-rich descriptions now.
          </p>
          <CapabilityList items={GEO_ITEMS} />
        </div>
      </SectionCard>

      {/* Discoverability content pipeline */}
      <SectionCard title="Discoverability content pipeline" icon={Search}>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            All SEO pages, AEO answers, GEO-ready summaries, comparison pages, and how-to guides
            currently in the content pipeline. Expand any row for full details.
          </p>
          <RecordModule
            definitionId="content"
            records={content}
          />
        </div>
      </SectionCard>

      <MockDataNote>
        <strong>Demo data.</strong> The content pipeline above shows realistic seed records.
        The capability checklists are your planning roadmap — wire each tool to a real provider
        (Google Search Console, Ahrefs, Semrush) when ready to replace with live data.
      </MockDataNote>
    </div>
  );
}
