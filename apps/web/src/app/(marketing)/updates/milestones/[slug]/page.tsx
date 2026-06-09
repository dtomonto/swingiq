import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/Badge';
import {
  getPublicMilestone, buildMilestoneFaqs, buildMilestoneMetadata, buildMilestoneJsonLd,
  relatedPublishedMilestones, nextMilestones, resolveMilestoneLinks, milestonePath,
} from '@/lib/milestones/page-detail';
import { publishedMilestoneSlugs } from '@/content/milestones/published';

// Pre-render only published milestones; unknown/unapproved slugs 404 (no orphans).
export function generateStaticParams() {
  return publishedMilestoneSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPublicMilestone(slug);
  if (!p) return { robots: { index: false, follow: false } };
  return buildMilestoneMetadata(p);
}

export default async function MilestonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPublicMilestone(slug);
  if (!p) notFound();

  const { definition: def, published, content } = p;
  const faqs = buildMilestoneFaqs(p);
  const jsonLd = buildMilestoneJsonLd(p, faqs);
  const links = resolveMilestoneLinks(def);
  const related = relatedPublishedMilestones(slug);
  const next = nextMilestones(def);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={jsonLd} />

      <section className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-primary-foreground/80">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/updates" className="hover:underline">Updates</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/updates/milestones" className="hover:underline">Milestones</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-primary-foreground/60" aria-current="page">{def.title}</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="default" className="bg-white/15 text-white">{def.category}</Badge>
            <Badge variant="success" className="bg-white/20 text-white">Verified milestone</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{def.title}</h1>
          <p className="text-primary-foreground/90 text-lg">{content.summary}</p>
          <div className="mt-5 text-sm text-primary-foreground/80">
            <span className="font-semibold">Verified:</span> {published.verifiedMetric} · <time dateTime={published.achievedAt}>{published.achievedAt}</time>
          </div>
        </div>
      </section>

      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">What this means</h2>
            <p className="text-foreground leading-relaxed">{content.whatItMeans}</p>
            <p className="text-muted-foreground leading-relaxed mt-3">{content.howUsersBenefit}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Why it matters</h2>
            <p className="text-foreground leading-relaxed">{def.authorityPurpose}</p>
            <p className="text-muted-foreground leading-relaxed mt-3">{content.educationalContext}</p>
          </section>

          <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary mb-2">In a nutshell</h2>
            <p className="text-sm text-foreground leading-relaxed">{content.shareSnippet} {content.relatedFeatureContext}</p>
          </section>

          {links.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Explore related features</h2>
              <div className="flex flex-wrap gap-3">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors">{l.label} →</Link>
                ))}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Frequently asked questions</h2>
              <div className="space-y-3">
                {faqs.map((f) => (
                  <div key={f.q} className="rounded-xl border border-border bg-card p-5">
                    <h3 className="font-semibold text-foreground mb-1">{f.q}</h3>
                    <p className="text-sm text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {next.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Next milestones</h2>
              <ul className="space-y-2">
                {next.map((n) => (
                  <li key={n.id} className="rounded-lg border border-border bg-card p-3 text-sm text-foreground">{n.title}</li>
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Related milestones</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link key={r.published.slug} href={milestonePath(r.published.slug)} className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
                    <span className="text-xs text-muted-foreground">{r.definition.category}</span>
                    <h3 className="mt-1 font-semibold text-foreground text-sm leading-snug">{r.definition.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="pt-2">
            <Link href="/updates/milestones" className="text-sm text-primary underline hover:no-underline">← All SwingVantage milestones</Link>
          </p>
        </div>
      </article>

      <section className="bg-primary text-primary-foreground py-14 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Try it on your own swing</h2>
        <p className="text-primary-foreground/90 mb-7 text-sm max-w-xl mx-auto">Upload a swing video or import your data and get a free, personalized breakdown — no account required.</p>
        <Link href="/start" className="inline-block bg-primary-foreground text-primary hover:opacity-90 font-bold px-8 py-3 rounded-xl transition-opacity">Analyze My Swing Free</Link>
      </section>
    </main>
  );
}
