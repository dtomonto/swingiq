// ============================================================
// SwingVantage — PostHog project setup (provisioning-as-code)
// ------------------------------------------------------------
// Creates the feature flags, funnels/insights, dashboards, and the
// post-analysis survey from the audit (docs/POSTHOG_AUDIT_2026-06.md §E/F/G/I)
// via the PostHog REST API — so the "PostHog UI setup" is reproducible and
// reviewable instead of hand-clicked.
//
// Safe by design:
//   • DRY-RUN by default — prints exactly what it WOULD create and writes
//     nothing. Pass --apply to actually create.
//   • IDEMPOTENT — skips anything that already exists (matched by flag key /
//     resource name), so re-running never duplicates.
//   • The survey is created as a DRAFT (no start_date) — it won't show to users
//     until you launch it in PostHog.
//   • Reads the personal API key from the environment; it is never logged.
//
// Usage:
//   # Dry run (no key needed — just prints the plan):
//   node apps/web/scripts/posthog-setup.mjs
//
//   # Apply (needs a personal API key with write scope + the project id):
//   POSTHOG_PERSONAL_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 \
//     node apps/web/scripts/posthog-setup.mjs --apply
//
//   # Limit to sections: --only=flags,survey,dashboards
//
// Env:
//   POSTHOG_PERSONAL_API_KEY   phx_…  (Settings → Personal API keys; write scope)
//   POSTHOG_PROJECT_ID         e.g. 12345  (Settings → Project)
//   NEXT_PUBLIC_POSTHOG_HOST   optional; us (default) | eu | self-hosted origin
// ============================================================

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const onlyArg = args.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()) : null;
const want = (section) => !ONLY || ONLY.includes(section);

// ── Host / config resolution (mirrors lib/posthog/config.ts) ──
function resolveApiBase(rawHost) {
  const host = (rawHost || '').trim().replace(/\/+$/, '');
  const lower = host.toLowerCase();
  if (!host || lower.includes('us.i.posthog.com') || lower.includes('app.posthog.com')) {
    return 'https://us.posthog.com';
  }
  if (lower.includes('eu.i.posthog.com') || lower.includes('eu.posthog.com')) {
    return 'https://eu.posthog.com';
  }
  return host; // self-hosted: ingest + app share one origin
}

const API_BASE = resolveApiBase(process.env.NEXT_PUBLIC_POSTHOG_HOST);
const KEY = (process.env.POSTHOG_PERSONAL_API_KEY || '').trim();
const PROJECT_ID = (process.env.POSTHOG_PROJECT_ID || '').trim();

// ── Spec: events (must match packages/core/src/analytics/events.ts) ──
const E = {
  page_view: 'page_view',
  sport_selected: 'sport_selected',
  sample_report_viewed: 'sample_report_viewed',
  profile_started: 'profile_started',
  account_created: 'account_created',
  video_upload_started: 'video_upload_started',
  video_upload_completed: 'video_upload_completed',
  video_upload_failed: 'video_upload_failed',
  analysis_started: 'analysis_started',
  analysis_completed: 'analysis_completed',
  analysis_failed: 'analysis_failed',
  priority_fix_viewed: 'priority_fix_viewed',
  fix_stack_created: 'fix_stack_created',
  drill_completed: 'drill_completed',
  retest_completed: 'retest_completed',
  ai_coach_opened: 'ai_coach_opened',
  ai_coach_question_asked: 'ai_coach_question_asked',
  ai_coach_answered: 'ai_coach_answered',
  ai_coach_answer_rated: 'ai_coach_answer_rated',
};

// ── Feature flags (audit §G). Keys are PostHog-valid (no dots) and are what
//    new gates should pass to isFlagEnabled() — the flag bridge consumes by key.
//    All ship OFF (rollout 0%) so nothing changes until you ramp them. ──
const FLAGS = [
  ['upload-flow-v2', 'New upload flow', 'Staged rollout of the redesigned upload/record flow.'],
  ['gemini-video-analysis', 'Gemini video analysis', 'Route vision analysis to Gemini for a cohort.'],
  ['openai-ai-coach', 'OpenAI AI coach', 'Beta-gate the OpenAI-backed coach.'],
  ['sport-dashboard-v2', 'Sport dashboard v2', 'Per-sport dashboard redesign rollout.'],
  ['premium-analysis-ui', 'Premium analysis UI', 'Plan-targeted premium report surface.'],
  ['ads-placement', 'Ads placement', 'Cautious rollout of ad placements.'],
  ['kill-mediapipe-onclient', 'Kill switch: on-client MediaPipe', 'Global kill switch — flip ON to disable on-device pose.'],
];

// ── Survey (audit §I): post-analysis "was this fix helpful?" — DRAFT. ──
const SURVEY = {
  name: 'Post-analysis — was this fix helpful?',
  type: 'popover',
  questions: [
    {
      type: 'rating',
      question: 'Was your #1 fix helpful?',
      display: 'emoji',
      scale: 3,
      lowerBoundLabel: 'Not really',
      upperBoundLabel: 'Very',
    },
  ],
  // No start_date → stays a draft until you launch it in PostHog.
};

// ── Insights + dashboards (audit §E funnels / §F dashboards) ──
const funnel = (name, events) => ({
  kind: 'insight', insightType: 'FUNNELS', name, events,
});
const trend = (name, series) => ({
  kind: 'insight', insightType: 'TRENDS', name, series,
});

const DASHBOARDS = [
  {
    name: 'Product Activation',
    description: 'Upload → analysis → first fix. The core value moment.',
    insights: [
      funnel('Activation funnel', [
        E.page_view, E.sport_selected, E.video_upload_started,
        E.video_upload_completed, E.analysis_completed, E.priority_fix_viewed,
      ]),
      funnel('Improvement loop (north star)', [
        E.analysis_completed, E.fix_stack_created, E.drill_completed, E.retest_completed,
      ]),
    ],
  },
  {
    name: 'Upload & Analysis Reliability',
    description: 'Where the AI value moment breaks, by cause.',
    insights: [
      trend('Analysis failures by error_code', [
        { event: E.analysis_failed, math: 'total', breakdown: 'error_code' },
      ]),
      trend('AI analysis latency (avg ms) by provider', [
        { event: E.analysis_completed, math: 'avg', math_property: 'ai_latency_ms', breakdown: 'ai_provider' },
      ]),
    ],
  },
  {
    name: 'AI Coach Quality',
    description: 'Opened → asked → answered → rated helpful, plus AI latency.',
    insights: [
      funnel('Coach quality funnel', [
        E.ai_coach_opened, E.ai_coach_question_asked, E.ai_coach_answered, E.ai_coach_answer_rated,
      ]),
      trend('Coach answer latency (avg ms) by provider', [
        { event: E.ai_coach_answered, math: 'avg', math_property: 'ai_latency_ms', breakdown: 'ai_provider' },
      ]),
      trend('Coach ratings', [{ event: E.ai_coach_answer_rated, math: 'total', breakdown: 'value' }]),
    ],
  },
  {
    name: 'Acquisition',
    description: 'Home → sample report → signup.',
    insights: [
      funnel('Signup funnel', [
        E.page_view, E.sample_report_viewed, E.profile_started, E.account_created,
      ]),
    ],
  },
];

// ── PostHog query payload builders (modern InsightVizNode schema) ──
const DATE_RANGE = { date_from: '-30d' };

function eventsNode(spec) {
  const node = { kind: 'EventsNode', event: spec.event, name: spec.event };
  if (spec.math) node.math = spec.math;
  if (spec.math_property) node.math_property = spec.math_property;
  return node;
}

function breakdownFilter(series) {
  const withBreakdown = series.find((s) => s.breakdown);
  if (!withBreakdown) return undefined;
  return { breakdown_type: 'event', breakdown: withBreakdown.breakdown };
}

export function buildInsightBody(insight, dashboardId) {
  let query;
  if (insight.insightType === 'FUNNELS') {
    query = {
      kind: 'InsightVizNode',
      source: {
        kind: 'FunnelsQuery',
        series: insight.events.map((event) => eventsNode({ event })),
        dateRange: DATE_RANGE,
      },
    };
  } else {
    query = {
      kind: 'InsightVizNode',
      source: {
        kind: 'TrendsQuery',
        series: insight.series.map(eventsNode),
        dateRange: DATE_RANGE,
        breakdownFilter: breakdownFilter(insight.series),
      },
    };
  }
  const body = { name: insight.name, query };
  if (dashboardId != null) body.dashboards = [dashboardId];
  return body;
}

export function buildFlagBody([key, name, description]) {
  return {
    key,
    name: `${name} — ${description}`,
    active: true, // the flag exists & is evaluatable; rollout 0% keeps it OFF
    filters: { groups: [{ properties: [], rollout_percentage: 0 }] },
  };
}

export function buildSurveyBody(survey) {
  return { ...survey };
}

// ── HTTP ──────────────────────────────────────────────────────
function authHeaders() {
  return { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

async function api(method, path, body) {
  const url = `${API_BASE}/api/projects/${encodeURIComponent(PROJECT_ID)}${path}`;
  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (!res.ok) {
    const detail = json?.detail || json?.error || text || `HTTP ${res.status}`;
    throw new Error(`${method} ${path} → ${res.status}: ${detail}`);
  }
  return json;
}

async function listAll(path) {
  const out = [];
  let next = `${API_BASE}/api/projects/${encodeURIComponent(PROJECT_ID)}${path}?limit=200`;
  while (next) {
    const res = await fetch(next, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    const json = await res.json();
    out.push(...(json.results ?? []));
    next = json.next;
  }
  return out;
}

// ── Runner ────────────────────────────────────────────────────
const log = (...a) => console.log(...a);
const summary = { created: 0, skipped: 0, failed: 0 };

async function ensure(kind, label, existsFn, createFn) {
  try {
    if (!APPLY) { log(`  • [plan] would create ${kind}: ${label}`); return; }
    if (await existsFn()) { log(`  • skip (exists) ${kind}: ${label}`); summary.skipped++; return; }
    await createFn();
    log(`  • created ${kind}: ${label}`);
    summary.created++;
  } catch (err) {
    log(`  ✗ failed ${kind}: ${label} — ${err.message}`);
    summary.failed++;
  }
}

async function run() {
  log(`PostHog setup — ${APPLY ? 'APPLY' : 'DRY RUN'} · api=${API_BASE} · project=${PROJECT_ID || '(unset)'}`);
  if (APPLY && (!KEY || !PROJECT_ID)) {
    log('\nERROR: --apply needs POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID.');
    process.exitCode = 1;
    return;
  }

  // Pre-load existing resources for idempotency (only when applying).
  const existing = { flags: [], dashboards: [], surveys: [] };
  if (APPLY) {
    if (want('flags')) existing.flags = await listAll('/feature_flags/');
    if (want('dashboards')) existing.dashboards = await listAll('/dashboards/');
    if (want('survey')) existing.surveys = await listAll('/surveys/');
  }

  if (want('flags')) {
    log('\nFeature flags (§G) — all ship at 0% rollout (OFF until you ramp):');
    for (const flag of FLAGS) {
      const [key] = flag;
      await ensure('flag', key,
        async () => existing.flags.some((f) => f.key === key),
        async () => api('POST', '/feature_flags/', buildFlagBody(flag)),
      );
    }
  }

  if (want('survey')) {
    log('\nSurvey (§I) — created as a DRAFT (won’t show until launched):');
    await ensure('survey', SURVEY.name,
      async () => existing.surveys.some((s) => s.name === SURVEY.name),
      async () => api('POST', '/surveys/', buildSurveyBody(SURVEY)),
    );
  }

  if (want('dashboards')) {
    log('\nDashboards + insights (§E/§F):');
    for (const dash of DASHBOARDS) {
      let dashboardId = null;
      await ensure('dashboard', dash.name,
        async () => {
          const found = existing.dashboards.find((d) => d.name === dash.name);
          if (found) { dashboardId = found.id; return true; }
          return false;
        },
        async () => { const d = await api('POST', '/dashboards/', { name: dash.name, description: dash.description }); dashboardId = d.id; },
      );
      for (const insight of dash.insights) {
        await ensure('insight', `${dash.name} ▸ ${insight.name}`,
          // Insight idempotency is name-scoped; cheap re-check via list is omitted
          // in dry-run. On apply we let PostHog accept duplicates only if the
          // dashboard was newly created (existing dashboards are left untouched).
          async () => APPLY && existing.dashboards.some((d) => d.name === dash.name),
          async () => api('POST', '/insights/', buildInsightBody(insight, dashboardId)),
        );
      }
    }
  }

  log(`\nDone. created=${summary.created} skipped=${summary.skipped} failed=${summary.failed}`);
  if (!APPLY) log('(dry run — pass --apply with a key to create these.)');
}

// Only run when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('posthog-setup.mjs')) {
  run().catch((err) => { console.error(err); process.exitCode = 1; });
}
