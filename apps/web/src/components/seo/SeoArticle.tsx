import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Target, Dumbbell, HelpCircle, ArrowRight } from 'lucide-react';
import type { SeoPage } from '@/content/seoPages';
import { getFeature, featureHref } from '@/content/features';
import { Breadcrumbs } from './Breadcrumbs';
import { JsonLd } from './JsonLd';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  howToSchema,
  serviceSchema,
} from '@/lib/seo/jsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { YouthSafetyNotice } from '@/components/trust/YouthSafetyNotice';

const SPORT_LABEL: Record<SeoPage['sport'], string> = {
  golf: 'Golf',
  tennis: 'Tennis',
  pickleball: 'Pickleball',
  padel: 'Padel',
  baseball: 'Baseball',
  softball: 'Softball',
  multi: 'All Sports',
};

// Inbound links into the per-feature guides, keyed by the article's sport. This
// gives every SEO content page a contextual link block to the relevant feature
// pages (the reciprocal of the relatedLinks the features point back with) —
// strengthening the internal-link graph from high-authority content pages.
// Slugs are resolved through getFeature, so a renamed feature simply drops out
// (never a broken link); the registry test guards the slugs exist.
const RACKET = ['ai-diagnostic-engine', 'swing-video-upload', 'phase-by-phase-timeline', 'fix-stack', 'motion-lab-3d'];
const BAT = ['ai-diagnostic-engine', 'swing-video-upload', 'tracking-device-support', 'fix-stack', 'motion-lab-3d'];
const SPORT_FEATURES: Record<SeoPage['sport'], string[]> = {
  golf: ['ai-diagnostic-engine', 'swing-video-upload', 'launch-monitor-csv-import', 'fix-stack', 'motion-lab-3d'],
  tennis: RACKET,
  pickleball: RACKET,
  padel: RACKET,
  baseball: BAT,
  softball: BAT,
  multi: ['ai-diagnostic-engine', 'swing-video-upload', 'fix-stack', 'motion-lab-3d', 'athletic-journey'],
};

function buildSchema(page: SeoPage): Record<string, unknown> {
  const path = `/${page.slug}`;
  const nodes: Record<string, unknown>[] = [];

  if (page.schemaType === 'HowTo') {
    nodes.push(
      howToSchema(
        page.title,
        page.drills.map((d) => ({ name: d.name, text: d.how })),
        page.directAnswer,
      ),
    );
  } else {
    nodes.push(
      articleSchema({ headline: page.title, description: page.metaDescription, path }),
    );
  }

  if (page.faqs.length) nodes.push(faqPageSchema(page.faqs.map((f) => ({ question: f.question, answer: f.answer }))));
  if (page.schemaType === 'Service') {
    nodes.push(serviceSchema({ name: page.title, description: page.metaDescription }));
  }

  return buildGraph(...nodes);
}

/**
 * Renders a registry SeoPage in the AEO/GEO format:
 * breadcrumbs → direct answer → explanation → diagnosis → what
 * SwingVantage looks for → drills → mistakes → coach → FAQ → CTA → schema.
 */
export function SeoArticle({ page }: { page: SeoPage }) {
  const sportPath =
    page.sport === 'golf' ? '/golf-swing-analysis'
    : page.sport === 'tennis' ? '/tennis-swing-analysis'
    : page.sport === 'baseball' ? '/baseball-swing-analysis'
    : page.sport === 'softball' ? '/softball-swing-analysis'
    : '/';

  const crumbs = [
    { name: 'Home', path: '/' },
    ...(page.sport !== 'multi' ? [{ name: SPORT_LABEL[page.sport], path: sportPath }] : []),
    { name: page.title, path: `/${page.slug}` },
  ];

  const isYouth = page.audience === 'parent';

  return (
    <main className="min-h-screen bg-card">
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-6" />

        <h1 className="mb-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">
          {page.title}
        </h1>

        {/* Direct answer (AEO/GEO) */}
        <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <p className="text-2xs font-semibold uppercase tracking-wide text-primary">Quick answer</p>
          <p className="mt-1 text-foreground">{page.directAnswer}</p>
        </div>

        {/* Problem explanation */}
        <section className="mb-8 space-y-3 text-foreground">
          <h2 className="text-xl font-bold text-foreground">What is happening</h2>
          {page.problemExplanation.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        {/* Diagnosis checklist */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground">
            <Target size={20} className="text-primary" aria-hidden="true" /> Diagnose it yourself
          </h2>
          <ul className="space-y-2">
            {page.diagnosisSteps.map((s) => (
              <li key={s.slice(0, 24)} className="flex items-start gap-2 text-foreground">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What SwingVantage looks for */}
        <section className="mb-8 rounded-2xl bg-muted p-5">
          <h2 className="mb-3 text-xl font-bold text-foreground">What SwingVantage looks for</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {page.whatSwingVantageLooksFor.map((s) => (
              <li key={s.slice(0, 24)} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Example diagnosis (optional worked example / proof) */}
        {page.exampleDiagnosis && (
          <section className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="mb-1 text-sm font-bold text-primary">Example SwingVantage diagnosis</h2>
            <p className="text-foreground">{page.exampleDiagnosis}</p>
          </section>
        )}

        {/* Drills */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground">
            <Dumbbell size={20} className="text-primary" aria-hidden="true" /> Beginner-safe drills
          </h2>
          <div className="space-y-3">
            {page.drills.map((d, i) => (
              <div key={d.name} className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">{i + 1}. {d.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d.how}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mistakes */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground">
            <AlertTriangle size={20} className="text-warning" aria-hidden="true" /> Common mistakes to avoid
          </h2>
          <ul className="space-y-2">
            {page.mistakesToAvoid.map((m) => (
              <li key={m.slice(0, 24)} className="flex items-start gap-2 text-foreground">
                <span className="mt-1 text-warning" aria-hidden="true">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* When to work with a coach */}
        <section className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-foreground">When to work with a coach</h2>
          <p className="text-foreground">{page.whenToWorkWithCoach}</p>
        </section>

        {/* Safety / youth notice */}
        {isYouth ? (
          <YouthSafetyNotice className="mb-4" />
        ) : (
          <NotCoachReplacementNotice className="mb-4" />
        )}
        {page.safetyNotes && (
          <p className="mb-8 text-xs italic text-muted-foreground">{page.safetyNotes}</p>
        )}

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground">
              <HelpCircle size={20} className="text-primary" aria-hidden="true" /> FAQ
            </h2>
            <div className="space-y-3">
              {page.faqs.map((f) => (
                <details key={f.question} className="rounded-xl border border-border p-4">
                  <summary className="cursor-pointer font-semibold text-foreground">{f.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA — "Dark Performance" (B) treatment: the action is a dark
            bg-background chip on the green panel (mirrors MarketingCTA / the
            homepage CTA) so it reads as primary instead of an invisible
            green-on-green button. */}
        <section className="mb-8 rounded-2xl bg-primary p-6 text-center text-primary-foreground shadow-theme-lg">
          <p className="mb-4 text-lg font-bold">Ready to see your own swing?</p>
          <Link
            href={page.cta.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-8 py-3 font-bold text-foreground transition-opacity hover:opacity-90"
          >
            {page.cta.label}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs text-primary-foreground/80">No account required · Free · Private by default</p>
        </section>

        {/* Features behind this analysis — inbound links to the feature guides */}
        {(() => {
          const features = (SPORT_FEATURES[page.sport] ?? [])
            .map(getFeature)
            .filter((f): f is NonNullable<typeof f> => Boolean(f));
          if (features.length === 0) return null;
          return (
            <section aria-label="Related features" className="border-t border-border pt-6">
              <p className="mb-3 text-sm font-semibold text-foreground">The SwingVantage features behind this</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <Link
                    key={f.slug}
                    href={featureHref(f)}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary">{f.name}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Related links */}
        {page.relatedLinks.length > 0 && (
          <nav aria-label="Related pages" className="border-t border-border pt-6">
            <p className="mb-2 text-sm font-semibold text-foreground">Keep learning</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {page.relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </article>

      <JsonLd data={buildSchema(page)} />
    </main>
  );
}
