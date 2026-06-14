import { Section, SectionHeading } from './Section';

export type FaqItem = { question: string; answer: string };

/**
 * The FAQ `<dl>` block that was inlined verbatim on every sport landing page
 * (golf / baseball / tennis / softball …). One component now owns the markup +
 * semantics (definition list, AA-safe tokens) so the FAQ reads identically
 * everywhere and maps to a single Figma "FAQ Section" component. Pair the same
 * `items` with `faqPageSchema()` for the JSON-LD so copy and structured data
 * can't drift.
 */
export function FAQSection({
  items,
  heading = 'Frequently Asked Questions',
  className,
}: {
  items: FaqItem[];
  /** @default 'Frequently Asked Questions' */
  heading?: string;
  className?: string;
}) {
  return (
    <Section bg="card" width="3xl" className={className}>
      <SectionHeading className="mb-8">{heading}</SectionHeading>
      <dl className="space-y-6">
        {items.map(({ question, answer }) => (
          <div key={question}>
            <dt className="font-semibold text-foreground mb-1">{question}</dt>
            <dd className="text-sm text-muted-foreground leading-relaxed">{answer}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
