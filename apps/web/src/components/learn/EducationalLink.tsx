import Link from 'next/link';
import { getEducationalTopic, type EducationalTerm } from '@/lib/learn/educational-links';

/**
 * EducationalLink — an accessible inline link to a SwingVantage explainer page.
 *
 *   <EducationalLink term="heuristic-data" />          → "heuristic data"
 *   <EducationalLink term="ai-sports">AI coach</EducationalLink>
 *
 * Design goals (from the education-linking brief):
 *   • Accessible: real <Link>, descriptive aria-label, native title tooltip
 *     (no JS/portal dependency, works on content-driven + product pages).
 *   • Consistent: pulls href + tooltip from the central registry so every
 *     instance of a topic agrees.
 *   • Quiet: inherits surrounding type; a subtle dotted underline signals
 *     "learn more" without the heavy styling of a primary link.
 *   • Safe: an unknown term degrades to plain text (never a broken link).
 *
 * UX RULE (enforced by authors, not the component): link only the FIRST
 * meaningful instance of a term in a paragraph, card, or section. Do not
 * wrap every occurrence — that creates spammy link density.
 */
export interface EducationalLinkProps {
  /** Which explainer topic to link to. */
  term: EducationalTerm;
  /** Visible text. Defaults to the topic's canonical label. */
  children?: React.ReactNode;
  /** Extra classes merged onto the link. */
  className?: string;
  /**
   * Suppress the tooltip (`title`). Default shows it. The aria-label is always
   * present for screen readers regardless.
   */
  noTooltip?: boolean;
  /** Override the accessible label (rare; defaults to "<label> — <tooltip>"). */
  ariaLabel?: string;
}

export function EducationalLink({
  term,
  children,
  className = '',
  noTooltip = false,
  ariaLabel,
}: EducationalLinkProps) {
  const topic = getEducationalTopic(term);

  // Unknown term → render plain text so prose never ships a broken link.
  if (!topic) return <>{children}</>;

  const label = children ?? topic.defaultLabel;
  const computedAria =
    ariaLabel ?? (typeof label === 'string' ? `${label} — ${topic.tooltip}` : topic.tooltip);

  return (
    <Link
      href={topic.href}
      aria-label={computedAria}
      title={noTooltip ? undefined : topic.tooltip}
      data-educational-term={term}
      className={`font-medium text-primary underline decoration-dotted decoration-from-font underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-solid ${className}`}
    >
      {label}
    </Link>
  );
}

export default EducationalLink;
