import type { ReactNode } from 'react';

/**
 * AEO/GEO answer-first block. Renders a single-sentence direct answer (the
 * snippet AI search engines and featured snippets extract) followed by an
 * optional expanded answer. Place it directly under the H1 on every authority
 * page so the most-quotable sentence is the first content a crawler reads.
 */
export function AnswerBlock({
  label = 'Quick answer',
  answer,
  children,
}: {
  /** Small eyebrow above the answer. */
  label?: string;
  /** The one-sentence, self-contained answer. */
  answer: ReactNode;
  /** Optional expanded answer (1–3 short paragraphs). */
  children?: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</p>
      <p className="mt-2 text-lg font-semibold leading-snug text-foreground">{answer}</p>
      {children && <div className="mt-3 space-y-3 text-sm text-foreground/90">{children}</div>}
    </div>
  );
}
