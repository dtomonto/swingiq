import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TechEducationFaq } from '@/lib/learn/tech-education';

// ============================================================
// Shared presentational building blocks for the /learn technology
// education pages (heuristic data, AI in sports). Plain semantic
// markup on theme tokens — premium, mobile-first, and consistent
// with the rest of the marketing surface (cf. athlete-general-
// intelligence). No new dependencies, no one-off colors.
// ============================================================

/**
 * The AEO/GEO answer lead: the direct, self-contained answer rendered
 * immediately under the H1. Marked `data-aeo-summary` so the page's Speakable
 * schema can point at it — this is the block answer engines quote.
 */
export function AnswerLead({ children }: { children: React.ReactNode }) {
  return (
    <p data-aeo-summary className="mt-3 text-lg leading-relaxed text-foreground">
      {children}
    </p>
  );
}

/**
 * Visible FAQ section whose questions/answers exactly match the page's FAQPage
 * JSON-LD (Google requires structured data to mirror visible content). Renders
 * semantic <dl> for accessibility.
 */
export function FaqSection({ faqs }: { faqs: TechEducationFaq[] }) {
  return (
    <section aria-labelledby="faq" className="mt-12">
      <h2 id="faq" className="text-2xl font-bold text-foreground">
        Frequently asked questions
      </h2>
      <dl className="mt-4 space-y-4">
        {faqs.map((f) => (
          <div key={f.question} className="rounded-xl border border-border p-5">
            <dt className="font-semibold text-foreground">{f.question}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{f.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** A titled content section with an accessible heading association. */
export function EduSection({
  id,
  eyebrow,
  title,
  children,
  className = '',
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`mt-12 ${className}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
      )}
      <h2 id={id} className="mt-1 text-2xl font-bold text-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-foreground">{children}</div>
    </section>
  );
}

/** A simple value card used in "why it matters" / "how we use it" grids. */
export function EduCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

/** Responsive grid wrapper for EduCard sets. */
export function EduCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export interface ComparisonRow {
  dimension: string;
  heuristic: string;
  ai: string;
}

/**
 * A two-approach comparison table that stays readable on mobile: a real
 * <table> on sm+; stacked, labeled cards on the smallest screens.
 */
export function ComparisonTable({
  caption,
  rows,
  leftLabel = 'Heuristic Intelligence',
  rightLabel = 'AI Analysis',
}: {
  caption: string;
  rows: ComparisonRow[];
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="px-4 py-3 font-bold text-foreground">
              Dimension
            </th>
            <th scope="col" className="px-4 py-3 font-bold text-foreground">
              {leftLabel}
            </th>
            <th scope="col" className="px-4 py-3 font-bold text-foreground">
              {rightLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.dimension} className={i % 2 === 1 ? 'bg-muted/40' : 'bg-card'}>
              <th scope="row" className="px-4 py-3 align-top font-semibold text-foreground">
                {r.dimension}
              </th>
              <td className="px-4 py-3 align-top text-muted-foreground">{r.heuristic}</td>
              <td className="px-4 py-3 align-top text-muted-foreground">{r.ai}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A trust / honesty callout, visually distinct but on-brand. */
export function TrustCallout({
  title = 'How to trust this',
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      role="note"
      className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6"
      aria-label={title}
    >
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{children}</p>
    </aside>
  );
}

export interface CtaItem {
  href: string;
  label: string;
  /** Primary gets the solid brand button; others are quiet outline links. */
  primary?: boolean;
}

/** A row of CTAs — one primary, the rest quiet — used at the foot of a page. */
export function CtaRow({ items }: { items: CtaItem[] }) {
  return (
    <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
      {items.map((c) =>
        c.primary ? (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <Link
            key={c.href + c.label}
            href={c.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {c.label}
          </Link>
        ),
      )}
    </div>
  );
}
