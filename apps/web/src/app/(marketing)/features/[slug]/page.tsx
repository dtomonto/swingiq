import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/config/site';
import {
  getFeature,
  allFeatureSlugs,
  relatedFeatures,
  featureHref,
  type Feature,
} from '@/content/features';

export function generateStaticParams() {
  return allFeatureSlugs().map((slug) => ({ slug }));
}

function metaTitle(f: Feature): string {
  return f.metaTitle ?? `${f.name} — How It Works & How to Use It`;
}
function metaDescription(f: Feature): string {
  return f.metaDescription ?? f.summary;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const f = getFeature(slug);
  if (!f) return {};
  return buildMetadata({
    title: metaTitle(f),
    description: metaDescription(f),
    path: featureHref(f),
  });
}

function structuredData(f: Feature) {
  const url = absoluteUrl(featureHref(f));
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingVantage', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Features', item: absoluteUrl('/features') },
        { '@type': 'ListItem', position: 3, name: f.name, item: url },
      ],
    },
    // The feature itself as a How-To (the step-by-step guide is the payload).
    {
      '@type': 'HowTo',
      name: `How to use ${f.name} in SwingVantage`,
      description: f.summary,
      step: f.guide.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.title,
        text: s.body,
      })),
    },
  ];
  if (f.faqs && f.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: f.faqs.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) notFound();

  const related = relatedFeatures(feature);

  return (
    <div className="min-h-screen bg-card">
      <JsonLd data={structuredData(feature)} />

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">SwingVantage</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <Link href="/features" className="hover:text-primary">Features</Link>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className="text-foreground">{feature.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">{feature.group}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{feature.sports}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{feature.name}</h1>
          <p className="text-lg text-muted-foreground mt-3 leading-relaxed">{feature.summary}</p>
        </header>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-3">What it is</h2>
          <div className="space-y-4">
            {feature.overview.map((para, i) => (
              <p key={i} className="text-foreground/90 leading-relaxed">{para}</p>
            ))}
          </div>
        </section>

        {/* Best for */}
        {feature.bestFor && feature.bestFor.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-3">Who it’s for</h2>
            <ul className="space-y-2">
              {feature.bestFor.map((b, i) => (
                <li key={i} className="flex gap-2.5 text-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* How-to guide */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-1">How to take full advantage</h2>
          <p className="text-sm text-muted-foreground mb-5">A step-by-step guide to getting everything out of {feature.name}.</p>
          <ol className="space-y-4">
            {feature.guide.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-0.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Pro tips */}
        {feature.proTips && feature.proTips.length > 0 && (
          <section className="mb-10 rounded-xl border border-accent-secondary/30 bg-accent-secondary/5 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
              <Lightbulb className="w-5 h-5 text-accent-secondary" aria-hidden="true" /> Pro tips
            </h2>
            <ul className="space-y-2">
              {feature.proTips.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-foreground/90">
                  <span className="text-accent-secondary font-bold shrink-0">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Good to know / limitations */}
        {(feature.note || (feature.limitations && feature.limitations.length > 0)) && (
          <section className="mb-10 rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground mb-3">
              <Info className="w-5 h-5 text-muted-foreground" aria-hidden="true" /> Good to know
            </h2>
            {feature.note && <p className="text-sm text-foreground/80 mb-2">{feature.note}</p>}
            {feature.limitations && feature.limitations.length > 0 && (
              <ul className="space-y-1.5">
                {feature.limitations.map((l, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed">• {l}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* FAQs */}
        {feature.faqs && feature.faqs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              {feature.faqs.map((q, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-foreground">{q.question}</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed mt-1.5">{q.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mb-10 rounded-xl bg-primary/10 border border-primary/30 p-6 text-center">
          <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-foreground mb-2">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" /> Try {feature.name} free
          </h2>
          <p className="text-muted-foreground text-sm mb-4">No account needed to start. Works on any device, for all seven sports.</p>
          <Link
            href="/start"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Open SwingVantage Free
          </Link>
        </section>

        {/* Related features */}
        {related.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">Related features</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={featureHref(r)}
                  className="group flex items-start gap-2 rounded-xl border border-border p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related links */}
        {feature.relatedLinks && feature.relatedLinks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Learn more</h2>
            <div className="flex flex-wrap gap-3">
              {feature.relatedLinks.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-primary hover:underline">
                  {l.label} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-6 border-t border-border">
          <Link href="/features" className="text-primary hover:underline">← All features</Link>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
        </nav>
      </article>
    </div>
  );
}
