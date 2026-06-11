// ============================================================
// /admin/growth/search/briefs — Content Brief generator (§2.13)
// ------------------------------------------------------------
// Thin server wrapper that seeds the client generator from ?topic=&sport=&intent=
// (so Keyword Explorer / Opportunities / Page Intelligence can deep-link here).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { ModuleHeader } from '../../_components/ui';
import { BriefGenerator } from './BriefGenerator';
import type { LinkIntent, LinkSport } from '@/lib/growth/search-intelligence/types';

export const metadata: Metadata = { title: 'Content Brief Generator | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SPORTS = new Set<LinkSport>(['multi', 'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball']);
const INTENTS = new Set<LinkIntent>(['informational', 'commercial', 'transactional', 'navigational']);

export default async function BriefsPage({ searchParams }: { searchParams: Promise<{ topic?: string; sport?: string; intent?: string }> }) {
  const sp = await searchParams;
  const sport = sp.sport && SPORTS.has(sp.sport as LinkSport) ? (sp.sport as LinkSport) : undefined;
  const intent = sp.intent && INTENTS.has(sp.intent as LinkIntent) ? (sp.intent as LinkIntent) : undefined;

  return (
    <div className="space-y-6">
      <ModuleHeader icon={FileText} title="Content Brief Generator" description="Deterministic, production-ready briefs. Keyless. Never auto-publishes.">
        <Link href="/admin/growth/search" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Command Center</Link>
      </ModuleHeader>
      <BriefGenerator initial={{ topic: sp.topic, sport, intent }} />
    </div>
  );
}
