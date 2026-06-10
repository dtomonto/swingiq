// ============================================================
// /admin/social — Blog-to-Social Studio
//
// Server shell: hands the (static) blog list + option choices to the
// client studio. Access is gated by app/admin/layout.tsx (ADMIN_SECRET
// in prod, open in dev) like every other admin page.
// ============================================================

import type { Metadata } from 'next';
import { Share2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { BLOG_POSTS } from '@/data/blog-posts';
import { OPTION_CHOICES } from '@/lib/social/options';
import { DEFAULT_PLATFORMS, ALL_PLATFORMS } from '@/lib/social/platforms';
import { isAutopublishEnabled, channelPublishMode } from '@/lib/social/publishers';
import socialPending from '@/data/social-pending.json';
import { SocialStudio } from './SocialStudio';

export const metadata: Metadata = {
  title: 'Social Studio | SwingVantage Admin',
  robots: 'noindex, nofollow',
};

export default function SocialAdminPage() {
  const posts = BLOG_POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    sport: p.sport,
    category: p.category,
    publishDate: p.publishDate,
  }));

  // Posts the commit hook flagged for social, newest first, still-existing only.
  const pending = (socialPending as Array<{ slug: string }>)
    .map((q) => BLOG_POSTS.find((b) => b.slug === q.slug))
    .filter((b): b is (typeof BLOG_POSTS)[number] => Boolean(b))
    .map((b) => ({ slug: b.slug, title: b.title }))
    .reverse();

  // Computed server-side so the client never sees credentials — just the mode.
  const publishCaps = {
    autopublish: isAutopublishEnabled(),
    channels: Object.fromEntries(
      ALL_PLATFORMS.map((p) => [p, channelPublishMode(p)]),
    ) as Record<string, 'direct' | 'webhook' | 'none'>,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Blog → Social Studio"
        icon={Share2}
        description="Turn any blog post into platform-native social posts. Review, edit, approve, copy, and export. Nothing is ever auto-published."
      />
      <SocialStudio
        posts={posts}
        choices={OPTION_CHOICES}
        defaultPlatforms={DEFAULT_PLATFORMS}
        pending={pending}
        publishCaps={publishCaps}
      />
    </div>
  );
}
