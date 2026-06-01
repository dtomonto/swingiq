import Link from 'next/link';
import { CheckCircle2, AlertTriangle, Target, Dumbbell, HelpCircle } from 'lucide-react';
import type { SeoPage } from '@/content/seoPages';
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
  baseball: 'Baseball',
  softball: 'Softball',
  multi: 'All Sports',
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
 * SwingIQ looks for → drills → mistakes → coach → FAQ → CTA → schema.
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
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-6" />

        <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
          {page.title}
        </h1>

        {/* Direct answer (AEO/GEO) */}
        <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Quick answer</p>
          <p className="mt-1 text-gray-800">{page.directAnswer}</p>
        </div>

        {/* Problem explanation */}
        <section className="mb-8 space-y-3 text-gray-700">
          <h2 className="text-xl font-bold text-gray-900">What is happening</h2>
          {page.problemExplanation.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        {/* Diagnosis checklist */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Target size={20} className="text-green-700" aria-hidden="true" /> Diagnose it yourself
          </h2>
          <ul className="space-y-2">
            {page.diagnosisSteps.map((s) => (
              <li key={s.slice(0, 24)} className="flex items-start gap-2 text-gray-700">
                <CheckCircle2 size={17} className="mt-0.5 flex-shrink-0 text-green-600" aria-hidden="true" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What SwingIQ looks for */}
        <section className="mb-8 rounded-2xl bg-gray-50 p-5">
          <h2 className="mb-3 text-xl font-bold text-gray-900">What SwingIQ looks for</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {page.whatSwingIQLooksFor.map((s) => (
              <li key={s.slice(0, 24)} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" aria-hidden="true" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Drills */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Dumbbell size={20} className="text-green-700" aria-hidden="true" /> Beginner-safe drills
          </h2>
          <div className="space-y-3">
            {page.drills.map((d, i) => (
              <div key={d.name} className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900">{i + 1}. {d.name}</p>
                <p className="mt-1 text-sm text-gray-600">{d.how}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mistakes */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
            <AlertTriangle size={20} className="text-amber-600" aria-hidden="true" /> Common mistakes to avoid
          </h2>
          <ul className="space-y-2">
            {page.mistakesToAvoid.map((m) => (
              <li key={m.slice(0, 24)} className="flex items-start gap-2 text-gray-700">
                <span className="mt-1 text-amber-500" aria-hidden="true">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* When to work with a coach */}
        <section className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-gray-900">When to work with a coach</h2>
          <p className="text-gray-700">{page.whenToWorkWithCoach}</p>
        </section>

        {/* Safety / youth notice */}
        {isYouth ? (
          <YouthSafetyNotice className="mb-4" />
        ) : (
          <NotCoachReplacementNotice className="mb-4" />
        )}
        {page.safetyNotes && (
          <p className="mb-8 text-xs italic text-gray-500">{page.safetyNotes}</p>
        )}

        {/* FAQ */}
        {page.faqs.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900">
              <HelpCircle size={20} className="text-green-700" aria-hidden="true" /> FAQ
            </h2>
            <div className="space-y-3">
              {page.faqs.map((f) => (
                <details key={f.question} className="rounded-xl border border-gray-200 p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">{f.question}</summary>
                  <p className="mt-2 text-sm text-gray-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mb-8 rounded-2xl bg-[#1a3a2a] p-6 text-center text-white">
          <p className="mb-4 text-lg font-bold">Ready to see your own swing?</p>
          <Link
            href={page.cta.href}
            className="inline-block rounded-xl bg-green-500 px-8 py-3 font-bold text-white transition-colors hover:bg-green-400"
          >
            {page.cta.label}
          </Link>
          <p className="mt-3 text-xs text-green-300">No account required · Free · Private by default</p>
        </section>

        {/* Related links */}
        {page.relatedLinks.length > 0 && (
          <nav aria-label="Related pages" className="border-t border-gray-200 pt-6">
            <p className="mb-2 text-sm font-semibold text-gray-900">Keep learning</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {page.relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-green-700 hover:underline">{l.label}</Link>
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
