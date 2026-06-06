// ============================================================
// /admin/social — Blog-to-Social Studio
//
// Server shell: hands the (static) blog list + option choices to the
// client studio. Access is gated by app/admin/layout.tsx (ADMIN_SECRET
// in prod, open in dev) like every other admin page.
// ============================================================

import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/data/blog-posts';
import { OPTION_CHOICES } from '@/lib/social/options';
import { DEFAULT_PLATFORMS } from '@/lib/social/platforms';
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-100">Blog → Social Studio</h1>
        <p className="text-sm text-gray-400 mt-1">
          Turn any blog post into platform-native social posts. Review, edit, approve, copy, and
          export. Nothing is ever auto-published.
        </p>
      </header>
      <SocialStudio posts={posts} choices={OPTION_CHOICES} defaultPlatforms={DEFAULT_PLATFORMS} />
    </div>
  );
}
