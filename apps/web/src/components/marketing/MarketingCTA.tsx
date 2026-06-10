import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The "Dark Performance" (B) call-to-action block — a contained, rounded,
 * glowing green panel, identical to the homepage's final CTA (`LocalizedHome`).
 * Replaces the old flat full-width `bg-primary` CTA bands that, under B's
 * palette, stretched edge-to-edge as another wall of bright green.
 *
 * The button sits on the green panel as a dark `bg-background` chip (matching
 * the homepage), so it reads as the primary action without a second green.
 */
export function MarketingCTA({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: { label: string; href: string };
}) {
  return (
    <section className="px-4 py-16">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-theme-lg">
        <h2 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">{heading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">{body}</p>
        <Link
          href={cta.href}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-background px-10 py-4 text-base font-bold text-foreground transition-opacity hover:opacity-90"
        >
          {cta.label}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
