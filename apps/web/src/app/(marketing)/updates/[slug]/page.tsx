import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/Badge';
import {
  getPublicUpdateBySlug,
  publicUpdateSlugs,
  getRelatedUpdates,
  buildUpdateFaqs,
  buildUpdateMetadata,
  buildUpdateJsonLd,
  resolveInternalLinks,
  updateAiAnswer,
  updatePath,
} from '@/lib/updates/product-detail';

// Pre-render a dedicated page for every published, public update. Draft /
// private / hidden slugs are absent here and 404 below — they can never become
// an orphan indexable page.
export async function generateStaticParams() {
  return publicUpdateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const update = getPublicUpdateBySlug(slug);
  if (!update) {
    // Unknown / non-public slug: never index a missing page.
    return { robots: { index: false, follow: false } };
  }
  return buildUpdateMetadata(update);
}

const SPORT_EMOJI: Record<string, string> = {
  Golf: '⛳',
  Tennis: '🎾',
  Pickleball: '🏓',
  Padel: '🎾',
  Baseball: '⚾',
  'Slow Pitch Softball': '🥎',
  'Fast Pitch Softball': '🥎',
  'All Sports': '🏅',
};

export default async function UpdateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const update = getPublicUpdateBySlug(slug);
  if (!update) notFound();

  const related = getRelatedUpdates(update);
  const faqs = buildUpdateFaqs(update);
  const internalLinks = resolveInternalLinks(update);
  const jsonLd = buildUpdateJsonLd(update, faqs);
  const aiAnswer = updateAiAnswer(update);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={jsonLd} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-theme-hero border-b border-border py-14 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="text-link hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/updates" className="text-link hover:underline">Updates</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/60" aria-current="page">{update.title}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="default" className="bg-secondary text-foreground">{update.category}</Badge>
            {update.sport && (
              <Badge variant="default" className="bg-secondary text-foreground">
                {SPORT_EMOJI[update.sport] ? `${SPORT_EMOJI[update.sport]} ` : ''}{update.sport}
              </Badge>
            )}
            {update.status !== 'published' && (
              <Badge variant="warning" className="bg-warning text-warning-foreground capitalize">
                {update.status.replace(/_/g, ' ')}
              </Badge>
            )}
            {update.isMajorMilestone && (
              <Badge variant="success" className="bg-primary/15 text-link">Major milestone</Badge>
            )}
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3 leading-tight text-foreground">{update.title}</h1>
          <p className="text-muted-foreground text-lg">{update.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <time dateTime={update.releaseDate}>Published {update.displayDate}</time>
            {update.audience && update.audience.length > 0 && (
              <span>For {update.audience.join(', ')}</span>
            )}
          </div>
        </div>
      </section>

      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* ── Executive summary ──────────────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">What changed and why it matters</h2>
            <p className="text-foreground leading-relaxed">{update.userBenefit}</p>
            {update.whyItMatters && (
              <p className="text-muted-foreground leading-relaxed mt-3">{update.whyItMatters}</p>
            )}
          </section>

          {/* ── Before vs After ────────────────────────────────────────── */}
          {update.beforeAfter && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">Before vs. after</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Before</h3>
                  <p className="text-sm text-foreground leading-relaxed">{update.beforeAfter.before}</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-primary mb-2">After</h3>
                  <p className="text-sm text-foreground leading-relaxed">{update.beforeAfter.after}</p>
                </div>
              </div>
            </section>
          )}

          {/* ── How it works / where to find it ────────────────────────── */}
          {(update.whereToFindIt || update.userActionRequired) && (
            <section className="rounded-xl border border-border bg-muted p-5 space-y-3">
              <h2 className="text-lg font-bold text-foreground">How to use it</h2>
              {update.whereToFindIt && (
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Where to find it:</span> {update.whereToFindIt}
                </p>
              )}
              <p className="text-sm text-foreground">
                <span className="font-semibold">Do you need to do anything?</span>{' '}
                {update.userActionRequired || 'No — it is already live and free to use.'}
              </p>
            </section>
          )}

          {/* ── AI answer summary ──────────────────────────────────────── */}
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary mb-2">In a nutshell</h2>
            <p className="text-sm text-foreground leading-relaxed">{aiAnswer}</p>
          </section>

          {/* ── Related features / internal links ──────────────────────── */}
          {internalLinks.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Explore related features</h2>
              <div className="flex flex-wrap gap-3">
                {internalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {link.label} →
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── FAQ ────────────────────────────────────────────────────── */}
          {faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Frequently asked questions</h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
                    <h3 className="font-semibold text-foreground mb-1">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Related updates ────────────────────────────────────────── */}
          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Related updates</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={updatePath(r)}
                    className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground">{r.displayDate} · {r.category}</span>
                    <h3 className="mt-1 font-semibold text-foreground text-sm leading-snug">{r.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Back to index (no dead ends / bidirectional link) ──────── */}
          <p className="pt-2">
            <Link href="/updates" className="text-sm text-primary underline hover:no-underline">
              ← Back to all SwingVantage updates
            </Link>
          </p>
        </div>
      </article>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-14 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Try it on your own swing</h2>
        <p className="text-primary-foreground/90 mb-7 text-sm max-w-xl mx-auto">
          Upload a swing video or import your data and get a free, personalized breakdown — no account required.
        </p>
        <Link
          href="/start"
          className="inline-block bg-primary-foreground text-primary hover:opacity-90 font-bold px-8 py-3 rounded-xl transition-opacity"
        >
          Analyze My Swing Free
        </Link>
      </section>
    </main>
  );
}
