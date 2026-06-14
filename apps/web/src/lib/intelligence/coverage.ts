// ============================================================
// SwingVantage — Deterministic Engine: Coverage & Scenario Summaries
// ------------------------------------------------------------
// Pure, read-only roll-ups over the deterministic diagnosis engine, for the
// admin "inspect the engine" surface (brief §15) and the scenario lab (§16).
// No I/O, no AI — it only reads the rule packs, the fault ontology, and the
// golden scenarios, then runs the (pure) engine over them.
// ============================================================

import { getFaultsForSport } from '@/lib/faults/ontology';
import { runDeterministicScenarioTest } from './diagnose';
import type { ConfidenceLabel } from './types';
import { GOLDEN_SCENARIOS } from './golden-scenarios';
import { listDiagnosisSports, getSportDiagnosisConfig } from './symptom-rules';
import type { SportId } from '@swingiq/core';

export interface SportCoverage {
  sport: SportId;
  displayName: string;
  /** Number of reportable symptoms (intake options) for the sport. */
  symptomCount: number;
  /** Distinct candidate fault ids reachable from those symptoms. */
  candidateFaultCount: number;
  /** Curated fault-ontology entries that apply to the sport. */
  curatedFaultCount: number;
  /** High-value follow-up questions wired across the sport's rules. */
  missingDataPromptCount: number;
  escalationThreshold: number;
  /** A sport with at least a few symptoms and candidate causes is "healthy". */
  healthy: boolean;
}

export interface EngineStatus {
  engineVersion: string;
  ruleVersion: string;
  sportCount: number;
  totalSymptoms: number;
  totalCandidateFaults: number;
  sports: SportCoverage[];
}

const ENGINE_VERSION = '1.0.0';
const RULE_VERSION = '2026.06';

/** Roll up per-sport coverage of the deterministic engine. */
export function getDeterministicEngineStatus(): EngineStatus {
  const sports: SportCoverage[] = listDiagnosisSports().map((sport) => {
    const cfg = getSportDiagnosisConfig(sport);
    const symptomCount = cfg?.rules.length ?? 0;
    const candidates = new Set<string>();
    let missingDataPromptCount = 0;
    for (const r of cfg?.rules ?? []) {
      for (const c of r.candidates) candidates.add(c.faultId);
      missingDataPromptCount += r.missingDataPrompts?.length ?? 0;
    }
    const curatedFaultCount = getFaultsForSport(sport).filter((f) => !f.generated).length;
    return {
      sport,
      displayName: cfg?.displayName ?? String(sport),
      symptomCount,
      candidateFaultCount: candidates.size,
      curatedFaultCount,
      missingDataPromptCount,
      escalationThreshold: cfg?.escalationConfidenceThreshold ?? 55,
      healthy: symptomCount >= 3 && candidates.size >= 3,
    };
  });

  return {
    engineVersion: ENGINE_VERSION,
    ruleVersion: RULE_VERSION,
    sportCount: sports.length,
    totalSymptoms: sports.reduce((n, s) => n + s.symptomCount, 0),
    totalCandidateFaults: sports.reduce((n, s) => n + s.candidateFaultCount, 0),
    sports,
  };
}

export interface ScenarioRow {
  name: string;
  sport: SportId;
  pass: boolean;
  primaryFaultId: string;
  primaryName: string;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  escalate: boolean;
  failures: string[];
}

export interface ScenarioSummary {
  total: number;
  passed: number;
  failed: number;
  /** Confidence-label distribution across the scenarios. */
  byConfidence: Record<ConfidenceLabel, number>;
  /** How many scenarios recommend AI escalation. */
  escalationCount: number;
  rows: ScenarioRow[];
}

/** Run every golden scenario and summarize — the admin scenario lab. */
export function runGoldenScenarios(): ScenarioSummary {
  const byConfidence: Record<ConfidenceLabel, number> = { low: 0, moderate: 0, high: 0 };
  let passed = 0;
  let escalationCount = 0;

  const rows: ScenarioRow[] = GOLDEN_SCENARIOS.map((scenario) => {
    const res = runDeterministicScenarioTest(scenario);
    const d = res.diagnosis;
    byConfidence[d.confidenceLabel] += 1;
    if (res.pass) passed += 1;
    if (d.escalateToAI) escalationCount += 1;
    return {
      name: scenario.name,
      sport: scenario.input.sport,
      pass: res.pass,
      primaryFaultId: d.primary.faultId,
      primaryName: d.primary.name,
      confidence: d.confidence,
      confidenceLabel: d.confidenceLabel,
      escalate: d.escalateToAI,
      failures: res.failures,
    };
  });

  return {
    total: rows.length,
    passed,
    failed: rows.length - passed,
    byConfidence,
    escalationCount,
    rows,
  };
}
