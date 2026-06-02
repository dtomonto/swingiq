'use client';

// ============================================================
// SwingIQ — AI Visual Analysis Panel
// Renders the validated, video-grounded result from the AI vision
// model: summary, what was clearly visible, video-quality limits,
// mechanical priorities (with evidence + confidence), a practice plan,
// and next-capture guidance.
// ============================================================

import {
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  Sparkles,
  Camera,
  ChevronRight,
  Award,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AIVisualAnalysis,
  VisibilityQuality,
  ConfidenceLevel,
  VideoQualityCheck,
} from '@swingiq/core';

// ──────────────────────────────────────────────────────────────
// Visual helpers
// ──────────────────────────────────────────────────────────────

const QUALITY_STYLES: Record<VisibilityQuality, string> = {
  excellent: 'bg-primary/10 text-primary border-primary/30',
  good: 'bg-primary/10 text-primary border-primary/30',
  limited: 'bg-warning/10 text-warning border-warning/30',
  poor: 'bg-error/10 text-error border-error/30',
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-primary/10 text-primary border-primary/30',
  moderate: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-muted text-muted-foreground border-border',
};

function QualityChip({ quality }: { quality: VisibilityQuality }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-sm border capitalize',
        QUALITY_STYLES[quality],
      )}
    >
      {quality}
    </span>
  );
}

function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-sm border capitalize',
        CONFIDENCE_STYLES[level],
      )}
    >
      {level} confidence
    </span>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

const QUALITY_ROWS: { key: keyof VideoQualityCheck; label: string }[] = [
  { key: 'cameraAngle', label: 'Camera angle' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'bodyVisibility', label: 'Body visibility' },
  { key: 'swingVisibility', label: 'Swing visibility' },
];

// ──────────────────────────────────────────────────────────────
// Panel
// ──────────────────────────────────────────────────────────────

export function AIVisualAnalysisPanel({ analysis }: { analysis: AIVisualAnalysis }) {
  const vq = analysis.videoQuality;
  const confidencePct = Math.round(analysis.overallConfidence * 100);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Section
        icon={<Sparkles className="w-4 h-4 text-golf-fairway" />}
        title="AI Visual Mechanics Summary"
      >
        <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
        <div className="flex items-center gap-2 mt-3">
          <QualityChip quality={analysis.visibilityQuality} />
          <span className="text-xs text-muted-foreground">
            Overall confidence: <span className="font-semibold text-foreground">{confidencePct}%</span>
          </span>
        </div>
      </Section>

      {/* What was clearly visible */}
      <Section
        icon={<CheckCircle className="w-4 h-4 text-primary" />}
        title="What SwingIQ Could Clearly See"
      >
        <ul className="space-y-2">
          {analysis.whatWasClearlyVisible.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground">
              <span className="text-primary font-bold mt-0.5 shrink-0">·</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* What you're doing well (strengths) — only if the AI found evidence-backed ones */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Section
          icon={<Award className="w-4 h-4 text-golf-fairway" />}
          title="What You're Doing Well"
        >
          <ul className="space-y-3">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="rounded-xl border border-golf-fairway/20 bg-golf-fairway/5 p-3">
                <p className="text-sm font-semibold text-foreground flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-golf-fairway shrink-0 mt-0.5" />
                  {s.strength}
                </p>
                <p className="text-xs text-muted-foreground mt-1 pl-6">{s.evidenceFromVideo}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Key swing moments timeline — the phases the AI detected/estimated */}
      {analysis.detectedPhases && analysis.detectedPhases.length > 0 && (
        <Section
          icon={<Film className="w-4 h-4 text-accent-secondary" />}
          title="Key Swing Moments"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Moments the AI identified across your swing, in order. These are estimated from the
            sampled frames — not exact, measured timestamps.
          </p>
          <ol className="relative border-l border-border ml-2 space-y-4">
            {analysis.detectedPhases.map((phase, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full bg-accent-secondary ring-4 ring-card" />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground capitalize">{phase.phaseName}</p>
                  <ConfidenceChip level={phase.confidence} />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{phase.observation}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Video quality / visibility limits */}
      <Section
        icon={<Camera className="w-4 h-4 text-accent-secondary" />}
        title="Video Quality & Visibility Limits"
      >
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_ROWS.map((row) => {
            const cell = vq[row.key] as { quality: VisibilityQuality; note: string };
            return (
              <div key={row.key} className="rounded-lg border border-border bg-muted p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                  <QualityChip quality={cell.quality} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{cell.note}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {vq.contactVisible ? (
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            )}
            Contact {vq.contactVisible ? 'was visible' : 'not clearly visible'}
          </span>
          <span className="inline-flex items-center gap-1">
            {vq.fullMotionCaptured ? (
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            )}
            Full motion {vq.fullMotionCaptured ? 'captured' : 'partially captured'}
          </span>
        </div>
        <div className="flex items-start gap-2 mt-3 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20 p-2.5">
          <Info className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-accent-secondary">{vq.nextCaptureRecommendation}</p>
        </div>
      </Section>

      {/* Top priorities */}
      <Section
        icon={<Target className="w-4 h-4 text-error" />}
        title="Top Mechanical Priorities"
      >
        <div className="space-y-3">
          {analysis.topPriorities.map((p, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-golf-fairway text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{p.issue}</h4>
                </div>
                <ConfidenceChip level={p.confidence} />
              </div>
              <dl className="space-y-1.5 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Why it matters</dt>
                  <dd className="text-foreground">{p.whyItMatters}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Evidence from your video</dt>
                  <dd className="text-foreground">{p.evidenceFromVideo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Corrective focus</dt>
                  <dd className="text-foreground">{p.correctiveFocus}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      {/* Practice plan */}
      <Section
        icon={<Sparkles className="w-4 h-4 text-accent-secondary" />}
        title="Personalized Practice Plan"
      >
        <div className="space-y-3">
          {analysis.practicePlan.map((d, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{d.name}</p>
              <p className="text-sm text-foreground mt-1">{d.purpose}</p>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg bg-muted border border-border p-2.5">
                  <p className="text-xs font-semibold text-muted-foreground">Reps / duration</p>
                  <p className="text-sm text-foreground">{d.repsOrDuration}</p>
                </div>
                <div className="rounded-lg bg-golf-fairway/5 border border-golf-fairway/20 p-2.5">
                  <p className="text-xs font-semibold text-golf-fairway">You&apos;re doing it right when…</p>
                  <p className="text-sm text-foreground">{d.howToKnowCorrect}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Next upload */}
      <Section
        icon={<Camera className="w-4 h-4 text-foreground" />}
        title="Your Next Upload — How to Capture It"
      >
        <ul className="space-y-2 text-sm text-foreground">
          {[
            ['Camera angle', analysis.nextUpload.cameraAngle],
            ['Framing', analysis.nextUpload.framing],
            ['Lighting', analysis.nextUpload.lighting],
            ['Distance', analysis.nextUpload.distance],
            ['Sport notes', analysis.nextUpload.sportNotes],
          ].map(([label, value]) => (
            <li key={label} className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold text-foreground">{label}:</span> {value}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Provenance footer */}
      <div className="rounded-xl bg-muted border border-border p-3">
        <p className="text-xs text-muted-foreground">
          Analyzed {analysis.meta.frameCountAnalyzed} frames with {analysis.meta.provider} ·{' '}
          {analysis.meta.model} · schema v{analysis.meta.schemaVersion}. AI-generated guidance from
          your video frames — helpful for self-coaching, not a substitute for an in-person coach.
        </p>
      </div>
    </div>
  );
}
