import type { ReactNode } from 'react';

/**
 * The "Dark Performance" (B) hero for the non-sport content marketing pages
 * (features / pricing / about / parents / trust / glossary / resources / blog).
 * The sibling `SportAnalysisHero` covers the per-sport landing pages; this is
 * its general-purpose twin — no sport accent token, plus a `children` slot for
 * page-specific extras (chip rows, a CTA, a search box) that render under the
 * subtitle.
 *
 * Same B language as the homepage hero: near-black `bg-theme-hero` wash, an
 * optional eyebrow pill, a big uppercase Space-Grotesk headline with an
 * optional green `text-link` accent phrase, a muted subtitle. Replaces the old
 * flat full-green `bg-primary` header that read as a wall of bright green under
 * B's palette.
 */
export function MarketingHero({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Trailing phrase rendered in the green accent color. */
  titleAccent?: string;
  subtitle?: ReactNode;
  /** Rendered under the subtitle — chips, a CTA, a search box, etc. */
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden bg-theme-hero">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        {eyebrow && (
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {eyebrow}
          </span>
        )}

        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {title}
          {titleAccent && (
            <>
              {' '}
              <span className="text-link">{titleAccent}</span>
            </>
          )}
        </h1>

        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        )}

        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}
