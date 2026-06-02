'use client';

// ============================================================
// SwingIQ — Start Here Flow
// ------------------------------------------------------------
// Guided, account-free, mobile-first onboarding. Gets a first-time
// user one useful, HONESTLY-LABELLED result in under three minutes:
//   sport → who you are → how to start → a couple of questions →
//   top issue + confidence + evidence + 3 drills + 7-day plan +
//   clear next actions.
//
// Trust by design:
//   - The quick result is an estimate from self-reported answers.
//     We say so, show confidence, and explain what would improve it.
//   - No video pixels are analysed on this path; we state that.
//   - Returning visitors get a "Welcome back" resume panel.
//
// Persistence is deliberately light: it sets the active sport, marks
// onboarding complete, and writes its OWN swingiq-start-here-v1
// record. It does NOT modify the main store schema, backup, or
// export/import.
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
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { EmailCapture } from '@/components/email/EmailCapture';
import { useSport } from '@/contexts/SportContext';
import { useSwingIQStore } from '@/store';
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
  const { setActiveSport } = useSport();
  const updateSettings = useSwingIQStore((s) => s.updateSettings);

  const [step, setStep] = useState<Step>('sport');
  const [sportId, setSportId] = useState<OnboardingSportId | ''>('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [method, setMethod] = useState<InputMethod | ''>('');
  const [symptom, setSymptom] = useState('');
  const [skill, setSkill] = useState<StartSkillLevel | ''>('');
  const [result, setResult] = useState<QuickResult | null>(null);
  const [error, setError] = useState('');
  const [returning, setReturning] = useState<StartHereRecord | null>(null);

  const sport = sportId ? getSport(sportId) : undefined;
  const selectedMethod = useMemo(
    () => INPUT_METHODS.find((m) => m.value === method),
    [method],
  );

  // Load returning-user record once on mount (client only).
  useEffect(() => {
    setReturning(loadStartHere());
  }, []);

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
    setSportId('');
    setUserType('');
    setMethod('');
    setSymptom('');
    setSkill('');
    setResult(null);
    setError('');
  }

  function handleSportContinue() {
    if (!sportId) {
      setError('Please choose your sport to continue.');
      return;
    }
    setError('');
    setActiveSport(sportId as SportId);
    track(ANALYTICS_EVENTS.SPORT_SELECTED, { sport: sportId, context: 'start_here' });
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
    if (method === 'quiz') {
      track(ANALYTICS_EVENTS.QUIZ_STARTED, { tool: 'start_here', sport: sportId });
      setStep('questions');
    } else {
      setStep('handoff');
    }
  }

  function handleSeeResult() {
    if (!sportId || !symptom || !skill || !userType) {
      setError('Please answer both questions to see your result.');
      return;
    }
    const built = buildQuickResult({
      sportId,
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

    setStep('result');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Compass size={20} aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wide">Start Here</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
          Get your first result in a few minutes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No account, no credit card. Your answers stay on this device.
        </p>
      </header>

      {/* Returning-user welcome back (shown on the first step) */}
      {returning && step === 'sport' && (
        <section
          aria-label="Welcome back"
          className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-5"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={18} aria-hidden="true" />
            <h2 className="text-base font-bold">Welcome back</h2>
          </div>
          <p className="mt-2 text-sm text-primary">
            Last time you focused on <strong>{returning.focus}</strong> in{' '}
            <strong>{returning.emoji} {returning.sportLabel}</strong>.
            {returning.retestDate && (
              <> Your retest reminder is set for <strong>{formatDate(returning.retestDate)}</strong>.</>
            )}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard"
              onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: 'start_here_resume' })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              Pick up where you left off
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setReturning(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              Start a new quick result
            </button>
          </div>
        </section>
      )}

      {/* Progress */}
      {showProgress && (
        <p className="mb-4 text-xs font-medium text-muted-foreground" aria-live="polite">
          Step {stepIndex + 1} of {QUIZ_STEPS.length}
        </p>
      )}

      {/* ── Step 1: Sport ── */}
      {step === 'sport' && (
        <section aria-labelledby="step-sport" className="rounded-2xl border border-border bg-card p-5">
          <h2 id="step-sport" className="mb-3 text-lg font-bold text-foreground">
            Which sport are you working on?
          </h2>
          <SportCardGrid
            selectedSport={(sportId || undefined) as SportId | undefined}
            onSelect={(id) => setSportId(id as OnboardingSportId)}
          />
          {error && <p role="alert" className="mt-3 text-sm font-medium text-error">{error}</p>}
          <div className="mt-5 flex justify-end">
            <PrimaryButton onClick={handleSportContinue} disabled={!sportId}>
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
            This tailors the tone and safety reminders. It doesn&apos;t change your privacy — everything stays on this device.
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
              SwingIQ is built for parent-guided youth practice. We&apos;ll keep tips encouraging and safety-first.
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
                SwingIQ labels every result with what it&apos;s based on and a confidence level. Visual or
                mechanical conclusions are shown as estimates unless they come from measured data or sensor input.
              </span>
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={selectedMethod.href}
              onClick={() => track(ANALYTICS_EVENTS.CTA_CLICKED, { cta: `start_here_${selectedMethod.value}` })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
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
        showSafetyNotice={false}
      />

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

      {/* Next actions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold text-foreground">What next?</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <NextAction href="/dashboard" cta="start_here_dashboard" primary>Go to my dashboard</NextAction>
          <NextAction href="/training" cta="start_here_training">Start my practice plan</NextAction>
          <NextAction href="/video" cta="start_here_video">Upload a swing video</NextAction>
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

      <NotCoachReplacementNotice />
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
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:bg-muted disabled:text-muted-foreground"
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
          ? 'bg-primary text-white hover:bg-primary'
          : 'border border-border text-foreground hover:border-primary/50 hover:bg-primary/10'
      }`}
    >
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
