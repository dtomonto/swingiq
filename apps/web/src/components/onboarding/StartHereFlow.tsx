'use client';

// ============================================================
// SwingVantage — Start Here Flow
// ------------------------------------------------------------
// Guided, account-free, mobile-first onboarding. Gets a first-time
// user one useful, HONESTLY-LABELLED result in under three minutes:
//   sport(s) → who you are → how to start → a couple of questions →
//   top issue + confidence + evidence + 3 drills + 7-day plan +
//   clear next actions.
//
// Multi-sport: an athlete can pick EVERY sport they play. We save
// the whole set, then start with one "primary" sport for the first
// result. They can switch sports anytime from the sidebar.
//
// Returning users can bypass intake entirely via the "skip setup"
// link and the richer Welcome Back panel.
//
// Trust by design:
//   - The quick result is an estimate from self-reported answers.
//     We say so, show confidence, and explain what would improve it.
//   - No video pixels are analysed on this path; we state that.
//
// Persistence is deliberately light: it sets the active + selected
// sports, marks onboarding complete, and writes its OWN
// swingiq-start-here-v1 record. It does NOT modify the main store
// schema, backup, or export/import.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Info,
  Sparkles,
} from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { SportCardGrid } from '@/components/sport/SportSelector';
import { ChoiceGroup } from '@/components/tools/fields';
import { ConfidenceBadge } from '@/components/agents/ConfidenceBadge';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { DeterministicWhyPanel } from '@/components/report/DeterministicWhyPanel';
import { DeterministicPlanCard } from '@/components/report/DeterministicPlanCard';
import { trackDeterministicAnalysis } from '@/lib/intelligence/analytics';
import { EmailCapture } from '@/components/email/EmailCapture';
import { useSport } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  USER_TYPES,
  SKILL_LEVELS,
  INPUT_METHODS,
  getSport,
  buildQuickResult,
  type OnboardingSportId,
  type UserType,
  type InputMethod,
  type StartSkillLevel,
  type QuickResult,
} from '@/lib/onboarding/quickStart';
import {
  loadStartHere,
  saveStartHere,
  type StartHereRecord,
} from '@/lib/onboarding/storage';
import { getTone, toneFromUserType } from '@/lib/coaching/tones';

type Step = 'sport' | 'about' | 'method' | 'questions' | 'result' | 'handoff';

const QUIZ_STEPS: Step[] = ['sport', 'about', 'method', 'questions', 'result'];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function StartHereFlow() {
  const { setActiveSport, setSelectedSports } = useSport();
  const updateSettings = useSwingVantageStore((s) => s.updateSettings);
  const onboardingComplete = useSwingVantageStore((s) => s.settings.onboarding_complete);

  const [step, setStep] = useState<Step>('sport');
  // Multi-sport: the athlete can pick every sport they play. `primarySport`
  // is the one we build the first result for.
  const [sportIds, setSportIds] = useState<OnboardingSportId[]>([]);
  const [primarySport, setPrimarySport] = useState<OnboardingSportId | ''>('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [method, setMethod] = useState<InputMethod | ''>('');
  const [symptom, setSymptom] = useState('');
  const [skill, setSkill] = useState<StartSkillLevel | ''>('');
  const [result, setResult] = useState<QuickResult | null>(null);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState<StartHereRecord | null>(null);

  const sport = primarySport ? getSport(primarySport) : undefined;
  const selectedMethod = useMemo(
    () => INPUT_METHODS.find((m) => m.value === method),
    [method],
  );

  // Load returning-user record once on mount (client only).
  useEffect(() => {
    setReturning(loadStartHere());
  }, []);

  // Deep-link preselect: /start?sport=<id> from the homepage persona
  // cards / sport hubs. Client-only (reads window) so no Suspense
  // boundary is required. Jumps straight to the "about you" step with
  // the chosen sport already selected.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('sport');
    if (!param) return;
    const id = param as OnboardingSportId;
    if (!getSport(id)) return;
    setSportIds([id]);
    setPrimarySport(id);
    setSelectedSports([id] as SportId[]);
    setActiveSport(id as SportId);
    setStep('about');
    track(ANALYTICS_EVENTS.SPORT_SELECTED, { sport: id, context: 'start_here_deeplink' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A returning user is anyone who has finished setup before or has a
  // saved quick-start record — they can skip intake.
  const isReturningUser = onboardingComplete || returning !== null;

  // Progress label (quiz path only — handoff path is shorter).
  const stepIndex = QUIZ_STEPS.indexOf(step);
  const showProgress = stepIndex >= 0;

  function goBack() {
    setError('');
    if (step === 'about') setStep('sport');
    else if (step === 'method') setStep('about');
    else if (step === 'questions') setStep('method');
    else if (step === 'handoff') setStep('method');
    else if (step === 'result') setStep('questions');
  }

  function restart() {
    setStep('sport');
    setSportIds([]);
    setPrimarySport('');
    setUserType('');
    setMethod('');
    setSymptom('');
    setSkill('');
    setResult(null);
    setError('');
  }

  function toggleSport(id: OnboardingSportId) {
    setError('');
    setSportIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((s) => s !== id);
        // If we removed the current primary, re-point it.
        setPrimarySport((p) => (p === id ? (next[0] ?? '') : p));
        return next;
      }
      const next = [...prev, id];
      // First pick becomes the default primary.
      setPrimarySport((p) => (p === '' ? id : p));
      return next;
    });
  }

  function handleSportContinue() {
    if (sportIds.length === 0) {
      setError('Please choose at least one sport to continue.');
      return;
    }
    const primary = (primarySport || sportIds[0]) as OnboardingSportId;
    setError('');
    setPrimarySport(primary);
    // Save the whole multi-sport set, then start with the primary.
    setSelectedSports(sportIds as SportId[]);
    setActiveSport(primary as SportId);
    track(ANALYTICS_EVENTS.SPORT_SELECTED, {
      sport: primary,
      sports: sportIds.join(','),
      sport_count: sportIds.length,
      context: 'start_here',
    });
    track(ANALYTICS_EVENTS.PROFILE_STARTED, { context: 'start_here' });
    setStep('about');
  }

  function handleAboutContinue() {
    if (!userType) {
      setError('Please pick the option that fits you best.');
      return;
    }
    setError('');
    setStep('method');
  }

  function handleMethodContinue() {
    if (!method) {
      setError('Please choose how you would like to start.');
      return;
    }
    setError('');
    track(ANALYTICS_EVENTS.INPUT_METHOD_SELECTED, {
      method,
      sport: primarySport,
      context: 'start_here',
    });
    if (method === 'quiz') {
      track(ANALYTICS_EVENTS.QUIZ_STARTED, { tool: 'start_here', sport: primarySport });
      setStep('questions');
    } else {
      setStep('handoff');
    }
  }

  function handleSeeResult() {
    if (!primarySport || !symptom || !skill || !userType) {
      setError('Please answer both questions to see your result.');
      return;
    }
    const built = buildQuickResult({
      sportId: primarySport,
      symptom,
      userType: userType as UserType,
      skill: skill as StartSkillLevel,
    });
    if (!built) {
      setError('Something went wrong building your result. Please try again.');
      return;
    }
    setError('');
    setResult(built);

    // Persist the lightweight returning-user record + mark onboarding done.
    const record: StartHereRecord = {
      version: 1,
      sportId: built.sportId,
      sportLabel: built.sportLabel,
      emoji: built.emoji,
      userType: built.userType,
      skill: built.skill,
      focus: built.issue,
      confidenceLevel: built.confidence.level,
      drills: built.drills,
      plan: built.plan,
      completedAt: new Date().toISOString(),
      retestDate: built.retestDate,
    };
    saveStartHere(record);
    setReturning(record);
    // Establish the coaching tone from who they told us they are.
    updateSettings({
      onboarding_complete: true,
      coaching_tone: toneFromUserType(built.userType),
    });

    track(ANALYTICS_EVENTS.QUIZ_COMPLETED, { tool: 'start_here', sport: built.sportId });
    track(ANALYTICS_EVENTS.TOOL_RESULT_GENERATED, {
      tool: 'start_here',
      sport: built.sportId,
      issue: built.issue,
    });
    track(ANALYTICS_EVENTS.PROFILE_COMPLETED, { context: 'start_here', sport: built.sportId });

    // Deterministic engine observability — only when it produced a real read.
    if (built.diagnosis) {
      trackDeterministicAnalysis(built.diagnosis, { surface: 'start_here' });
    }

    setStep('result');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary">
            <Compass size={20} aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-wide">Start Here</span>
          </div>
          {/* Returning-user bypass — always available so anyone who has
              used SwingVantage before can skip straight to their dashboard. */}
          <Link
            href="/dashboard"
            onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: 'start_here_skip_setup' })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Used SwingVantage before? Skip setup
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          Get your first result in a few minutes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No account, no credit card needed to start. Sign in anytime to save your progress.
        </p>
      </header>

      {/* Returning-user welcome back (shown on the first step) */}
      {isReturningUser && step === 'sport' && (
        <section
          aria-label="Welcome back"
          className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-5"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} aria-hidden="true" />
            <h2 className="text-base font-bold">Welcome back</h2>
          </div>
          {returning ? (
            <p className="mt-2 text-sm text-primary">
              Last time you focused on <strong>{returning.focus}</strong> in{' '}
              <strong>{returning.emoji} {returning.sportLabel}</strong>.
              {returning.retestDate && (
                <> Your retest reminder is set for <strong>{formatDate(returning.retestDate)}</strong>.</>
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-primary">
              You&apos;re already set up. Jump straight back into your dashboard, or start a fresh quick result below.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard"
              onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: 'start_here_resume' })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
            >
              Pick up where you left off
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => { setReturning(null); updateSettings({ onboarding_complete: false }); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              Start a new quick result
            </button>
          </div>
          <Link
            href="/agi"
            onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: 'start_here_agi' })}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            See your Athlete GI — the one thing to train across all your sports
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>
      )}

      {/* Progress */}
      {showProgress && (
        <p className="mb-4 text-xs font-medium text-muted-foreground" aria-live="polite">
          Step {stepIndex + 1} of {QUIZ_STEPS.length}
        </p>
      )}

      {/* ── Step 1: Sport(s) ── */}
      {step === 'sport' && (
        <section aria-labelledby="step-sport" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="step-sport" className="mb-1 text-lg font-bold text-foreground">
            Which sports are you working on?
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Pick every sport you play — tap as many as you like. You can switch between them anytime, and
            we&apos;ll start with one.
          </p>
          <SportCardGrid
            selectedSports={sportIds as SportId[]}
            onToggle={(id) => toggleSport(id as OnboardingSportId)}
          />

          {/* Primary picker — only when more than one sport is chosen */}
          {sportIds.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Which one do you want to start with?</p>
              <div className="flex flex-wrap gap-2">
                {sportIds.map((id) => {
                  const s = getSport(id);
                  if (!s) return null;
                  const selected = primarySport === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPrimarySport(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:border-primary/50'
                      }`}
                    >
                      <span>{s.emoji}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && <p role="alert" className="mt-3 text-sm font-medium text-error">{error}</p>}
          <div className="mt-5 flex justify-end">
            <PrimaryButton onClick={handleSportContinue} disabled={sportIds.length === 0}>
              Continue
            </PrimaryButton>
          </div>
        </section>
      )}

      {/* ── Step 2: About you ── */}
      {step === 'about' && (
        <section aria-labelledby="step-about" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="step-about" className="mb-3 text-lg font-bold text-foreground">
            Who is this for?
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This tailors the tone and safety reminders. It doesn&apos;t change your privacy — your data is always yours.
          </p>
          <div role="radiogroup" aria-label="Who is this for" className="space-y-2">
            {USER_TYPES.map((u) => {
              const selected = userType === u.value;
              return (
                <button
                  key={u.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setUserType(u.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    selected ? 'border-primary bg-primary/10' : 'border-border hover:border-border'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{u.label}</p>
                    <p className="text-xs text-muted-foreground">{u.sublabel}</p>
                  </div>
                  <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? 'border-primary bg-primary' : 'border-border'}`} />
                </button>
              );
            })}
          </div>
          {userType === 'parent' && (
            <p className="mt-3 rounded-lg bg-accent-secondary/10 p-3 text-xs text-foreground">
              SwingVantage is built for parent-guided youth practice. We&apos;ll keep tips encouraging and safety-first.
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-error">{error}</p>}
          <StepNav onBack={goBack} onNext={handleAboutContinue} nextDisabled={!userType} />
        </section>
      )}

      {/* ── Step 3: How to start ── */}
      {step === 'method' && (
        <section aria-labelledby="step-method" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="step-method" className="mb-3 text-lg font-bold text-foreground">
            How would you like to start?
          </h2>
          <div role="radiogroup" aria-label="How would you like to start" className="space-y-2">
            {INPUT_METHODS.map((m) => {
              const selected = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethod(m.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    selected ? 'border-primary bg-primary/10' : 'border-border hover:border-border'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{m.label}</p>
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{m.timeHint}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-medium text-error">{error}</p>}
          <StepNav onBack={goBack} onNext={handleMethodContinue} nextDisabled={!method} />
        </section>
      )}

      {/* ── Step 4 (quiz): A couple of questions ── */}
      {step === 'questions' && sport && (
        <section aria-labelledby="step-questions" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="step-questions" className="mb-4 text-lg font-bold text-foreground">
            Two quick questions about your {sport.label.toLowerCase()} swing
          </h2>
          <ChoiceGroup
            label={sport.missQuestion}
            name="symptom"
            value={symptom}
            onChange={setSymptom}
            choices={sport.outcomes.map((o) => ({ value: o.value, label: o.label }))}
          />
          <ChoiceGroup
            label="How would you describe your experience?"
            name="skill"
            value={skill}
            onChange={(v) => setSkill(v as StartSkillLevel)}
            choices={SKILL_LEVELS}
          />
          {error && <p role="alert" className="mt-1 mb-2 text-sm font-medium text-error">{error}</p>}
          <StepNav onBack={goBack} onNext={handleSeeResult} nextLabel="See my result" nextDisabled={!symptom || !skill} />
        </section>
      )}

      {/* ── Handoff (non-quiz methods) ── */}
      {step === 'handoff' && selectedMethod && selectedMethod.href !== 'inline' && (
        <section aria-labelledby="step-handoff" className="rounded-2xl border border-primary/30 bg-card p-5">
          <h2 id="step-handoff" className="mb-2 text-lg font-bold text-foreground">
            {selectedMethod.label}
          </h2>
          <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
          <div className="mt-4 rounded-xl bg-warning/10 p-4 text-xs text-warning">
            <p className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                SwingVantage labels every result with what it&apos;s based on and a confidence level. Visual or
                mechanical conclusions are shown as estimates unless they come from measured data or sensor input.
              </span>
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={selectedMethod.href}
              onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: `start_here_${selectedMethod.value}` })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary"
            >
              Continue
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => { setMethod('quiz'); setStep('questions'); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Just answer a couple of questions instead
            </button>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back
          </button>
        </section>
      )}

      {/* ── Step 5: Result ── */}
      {step === 'result' && result && (
        <ResultView
          result={result}
          onRestart={restart}
        />
      )}
    </div>
  );
}

// ── Result view ───────────────────────────────────────────────

function ResultView({ result, onRestart }: { result: QuickResult; onRestart: () => void }) {
  const sport = getSport(result.sportId);
  const tone = getTone(toneFromUserType(result.userType));
  return (
    <section aria-live="polite" className="space-y-4">
      {/* Headline */}
      <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            {result.emoji} {result.sportLabel}
          </p>
          <ConfidenceBadge confidence={result.confidence} showReason={false} />
        </div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Your top thing to work on first
        </p>
        <h2 className="mt-1 text-xl font-bold text-foreground">{result.issue}</h2>
        <div className="mt-3 rounded-xl bg-warning/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Why it matters</p>
          <p className="mt-1 text-foreground">{result.whyItMatters}</p>
        </div>
      </div>

      {/* Coaching mode framing (tone-aware) */}
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <p className="text-xs font-semibold text-primary">Coaching mode: {tone.label}</p>
        <p className="mt-1 text-sm text-primary">{tone.resultIntro}</p>
        {tone.note && <p className="mt-2 text-xs text-primary">{tone.note}</p>}
        <p className="mt-2 text-[11px] text-primary">You can change this in Settings → Coaching Preferences.</p>
      </div>

      {/* Transparency: what this is based on (shared, reusable panel) */}
      <AnalysisTransparency
        basedOn={result.evidence}
        videoAnalyzed={result.videoAnalyzed}
        confidence={result.confidence}
        whatImproves={result.whatImproves}
      />

      {/* Deterministic engine's explainable read (collapsed by default) —
          ranked cause, evidence, alternatives and an honest "deeper look" note.
          Renders only when the engine confidently matched a curated cause. */}
      {result.diagnosis && (
        <>
          <DeterministicWhyPanel diagnosis={result.diagnosis} />
          <DeterministicPlanCard diagnosis={result.diagnosis} surface="start_here" />
        </>
      )}

      {/* Drills */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-foreground">Three beginner-safe drills</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {result.drills.map((d) => (
            <li key={d} className="flex gap-2"><span className="text-primary">•</span>{d}</li>
          ))}
        </ul>
      </div>

      {/* 7-day plan */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-foreground">Your 7-day practice plan</h3>
        <ul className="mt-2 space-y-1 text-sm text-foreground">
          {result.plan.map((p) => <li key={p}>{p}</li>)}
        </ul>
        {result.retestDate && (
          <p className="mt-3 text-xs font-medium text-primary">
            Retest reminder saved for {formatDate(result.retestDate)}.
          </p>
        )}
      </div>

      {/* Email the plan (honest: no fake success if no provider) */}
      {sport && (
        <EmailCapture
          source={sport.leadSource}
          heading="Email me this plan"
          subheading="Your plan plus a day-7 retest reminder."
          meta={{ sport: result.sportId, tool: 'start_here' }}
        />
      )}

      {/* Primary next step — lead with the single highest-value action: turn
          this self-reported estimate into a real, MEASURED analysis. One clear
          step beats a wall of equal options at the activation moment. */}
      <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Recommended next step</p>
        <h3 className="mt-1 text-lg font-bold text-foreground">Now make it measured</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          That read came from your answers. Let SwingVantage watch a real swing in 3D — Motion Lab gives you a
          measured breakdown with phase-by-phase detail, not an estimate.
        </p>
        <Link
          href="/motion-lab"
          onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: 'start_here_motion_lab', context: 'start_here_result' })}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90 sm:w-auto"
        >
          Analyze a real swing in Motion Lab
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          A free account unlocks the full measured analysis and saves your progress — it takes a few seconds.
        </p>
      </div>

      {/* Secondary actions — demoted so they don't compete with the recommended step */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold text-foreground">Or keep going another way</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <NextAction href="/video" cta="start_here_video">Upload a swing video</NextAction>
          <NextAction href="/training" cta="start_here_training">Start my practice plan</NextAction>
          <NextAction href="/dashboard" cta="start_here_dashboard">Go to my dashboard</NextAction>
          <NextAction href="/ai-coach" cta="start_here_ai_coach">Ask your AI coach</NextAction>
          <NextAction href="/sessions/import" cta="start_here_import">Import my data</NextAction>
          {result.userType === 'coach' && (
            <NextAction href="/reports" cta="start_here_coach">Build a coach summary</NextAction>
          )}
          <NextAction href="/data" cta="start_here_data">View my Data Center</NextAction>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={15} aria-hidden="true" /> Try another sport
        </button>
      </div>
    </section>
  );
}

// ── Small building blocks ─────────────────────────────────────

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary disabled:bg-muted disabled:text-muted-foreground"
    >
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Back
      </button>
      <PrimaryButton onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </PrimaryButton>
    </div>
  );
}

function NextAction({
  href,
  cta,
  children,
  primary,
}: {
  href: string;
  cta: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta })}
      className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
        primary
          ? 'bg-primary text-primary-foreground hover:bg-primary'
          : 'border border-border text-foreground hover:border-primary/50 hover:bg-primary/10'
      }`}
    >
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
