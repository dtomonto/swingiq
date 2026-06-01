import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';

export const metadata = buildMetadata({
  title: 'Methodology — What SwingIQ Measures, Estimates, and Does Not',
  description:
    'An honest explanation of how SwingIQ produces results: what it analyses, what it estimates, what it does not measure, how confidence is decided, how input quality matters, and why a qualified coach should validate.',
  path: '/methodology',
  keywords: [
    'SwingIQ methodology',
    'how swing analysis works',
    'swing analysis confidence',
    'is AI swing analysis accurate',
    'estimate vs measured swing data',
  ],
});

const FAQS = [
  {
    question: 'Does SwingIQ measure my swing from the video pixels?',
    answer:
      'Not unless a result is explicitly labelled as measured by validated video-processing or sensor data. By default, uploaded video helps you organise and review your swing and gives the AI context. Visual or mechanical conclusions are shown as estimates unless they come from measured data.',
  },
  {
    question: 'What is the difference between "measured" and "estimated"?',
    answer:
      'Measured means a number came from sensor or launch-monitor data you provided, or from validated processing. Estimated means SwingIQ inferred something from your answers, your description, or general patterns. SwingIQ labels every result so you know which one you are looking at.',
  },
  {
    question: 'How does SwingIQ decide a confidence level?',
    answer:
      'Confidence is based on how much real data backs a result. Self-reported answers give low confidence (an estimate). Imported launch-monitor data, more sessions, and a clear retest raise it. SwingIQ never shows false precision.',
  },
  {
    question: 'Should I trust SwingIQ instead of a coach?',
    answer:
      'No. SwingIQ helps you prioritise practice and track change over time. It does not replace a qualified coach, club fitter, trainer, doctor, or physical therapist. Use it to come to a coach with better questions.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'By default your data is stored locally on your device, not in the cloud. Some optional features may require sending selected inputs for processing, and SwingIQ tells you when that is the case. You can export or delete your data at any time.',
  },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-gray-700">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'SwingIQ Methodology — What We Measure, Estimate, and Do Not',
      description:
        'How SwingIQ produces results: what it analyses, what it estimates, what it does not measure, how confidence is decided, and why a coach should validate.',
      path: '/methodology',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Methodology', path: '/methodology' },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Methodology', path: '/methodology' }]} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Methodology</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900 md:text-4xl">
            What SwingIQ measures, estimates, and does not measure
          </h1>
          <p className="mt-3 text-gray-600">
            SwingIQ is built to be useful and honest. Every result is labelled with what it is based on
            and how confident it is, so you always know whether you are looking at a measurement or an
            estimate. Here is exactly how that works.
          </p>
        </header>

        <Section id="analyzes" title="What SwingIQ analyses">
          <p>SwingIQ builds each result from the information you choose to provide:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Manual answers</strong> — quick questions about your sport, miss, and experience.</li>
            <li><strong>Imported data</strong> — launch-monitor or CSV data (e.g. FlightScope, TrackMan, Garmin) when you import it.</li>
            <li><strong>Uploaded video</strong> — used to organise your review and give the AI context.</li>
            <li><strong>Session history</strong> — patterns across the sessions you have logged.</li>
            <li><strong>Profile &amp; equipment</strong> — your level, goals, and gear when you add them.</li>
          </ul>
        </Section>

        <Section id="estimates" title="What SwingIQ estimates">
          <p>
            When you have not provided measured data, SwingIQ gives its best <strong>estimate</strong> from
            your answers and well-established coaching patterns. Estimates are genuinely useful for picking
            one thing to work on first — but they are starting points, not measurements, and SwingIQ marks
            them clearly.
          </p>
        </Section>

        <Section id="not-measured" title="What SwingIQ does not measure">
          <p>Unless a result is explicitly labelled as measured, SwingIQ does <strong>not</strong>:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Calculate exact joint angles or biomechanics from your video pixels.</li>
            <li>Produce certified club-fitting or medical conclusions.</li>
            <li>Diagnose injuries or replace a physical therapist or doctor.</li>
            <li>Guarantee a specific score, distance, or performance improvement.</li>
          </ul>
          <p>
            If a feature ever does measure your swing with validated video-processing or sensor logic, that
            result will say so plainly.
          </p>
        </Section>

        <Section id="confidence" title="How confidence works">
          <p>
            Every generated result carries a confidence level so you never see false precision:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Estimate / Low</strong> — based on self-reported answers, or very little data.</li>
            <li><strong>Medium</strong> — backed by some imported data or a few logged sessions.</li>
            <li><strong>High</strong> — backed by consistent measured data and repeat sessions.</li>
          </ul>
          <p>
            Confidence rises as you add measured data, log more sessions, improve your input quality, and
            complete a retest.
          </p>
        </Section>

        <Section id="input-quality" title="How input quality affects your result">
          <p>
            Better input means a more trustworthy result. A clear camera angle, complete profile, imported
            launch-monitor data, and a couple of logged sessions all raise both the usefulness and the
            confidence of what SwingIQ gives you. Thin or unclear input keeps a result at the estimate level.
          </p>
        </Section>

        <Section id="validate" title="Why a qualified coach should validate">
          <p>
            SwingIQ is an improvement assistant, not an authority. It is best used to prioritise practice and
            track change over time, then bring sharper questions to a qualified coach, club fitter, or trainer.
            For pain, injury, or safety-critical decisions, consult a licensed professional.
          </p>
        </Section>

        <Section id="local-first" title="How local-first data works">
          <p>
            By default, your profiles, sessions, and results are stored locally on your device — not in the
            cloud. Some optional features may need to send selected inputs for processing, and SwingIQ tells
            you when that happens. You own your data: you can export it, back it up, and delete it at any time
            from the <Link href="/data" className="text-green-700 hover:underline">Data Center</Link>.
          </p>
        </Section>

        <Section id="retesting" title="How retesting works">
          <p>
            Improvement is shown conservatively. After you set a baseline and practise, SwingIQ prompts a
            retest (typically after 7 days) and compares results honestly — improved, no clear change, or not
            enough data yet. It will not claim progress it cannot support.
          </p>
        </Section>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Ready to try it?</h2>
          <p className="mt-1 text-sm text-gray-700">
            Get your first honestly-labelled result in a few minutes — free, no account.
          </p>
          <Link
            href="/start"
            className="mt-4 inline-flex items-center rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            Start Here — Free
          </Link>
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((f) => (
              <div key={f.question} className="rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900">{f.question}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <NotCoachReplacementNotice className="mt-10" />

        <nav aria-label="Related" className="mt-8 border-t border-gray-200 pt-5 text-sm">
          <span className="font-semibold text-gray-900">Related: </span>
          <Link href="/trust" className="text-green-700 hover:underline">Trust &amp; Safety</Link>
          <span className="text-gray-300"> · </span>
          <Link href="/privacy" className="text-green-700 hover:underline">Privacy</Link>
          <span className="text-gray-300"> · </span>
          <Link href="/how-it-works" className="text-green-700 hover:underline">How It Works</Link>
        </nav>
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
