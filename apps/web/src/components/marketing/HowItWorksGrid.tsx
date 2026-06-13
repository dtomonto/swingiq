import { Section, SectionHeading } from './Section';

export type HowStep = { name: string; text: string };

/**
 * The numbered "How it works" 3-up step grid inlined on every sport landing
 * page. Steps render in document order with an auto-incrementing badge, so the
 * page and its HowTo JSON-LD can share one `steps` array. Maps to a single Figma
 * "How It Works" component.
 */
export function HowItWorksGrid({
  heading,
  steps,
  bg = 'card',
  className,
}: {
  heading: string;
  steps: HowStep[];
  /** Section background — sport pages alternate card/muted. @default 'card' */
  bg?: 'card' | 'muted';
  className?: string;
}) {
  return (
    <Section bg={bg} width="4xl" className={className}>
      <SectionHeading align="center" className="mb-10">
        {heading}
      </SectionHeading>
      <ol className="grid sm:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <li key={s.name} className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-black text-lg flex items-center justify-center mb-4">
              {i + 1}
            </div>
            <h3 className="font-bold text-foreground mb-2">{s.name}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
