// ============================================================
// Clarity OS — capability coverage map (single source of truth)
// ------------------------------------------------------------
// The full surface of what Microsoft Clarity does, and how the OS covers
// each piece:
//   • live   — we render the data inside the OS (needs Data Export token)
//   • linked — we deep-link into Clarity for the rich interactive UI
//     (heatmaps and session replay have no public read API, so they are
//      always deep-linked — never faked).
//
// Adding a capability later is a one-line change here; the coverage grid,
// the stats and the deep links all read from this array.
// ============================================================

import type { CapabilityGroupId, ClarityCapability } from './types';

export const CAPABILITY_GROUPS: { id: CapabilityGroupId; label: string }[] = [
  { id: 'observe', label: 'Record & observe' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'configure', label: 'Configure & integrate' },
];

export const CLARITY_CAPABILITIES: ClarityCapability[] = [
  // ── Record & observe ───────────────────────────────────────
  {
    id: 'recordings',
    label: 'Session recordings',
    description: 'Watch real replays of user sessions to see exactly what happened.',
    group: 'observe',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'impressions',
    icon: 'PlayCircle',
  },
  {
    id: 'heatmaps',
    label: 'Heatmaps',
    description: 'Click, scroll and area heatmaps showing where attention goes on each page.',
    group: 'observe',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'heatmaps',
    icon: 'Flame',
  },
  {
    id: 'dashboard',
    label: 'Clarity dashboard',
    description: 'The full interactive Clarity dashboard — metrics, insights and filters.',
    group: 'observe',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'dashboard',
    icon: 'LayoutDashboard',
  },

  // ── Analyze (rendered here from the Data Export API) ────────
  {
    id: 'traffic',
    label: 'Traffic & sessions',
    description: 'Sessions, distinct users, bot traffic and pages-per-session for the window.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    clarityPath: 'dashboard',
    icon: 'Globe',
  },
  {
    id: 'engagement',
    label: 'Engagement',
    description: 'Average scroll depth and time on page — how deeply people engage.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    clarityPath: 'dashboard',
    icon: 'Activity',
  },
  {
    id: 'quality-signals',
    label: 'Quality signals',
    description: 'Rage clicks, dead clicks, excessive scroll, quick-backs and script errors.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    clarityPath: 'dashboard',
    icon: 'MousePointerClick',
  },
  {
    id: 'breakdowns',
    label: 'Breakdowns',
    description: 'Slice traffic by browser, device, OS or country.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    clarityPath: 'dashboard',
    icon: 'BarChart3',
  },
  {
    id: 'filters',
    label: 'Filters & segments',
    description: 'Slice recordings and heatmaps by dozens of dimensions in Clarity.',
    group: 'analyze',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'dashboard',
    icon: 'Filter',
  },

  // ── Configure & integrate ──────────────────────────────────
  {
    id: 'smart-events',
    label: 'Smart events',
    description: 'Auto-captured and custom events you can segment and build funnels on.',
    group: 'configure',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'settings/smartevents',
    icon: 'FlaskConical',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Google Analytics, GA4 and other connectors managed in Clarity.',
    group: 'configure',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'settings/integrations',
    icon: 'Share2',
  },
  {
    id: 'masking',
    label: 'Masking & privacy',
    description: 'Content masking and privacy controls — keep recordings youth-safe.',
    group: 'configure',
    access: 'linked',
    needsReadKey: false,
    clarityPath: 'settings/masking',
    icon: 'Settings',
  },
];

/** Total number of Clarity capabilities the OS maps. */
export const CAPABILITY_COUNT = CLARITY_CAPABILITIES.length;

/**
 * The behavioral quality signals the OS surfaces from the Data Export API.
 * `id` matches the key produced by the client normalizer (client.ts).
 */
export const SIGNAL_CATALOG: { id: string; label: string; description: string }[] = [
  { id: 'rageClicks', label: 'Rage clicks', description: 'Repeated frustrated clicks on the same spot.' },
  { id: 'deadClicks', label: 'Dead clicks', description: 'Clicks that produced no response.' },
  { id: 'excessiveScroll', label: 'Excessive scroll', description: 'Sessions scrolling far more than usual.' },
  { id: 'quickBack', label: 'Quick backs', description: 'Users who immediately navigated back.' },
  { id: 'scriptErrors', label: 'Script errors', description: 'Sessions that hit a JavaScript error.' },
  { id: 'errorClicks', label: 'Error clicks', description: 'Clicks that triggered an error.' },
];

/** Dimensions the Data Export API accepts for a single-dimension breakdown. */
export const CLARITY_DIMENSIONS: { id: string; label: string }[] = [
  { id: 'Browser', label: 'Browser' },
  { id: 'Device', label: 'Device' },
  { id: 'OS', label: 'Operating system' },
  { id: 'Country', label: 'Country' },
];
