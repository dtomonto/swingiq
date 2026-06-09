// ============================================================
// GrowthOS — Brand Voice (§25)
// ------------------------------------------------------------
// Displays all brand voice assets grouped by category.
// Server component: no interactivity needed, reads from the
// in-memory repository at request time.
// ============================================================

import type { Metadata } from 'next';
import { Palette, CheckCircle, Ban } from 'lucide-react';
import { brandVoiceRepo } from '@/lib/growth/repository';
import type { BrandVoiceAsset, BrandVoiceCategory } from '@/lib/growth/types';
import { humanize } from '@/lib/growth/format';
import {
  ModuleHeader,
  SectionCard,
  Badge,
  MockDataNote,
} from '../_components/ui';

export const metadata: Metadata = {
  title: 'Brand Voice | GrowthOS',
  robots: 'noindex, nofollow',
};

// ── Category ordering — more strategic categories come first ──
const CATEGORY_ORDER: BrandVoiceCategory[] = [
  'positioning',
  'elevator-pitch',
  'manifesto',
  'founder-pov',
  'persona',
  'value-prop',
  'messaging-pillar',
  'tone',
  'differentiation',
  'category-narrative',
  'use-case',
  'product-description',
  'boilerplate',
  'approved-claim',
  'banned-claim',
  'objection-handling',
  'proof-point',
];

function groupByCategory(
  assets: BrandVoiceAsset[],
): Map<BrandVoiceCategory, BrandVoiceAsset[]> {
  const map = new Map<BrandVoiceCategory, BrandVoiceAsset[]>();
  for (const asset of assets) {
    const existing = map.get(asset.category);
    if (existing) {
      existing.push(asset);
    } else {
      map.set(asset.category, [asset]);
    }
  }
  return map;
}

function sortedCategories(
  grouped: Map<BrandVoiceCategory, BrandVoiceAsset[]>,
): BrandVoiceCategory[] {
  // categories in preferred order first, then any extras alphabetically
  const ordered: BrandVoiceCategory[] = [];
  for (const cat of CATEGORY_ORDER) {
    if (grouped.has(cat)) ordered.push(cat);
  }
  for (const cat of grouped.keys()) {
    if (!ordered.includes(cat)) ordered.push(cat);
  }
  return ordered;
}

export default async function BrandVoicePage() {
  const assets = await brandVoiceRepo.list();
  const grouped = groupByCategory(assets);
  const categories = sortedCategories(grouped);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Palette}
        title="Brand Voice"
        description="Positioning, claims, and tone — the brand operating system."
      />

      {/* AI Strategist safety note */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <Palette className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200/90">
            <p className="font-semibold text-blue-300">This is the AI Strategist&apos;s source of truth</p>
            <p className="mt-1 text-xs leading-relaxed">
              The AI Strategist reads this library before generating any copy, campaign briefs, or recommendations.
              It will <strong className="text-blue-200">only use approved claims</strong> and will
              never generate content that contradicts the banned-claim entries.
              Keep this library accurate — the quality of every AI draft depends on it.
            </p>
          </div>
        </div>
      </div>

      {/* One SectionCard per category */}
      {categories.map((category) => {
        const categoryAssets = grouped.get(category)!;
        const isApprovedClaims = category === 'approved-claim';
        const isBannedClaims = category === 'banned-claim';

        return (
          <SectionCard
            key={category}
            title={humanize(category)}
            icon={
              isApprovedClaims
                ? CheckCircle
                : isBannedClaims
                  ? Ban
                  : undefined
            }
          >
            {/* Category-level framing note */}
            {isApprovedClaims && (
              <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-300">
                <CheckCircle className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                <strong>Substantiated claims only.</strong> Each item below has been verified and
                may be used in marketing copy, ads, and sales collateral.
              </div>
            )}
            {isBannedClaims && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300">
                <Ban className="inline-block w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                <strong>Do not use — ever.</strong> These claims are stored here so the AI
                Strategist knows to avoid them. They are unsubstantiated, legally risky, or
                misleading regardless of context.
              </div>
            )}

            <ul className="space-y-2">
              {categoryAssets.map((asset) => (
                <li
                  key={asset.id}
                  className={[
                    'rounded-lg border px-3 py-2.5',
                    isApprovedClaims
                      ? 'bg-green-500/5 border-green-500/20'
                      : isBannedClaims
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-gray-800/40 border-gray-800',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    {/* Claim treatment badges */}
                    {isApprovedClaims && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    )}
                    {isBannedClaims && (
                      <Ban className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}

                    <p
                      className={[
                        'text-sm leading-relaxed flex-1',
                        isApprovedClaims
                          ? 'text-gray-200'
                          : isBannedClaims
                            ? 'text-red-300/80 line-through decoration-red-500/50'
                            : 'text-gray-300',
                      ].join(' ')}
                    >
                      {asset.content}
                    </p>

                    {/* Status badge for claim categories */}
                    {isApprovedClaims && (
                      <Badge className="text-green-400 bg-green-400/10 border-green-400/30 shrink-0 self-start">
                        <CheckCircle className="w-3 h-3" />
                        Approved claim
                      </Badge>
                    )}
                    {isBannedClaims && (
                      <Badge className="text-red-400 bg-red-400/10 border-red-400/30 shrink-0 self-start">
                        <Ban className="w-3 h-3" />
                        Banned
                      </Badge>
                    )}

                    {/* For non-claim categories, show approved/unapproved state if applicable */}
                    {!isApprovedClaims && !isBannedClaims && !asset.approved && (
                      <Badge className="text-amber-400 bg-amber-400/10 border-amber-400/30 shrink-0 self-start">
                        Draft
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        );
      })}

      {categories.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
          <Palette className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-300">No brand voice assets yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Add positioning, tone, approved claims, and banned claims to populate this library.
          </p>
        </div>
      )}

      <MockDataNote />
    </div>
  );
}
