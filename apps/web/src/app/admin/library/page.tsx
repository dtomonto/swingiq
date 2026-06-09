// ============================================================
// /admin/library — Video Library Publishing (in-app → public /learn)
// ------------------------------------------------------------
// Every training video shows in the in-app /library immediately. This screen
// controls which ones are ALSO listed on the public /learn pages (the SEO /
// answer-engine surface), so new videos can be rolled out to search gradually.
// /learn is statically generated, so a toggle writes the versioned overrides
// file (a git diff you push) and goes live on the next build — same model as
// the changelog Publishing screen.
// ============================================================

import type { Metadata } from 'next';
import { Clapperboard } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { readLibraryPublishSnapshot } from '@/lib/admin/library-publish-store';
import { LibraryPublishingClient } from './LibraryPublishingClient';

export const metadata: Metadata = { title: 'Video Library Publishing | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminLibraryPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';
  const { rows, writable } = readLibraryPublishSnapshot();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Video Library Publishing"
        icon={Clapperboard}
        description="Choose which training videos appear on the public /learn pages. Every video is already in the in-app /library — flip a few to public per week to roll them out to search gradually."
      />

      <LibraryPublishingClient rows={rows} writable={writable} actor={actor} />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">In-app vs. public.</strong> The signed-in{' '}
          <code>/library</code> always shows every video. This screen only controls the public{' '}
          <code>/learn</code> pages — the search / answer-engine surface — so you can publish on a
          deliberate cadence instead of all at once.
        </p>
        <p>
          <strong className="text-gray-300">Why gradual.</strong> Publishing a few quality pages a
          week reads as an active, maintained library and avoids thin / duplicate-content flags on a
          young domain. Recorded videos also emit rich VideoObject data; unrecorded ones publish as
          honest transcript pages.
        </p>
        <p>
          <strong className="text-gray-300">How publishing is saved.</strong> A toggle edits a
          versioned overrides file, so your change is a normal git diff you commit &amp; push.{' '}
          <code>/learn</code> is statically generated, so it goes live on the next deploy. Production
          runs read-only, so publish from your local dev environment, then push.
        </p>
      </HelpPanel>
    </div>
  );
}
