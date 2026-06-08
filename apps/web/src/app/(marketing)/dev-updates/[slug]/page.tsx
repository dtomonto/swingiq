import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/Badge';
import {
  getPublicDevUpdateBySlug,
  publicDevUpdateSlugs,
  getRelatedDevUpdates,
  buildDevUpdateFaqs,
  buildDevUpdateMetadata,
  buildDevUpdateJsonLd,
  devUpdateAiAnswer,
  devUpdatePath,
} from '@/lib/updates/dev-detail';

const IMPACT_LABEL: Record<string, string> = {
  major: 'Major',
  notable: 'Notable',
  foundational: 'Foundational',
};

export async function generateStaticParams() {
  return publicDevUpdateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const update = getPublicDevUpdateBySlug(slug);
  if (!update) return { robots: { index: false, follow: false } };
  return buildDevUpdateMetadata(update);
}

export default async function DevUpdateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const update = getPublicDevUpdateBySlug(slug);
  if (!update) notFound();

  const related = getRelatedDevUpdates(update);
  const faqs = buildDevUpdateFaqs(update);
  const jsonLd = buildDevUpdateJsonLd(update, faqs);
  const aiAnswer = devUpdateAiAnswer(update);

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={jsonLd} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-primary-foreground/80">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/dev-updates" className="hover:underline">Developer Updates</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-primary-foreground/60" aria-current="page">{update.title}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="default" className="bg-white/15 text-white">{update.category}</Badge>
            <Badge variant="default" className="bg-white/15 text-white">{IMPACT_LABEL[update.impact]}</Badge>
            {update.version && (
              <span className="rounded-sm bg-white/15 px-2 py-0.5 font-mono text-xs">{update.version}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{update.title}</h1>
          <p className="text-primary-foreground/90 text-lg">{update.headline}</p>
          <p className="mt-5 text-sm text-primary-foreground/80">
            <time dateTime={update.date}>Published {update.displayDate}</time>
          </p>
        </div>
      </section>

      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* ── Technical summary ──────────────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">What was built</h2>
            <p className="text-foreground leading-relaxed">{update.details}</p>
          </section>

          {/* ── Engineering highlights ─────────────────────────────────── */}
          {update.highlights && update.highlights.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Implementation highlights</h2>
              <ul className="space-y-2">
                {update.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-foreground">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Stack ──────────────────────────────────────────────────── */}
          {update.stack && update.stack.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Stack</h2>
              <div className="flex flex-wrap gap-1.5">
                {update.stack.map((tech) => (
                  <span key={tech} className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Testing / validation ───────────────────────────────────── */}
          {update.testing && update.testing.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Testing &amp; validation</h2>
              <ul className="space-y-2">
                {update.testing.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-foreground">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Rollback / risk ────────────────────────────────────────── */}
          {update.rollback && (
            <section className="rounded-xl border border-warning/30 bg-warning/10 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-warning mb-2">Rollback &amp; risk</h2>
              <p className="text-sm text-foreground leading-relaxed">{update.rollback}</p>
            </section>
          )}

          {/* ── AI answer summary ──────────────────────────────────────── */}
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary mb-2">In a nutshell</h2>
            <p className="text-sm text-foreground leading-relaxed">{aiAnswer}</p>
          </section>

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

          {/* ── Related developer updates ──────────────────────────────── */}
          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Related developer updates</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={devUpdatePath(r)}
                    className="block rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground">{r.displayDate} · {r.category}</span>
                    <h3 className="mt-1 font-semibold text-foreground text-sm leading-snug">{r.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Cross-links ────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <Link href="/dev-updates" className="text-primary underline hover:no-underline">
              ← All developer updates
            </Link>
            <Link href="/updates" className="text-primary underline hover:no-underline">
              See the product (plain-English) updates →
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
