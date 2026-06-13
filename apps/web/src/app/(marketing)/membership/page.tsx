import Link from 'next/link';
import { Fragment } from 'react';
import { Check, Minus } from 'lucide-react';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { BILLING_TIERS, getTier } from '@/lib/billing/tiers';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';

export const metadata = buildMetadata({
  title: 'Membership Tiers — Free, Pro & Team Compared',
  description:
    'How SwingVantage membership tiers differ: what each unlocks, the intelligence difference between Free, Pro and Team, the benefits, and honest reasons to upgrade. Free stays free forever.',
  path: '/membership',
  keywords: [
    'SwingVantage membership tiers',
    'SwingVantage Pro vs Free',
    'SwingVantage Team plan',
    'swing analysis plans compared',
    'why upgrade SwingVantage',
    'AI coaching intelligence tiers',
  ],
});

const free = getTier('free')!;
const pro = getTier('pro')!;
const team = getTier('team')!;

// What each tier UNLOCKS at the intelligence layer — grounded in the real
// feature set (lib/billing/tiers.ts). Honest: the labelling + measurement
// methodology is identical across tiers; tiers add DEPTH, MEMORY and REACH.
const INTELLIGENCE = [
  {
    tier: free,
    badge: 'Tier 1 · Free forever',
    headline: 'Full coaching intelligence on every swing',
    points: [
      'AI swing analysis with a single, prioritised fix — the "one fix, one plan, one retest" loop.',
      'Athlete General Intelligence: your cross-sport priority and a coach-shareable report.',
      'Drill recommendations and practice plans tailored to your diagnosis.',
      'Every result honestly labelled — measured vs estimated, with a confidence level.',
    ],
  },
  {
    tier: pro,
    badge: 'Tier 2 · Pro',
    headline: 'Intelligence that compounds and goes deeper',
    points: [
      'Unlimited AI narrative coaching — ask follow-ups and go as deep as you want.',
      'Cloud memory across devices, so your intelligence builds session over session.',
      'OCR / image data extraction turns launch-monitor screenshots into measured inputs (higher confidence).',
      'Verified professional swing library to compare your motion against.',
      'PDF reports and coach sharing to bring sharper questions to a lesson.',
    ],
  },
  {
    tier: team,
    badge: 'Tier 3 · Team',
    headline: 'Squad-level intelligence for coaches & facilities',
    points: [
      'Everything in Pro, for up to 20 athletes.',
      'Coach dashboard and athlete invites — one view across your roster.',
      'Aggregate team analytics to spot squad-wide patterns and priorities.',
      'White-label option for academies and facilities.',
    ],
  },
];

// Feature comparison matrix. `true` = included, `false` = not in this tier,
// or a short string for a tier-specific detail.
type Cell = boolean | string;
const COMPARISON: { group: string; rows: { label: string; free: Cell; pro: Cell; team: Cell }[] }[] = [
  {
    group: 'Coaching intelligence',
    rows: [
      { label: 'AI swing analysis & priority-issue diagnosis', free: true, pro: true, team: true },
      { label: 'Athlete General Intelligence (cross-sport priority + report)', free: true, pro: true, team: true },
      { label: 'Drill recommendations & practice plans', free: true, pro: true, team: true },
      { label: 'Honest confidence labels (measured vs estimated)', free: true, pro: true, team: true },
      { label: 'AI narrative coaching', free: 'Included', pro: 'Unlimited', team: 'Unlimited' },
      { label: 'Verified professional swing library', free: false, pro: true, team: true },
      { label: 'OCR / image data extraction', free: false, pro: true, team: true },
    ],
  },
  {
    group: 'Your data & memory',
    rows: [
      { label: 'Local data storage (no account needed)', free: true, pro: true, team: true },
      { label: 'Session history & progress tracking', free: true, pro: true, team: true },
      { label: 'Data backup & restore', free: true, pro: true, team: true },
      { label: 'Cloud sync across devices', free: false, pro: true, team: true },
      { label: 'Video storage & history', free: false, pro: true, team: true },
      { label: 'PDF reports & coach sharing', free: false, pro: true, team: true },
    ],
  },
  {
    group: 'Teams & coaching',
    rows: [
      { label: 'Side-by-side swing comparison', free: true, pro: true, team: true },
      { label: 'Priority support', free: false, pro: true, team: true },
      { label: 'Coach dashboard & athlete invites', free: false, pro: false, team: 'Up to 20' },
      { label: 'Aggregate team analytics', free: false, pro: false, team: true },
      { label: 'White-label option', free: false, pro: false, team: true },
    ],
  },
];

const REASONS = [
  {
    from: 'Free → Pro',
    why: 'You practise often and want the intelligence to remember everything, go deeper on demand, and follow you across devices.',
    bullets: [
      'Unlimited narrative coaching for the harder questions.',
      'Cloud memory so every session sharpens the next one.',
      'Turn launch-monitor screenshots into measured, higher-confidence data.',
      'Share clean PDF reports with your coach.',
    ],
  },
  {
    from: 'Pro → Team',
    why: 'You coach or run a facility and need one intelligent view across many athletes.',
    bullets: [
      'Up to 20 athletes under one coach dashboard.',
      'Aggregate analytics to find squad-wide priorities.',
      'Invite athletes and track their progress together.',
      'White-label it for your academy.',
    ],
  },
];

const FAQS = [
  {
    question: 'Is SwingVantage really free?',
    answer:
      'Yes. The Free tier is full coaching intelligence on every swing — AI analysis, your prioritised fix, Athlete General Intelligence, drills and practice plans — and it stays free forever. Pro and Team add depth, memory and reach; they never take features away from Free.',
  },
  {
    question: 'What is the "intelligence difference" between tiers?',
    answer:
      'Every tier runs the same honest analysis and confidence labelling. Free gives you the full one-fix coaching loop. Pro adds unlimited narrative coaching, cross-device cloud memory so your intelligence compounds, and measured-data extraction that raises confidence. Team adds squad-level intelligence — one coach view and aggregate analytics across up to 20 athletes.',
  },
  {
    question: 'Do paid tiers change how accurate or honest my results are?',
    answer:
      'No. The methodology is identical across tiers: results are labelled measured or estimated with a confidence level, and SwingVantage never shows false precision. Paid tiers add more ways to feed it measured data (which raises confidence) and more depth — not a different version of the truth.',
  },
  {
    question: 'Can I try Pro before paying?',
    answer:
      'Pro and Team are rolling out gradually. While they are gated, you can sign in and join the waitlist for the tier you want from the pricing page — we roll out to the athletes who ask first. No one is ever charged before checkout is connected.',
  },
  {
    question: 'How do I keep my free account for life?',
    answer:
      'The first 100 Founding Members lock in a free account for life — even after paid tiers launch. Complete your sport’s founding journey to claim your member number on the Founding Members page.',
  },
];

function Cell({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="h-4 w-4 text-primary" aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
      </span>
    );
  }
  return <span className="text-xs font-semibold text-foreground">{value}</span>;
}

function priceLabel(price: number | null): string {
  if (price == null || price === 0) return '$0';
  return `$${price}/mo`;
}

export default function MembershipPage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'SwingVantage Membership Tiers — Free, Pro & Team Compared',
      description:
        'How SwingVantage membership tiers differ: what each unlocks, the intelligence difference, benefits, and honest reasons to upgrade.',
      path: '/membership',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Membership', path: '/membership' },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Membership', path: '/membership' }]} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Membership</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            Free, Pro &amp; Team — what each tier unlocks
          </h1>
          <p className="mt-3 text-muted-foreground">
            SwingVantage is fully usable on the Free tier, forever. Pro and Team don&apos;t change the
            honest methodology behind your results — they add <strong>depth</strong>, <strong>memory</strong>{' '}
            and <strong>reach</strong>. Here is exactly how the tiers differ, the intelligence difference, and
            honest reasons to upgrade.
          </p>
        </header>

        {/* The constant promise */}
        <section aria-labelledby="constant" className="mt-8 rounded-2xl border border-primary/30 bg-primary/10 p-6">
          <h2 id="constant" className="text-lg font-bold text-foreground">The promise that never changes</h2>
          <p className="mt-2 text-sm text-foreground">
            Every tier gets the same honest analysis: each result is labelled <strong>measured</strong> or{' '}
            <strong>estimated</strong> with a confidence level, and we never show false precision. Upgrading
            buys you more depth and more ways to feed in measured data — not a different version of the truth.
            See exactly how that works in our{' '}
            <Link href="/methodology" className="text-primary hover:underline">methodology</Link>.
          </p>
        </section>

        {/* Tier summary cards */}
        <section aria-labelledby="tiers" className="mt-10">
          <h2 id="tiers" className="text-xl font-bold text-foreground">The three tiers</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {BILLING_TIERS.map((t) => (
              <div
                key={t.id}
                className={`rounded-2xl border p-5 ${t.popular ? 'border-primary shadow-sm' : 'border-border'}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">{t.name}</div>
                <div className="mt-1 text-2xl font-bold text-foreground">{priceLabel(t.priceMonthly)}</div>
                <p className="mt-2 text-sm text-muted-foreground">{t.tagline}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Intelligence difference */}
        <section aria-labelledby="intelligence" className="mt-10">
          <h2 id="intelligence" className="text-xl font-bold text-foreground">The intelligence difference</h2>
          <p className="mt-2 text-muted-foreground">
            Same honest engine, increasing depth and reach as you move up.
          </p>
          <div className="mt-4 space-y-4">
            {INTELLIGENCE.map((block) => (
              <div key={block.tier.id} className="rounded-2xl border border-border p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-foreground">{block.headline}</h3>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {block.badge}
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {block.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison matrix */}
        <section aria-labelledby="compare" className="mt-10">
          <h2 id="compare" className="text-xl font-bold text-foreground">Full comparison</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Feature</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{free.name}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{pro.name}</th>
                  <th scope="col" className="px-3 py-3 text-center font-semibold">{team.name}</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((section) => (
                  <Fragment key={section.group}>
                    <tr className="border-t border-border bg-card/50">
                      <th
                        scope="colgroup"
                        colSpan={4}
                        className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-primary"
                      >
                        {section.group}
                      </th>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-t border-border">
                        <td className="px-4 py-2.5 text-foreground">{row.label}</td>
                        <td className="px-3 py-2.5 text-center"><Cell value={row.free} /></td>
                        <td className="px-3 py-2.5 text-center"><Cell value={row.pro} /></td>
                        <td className="px-3 py-2.5 text-center"><Cell value={row.team} /></td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reasons to upgrade */}
        <section aria-labelledby="reasons" className="mt-10">
          <h2 id="reasons" className="text-xl font-bold text-foreground">Honest reasons to upgrade</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.from} className="rounded-2xl border border-border p-5">
                <div className="text-sm font-bold text-primary">{r.from}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.why}</p>
                <ul className="mt-3 space-y-1.5">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Rollout honesty */}
        <section aria-labelledby="rollout" className="mt-10 rounded-2xl border border-border bg-muted p-6">
          <h2 id="rollout" className="text-lg font-bold text-foreground">Pro &amp; Team are rolling out gradually</h2>
          <p className="mt-2 text-sm text-foreground">
            We&apos;re launching the paid tiers a step at a time. While they&apos;re gated, you can sign in and
            join the waitlist for the tier you want — we roll out to the athletes who ask first, and no one is
            ever charged before checkout is connected.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            See pricing &amp; join a waitlist
          </Link>
        </section>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/10 p-6">
          <h2 className="text-lg font-bold text-foreground">Start free — no account, no card</h2>
          <p className="mt-1 text-sm text-foreground">
            Get your first honestly-labelled result in a few minutes. Upgrade only if and when the depth is
            worth it to you.
          </p>
          <Link
            href="/start"
            className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Here — Free
          </Link>
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq" className="mt-12">
          <h2 id="faq" className="text-2xl font-bold text-foreground">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((fq) => (
              <div key={fq.question} className="rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground">{fq.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{fq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <NotCoachReplacementNotice className="mt-10" />

        <nav aria-label="Related" className="mt-8 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/methodology" className="text-primary hover:underline">Methodology</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/athlete-general-intelligence" className="text-primary hover:underline">Athlete General Intelligence</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/founding" className="text-primary hover:underline">Founding Members</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/features" className="text-primary hover:underline">Features</Link>
        </nav>
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
