// ============================================================
// External Auditor Access — barrier map (isomorphic, pure)
// ------------------------------------------------------------
// The exact barriers an external auditor reported when it tried to do a
// complete analysis of the public site, mapped to how this audit packet
// addresses each one (or honestly, why it still requires a manual upload).
//
// The admin page renders this as a "barriers cleared" checklist; the API
// packet embeds it so the auditor sees, up front, what it now has.
// ============================================================

import type { AuditBarrier, AppSurfaceRoute } from './types';

/** The auth-gated "logged-in experience" an auditor cannot reach unaided. */
export const APP_SURFACE: AppSurfaceRoute[] = [
  { path: '/dashboard', label: 'Dashboard', authRequired: true,
    purpose: 'The athlete home: latest swing scores, the unified "SwingVantage noticed…" cards, next-best-action, priority panel, progress and quick links.' },
  { path: '/diagnose', label: 'Diagnose', authRequired: true,
    purpose: 'Per-session swing diagnosis with profile-aware grading (graded against the user\'s own level, not tour pros) and the next-step row.' },
  { path: '/video', label: 'Video upload & analysis', authRequired: true,
    purpose: 'Upload or record a swing video (front/back camera with a "where to stand" overlay); produces the analysis a swing report is built from.' },
  { path: '/reports', label: 'Reports', authRequired: true,
    purpose: 'Generated swing reports. A public, logged-out example lives at /sample-report.' },
  { path: '/fix', label: 'Fix Stack / DrillMatch', authRequired: true,
    purpose: 'Turns the live diagnosis into matched, sport-aware drills (issue → drill → outcome).' },
  { path: '/training', label: 'Training & drills', authRequired: true,
    purpose: 'Drill library and practice plans tailored to the athlete\'s faults and goals.' },
  { path: '/progress', label: 'Progress & timeline', authRequired: true,
    purpose: 'The athlete arc: every dated event merged newest-first, momentum and trend over time.' },
  { path: '/bag', label: 'Golf bag', authRequired: true,
    purpose: 'Auto-detected golf bag (clubs + provenance), suggest-only reconciliation.' },
  { path: '/profile', label: 'Profile', authRequired: true,
    purpose: 'Sport, skill/handicap, goals — feeds profile-aware grading and personas.' },
  { path: '/settings', label: 'Settings', authRequired: true,
    purpose: 'Account, sync, privacy controls and feature toggles (e.g. cross-sport reasoning).' },
  { path: '/agi', label: 'Athlete General Intelligence', authRequired: true,
    purpose: 'Honest cross-sport reasoning layer that finds the keystone skill across the athlete\'s sports (opt-in).' },
  { path: '/bodysync', label: 'BodySync', authRequired: true,
    purpose: 'Health/wearable intelligence: manual wellness, readiness scoring and health-aware coaching.' },
];

/** The auditor's reported barriers, each mapped to a resolution + bundle section. */
export const AUDIT_BARRIERS: AuditBarrier[] = [
  {
    id: 'logged-in-experience',
    barrier: 'The logged-in dashboard experience after account creation.',
    status: 'partial',
    resolution:
      'This packet describes every auth-gated route and what a user does there (routes.authenticated). A real interactive walkthrough/screenshots still requires a manual upload.',
    sections: ['routes.authenticated'],
  },
  {
    id: 'analytics',
    barrier:
      'Actual analytics: traffic sources, bounce rate, sign-up conversion, activation, retention, cohorts, Search Console queries, indexed pages.',
    status: 'partial',
    resolution:
      'When a PostHog read key is configured, the aggregate web overview, top pages, referrers and events are included (analytics). GA4 export, Search Console queries/indexed pages and session-replay tools (Clarity/Hotjar) still require a manual upload — listed in analytics.stillNeedsManual.',
    sections: ['analytics', 'capabilities'],
  },
  {
    id: 'video-upload-quality',
    barrier: 'The actual video upload result quality on a real swing.',
    status: 'manual',
    resolution:
      'Producing a real analysis requires uploading a real swing video while logged in — it cannot be auto-served. The public, logged-out /sample-report shows representative output and /methodology explains how scores are derived.',
    sections: ['routes.public', 'routes.authenticated'],
  },
  {
    id: 'sitemap-robots',
    barrier:
      'The XML sitemap and robots.txt content; the browsing tool blocked direct opening of those paths.',
    status: 'cleared',
    resolution:
      'Verbatim /robots.txt and /sitemap.xml (and /llms.txt when present) are mirrored inside this JSON packet (crawl), so a browsing tool that blocks those paths still receives their full contents.',
    sections: ['crawl'],
  },
  {
    id: 'visual-mobile-rendering',
    barrier: 'Visual/mobile rendering beyond text-level page extraction.',
    status: 'manual',
    resolution:
      'Pixel rendering and responsive behavior cannot be conveyed as JSON. Provide a Lighthouse report and mobile/desktop screenshots via a manual upload; the route list lets the auditor target which pages to capture.',
    sections: ['routes.public', 'routes.authenticated'],
  },
];

/** Honest list of artifacts the packet cannot include; require a manual upload. */
export const STILL_CANNOT_PROVIDE: string[] = [
  'GA4 export (events, conversions, funnels)',
  'Google Search Console export (queries, impressions, indexed pages)',
  'Microsoft Clarity / Hotjar session recordings & heatmaps',
  'Lighthouse / Core Web Vitals reports',
  'Screenshots or screen recordings of the logged-in onboarding, dashboard, upload and report flow',
  'Real swing-video analysis output (requires a logged-in upload)',
];

/** Count barriers by status — used by the admin "cleared" summary. */
export function barrierSummary(barriers: AuditBarrier[] = AUDIT_BARRIERS): {
  cleared: number;
  partial: number;
  manual: number;
  total: number;
} {
  const summary = { cleared: 0, partial: 0, manual: 0, total: barriers.length };
  for (const b of barriers) summary[b.status] += 1;
  return summary;
}
