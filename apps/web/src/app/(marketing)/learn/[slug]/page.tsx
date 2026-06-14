import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FileText, ArrowRight, Clock } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCategoryMeta } from '@/lib/library';
import { getEffectivePublicLearnItems } from '@/lib/publishing/public-updates.server';
import {
  videoObjectSchema,
  faqPageSchema,
  breadcrumbSchema,
  videoFaqs,
  answerSummary,
  learnPath,
} from '@/lib/library/seo';
import { absoluteUrl } from '@/config/site';

// Fully dynamic so a durable PublishingOS override flips this page live/dark on
// the next request. Only effectively-public videos resolve; the rest 404.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getEffectivePublicLearnItems()).find((i) => i.id === slug);
  if (!item) return {};
  const path = learnPath(item);
  // Recordings are produced at 1280×720 (see scripts/.../record-*.mjs).
  const isVideo = Boolean(item.hasRecording && item.mp4Src);
  return {
    title: `${item.title} — SwingVantage Video`,
    description: item.description,
    alternates: { canonical: path },
    openGraph: {
      title: item.title,
      description: item.description,
      // A real video page advertises itself as og video so social/chat
      // unfurlers offer an inline player; "coming soon" pages stay 'website'.
      type: isVideo ? 'video.other' : 'website',
      url: absoluteUrl(path),
      ...(item.poster
        ? { images: [{ url: absoluteUrl(item.poster), width: 1280, height: 720, alt: item.title }] }
        : {}),
      ...(isVideo
        ? {
            videos: [
              { url: absoluteUrl(item.mp4Src!), type: 'video/mp4', width: 1280, height: 720 },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description: item.description,
      ...(item.poster ? { images: [absoluteUrl(item.poster)] } : {}),
    },
  };
}

export default async function LearnVideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const items = await getEffectivePublicLearnItems();
  const item = items.find((i) => i.id === slug);
  if (!item) notFound();

  const meta = getCategoryMeta(item.category);
  const faqs = videoFaqs(item);
  const video = videoObjectSchema(item);
  const related = items.filter((i) => i.category === item.category && i.id !== item.id).slice(0, 3);

  return (
    <main className="bg-background">
      {video && <JsonLd data={video} />}
      <JsonLd data={faqPageSchema(item)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Video Library', path: '/learn' },
          { name: item.title, path: learnPath(item) },
        ])}
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/learn" className="hover:text-foreground">
            Video Library
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          {meta && <span>{meta.label}</span>}
        </nav>

        <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">{item.title}</h1>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} aria-hidden="true" /> {item.durationLabel}
        </p>

        {/* Answer summary (AEO/GEO lead) */}
        <p className="mt-4 text-base leading-relaxed text-foreground">{answerSummary(item)}</p>

        {/* Player */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-black">
          {item.hasRecording && item.mp4Src ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- caption track added below
            <video
              controls
              playsInline
              preload="metadata"
              poster={item.poster}
              className="aspect-video w-full"
              aria-label={item.title}
            >
              <source src={item.mp4Src} type="video/mp4" />
              {item.captionsSrc && (
                <track kind="captions" src={item.captionsSrc} srcLang="en" label="English" default />
              )}
            </video>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-secondary text-center">
              <p className="px-6 text-sm text-muted-foreground">
                Recording coming soon — the full written walkthrough is below.
              </p>
            </div>
          )}
        </div>

        {/* Transcript (crawlable text — the AEO/GEO payload) */}
        <section className="mt-8" aria-label="Transcript">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            Transcript &amp; step-by-step
          </h2>
          <ol className="mt-3 space-y-3">
            {item.script.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xs font-bold text-primary"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ (AEO) */}
        <section className="mt-8" aria-label="Frequently asked questions">
          <h2 className="text-lg font-bold text-foreground">FAQ</h2>
          <dl className="mt-3 space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-4">
                <dt className="text-sm font-semibold text-foreground">{f.question}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-xl bg-primary p-6 text-center text-primary-foreground">
          <h2 className="text-xl font-bold">Try it in SwingVantage</h2>
          <p className="mt-1 text-sm text-primary-foreground/90">
            Analyze your swing and get a personalized plan — free, no credit card.
          </p>
          <Link
            href={item.route ?? '/start'}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
          >
            Get started free
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10" aria-label="Related videos">
            <h2 className="text-lg font-bold text-foreground">More in {meta?.label}</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={learnPath(r)}
                  className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{r.title}</h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Watch <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
