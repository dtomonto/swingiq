'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { getPublishedBlogPosts } from '@/data/blog-posts';

const SPORT_FILTERS = ['All', 'Golf', 'Tennis', 'Pickleball', 'Padel', 'Baseball', 'Softball'] as const;
type SportFilter = typeof SPORT_FILTERS[number];

const SPORT_BADGE_COLORS: Record<string, string> = {
  golf: 'bg-primary/15 text-primary',
  tennis: 'bg-warning/15 text-warning',
  pickleball: 'bg-lime-500/15 text-lime-700',
  padel: 'bg-sky-500/15 text-sky-700',
  baseball: 'bg-error/15 text-error',
  softball: 'bg-accent-secondary/15 text-accent-secondary',
  all: 'bg-muted text-muted-foreground',
};

export default function BlogIndexPage() {
  const [sportFilter, setSportFilter] = useState<SportFilter>('All');
  const [query, setQuery] = useState('');

  const sorted = [...getPublishedBlogPosts()].sort((a, b) => b.publishDate.localeCompare(a.publishDate));

  const filtered = sorted.filter((post) => {
    const matchesSport =
      sportFilter === 'All' ||
      post.sport === sportFilter.toLowerCase() ||
      post.sport === 'all';
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchesSport && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-card">
      {/* Hero */}
      <MarketingHero
        title="SwingVantage"
        titleAccent="Blog"
        subtitle="Swing tips, analysis guides, and training advice for golf, tennis, baseball, and softball."
      >
        <input
          type="search"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mx-auto block w-full max-w-md rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50"
        />
      </MarketingHero>

      {/* Filter pills */}
      <section className="bg-muted border-b border-border py-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
          {SPORT_FILTERS.map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sportFilter === sport
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </section>

      {/* Post grid */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No posts match your search.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filtered.map((post) => (
                <article key={post.slug} className="bg-card rounded-xl border border-border shadow-xs p-5 sm:p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[post.sport] ?? 'bg-muted text-muted-foreground'}`}>
                      {post.sport === 'all' ? 'All Sports' : post.sport.charAt(0).toUpperCase() + post.sport.slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.category}</span>
                  </div>
                  <h2 className="font-bold text-foreground text-base mb-2 leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-muted-foreground">
                      {post.displayDate} &middot; {post.readingTime}
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Read more →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
