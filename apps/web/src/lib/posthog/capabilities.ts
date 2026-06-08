// ============================================================
// Analytics OS — PostHog capability coverage map (single source of truth)
// ------------------------------------------------------------
// The full surface of what PostHog does, and how the OS covers each piece:
//   • live   — we render the data inside the OS (needs read key)
//   • manage — we can create / toggle it inside the OS (needs read key)
//   • linked — we deep-link into PostHog for the rich interactive UI
//
// Adding a capability later is a one-line change here; the coverage grid,
// the stats and the deep links all read from this array.
// ============================================================

import type { CapabilityGroupId, PostHogCapability } from './types';

export const CAPABILITY_GROUPS: { id: CapabilityGroupId; label: string }[] = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'record', label: 'Record & observe' },
  { id: 'experiment', label: 'Experiment & ask' },
  { id: 'data', label: 'Data & people' },
  { id: 'manage', label: 'Manage & ship' },
];

export const POSTHOG_CAPABILITIES: PostHogCapability[] = [
  // ── Analyze ────────────────────────────────────────────────
  {
    id: 'product-analytics',
    label: 'Product analytics',
    description: 'Event trends, insights and breakdowns for everything users do.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/insights',
    icon: 'BarChart3',
  },
  {
    id: 'web-analytics',
    label: 'Web analytics',
    description: 'Pageviews, unique visitors, sessions, top pages and referrers.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/web',
    icon: 'Globe',
  },
  {
    id: 'funnels',
    label: 'Funnels',
    description: 'Step-by-step conversion and the biggest drop-off in each journey.',
    group: 'analyze',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/insights/new?insight=FUNNELS',
    icon: 'Filter',
  },
  {
    id: 'retention',
    label: 'Retention',
    description: 'How many users come back, cohort by cohort, week over week.',
    group: 'analyze',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/insights/new?insight=RETENTION',
    icon: 'CalendarClock',
  },
  {
    id: 'paths',
    label: 'User paths',
    description: 'The real routes users take through the product, and where they leave.',
    group: 'analyze',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/insights/new?insight=PATHS',
    icon: 'Route',
  },
  {
    id: 'sql',
    label: 'SQL (HogQL) explorer',
    description: 'Run read-only SQL over your events right inside the OS.',
    group: 'analyze',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/sql',
    icon: 'Terminal',
  },

  // ── Record & observe ───────────────────────────────────────
  {
    id: 'session-replay',
    label: 'Session replay',
    description: 'Watch real recordings of user sessions to see exactly what happened.',
    group: 'record',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/replay/recent',
    icon: 'PlayCircle',
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    description: 'Saved boards of the insights that matter, shareable with the team.',
    group: 'record',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'activity',
    label: 'Live events',
    description: 'A real-time stream of events as they arrive — great for debugging.',
    group: 'record',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/activity/explore',
    icon: 'Activity',
  },
  {
    id: 'alerts',
    label: 'Alerts & subscriptions',
    description: 'Get notified when a metric crosses a threshold or on a schedule.',
    group: 'record',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/insights',
    icon: 'BellRing',
  },

  // ── Experiment & ask ───────────────────────────────────────
  {
    id: 'feature-flags',
    label: 'Feature flags',
    description: 'Roll features out by percentage or segment — and toggle them here.',
    group: 'experiment',
    access: 'manage',
    needsReadKey: true,
    posthogPath: '/feature_flags',
    icon: 'Flag',
  },
  {
    id: 'experiments',
    label: 'A/B experiments',
    description: 'Test changes against a control and measure the real impact.',
    group: 'experiment',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/experiments',
    icon: 'FlaskConical',
  },
  {
    id: 'surveys',
    label: 'Surveys',
    description: 'Ask users questions in-app and read the responses.',
    group: 'experiment',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/surveys',
    icon: 'MessageSquare',
  },

  // ── Data & people ──────────────────────────────────────────
  {
    id: 'cohorts',
    label: 'Cohorts',
    description: 'Group users by behaviour and reuse those groups everywhere.',
    group: 'data',
    access: 'live',
    needsReadKey: true,
    posthogPath: '/cohorts',
    icon: 'Users',
  },
  {
    id: 'persons',
    label: 'Persons & groups',
    description: 'Look up an individual user or an organization and their full timeline.',
    group: 'data',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/persons',
    icon: 'UserSearch',
  },
  {
    id: 'data-management',
    label: 'Data management',
    description: 'Events, properties, actions and definitions — the data dictionary.',
    group: 'data',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/data-management/events',
    icon: 'Database',
  },
  {
    id: 'pipelines',
    label: 'Pipelines & exports',
    description: 'Send PostHog data to your warehouse or other tools (CDP).',
    group: 'data',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/pipeline/overview',
    icon: 'Share2',
  },

  // ── Manage & ship ──────────────────────────────────────────
  {
    id: 'toolbar',
    label: 'Toolbar',
    description: 'Point-and-click to create actions and inspect events on the live site.',
    group: 'manage',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/toolbar',
    icon: 'MousePointerClick',
  },
  {
    id: 'project-settings',
    label: 'Project settings',
    description: 'Keys, autocapture, data retention and project configuration.',
    group: 'manage',
    access: 'linked',
    needsReadKey: false,
    posthogPath: '/settings/project',
    icon: 'Settings',
  },
];

/** Total number of PostHog capabilities the OS maps. */
export const CAPABILITY_COUNT = POSTHOG_CAPABILITIES.length;
