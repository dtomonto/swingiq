// ============================================================
// /admin/assets — Digital Asset Library
// ------------------------------------------------------------
// One internal catalog of every generated media asset across the app:
// training videos, feature walkthroughs, and Video Studio assets — each with
// a preview, source, type, duration, the files it's made of, and where it's
// used. Read-only and registry-derived, so it stays current automatically.
// ============================================================

import type { Metadata } from 'next';
import { Images } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { buildAssetLibrary } from '@/lib/admin/asset-library';
import { AssetLibraryBrowser } from './AssetLibraryBrowser';

export const metadata: Metadata = { title: 'Digital Asset Library | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminAssetsPage() {
  const { records, stats } = await buildAssetLibrary();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Digital Asset Library"
        icon={Images}
        description="Every generated media asset in one place — training videos, feature walkthroughs, and Video Studio assets, with previews, files, and where each is used. Read-only and self-maintaining."
      />

      <AssetLibraryBrowser records={records} stats={stats} />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Where this comes from.</strong> The catalog is built from the
          same registries the app uses (the library &amp; tutorial video catalogs and the Video Studio store),
          so a new recording or generated asset shows up here automatically — nothing to sync by hand.
        </p>
        <p>
          <strong className="text-gray-300">Adding a source.</strong> Brand assets, blog→social creative, and
          share-card images can plug into the same aggregator: add one collector in
          <code> lib/admin/asset-library.ts</code> and it appears here.
        </p>
        <p>
          <strong className="text-gray-300">Read-only.</strong> This screen catalogs and links to media; it
          doesn&apos;t edit or delete it. Use Video Studio or the recorder pipelines to produce new assets.
        </p>
      </HelpPanel>
    </div>
  );
}
