// ============================================================
// /admin/uiux-lab/sport-hero — Sport Hero design lab
// ------------------------------------------------------------
// The owner's preview surface for the reusable <SportHero>: switch
// sport, layout variant, and motif live and pick the look before it's
// adopted on any public page. Admin-only + noindex (inherited from the
// /admin layout). Nothing here publishes.
// ============================================================

import type { Metadata } from 'next';
import { Palette } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SportHeroPreview } from './SportHeroPreview';

export const metadata: Metadata = { title: 'Sport Hero Lab | Admin', robots: 'noindex, nofollow' };

export default function SportHeroLabPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Sport Hero Lab"
        icon={Palette}
        description="Preview the reusable per-sport hero across every sport and layout. The accent comes from the AA-validated per-sport tokens, so each sport is distinct but on-brand. Switch and compare — nothing here publishes."
      />
      <SportHeroPreview />
    </div>
  );
}
