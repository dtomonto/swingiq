// QA scenario generator — pure tests.
// Confirms scenarios are generated from the registries, prioritized
// sensibly, and that the checklist stats reconcile.

import {
  buildQaChecklist,
  buildAdminSectionScenarios,
  buildAgentScenarios,
  buildSportScenarios,
  crossCuttingScenarios,
  type QaNavSection,
  type QaAgent,
} from '../qa/scenarios';

const sections: QaNavSection[] = [
  { id: 'home', label: 'Command Center', href: '/admin', built: true },
  { id: 'users', label: 'Users', href: '/admin/users', built: true, permission: 'users.view' },
  { id: 'soon', label: 'Soon', href: '/admin/soon', built: false },
];

const agents: QaAgent[] = [
  { id: 'copilot', name: 'Admin Copilot', family: 'content-ai', runtime: 'deterministic+llm', safety: 'Read-only.' },
  { id: 'progress', name: 'Progress Memory', family: 'insight', runtime: 'deterministic' },
  { id: 'guardrail', name: 'Safety Guardrail', family: 'safety', runtime: 'deterministic', safety: 'Never medical.' },
];

describe('buildAdminSectionScenarios', () => {
  it('only includes built sections and adds a permission step when gated', () => {
    const cat = buildAdminSectionScenarios(sections);
    expect(cat.scenarios.length).toBe(2); // 'soon' excluded
    const users = cat.scenarios.find((s) => s.id === 'section:users')!;
    expect(users.steps.some((t) => t.includes('users.view'))).toBe(true);
    expect(users.priority).toBe('p0');
  });
});

describe('buildAgentScenarios', () => {
  const cat = buildAgentScenarios(agents);
  it('flags safety/guardrail agents as p0', () => {
    expect(cat.scenarios.find((s) => s.id === 'agent:guardrail')!.priority).toBe('p0');
    expect(cat.scenarios.find((s) => s.id === 'agent:progress')!.priority).toBe('p1');
  });
  it('adds an AI-fallback step for LLM-capable agents only', () => {
    const copilot = cat.scenarios.find((s) => s.id === 'agent:copilot')!;
    const progress = cat.scenarios.find((s) => s.id === 'agent:progress')!;
    expect(copilot.steps.some((t) => t.toLowerCase().includes('no ai provider'))).toBe(true);
    expect(progress.steps.some((t) => t.toLowerCase().includes('no ai provider'))).toBe(false);
  });
});

describe('buildSportScenarios', () => {
  it('builds one core-flow scenario per sport with readable labels', () => {
    const cat = buildSportScenarios(['golf', 'softball_slow']);
    expect(cat.scenarios.length).toBe(2);
    expect(cat.scenarios[1].title).toContain('Slow-pitch softball');
  });
});

describe('crossCuttingScenarios', () => {
  it('includes a contrast / no-white-on-white check', () => {
    const cat = crossCuttingScenarios();
    expect(cat.scenarios.some((s) => s.title.toLowerCase().includes('contrast'))).toBe(true);
  });
});

describe('buildQaChecklist', () => {
  const checklist = buildQaChecklist(sections, agents, ['golf', 'tennis']);

  it('aggregates categories and reconciles stats', () => {
    expect(checklist.stats.categories).toBe(checklist.categories.length);
    const scenarioSum = checklist.categories.reduce((n, c) => n + c.scenarios.length, 0);
    expect(checklist.stats.scenarios).toBe(scenarioSum);
    const prioSum = checklist.stats.byPriority.p0 + checklist.stats.byPriority.p1 + checklist.stats.byPriority.p2;
    expect(prioSum).toBe(checklist.stats.scenarios);
    expect(checklist.stats.steps).toBeGreaterThan(checklist.stats.scenarios);
  });

  it('has at least one p0 (built admin sections)', () => {
    expect(checklist.stats.byPriority.p0).toBeGreaterThanOrEqual(2);
  });
});
