// ============================================================
// SwingVantage Admin — QA scenario generator (isomorphic, pure)
// ------------------------------------------------------------
// A deterministic, keyless manual-QA checklist GENERATED from the real
// registries (admin nav sections, the agent registry, sports) plus the
// cross-cutting quality concerns every release should re-check. It does
// not run tests — it produces a grounded, prioritized checklist an
// operator can work through, so QA coverage tracks the app as it grows
// instead of going stale in a doc.
//
// Pure + structurally typed (operates on minimal shapes) so it is fully
// unit testable and never pulls UI/icon deps into tests.
// ============================================================

export type QaPriority = 'p0' | 'p1' | 'p2';

export interface QaScenario {
  id: string;
  title: string;
  priority: QaPriority;
  steps: string[];
}

export interface QaCategory {
  id: string;
  label: string;
  description: string;
  scenarios: QaScenario[];
}

export interface QaChecklist {
  categories: QaCategory[];
  stats: {
    categories: number;
    scenarios: number;
    steps: number;
    byPriority: Record<QaPriority, number>;
  };
}

// Minimal input shapes (the real NavItem / RegisteredAgent are supersets).
export interface QaNavSection {
  id: string;
  label: string;
  href: string;
  built: boolean;
  permission?: string;
}
export interface QaAgent {
  id: string;
  name: string;
  family: string;
  runtime: string;
  safety?: string;
}

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch softball', softball_fast: 'Fast-pitch softball',
};
const sportLabel = (s: string) => SPORT_LABELS[s] ?? s;

/** One smoke scenario per built admin section. */
export function buildAdminSectionScenarios(sections: QaNavSection[]): QaCategory {
  const scenarios: QaScenario[] = sections
    .filter((s) => s.built)
    .map((s) => {
      const steps = [
        `Open ${s.href} as an admin — page renders without a crash or error boundary.`,
        'Sign out / use a non-admin account — you are redirected away (no admin content leaks).',
        'With no data connected, the page shows an honest empty/“connect” state (not a blank or fake numbers).',
      ];
      if (s.permission) steps.push(`A role lacking "${s.permission}" cannot see or use this section.`);
      return { id: `section:${s.id}`, title: `${s.label} (${s.href})`, priority: 'p0' as QaPriority, steps };
    });
  return {
    id: 'admin-sections',
    label: 'Admin sections',
    description: 'Every built admin section loads, is access-controlled, and degrades honestly.',
    scenarios,
  };
}

/** One behavior scenario per registered agent. */
export function buildAgentScenarios(agents: QaAgent[]): QaCategory {
  const scenarios: QaScenario[] = agents.map((a) => {
    const steps = [
      `With representative input, ${a.name} produces output (or an honest “not enough data” state).`,
      'With missing/sparse data, it degrades gracefully — no crash, no invented numbers.',
    ];
    if (a.runtime !== 'deterministic') {
      steps.push('With no AI provider configured, it falls back to deterministic output (no errors, AI clearly optional).');
    }
    if (a.safety) steps.push(`Safety behavior holds: ${a.safety}`);
    const priority: QaPriority = a.family === 'safety' || a.safety ? 'p0' : 'p1';
    return { id: `agent:${a.id}`, title: a.name, priority, steps };
  });
  return {
    id: 'agents',
    label: 'AI agents',
    description: 'Each agent produces useful output, degrades safely, and honors its guardrails.',
    scenarios,
  };
}

/** One core-flow scenario per sport. */
export function buildSportScenarios(sports: string[]): QaCategory {
  const scenarios: QaScenario[] = sports.map((sport) => ({
    id: `sport:${sport}`,
    title: `${sportLabel(sport)} core flow`,
    priority: 'p1' as QaPriority,
    steps: [
      `Create a ${sportLabel(sport)} profile — required fields validate and save.`,
      'Start an upload / session — the intake-quality check guides bad inputs.',
      'Run analysis — a diagnosis with an honest confidence appears (or a clear “need more data”).',
      'Drills and a practice plan are suggested and match the diagnosed focus.',
    ],
  }));
  return {
    id: 'sport-flows',
    label: 'Sport flows',
    description: 'The end-to-end athlete journey works for every supported sport.',
    scenarios,
  };
}

/** Cross-cutting quality concerns to re-check each release. */
export function crossCuttingScenarios(): QaCategory {
  return {
    id: 'cross-cutting',
    label: 'Cross-cutting quality',
    description: 'Accessibility, responsiveness, theming and SEO basics that apply app-wide.',
    scenarios: [
      {
        id: 'xc:contrast', title: 'Theme & contrast (no white-on-white)', priority: 'p1',
        steps: [
          'Every theme renders readable text — no white-on-white or low-contrast text.',
          'Interactive elements meet a visible focus state and ~4.5:1 contrast.',
          'Status badges and alerts are distinguishable without relying on color alone.',
        ],
      },
      {
        id: 'xc:a11y', title: 'Keyboard & screen-reader', priority: 'p1',
        steps: [
          'All primary flows are operable by keyboard (tab order, Enter/Space activate).',
          'Inputs have labels; images/icons that convey meaning have text alternatives.',
        ],
      },
      {
        id: 'xc:mobile', title: 'Mobile responsiveness', priority: 'p1',
        steps: [
          'Tables/cards reflow on small screens; tap targets are ≥44px.',
          'No horizontal scroll or clipped content at 375px width.',
        ],
      },
      {
        id: 'xc:seo', title: 'SEO / metadata basics', priority: 'p2',
        steps: [
          'Public pages have a unique title + meta description and a canonical URL.',
          'Admin pages are noindex; the sitemap covers only trust-positive public routes.',
        ],
      },
    ],
  };
}

/** Build the full prioritized QA checklist from the real registries. */
export function buildQaChecklist(
  sections: QaNavSection[],
  agents: QaAgent[],
  sports: string[],
): QaChecklist {
  const categories = [
    buildAdminSectionScenarios(sections),
    buildAgentScenarios(agents),
    buildSportScenarios(sports),
    crossCuttingScenarios(),
  ].filter((c) => c.scenarios.length > 0);

  const byPriority: Record<QaPriority, number> = { p0: 0, p1: 0, p2: 0 };
  let scenarios = 0;
  let steps = 0;
  for (const c of categories) {
    for (const s of c.scenarios) {
      scenarios += 1;
      steps += s.steps.length;
      byPriority[s.priority] += 1;
    }
  }
  return { categories, stats: { categories: categories.length, scenarios, steps, byPriority } };
}
