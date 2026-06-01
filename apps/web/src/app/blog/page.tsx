'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/data/blog-posts';
import { PublicFooter } from '@/components/layout/PublicFooter';

const SPORT_FILTERS = ['All', 'Golf', 'Tennis', 'Baseball', 'Softball'] as const;
type SportFilter = typeof SPORT_FILTERS[number];

const SPORT_BADGE_COLORS: Record<string, string> = {
  golf: 'bg-green-100 text-green-700',
  tennis: 'bg-yellow-100 text-yellow-700',
  baseball: 'bg-red-100 text-red-700',
  softball: 'bg-pink-100 text-pink-700',
  all: 'bg-gray-100 text-gray-600',
};

export default function BlogIndexPage() {
  const [sportFilter, setSportFilter] = useState<SportFilter>('All');
  const [query, setQuery] = useState('');

  const sorted = [...BLOG_POSTS].sort((a, b) => b.publishDate.localeCompare(a.publishDate));

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
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#1a3a2a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SwingIQ Blog</h1>
          <p className="text-green-100 text-xl max-w-2xl mx-auto mb-8">
            Swing tips, analysis guides, and training advice for golf, tennis, baseball, and softball.
          </p>
          <input
            type="search"
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-md mx-auto block px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-green-400"
          />
        </div>
      </section>

      {/* Filter pills */}
      <section className="bg-gray-50 border-b border-gray-200 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
          {SPORT_FILTERS.map((sport) => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sportFilter === sport
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'
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
            <p className="text-gray-500 text-center py-12">No posts match your search.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filtered.map((post) => (
                <article key={post.slug} className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 sm:p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPORT_BADGE_COLORS[post.sport] ?? 'bg-gray-100 text-gray-600'}`}>
                      {post.sport === 'all' ? 'All Sports' : post.sport.charAt(0).toUpperCase() + post.sport.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">{post.category}</span>
                  </div>
                  <h2 className="font-bold text-gray-900 text-base mb-2 leading-snug">
                    <Link href={`/blog/${post.slug}`} className="hover:text-green-700 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-gray-400">
                      {post.displayDate} &middot; {post.readingTime}
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-green-700 text-xs font-medium hover:underline"
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

      <PublicFooter />
    </main>
  );
}
