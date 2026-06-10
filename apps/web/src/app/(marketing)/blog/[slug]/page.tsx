import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingCTA } from '@/components/marketing/MarketingCTA';
import { getPublishedBlogPosts } from '@/data/blog-posts';
import { getEffectiveBlogPost } from '@/lib/publishing/public-updates.server';

export async function generateStaticParams() {
  return getPublishedBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEffectiveBlogPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://swingvantage.com/blog/${post.slug}`,
      publishedTime: post.publishDate,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

const SPORT_BADGE_COLORS: Record<string, string> = {
  golf: 'bg-primary/15 text-primary',
  tennis: 'bg-warning/15 text-warning',
  pickleball: 'bg-success/15 text-success',
  padel: 'bg-info/15 text-info',
  baseball: 'bg-error/15 text-error',
  softball: 'bg-accent-secondary/15 text-accent-secondary',
  all: 'bg-muted text-muted-foreground',
};

function renderContent(content: string): React.ReactNode[] {
  const blocks = content.split('\n\n');
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4">
          {block.replace('## ', '')}
        </h2>
      );
    }
    if (block.startsWith('**') && block.includes('.**')) {
      // Bold lead paragraph
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-foreground text-sm leading-relaxed mb-4">
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
      <p key={i} className="text-foreground text-sm leading-relaxed mb-4">
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
  const post = await getEffectiveBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = post.relatedSlugs
    ? getPublishedBlogPosts().filter((p) => post.relatedSlugs!.includes(p.slug))
    : [];

  return (
    <main className="min-h-screen bg-card">
      {/* Hero */}
      <section className="bg-theme-hero border-b border-border py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/blog" className="text-link text-sm hover:underline">
              ← Blog
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[post.sport] ?? 'bg-muted text-muted-foreground'}`}>
              {post.sport === 'all' ? 'All Sports' : post.sport.charAt(0).toUpperCase() + post.sport.slice(1)}
            </span>
            <span className="text-muted-foreground text-xs">{post.category}</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 leading-tight text-foreground">{post.title}</h1>
          <div className="text-muted-foreground text-sm">
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
                <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-4 bg-muted">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="bg-card rounded-xl border border-border shadow-xs p-4 hover:border-primary/50 transition-colors block"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[related.sport] ?? 'bg-muted text-muted-foreground'} mb-2 inline-block`}>
                    {related.sport === 'all' ? 'All Sports' : related.sport.charAt(0).toUpperCase() + related.sport.slice(1)}
                  </span>
                  <h3 className="font-semibold text-foreground text-sm leading-snug mt-1">{related.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{related.readingTime}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <MarketingCTA
        heading="Apply This to Your Own Swing"
        body="Import your data and get a personalized diagnosis based on your actual numbers — free."
        cta={{ label: 'Analyze My Swing Free', href: '/start' }}
      />

    </main>
  );
}
