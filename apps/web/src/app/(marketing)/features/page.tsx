import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';
import { ogCardUrl } from '@/lib/og/card';
import { FEATURE_GROUPS, ALL_FEATURES, featureHref } from '@/content/features';

// buildMetadata adds canonical + hreflang alternates to localized versions
// (e.g. /es/features) when they exist — see lib/seo/metadata.
export const metadata = buildMetadata({
  title: 'SwingVantage Features — AI Diagnosis, Drills & Tracking',
  description:
    'Every SwingVantage feature with a full how-to guide: AI diagnosis, launch-monitor import, video analysis, drills, practice scheduling and progress tracking — all sports.',
  path: '/features',
  ogImage: ogCardUrl({
    eyebrow: 'Features',
    title: 'Everything SwingVantage Does — Free',
    subtitle: 'Every feature with a full how-to guide, for all 7 sports.',
  }),
});

const SITE = 'https://swingvantage.com';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingVantage', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE}/features` },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'SwingVantage',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web browser',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: ALL_FEATURES.map((f) => f.name).join(', '),
    },
    // An ItemList of every feature page strengthens the hub→detail relationship
    // for search engines (each feature is a discrete, linkable entity).
    {
      '@type': 'ItemList',
      name: 'SwingVantage features',
      itemListElement: ALL_FEATURES.map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: f.name,
        url: `${SITE}${featureHref(f)}`,
      })),
    },
  ],
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-card">
      <JsonLd data={structuredData} />

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SV</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-primary-foreground/80 transition-colors">SwingVantage</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Everything SwingVantage Does — Free</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Every feature. Every sport. No credit card. No account required to start.
            <span className="block text-primary-foreground/80 text-base mt-1">Tap any feature for a full guide on how to use it.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            {['Golf', 'Tennis', 'Pickleball', 'Padel', 'Baseball', 'Slow Pitch Softball', 'Fast Pitch Softball'].map((s) => (
              <span key={s} className="bg-primary/50 text-primary-foreground/90 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature groups */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.heading}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">{group.heading}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {group.features.map((f) => (
                <Link
                  key={f.slug}
                  href={featureHref(f)}
                  className="group flex gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{f.name}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{f.sports}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.summary}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Read the full guide
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Start using SwingVantage free</h3>
          <p className="text-muted-foreground text-sm mb-4">No account needed. Works on any device.</p>
          <Link
            href="/start"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Open SwingVantage Free
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href="/" className="text-primary hover:underline">← SwingVantage Home</Link>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
          <Link href="/golf-swing-analysis" className="text-primary hover:underline">Golf Analysis</Link>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
        </nav>
      </div>
    </div>
  );
}
