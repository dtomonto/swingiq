import { buildMetadata } from '@/lib/seo/metadata';

/**
 * The /sports picker reads your saved per-sport progress and routes you back
 * into the app — it's an app entry point, not an SEO landing page. The canonical,
 * indexable sport surfaces are the dedicated hubs (/golf-swing-analysis,
 * /tennis-swing-analysis, …). We keep /sports out of the index (and out of
 * sitemap.ts) so crawlers consolidate on those unique pages instead of treating
 * this thin, state-driven chooser as a competing duplicate.
 *
 * Metadata lives here (a server layout) because the page itself is a Client
 * Component and cannot export `metadata`.
 */
export const metadata = buildMetadata({
  title: 'Choose Your Sport',
  description:
    'Pick your sport and jump back into your SwingVantage analysis, drills, and progress.',
  path: '/sports',
  noindex: true,
});

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
