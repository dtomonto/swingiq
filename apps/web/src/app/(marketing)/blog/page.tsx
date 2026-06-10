// Blog index — server component. Reads the override-aware effective post set so
// a durable PublishingOS publish decision (the production path) is honoured,
// then hands it to the client list for search + filtering. Metadata lives in
// ./layout.tsx. With no overrides this returns exactly getPublishedBlogPosts().

import { getEffectivePublicBlogPosts } from '@/lib/publishing/public-updates.server';
import { BlogIndexClient } from '@/components/blog/BlogIndexClient';

export default async function BlogIndexPage() {
  const posts = await getEffectivePublicBlogPosts();
  return <BlogIndexClient posts={posts} />;
}
