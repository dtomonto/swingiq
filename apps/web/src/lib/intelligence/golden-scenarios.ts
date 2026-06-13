// ============================================================
// SwingVantage — Deterministic Diagnosis: Golden Scenarios (data)
// ------------------------------------------------------------
// Per-sport, per-skill golden cases for the deterministic engine. Kept in a
// plain module (not a *.test.ts) so BOTH the Jest evaluation suite and the
// admin "run sample athlete scenarios" surface can import the same data.
//
// Each scenario asserts the engine's stable behaviour: expected diagnosis
// family, confidence band, urgency, and whether AI escalation should fire.
// ============================================================

import type { DiagnosisScenario } from './diagnose';

export const GOLDEN_SCENARIOS: DiagnosisScenario[] = [
  // ── Golf ──────────────────────────────────────────────────
  {
    name: 'Golf · beginner slice',
    input: { sport: 'golf', issue: 'slice', skillLevel: 'beginner' },
    expect: { expectedPrimaryFaultIds: ['slice'], expectedConfidenceLabel: 'moderate', shouldEscalate: false },
  },
  {
    name: 'Golf · advanced push',
    input: { sport: 'golf', issue: 'push', skillLevel: 'advanced' },
    expect: { expectedPrimaryFaultIds: ['push'], shouldEscalate: false },
  },
  {
    name: 'Golf · fat wedge shots',
    input: { sport: 'golf', issue: 'fat', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['fat_contact'], shouldEscalate: false, expectedUrgency: 'high' },
  },
  {
    name: 'Golf · toe-strike pattern',
    input: { sport: 'golf', issue: 'toe', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['toe_strike'], shouldEscalate: false },
  },
  {
    name: 'Golf · driver pop-up',
    input: { sport: 'golf', issue: 'pop_up', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['sky_pop_up'], shouldEscalate: false },
  },
  {
    name: 'Golf · shank, fix already failed twice (escalate)',
    input: { sport: 'golf', issue: 'shank', skillLevel: 'intermediate', priorFailedAttempts: 2 },
    expect: { expectedPrimaryFaultIds: ['shank'], shouldEscalate: true, expectedUrgency: 'high' },
  },
  {
    name: 'Golf · contradictory slice + hook (low confidence, escalate)',
    input: { sport: 'golf', issue: 'slice', symptoms: ['hook'], skillLevel: 'intermediate' },
    expect: { expectedConfidenceLabel: 'low', shouldEscalate: true },
  },

  // ── Baseball / Softball ───────────────────────────────────
  {
    name: 'Slow-pitch · pop-up',
    input: { sport: 'softball_slow', issue: 'pop_up', skillLevel: 'beginner' },
    expect: { expectedPrimaryFaultIds: ['pop_up'], shouldEscalate: false },
  },
  {
    name: 'Baseball · late contact',
    input: { sport: 'baseball', issue: 'late', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['late_contact_bat'], shouldEscalate: false },
  },
  {
    name: 'Slow-pitch · rollover grounders',
    input: { sport: 'softball_slow', issue: 'rollover', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['rollover_grounder'], shouldEscalate: false },
  },
  {
    name: 'Baseball · weak opposite-field contact',
    input: { sport: 'baseball', issue: 'weak_oppo', skillLevel: 'advanced' },
    expect: { expectedPrimaryFaultIds: ['weak_oppo_contact'], shouldEscalate: false },
  },
  {
    name: 'Baseball · good contact but low carry',
    input: { sport: 'baseball', issue: 'low_carry', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['low_carry_good_contact'], shouldEscalate: false },
  },
  {
    name: 'Fast-pitch · under-cutting the ball',
    input: { sport: 'softball_fast', issue: 'undercut', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['undercut_ball'], shouldEscalate: false },
  },

  // ── Tennis / Pickleball / Padel ───────────────────────────
  {
    name: 'Tennis · late forehand',
    input: { sport: 'tennis', issue: 'late', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['late_contact_racket'], shouldEscalate: false },
  },
  {
    name: 'Pickleball · net-heavy errors',
    input: { sport: 'pickleball', issue: 'net_errors', skillLevel: 'beginner' },
    expect: { expectedPrimaryFaultIds: ['net_errors'], shouldEscalate: false },
  },
  {
    name: 'Tennis · long errors',
    input: { sport: 'tennis', issue: 'long_errors', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['long_errors'], shouldEscalate: false },
  },
  {
    name: 'Tennis · poor recovery positioning',
    input: { sport: 'tennis', issue: 'poor_recovery', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['poor_recovery'], shouldEscalate: false },
  },
  {
    name: 'Padel · weak serve',
    input: { sport: 'padel', issue: 'weak_serve', skillLevel: 'intermediate' },
    expect: { expectedPrimaryFaultIds: ['weak_serve'], shouldEscalate: false },
  },
  {
    name: 'Tennis · mishit under pressure',
    input: { sport: 'tennis', issue: 'under_pressure', skillLevel: 'advanced' },
    expect: { expectedPrimaryFaultIds: ['mishit_under_pressure'], shouldEscalate: false },
  },
];
