import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, PlayCircle } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getLibraryItems, getLibrarySections } from '@/lib/library';
import { learnItemListSchema, breadcrumbSchema, learnPath } from '@/lib/library/seo';
import { getConceptEntries, learnPath as conceptHref } from '@/lib/learn';

export const metadata: Metadata = {
  title: 'Video Library — Learn SwingVantage',
  description:
    'Free video walkthroughs for SwingVantage: analyze your swing, read swing path, use a launch monitor, run drills, and track progress — golf, tennis, baseball & softball.',
  alternates: { canonical: '/learn' },
  openGraph: {
    title: 'SwingVantage Video Library',
    description:
      'Free walkthroughs + training videos: swing analysis, swing path, launch monitors, drills, and progress tracking.',
    type: 'website',
    url: 'https://swingvantage.com/learn',
  },
};

export default function LearnIndexPage() {
  const items = getLibraryItems();
  const recorded = items.filter((i) => i.hasRecording);
  const sections = getLibrarySections(items).filter((s) => s.items.length > 0);
  const concepts = getConceptEntries();

  return (
    <main className="bg-background">
      <JsonLd data={learnItemListSchema(recorded)} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Video Library', path: '/learn' }])} />

      {/* Hero */}
      <section className="bg-primary px-4 py-16 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/80">Video Library</p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">Learn SwingVantage on video</h1>
          <p className="mt-3 max-w-2xl text-sm text-primary-foreground/90 md:text-base">
            Short, guided walkthroughs for every feature — plus deeper training on swing path, using a
            launch monitor, drills, coaching, and film study. Free, with full transcripts.
          </p>
          <Link
            href="/start"
            className="mt-6 inline-block rounded-xl bg-primary-foreground px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary-foreground/90"
          >
            Try SwingVantage free
          </Link>
        </div>
      </section>

      {/* Swing concepts & data points (deep written guides) */}
      {concepts.length > 0 && (
        <section aria-label="Swing concepts" className="border-b border-border bg-muted px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold text-foreground">Swing concepts &amp; data points</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Flagship written guides to the fundamentals — plus a page for every data point we analyze.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {concepts.map((c) => (
                <Link
                  key={c.slug}
                  href={conceptHref(c)}
                  className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <h3 className="text-base font-bold text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.descriptionShort}</p>
                </Link>
              ))}
            </div>
            <Link href="/learn/data-points" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
              Browse all swing data points →
            </Link>
          </div>
        </section>
      )}

      {/* Sections */}
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
        {sections.map((section) => (
          <section key={section.category} aria-label={section.label}>
            <h2 className="text-2xl font-bold text-foreground">{section.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{section.blurb}</p>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={`${item.source}:${item.id}`}
                  href={learnPath(item)}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.poster}
                        alt={`${item.title} — video thumbnail`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent-secondary/10">
                        <PlayCircle size={28} className="text-primary/60" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      <Clock size={10} aria-hidden="true" /> {item.durationLabel}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer note */}
      <section className="border-t border-border bg-card px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Signed in? Browse the same videos in the app at{' '}
          <Link href="/library" className="font-semibold text-primary hover:underline">
            your Video Library
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
