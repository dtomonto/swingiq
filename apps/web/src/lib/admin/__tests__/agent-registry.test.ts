// AI Agent Registry — invariants for the agent inventory.
// Guards against malformed entries and keeps the catalog honest:
// unique ids, real surfaces, valid families, and stats that add up.

import {
  AGENT_REGISTRY,
  AGENT_FAMILY_META,
  groupAgentsByFamily,
  agentRegistryStats,
  findAgent,
  type AgentFamily,
} from '../agent-registry';

const FAMILIES: AgentFamily[] = ['insight', 'growth', 'content-ai', 'safety'];

describe('AGENT_REGISTRY entries', () => {
  it('has a healthy number of agents', () => {
    expect(AGENT_REGISTRY.length).toBeGreaterThanOrEqual(20);
  });

  it('every agent is well-formed', () => {
    for (const a of AGENT_REGISTRY) {
      expect(a.id).toMatch(/^[a-z0-9_]+$/);
      expect(a.name.length).toBeGreaterThan(0);
      expect(FAMILIES).toContain(a.family);
      expect(a.purpose.length).toBeGreaterThan(10);
      expect(a.inputs.length).toBeGreaterThan(0);
      expect(a.outputs.length).toBeGreaterThan(0);
      expect(['deterministic', 'deterministic+llm', 'llm']).toContain(a.runtime);
      expect(a.control.length).toBeGreaterThan(0);
      expect(a.surface.href.startsWith('/admin/')).toBe(true);
      expect(a.surface.label.length).toBeGreaterThan(0);
      expect(a.module.length).toBeGreaterThan(0);
    }
  });

  it('ids are unique', () => {
    const ids = AGENT_REGISTRY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every declared family', () => {
    for (const fam of AGENT_FAMILY_META) {
      expect(AGENT_REGISTRY.some((a) => a.family === fam.id)).toBe(true);
    }
  });

  it('safety-family agents and guardrails carry a safety note', () => {
    const guardrail = findAgent('guardrail');
    expect(guardrail?.safety).toBeTruthy();
    expect(guardrail?.control.toLowerCase()).toContain('cannot be disabled');
  });

  it('the Admin Copilot is catalogued as read-only and aggregate', () => {
    const copilot = findAgent('admin_copilot');
    expect(copilot).toBeDefined();
    expect(copilot?.safety?.toLowerCase()).toContain('read-only');
  });
});

describe('groupAgentsByFamily', () => {
  it('groups in declared family order and loses no agents', () => {
    const groups = groupAgentsByFamily();
    const flat = groups.flatMap((g) => g.agents);
    expect(flat.length).toBe(AGENT_REGISTRY.length);
    expect(groups.map((g) => g.family.id)).toEqual(
      AGENT_FAMILY_META.filter((f) => AGENT_REGISTRY.some((a) => a.family === f.id)).map((f) => f.id),
    );
  });
});

describe('agentRegistryStats', () => {
  it('totals reconcile with the registry', () => {
    const s = agentRegistryStats();
    expect(s.total).toBe(AGENT_REGISTRY.length);
    expect(s.keyless + s.llmCapable).toBe(s.total);
    const familySum = FAMILIES.reduce((n, f) => n + s.byFamily[f], 0);
    expect(familySum).toBe(s.total);
    expect(s.withSafety).toBeGreaterThan(0);
  });
});
