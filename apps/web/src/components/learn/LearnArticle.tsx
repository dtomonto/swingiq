// ============================================================
// SwingVantage — LearnArticle: one renderer for every learning page
// (flagship concepts + data points). Server component; uses native
// <details> for progressive disclosure so all content is crawlable
// and there is zero client JS. Never renders admin-only sourceNotes.
// ============================================================

import Link from 'next/link';
import {
  BookOpen,
  Target,
  Search,
  Dumbbell,
  CalendarCheck,
  Wrench,
  HelpCircle,
  Link2,
  CheckCircle2,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { getSportTaxonomy } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { designV2EnabledFromEnv } from '@/lib/design-v2';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { ConfidenceNote } from './ConfidenceNote';
import {
  resolveRelatedPages,
  resolveRelatedFaults,
  resolveRelatedCoachStyles,
  buildLearnGraph,
  type LearnEntry,
} from '@/lib/learn';

const EVIDENCE_LABEL: Record<LearnEntry['evidenceBasis'], string> = {
  measured: 'Measured',
  estimated: 'Estimated',
  ai_inferred: 'AI-inferred',
  user_entered: 'Self-reported',
};

function sportLabel(id: LearnEntry['sports'][number]): string {
  return getSportTaxonomy(id)?.name ?? id;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-foreground">
        <Icon size={20} className="text-primary" aria-hidden={true} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-0.5 text-primary" aria-hidden="true">•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function LearnArticle({ entry }: { entry: LearnEntry }) {
  const related = resolveRelatedPages(entry);
  const faults = resolveRelatedFaults(entry);
  const coachStyles = resolveRelatedCoachStyles(entry);
  const isConcept = entry.kind === 'concept';
  // Design V2: open the article on the light "document" surface (premium-paper
  // masthead). Env-gated so this stays a server component. Scoped to the hero —
  // the dense body keeps its shipped theme styling (its Section/Bullets are
  // shared with in-card contexts, so a full re-ink belongs in its own pass).
  const v2 = designV2EnabledFromEnv();
  const hubCrumb = isConcept
    ? { name: 'Learn', path: '/learn' }
    : { name: 'Data points', path: '/learn/data-points' };

  // Masthead content (eyebrow chips + title + description + sport chips). Ink is
  // flag-aware: document tokens on the V2 paper sheet, theme tokens otherwise.
  const masthead = (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
            v2 ? 'bg-document-accent/10 text-document-accent' : 'bg-primary/10 text-primary',
          )}
        >
          {isConcept ? 'Core concept' : 'Data point'}
        </span>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium',
            v2 ? 'border-document-fg/20 text-document-fg/70' : 'border-border text-muted-foreground',
          )}
        >
          {EVIDENCE_LABEL[entry.evidenceBasis]}
        </span>
      </div>
      <h1 className={cn('text-3xl font-bold sm:text-4xl', v2 ? 'text-document-fg' : 'text-foreground')}>
        {entry.title}
      </h1>
      <p className={cn('mt-3 text-lg', v2 ? 'text-document-fg/70' : 'text-muted-foreground')}>
        {entry.descriptionShort}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {entry.sports.map((s) => (
          <span
            key={s}
            className={cn(
              'rounded-md px-2 py-0.5 text-xs ring-1',
              v2 ? 'bg-document-fg/5 text-document-fg/70 ring-document-fg/15' : 'bg-card text-muted-foreground ring-border',
            )}
          >
            {sportLabel(s)}
          </span>
        ))}
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Breadcrumbs
            className="mb-4"
            items={[
              { name: 'Home', path: '/' },
              hubCrumb,
              { name: entry.title, path: '' },
            ]}
          />
          {v2 ? (
            <div className="rounded-2xl bg-document p-6 shadow-theme-lg sm:p-8">{masthead}</div>
          ) : (
            masthead
          )}
        </div>
      </div>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {/* Overview — beginner first, advanced behind disclosure */}
        <Section icon={BookOpen} title="Overview">
          <p className="text-foreground">{entry.explanationBeginner}</p>
          <details className="group mt-3 rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer list-none font-semibold text-primary">
              <span className="inline-flex items-center gap-1">
                <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
                Go deeper — the advanced explanation
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{entry.explanationAdvanced}</p>
          </details>
        </Section>

        {/* Why it matters */}
        <Section icon={Target} title="Why it matters">
          <p className="text-muted-foreground">{entry.whyItMatters}</p>
        </Section>

        {/* How SwingVantage detects it + confidence */}
        <Section icon={Search} title="How SwingVantage detects this">
          <p className="text-muted-foreground">{entry.detectionLogic}</p>
          <ConfidenceNote basis={entry.evidenceBasis} explanation={entry.confidenceExplanation} />
        </Section>

        {/* Good vs poor */}
        <Section icon={CheckCircle2} title="What good looks like — and what doesn't">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm font-semibold text-foreground">Good pattern</p>
            <p className="mt-1 text-sm text-muted-foreground">{entry.goodPattern}</p>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-sm font-semibold text-foreground">Common poor patterns</p>
            <Bullets items={entry.poorPatterns} />
          </div>
        </Section>

        {/* Causes + symptoms + result */}
        <Section icon={Activity} title="Causes, what you feel, and the result">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Common causes</p>
              <Bullets items={entry.commonCauses} />
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">What you may feel</p>
              <Bullets items={entry.symptoms} />
            </div>
          </div>
          {entry.ballFlightOrResult && entry.ballFlightOrResult.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">What the result may look like</p>
              <Bullets items={entry.ballFlightOrResult} />
            </div>
          )}
        </Section>

        {/* Sport variations */}
        {entry.sportVariations && entry.sportVariations.length > 0 && (
          <Section icon={BookOpen} title="By sport">
            <dl className="space-y-3">
              {entry.sportVariations.map((v) => (
                <div key={v.sport} className="rounded-xl border border-border bg-card p-4">
                  <dt className="text-sm font-semibold text-foreground">{sportLabel(v.sport)}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{v.note}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* Self-checks + upload tips */}
        {((entry.selfChecks && entry.selfChecks.length > 0) ||
          (entry.videoUploadTips && entry.videoUploadTips.length > 0)) && (
          <Section icon={Search} title="Check it yourself">
            {entry.selfChecks && entry.selfChecks.length > 0 && (
              <ul className="space-y-2">
                {entry.selfChecks.map((c) => (
                  <li key={c.label} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm font-semibold text-foreground">{c.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
                  </li>
                ))}
              </ul>
            )}
            {entry.videoUploadTips && entry.videoUploadTips.length > 0 && (
              <details className="group mt-3 rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer list-none font-semibold text-primary">
                  <span className="inline-flex items-center gap-1">
                    <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
                    Video upload tips for an accurate read
                  </span>
                </summary>
                <div className="mt-3">
                  <Bullets items={entry.videoUploadTips} />
                </div>
              </details>
            )}
          </Section>
        )}

        {/* Drills */}
        <Section icon={Dumbbell} title="Drills">
          <div className="space-y-3">
            {entry.drills.map((d) => (
              <div key={d.name} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{d.name}</p>
                  {d.level && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                      {d.level}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Goal:</span> {d.goal}</p>
                <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">How:</span> {d.how}</p>
                {d.feel && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Feel:</span> {d.feel}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {d.reps && <span>🔁 {d.reps}</span>}
                  {d.equipment && <span>🧰 {d.equipment}</span>}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Practice plan + progression */}
        <Section icon={CalendarCheck} title="Your practice plan">
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            {entry.practicePlan.map((p, i) => (
              <li key={p} className="flex gap-2">
                <span className="font-semibold text-primary">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
          {entry.progressionLadder && entry.progressionLadder.length > 0 && (
            <details className="group mt-3 rounded-xl border border-border bg-card p-4">
              <summary className="cursor-pointer list-none font-semibold text-primary">
                <span className="inline-flex items-center gap-1">
                  <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
                  Progression ladder (beginner → advanced)
                </span>
              </summary>
              <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {entry.progressionLadder.map((p, i) => (
                  <li key={p} className="flex gap-2">
                    <span className="font-semibold text-primary">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </Section>

        {/* Troubleshooting + extra sections */}
        {((entry.troubleshooting && entry.troubleshooting.length > 0) ||
          (entry.extraSections && entry.extraSections.length > 0)) && (
          <Section icon={Wrench} title="Troubleshooting & deeper reading">
            <div className="space-y-2">
              {[...(entry.extraSections ?? []), ...(entry.troubleshooting ?? [])].map((s) => (
                <details key={s.heading} className="group rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer list-none font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ChevronRight size={16} className="text-primary transition-transform group-open:rotate-90" aria-hidden="true" />
                      {s.heading}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* FAQs */}
        {entry.faqs.length > 0 && (
          <Section icon={HelpCircle} title="FAQs">
            <div className="space-y-2">
              {entry.faqs.map((f) => (
                <details key={f.question} className="group rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer list-none font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ChevronRight size={16} className="text-primary transition-transform group-open:rotate-90" aria-hidden="true" />
                      {f.question}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </Section>
        )}

        {/* Related + internal links */}
        <Section icon={Link2} title="Keep going">
          {(related.concepts.length > 0 || related.dataPoints.length > 0 || faults.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {related.concepts.length > 0 && (
                <RelatedList title="Related concepts" links={related.concepts} />
              )}
              {related.dataPoints.length > 0 && (
                <RelatedList title="Related data points" links={related.dataPoints} />
              )}
              {faults.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Related swing faults</p>
                  <ul className="space-y-1.5 text-sm">
                    {faults.map((f) => (
                      <li key={f.name}>
                        {f.href ? (
                          <Link href={f.href} className="text-primary hover:underline">{f.name}</Link>
                        ) : (
                          <span className="text-muted-foreground">{f.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {coachStyles.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Explained for these coaching styles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {coachStyles.map((c) => (
                      <span key={c.id} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {c.label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Pick your coaching style in{' '}
                    <Link href="/settings" className="text-primary hover:underline">Settings</Link> to tailor your reports and drills.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Conversion: into the product loop */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/start" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Analyze my swing free
            </Link>
            <Link href="/sample-report/golf" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50">
              See a sample report
            </Link>
            <Link href="/dashboard" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50">
              My dashboard
            </Link>
          </div>
        </Section>

        {/* Honest, non-medical disclaimer */}
        <p className="border-t border-border pt-6 text-xs text-muted-foreground">
          SwingVantage explanations are educational, not medical advice. Video-based reads are
          labeled by confidence; treat estimated and inferred findings as starting points, not
          measurements. Last reviewed {entry.lastReviewedAt}.
        </p>
      </article>

      <JsonLd data={buildLearnGraph(entry)} />
    </main>
  );
}

function RelatedList({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      <ul className="space-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex items-center gap-1 text-primary hover:underline">
              {l.label}
              <ChevronRight size={13} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
