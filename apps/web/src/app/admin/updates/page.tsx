// ============================================================
// /admin/updates — Publishing (changelog draft → live)
// ------------------------------------------------------------
// Review and publish the auto-generated product (/updates) and developer
// (/dev-updates) changelog entries created from commit trailers. Everything
// lands as a draft; nothing reaches the public pages until you flip it live
// here. Writes persist to the versioned data files (a git diff you push).
// ============================================================

import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { readPublishSnapshot } from '@/lib/admin/updates-store';
import { readSeoRows, readBlogRows } from '@/lib/admin/content-publish-store';
import { UpdatesPublishingClient } from './UpdatesPublishingClient';

export const metadata: Metadata = { title: 'Publishing | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminUpdatesPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';
  const { product, dev, writable } = readPublishSnapshot();
  const seo = readSeoRows();
  const blog = readBlogRows();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Publishing"
        icon={Newspaper}
        description="One place to control what's live: auto-generated changelog entries (Updates & Developer Updates), SEO/answer-engine pages, and blog posts. Nothing reaches the public until you publish it here."
      />

      <UpdatesPublishingClient
        product={product}
        dev={dev}
        seo={seo}
        blog={blog}
        writable={writable}
        actor={actor}
      />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Why everything starts as a draft.</strong> The public
          /updates and /dev-updates pages are search-indexed. Holding new entries as drafts means a
          commit can never push something live before you&apos;ve read it.
        </p>
        <p>
          <strong className="text-gray-300">How publishing is saved.</strong> A toggle edits the
          versioned data file the page reads, so your change is a normal git diff you commit &amp;
          push — the same way all SwingVantage content goes live. Because production runs on a
          read-only filesystem, this screen is view-only there; publish from your local dev
          environment, then push.
        </p>
        <p>
          <strong className="text-gray-300">Safety net.</strong> A guard in the generator already
          refuses to create any entry whose text looks like a secret, key, or file path — so drafts
          are safe to review.
        </p>
      </HelpPanel>
    </div>
  );
}
