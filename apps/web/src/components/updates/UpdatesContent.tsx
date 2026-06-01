'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { UpdateCard } from './UpdateCard';
import type { Update, UpdateCategory, UpdateSport } from '@/data/updates';

// ── Sport filter pills ────────────────────────────────────────────────────

const SPORT_OPTIONS: Array<{ value: UpdateSport | 'all'; label: string; emoji: string }> = [
  { value: 'all', label: 'All Sports', emoji: '' },
  { value: 'Golf', label: 'Golf', emoji: '⛳' },
  { value: 'Tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'Baseball', label: 'Baseball', emoji: '⚾' },
  { value: 'Slow Pitch Softball', label: 'Slow Pitch', emoji: '🥎' },
  { value: 'Fast Pitch Softball', label: 'Fast Pitch', emoji: '🥎' },
];

// ── FAQs ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What is SwingIQ?',
    a: 'SwingIQ is a free, web-based AI swing analysis platform that helps athletes understand and improve their technique. It works for golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
  },
  {
    q: 'What sports does SwingIQ support?',
    a: 'SwingIQ currently supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own coaching feedback, drill library, and analysis engine.',
  },
  {
    q: 'How does SwingIQ help with swing improvement?',
    a: "SwingIQ analyzes your performance data or swing video and identifies your highest-priority issue. Instead of a list of 20 things to fix, you get one clear starting point with targeted drills and a practice plan.",
  },
  {
    q: 'Does SwingIQ replace private coaching?',
    a: 'No. SwingIQ is an AI-powered improvement assistant. It helps you identify patterns and prioritize your practice. For complex technique work or injury concerns, work with a qualified coach.',
  },
  {
    q: 'Can SwingIQ analyze my equipment?',
    a: 'Yes. You can optionally add details about your clubs, racket, or bat. SwingIQ uses that information to give you more personalized feedback. Adding equipment details is never required.',
  },
  {
    q: 'Can SwingIQ help me track progress over time?',
    a: 'Yes. SwingIQ saves your training history and shows how your key metrics change over sessions. You can also back up your progress and restore it on any device.',
  },
];

// ── Milestone timeline ────────────────────────────────────────────────────

interface MilestoneProps {
  milestones: Update[];
}

function MilestoneTimeline({ milestones }: MilestoneProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-green-200 hidden sm:block" aria-hidden="true" />
      <ol className="space-y-6">
        {milestones.map((m, i) => (
          <li key={m.id} className="flex gap-4 sm:gap-6">
            {/* Step circle */}
            <div
              className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shadow-xs"
              aria-hidden="true"
            >
              {i + 1}
            </div>
            <div className="pt-1 min-w-0">
              <time
                dateTime={m.releaseDate}
                className="text-xs text-gray-400 font-medium uppercase tracking-wide"
              >
                {m.displayDate}
              </time>
              <h3 className="text-base font-semibold text-gray-900 mt-0.5">{m.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{m.userBenefit}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Main content component ────────────────────────────────────────────────

interface UpdatesContentProps {
  updates: Update[];
  milestones: Update[];
  featured: Update | undefined;
}

export function UpdatesContent({ updates, milestones, featured }: UpdatesContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<UpdateSport | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<UpdateCategory | 'all'>('all');

  // Derive unique categories from published data
  const availableCategories = useMemo<Array<UpdateCategory | 'all'>>(() => {
    const cats = new Set<UpdateCategory>();
    updates.forEach((u) => cats.add(u.category));
    return ['all', ...Array.from(cats).sort()];
  }, [updates]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return updates.filter((u) => {
      if (selectedSport !== 'all') {
        if (!u.sport) return false;
        // "All Sports" updates are shown for every sport filter
        if (u.sport !== 'All Sports' && u.sport !== selectedSport) return false;
      }
      if (selectedCategory !== 'all' && u.category !== selectedCategory) return false;
      if (q) {
        const haystack = [u.title, u.summary, u.userBenefit, u.whyItMatters, u.category, u.sport ?? '']
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [updates, selectedSport, selectedCategory, searchQuery]);

  const hasFilters = searchQuery !== '' || selectedSport !== 'all' || selectedCategory !== 'all';

  function clearFilters() {
    setSearchQuery('');
    setSelectedSport('all');
    setSelectedCategory('all');
  }

  return (
    <>
      {/* ── Featured / Latest update ───────────────────────────────────── */}
      {featured && !hasFilters && (
        <section className="py-12 px-4 bg-green-50 border-b border-green-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-green-800 mb-4 uppercase tracking-wide text-sm">
              Latest Update
            </h2>
            <UpdateCard update={featured} featured />
          </div>
        </section>
      )}

      {/* ── Product progress milestone timeline ───────────────────────── */}
      {milestones.length > 0 && !hasFilters && (
        <section className="py-14 px-4 bg-gray-50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">How SwingIQ Has Improved Over Time</h2>
              <p className="text-gray-500 mt-2 text-sm">
                Key milestones in SwingIQ&apos;s journey — told from a user perspective, not a technical one.
              </p>
            </div>
            <MilestoneTimeline milestones={milestones} />
          </div>
        </section>
      )}

      {/* ── All updates ────────────────────────────────────────────────── */}
      <section className="py-14 px-4" id="all-updates">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {hasFilters ? 'Filtered Updates' : 'All Updates'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Sorted newest first. Only meaningful user-facing changes are published here.</p>
          </div>

          {/* Filters */}
          <div className="space-y-4 mb-8">
            {/* Search */}
            <div className="relative">
              <label htmlFor="updates-search" className="sr-only">Search updates</label>
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                id="updates-search"
                type="search"
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            </div>

            {/* Sport pills */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sport">
              {SPORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSport(opt.value as UpdateSport | 'all')}
                  className={[
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    selectedSport === opt.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700',
                  ].join(' ')}
                  aria-pressed={selectedSport === opt.value}
                >
                  {opt.emoji && <span aria-hidden="true">{opt.emoji}</span>}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category dropdown */}
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="category-filter" className="text-xs font-medium text-gray-500 whitespace-nowrap">
                Category:
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as UpdateCategory | 'all')}
                className="border border-gray-200 rounded-lg text-sm text-gray-700 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-green-400 bg-white"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-green-700 underline hover:text-green-900 focus:outline-hidden focus:ring-2 focus:ring-green-400 rounded-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500 font-medium">No updates match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-green-700 underline hover:text-green-900"
              >
                Clear filters to see all updates
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filtered.map((update) => (
                <UpdateCard key={update.id} update={update} />
              ))}
            </div>
          )}

          {/* Update count */}
          {filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-6 text-center">
              Showing {filtered.length} of {updates.length} update{updates.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Quick answers about SwingIQ and how it can help you improve.
          </p>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-amber-50 border-y border-amber-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-amber-800">
            <strong>SwingIQ is an AI-powered improvement assistant — not a certified coach, medical professional, or training authority.</strong>{' '}
            Results are heuristic estimates. Always consult qualified professionals for safety-critical decisions, injury concerns, or advanced competitive development. Young athletes should practice with adult supervision.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-4 text-xs">
          <span>&copy; {new Date().getFullYear()} SwingIQ. All rights reserved.</span>
          <nav aria-label="Footer navigation">
            <div className="flex gap-4 flex-wrap">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/parents" className="hover:text-white">Parents</Link>
              <Link href="/pricing" className="hover:text-white">Pricing</Link>
              <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
              <Link href="/updates" className="hover:text-white text-green-400">Updates</Link>
            </div>
          </nav>
        </div>
      </footer>
    </>
  );
}
