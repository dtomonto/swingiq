import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '@/data/blog-posts';
import { PublicFooter } from '@/components/layout/PublicFooter';

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://swingiq.app/blog/${post.slug}`,
      publishedTime: post.publishDate,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

const SPORT_BADGE_COLORS: Record<string, string> = {
  golf: 'bg-green-100 text-green-700',
  tennis: 'bg-yellow-100 text-yellow-700',
  baseball: 'bg-red-100 text-red-700',
  softball: 'bg-pink-100 text-pink-700',
  all: 'bg-gray-100 text-gray-600',
};

function renderContent(content: string): React.ReactNode[] {
  const blocks = content.split('\n\n');
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4">
          {block.replace('## ', '')}
        </h2>
      );
    }
    if (block.startsWith('**') && block.includes('.**')) {
      // Bold lead paragraph
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-gray-700 text-sm leading-relaxed mb-4">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : (
              part
            ),
          )}
        </p>
      );
    }
    return (
      <p key={i} className="text-gray-700 text-sm leading-relaxed mb-4">
        {block}
      </p>
    );
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const relatedPosts = post.relatedSlugs
    ? BLOG_POSTS.filter((p) => post.relatedSlugs!.includes(p.slug))
    : [];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/blog" className="text-green-300 text-sm hover:underline">
              ← Blog
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[post.sport] ?? 'bg-gray-100 text-gray-600'}`}>
              {post.sport === 'all' ? 'All Sports' : post.sport.charAt(0).toUpperCase() + post.sport.slice(1)}
            </span>
            <span className="text-green-300 text-xs">{post.category}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
          <div className="text-green-300 text-sm">
            {post.displayDate} &middot; {post.readingTime}
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="prose-sm max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 hover:border-green-400 transition-colors block"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[related.sport] ?? 'bg-gray-100 text-gray-600'} mb-2 inline-block`}>
                    {related.sport === 'all' ? 'All Sports' : related.sport.charAt(0).toUpperCase() + related.sport.slice(1)}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug mt-1">{related.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{related.readingTime}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Apply This to Your Own Swing</h2>
        <p className="text-green-200 mb-8 text-sm">Import your data and get a personalized diagnosis based on your actual numbers — free.</p>
        <Link href="/dashboard" className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Analyze My Swing Free
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
