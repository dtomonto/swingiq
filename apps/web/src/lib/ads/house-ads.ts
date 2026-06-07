// ============================================================
// SwingVantage — AdsOS: house ads (self-promotion inventory)
// ------------------------------------------------------------
// What fills ad slots before (and alongside) paid demand. These grow the
// product now: they push the highest-leverage free-user actions —
// inviting friends (ReferralOS), going deeper into the product, etc.
// English source of truth; honest, never clickbait.
// ============================================================

import type { HouseAd } from './types';

export const HOUSE_ADS: HouseAd[] = [
  {
    id: 'invite-friends',
    title: 'Improve faster — together',
    body: 'Invite a friend to SwingVantage. You both get better, and you climb the reward ladder.',
    cta: { label: 'Invite a friend', href: '/refer' },
    accent: 'primary',
    weight: 3,
  },
  {
    id: 'try-agi',
    title: 'Find your keystone skill',
    body: 'Athlete GI reads every signal across your sports to find the one thing that lifts everything.',
    cta: { label: 'Open Athlete GI', href: '/agi' },
    accent: 'success',
    weight: 2,
  },
  {
    id: 'build-streak',
    title: 'Turn reps into results',
    body: 'A short daily drill builds the streak that turns a good swing into a reliable one.',
    cta: { label: 'Start today’s drill', href: '/training' },
    accent: 'warning',
    weight: 2,
  },
  {
    id: 'motion-lab',
    title: 'See your swing in 3D',
    body: 'Motion Lab breaks your motion into phases so you know exactly what to change.',
    cta: { label: 'Open Motion Lab', href: '/motion-lab' },
    accent: 'primary',
    weight: 1,
  },
];
