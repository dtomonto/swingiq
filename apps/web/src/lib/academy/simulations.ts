// ============================================================
// SwingVantage Academy — advanced simulations (Phase 6)
// ------------------------------------------------------------
// Support-ticket / sales-roleplay / coach-demo / explain-feedback
// exercises with an HONEST, deterministic rubric evaluator. The
// learner writes a free-text response; we score it against the
// rubric (term coverage) and flag guardrail violations (medical
// claims, guarantees, AI-accuracy overpromises). No hallucination,
// no API key required — upgradeable to an LLM reviewer later.
// ============================================================

export type SimulationKind = 'support' | 'sales' | 'coach' | 'feedback';

export interface RubricCriterion {
  id: string;
  label: string;
  /** Met if the response contains ANY of these (lowercased) terms. */
  anyOf: string[];
  hint: string;
}

export interface Simulation {
  id: string;
  kind: SimulationKind;
  title: string;
  persona: string;
  scenario: string;
  prompt: string;
  passThreshold: number;
  rubric: RubricCriterion[];
}

export interface CriterionResult { id: string; label: string; met: boolean; hint: string }

export interface SimEvaluation {
  score: number;
  passed: boolean;
  results: CriterionResult[];
  redFlags: string[];
  summary: string;
}

/** Guardrail phrases that should never appear in a compliant response. */
const RED_FLAGS: { term: string; why: string }[] = [
  { term: 'guarantee', why: 'Avoid guaranteed-outcome claims.' },
  { term: 'cure', why: 'No medical / cure claims.' },
  { term: 'diagnos', why: 'Don’t diagnose injuries or conditions.' },
  { term: 'will heal', why: 'No injury-healing claims.' },
  { term: '100% accurate', why: 'Don’t overpromise AI accuracy.' },
];

export function evaluateResponse(sim: Simulation, text: string): SimEvaluation {
  const t = text.toLowerCase();
  const results: CriterionResult[] = sim.rubric.map((c) => ({
    id: c.id, label: c.label, hint: c.hint,
    met: c.anyOf.some((p) => t.includes(p)),
  }));
  const met = results.filter((r) => r.met).length;
  const redFlags = [...new Set(RED_FLAGS.filter((f) => t.includes(f.term)).map((f) => f.why))];

  const base = Math.round((met / sim.rubric.length) * 100);
  const score = redFlags.length ? Math.max(0, base - 40) : base;
  const passed = score >= sim.passThreshold && redFlags.length === 0 && t.trim().length > 20;

  const summary = redFlags.length
    ? 'Contains a guardrail issue — revise before this would pass.'
    : passed
      ? 'Strong, compliant response.'
      : t.trim().length <= 20
        ? 'Write a fuller response to be evaluated.'
        : 'Good start — cover the missing points to pass.';

  return { score, passed, results, redFlags, summary };
}

export const SIMULATIONS: Simulation[] = [
  {
    id: 'sim-support-ticket', kind: 'support', title: 'Resolve a support ticket', passThreshold: 75,
    persona: 'Frustrated softball user',
    scenario: 'Ticket: "I uploaded my softball swing but the feedback makes no sense and seems random. Is your app broken?"',
    prompt: 'Write the reply you would send, following the triage playbook.',
    rubric: [
      { id: 'empathy', label: 'Acknowledges warmly without overpromising', anyOf: ['sorry', 'understand', 'frustrat', 'happy to help', 'thanks', 'appreciate'], hint: 'Open with empathy.' },
      { id: 'input', label: 'Checks input quality (angle/framing/lighting)', anyOf: ['angle', 'frame', 'framing', 'lighting', 're-record', 'record again', 'side-on', 'in frame'], hint: 'The #1 cause is the camera angle/framing/lighting.' },
      { id: 'privacy', label: 'States the frames-only / on-device privacy fact', anyOf: ['frames', 'on your device', 'stays on', 'not uploaded', 'only sampled'], hint: 'Only sampled frames are sent; the full video stays on device.' },
      { id: 'next', label: 'Gives a clear next step / escalation path', anyOf: ['could you', 'try', 'reply', 'escalat', 'follow up', 'next'], hint: 'End with a concrete next step.' },
    ],
  },
  {
    id: 'sim-sales-objection', kind: 'sales', title: 'Handle a sales objection', passThreshold: 66,
    persona: 'Skeptical prospect',
    scenario: 'Prospect: "Isn’t this just a video app? I can already record my swing on my phone."',
    prompt: 'Write your spoken response.',
    rubric: [
      { id: 'reframe', label: 'Reframes to AI coaching / prioritization', anyOf: ['coach', 'coaching', 'prioriti', 'one thing', 'next fix', 'what to work on', 'ai'], hint: 'Lead with "tells you the one thing to work on".' },
      { id: 'multisport', label: 'Mentions multi-sport breadth', anyOf: ['multi-sport', 'multiple sports', 'golf', 'tennis', 'baseball', 'softball'], hint: 'Multi-sport in one app is a differentiator.' },
      { id: 'privacy-progress', label: 'Notes privacy and/or progress tracking', anyOf: ['privacy', 'private', 'device', 'progress', 'track', 'retest'], hint: 'Privacy + progress tracking are real differentiators.' },
    ],
  },
  {
    id: 'sim-coach-demo', kind: 'coach', title: 'Demo for a youth coach', passThreshold: 66,
    persona: 'Busy youth coach with 12 athletes',
    scenario: 'You have 5 minutes to show a coach who wants to give each of 12 athletes one clear thing to work on.',
    prompt: 'Write your demo opener and outline.',
    rubric: [
      { id: 'jtbd', label: 'Opens with the coach’s job-to-be-done', anyOf: ['time', '12', 'each', 'one', 'priority', 'manage', 'limited'], hint: 'Open with their goal, not a feature list.' },
      { id: 'dashboard', label: 'Shows the roster / coach dashboard', anyOf: ['dashboard', 'roster', 'players', 'athletes', 'group'], hint: 'Show managing many athletes.' },
      { id: 'youth', label: 'Addresses youth privacy', anyOf: ['privacy', 'private', 'not public', 'youth', 'minor'], hint: 'Keep minors’ data private; no public comparison.' },
      { id: 'next', label: 'Ends with a next step', anyOf: ['trial', 'next step', 'sign up', 'get started', 'start'], hint: 'Close with a concrete next step.' },
    ],
  },
  {
    id: 'sim-explain-feedback', kind: 'feedback', title: 'Explain AI feedback to a beginner', passThreshold: 75,
    persona: 'Overwhelmed beginner',
    scenario: 'User: "There are so many numbers, I don’t know what to do."',
    prompt: 'Write what you would say.',
    rubric: [
      { id: 'one-priority', label: 'Leads with one priority', anyOf: ['one', 'single', 'priority', 'first', 'start with', 'focus'], hint: 'Name the single top issue.' },
      { id: 'one-drill', label: 'Gives one action/drill', anyOf: ['drill', 'work on', 'practice', 'try this'], hint: 'One drill, not a list.' },
      { id: 'confidence', label: 'Frames confidence honestly', anyOf: ['estimate', 'confidence', 'sharpen', 'more data', 'gets better'], hint: 'Confidence is an honesty feature.' },
      { id: 'safe', label: 'Stays encouraging / suggests a pro when needed', anyOf: ['great', 'nice', 'coach', 'professional', 'encourag', 'you’ve got'], hint: 'Encourage; mention a coach/pro for deeper needs.' },
    ],
  },
];

export const getSimulation = (id: string): Simulation | undefined =>
  SIMULATIONS.find((s) => s.id === id);
