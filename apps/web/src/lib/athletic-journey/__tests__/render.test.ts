/**
 * SSR smoke test — proves the whole Athletic Journey React tree composes and
 * renders without throwing (catches bad imports, hook misuse, undefined
 * components) even though the live page sits behind auth. Uses
 * renderToStaticMarkup in the node test env; effects (analytics, snapshot
 * persistence) don't run, and the SSR-safe stores return empty snapshots.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// next/link needs no Next runtime here — render it as a plain anchor.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    require('react').createElement('a', { href }, children),
}));

import { AthleticJourneyDashboard } from '@/components/athletic-journey/AthleticJourneyDashboard';
import { InDevelopmentCard } from '@/components/athletic-journey/InDevelopmentCard';
import { getSportAvailability } from '@/lib/athletic-journey';

describe('Athletic Journey UI — SSR smoke', () => {
  it('renders the dashboard shell + a live (golf) journey without throwing', () => {
    const html = renderToStaticMarkup(React.createElement(AthleticJourneyDashboard));
    expect(html).toContain('Athletic Journey');
    expect(html).toContain('Choose your sport');
    expect(html).toContain('Journey momentum');
    // The cross-sport availability message is present.
    expect(html).toContain('available now');
  });

  it('renders an in-development sport card with no stage scoring', () => {
    const html = renderToStaticMarkup(
      React.createElement(InDevelopmentCard, { availability: getSportAvailability('baseball') }),
    );
    expect(html).toContain('Baseball');
    expect(html.toLowerCase()).toContain('in development');
    // No momentum/stage scoring is ever shown for an in-development sport.
    expect(html).not.toContain('Journey momentum');
  });
});
