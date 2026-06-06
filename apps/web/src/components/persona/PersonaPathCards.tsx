'use client';

// ============================================================
// SwingVantage — Persona Path Cards (homepage intent router)
//
// Intent-first entry point: "What are you trying to fix?" → a card
// per primary sport (from sportStrategy.ts), plus a small
// "Also analyze:" row for secondary sports. Replaces the old
// feature-described sport grid (which sent both softball cards to
// the same URL). See docs/FIVE_PERSONA_MASTER_PLAN.md §5.
// ============================================================

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { PERSONA_PATHS } from '@/content/personas';
import {
  primaryPersonaIds,
  secondaryPersonaIds,
  type PersonaId,
} from '@/content/sportStrategy';

function trackClick(id: PersonaId, sport: string) {
  // Phase 1 reuses the existing CTA event with persona props; a
  // dedicated `persona_card_clicked` event lands in Phase 6.
  track(ANALYTICS_EVENTS.CTA_CLICKED, {
    persona: id,
    sport,
    surface: 'homepage_persona',
  });
}

export function PersonaPathCards() {
  const primary = primaryPersonaIds();
  const secondary = secondaryPersonaIds();

  if (primary.length === 0) return null;

  return (
    <section id="find-your-fix" className="scroll-mt-16 py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-3">
          What are you trying to fix?
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
          Pick your game. Each path is built for your sport and the exact thing
          you want to improve — one fix, the drills to groove it, and a plan.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {primary.map((id) => {
            const p = PERSONA_PATHS[id];
            return (
              <Link
                key={id}
                href={p.href}
                onClick={() => trackClick(id, p.sport)}
                className="group flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-primary hover:bg-primary/5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="text-2xl mb-2" aria-hidden="true">
                  {p.emoji}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground grow">{p.painLine}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {p.ctaLabel}
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>

        {secondary.length > 0 && (
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Also analyze:{' '}
            {secondary.map((id, i) => {
              const p = PERSONA_PATHS[id];
              return (
                <span key={id}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <Link
                    href={p.href}
                    onClick={() => trackClick(id, p.sport)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {p.title} {p.emoji}
                  </Link>
                </span>
              );
            })}
          </p>
        )}
      </div>
    </section>
  );
}
