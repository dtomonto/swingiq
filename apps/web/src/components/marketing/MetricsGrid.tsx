import { Section, SectionHeading } from './Section';

export type MetricItem = { label: string; detail: string };

/**
 * The 2-up "metrics we analyze" card grid inlined on the sport landing pages
 * (golf/baseball metrics, tennis strokes). One component owns the card markup +
 * tokens so the grid is consistent and maps to a single Figma "Metrics Grid"
 * component. Pass any `{ label, detail }[]` (e.g. map tennis strokes to it).
 */
export function MetricsGrid({
  heading,
  intro,
  items,
  bg = 'muted',
  className,
}: {
  heading: string;
  intro?: string;
  items: MetricItem[];
  /** @default 'muted' */
  bg?: 'card' | 'muted';
  className?: string;
}) {
  return (
    <Section bg={bg} width="4xl" className={className}>
      <SectionHeading className="mb-3">{heading}</SectionHeading>
      {intro && <p className="text-muted-foreground mb-8 text-sm">{intro}</p>}
      <ul className="grid sm:grid-cols-2 gap-4">
        {items.map(({ label, detail }) => (
          <li key={label} className="bg-card rounded-xl border border-border px-4 py-4">
            <h3 className="font-semibold text-foreground text-sm mb-1">{label}</h3>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
