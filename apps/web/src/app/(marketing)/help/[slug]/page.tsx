import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  articleSchema,
  faqPageSchema,
  howToSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
import { getHelpTopic, getHelpTopics, helpPath } from '@/lib/feature-education/help-center';

// Every published help topic gets a static page; unknown slugs notFound().
export function generateStaticParams() {
  return getHelpTopics().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  if (!topic) return {};
  return buildMetadata({
    title: topic.seoTitle ?? `${topic.title} — help`,
    description: topic.seoDescription ?? topic.lead,
    path: helpPath(slug),
    ogType: 'article',
    // Admin/operator help is real but internal-facing — keep it out of search.
    noindex: topic.isAdmin,
  });
}

/** Render a section body line as a paragraph or a list item (auto-detects bullets/numbers). */
function isBulletLine(line: string): boolean {
  return /^\s*(\d+\.|[-•])\s+/.test(line);
}

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getHelpTopic(slug);
  if (!topic) notFound();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Help Center', path: '/help' },
    { name: topic.title, path: helpPath(slug) },
  ];

  return (
    <main className="bg-background">
      <JsonLd data={breadcrumbListSchema(crumbs)} />
      <JsonLd
        data={articleSchema({
          headline: `${topic.title} — help`,
          description: topic.lead,
          path: helpPath(slug),
        })}
      />
      {topic.steps.length > 0 && (
        <JsonLd
          data={howToSchema(
            `How to use ${topic.title}`,
            topic.steps.map((s) => ({ name: s.title, text: s.detail })),
            topic.lead,
          )}
        />
      )}
      {topic.faqs.length > 0 && (
        <JsonLd
          data={faqPageSchema(topic.faqs.map((f) => ({ question: f.q, answer: f.a })))}
        />
      )}

      {/* Hero */}
      <section className="bg-primary px-4 py-14 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/80 transition-opacity hover:opacity-90"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Help Center
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-primary-foreground/80">
            {topic.isAdmin ? 'Admin guide' : 'Help article'}
          </p>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">{topic.title}</h1>
          <p className="mt-3 text-sm text-primary-foreground/90 md:text-base">{topic.lead}</p>
          {topic.primaryRoute && (
            <Link
              href={topic.primaryRoute}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-background px-5 py-2.5 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
            >
              Open in the app
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
        {/* Quick answer */}
        {topic.answer && (
          <section className="rounded-xl border border-border bg-muted p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              In short
            </h2>
            <p className="mt-2 text-base text-foreground">{topic.answer}</p>
          </section>
        )}

        {/* Steps */}
        {topic.steps.length > 0 && (
          <section aria-label="Step by step">
            <h2 className="text-2xl font-bold text-foreground">Step by step</h2>
            <ol className="mt-5 space-y-4">
              {topic.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="pt-0.5">
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Narrative sections */}
        {topic.sections.map((section, si) => (
          <section key={si} aria-label={section.heading}>
            <h2 className="text-xl font-bold text-foreground">{section.heading}</h2>
            {(() => {
              const bullets = section.body.filter(isBulletLine);
              const paras = section.body.filter((l) => !isBulletLine(l));
              return (
                <>
                  {paras.map((p, pi) => (
                    <p key={`p${pi}`} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                  {bullets.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                      {bullets.map((b, bi) => (
                        <li key={`b${bi}`}>{b.replace(/^\s*(\d+\.|[-•])\s+/, '')}</li>
                      ))}
                    </ul>
                  )}
                </>
              );
            })()}
          </section>
        ))}

        {/* FAQ */}
        {topic.faqs.length > 0 && (
          <section aria-label="Frequently asked questions">
            <h2 className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
              {topic.faqs.map((f, fi) => (
                <details key={fi} className="group p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA / related */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground">Keep going</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {topic.primaryRoute && (
              <Link
                href={topic.primaryRoute}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Open in the app <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Video library <ExternalLink size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              All help topics
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
