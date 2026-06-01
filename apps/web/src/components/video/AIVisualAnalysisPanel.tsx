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
  excellent: 'bg-green-50 text-green-700 border-green-200',
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  limited: 'bg-amber-50 text-amber-700 border-amber-200',
  poor: 'bg-red-50 text-red-700 border-red-200',
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-green-50 text-green-700 border-green-200',
  moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-50 text-gray-600 border-gray-200',
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
    <section className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
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
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
        <div className="flex items-center gap-2 mt-3">
          <QualityChip quality={analysis.visibilityQuality} />
          <span className="text-xs text-gray-500">
            Overall confidence: <span className="font-semibold text-gray-700">{confidencePct}%</span>
          </span>
        </div>
      </Section>

      {/* What was clearly visible */}
      <Section
        icon={<CheckCircle className="w-4 h-4 text-green-600" />}
        title="What SwingIQ Could Clearly See"
      >
        <ul className="space-y-2">
          {analysis.whatWasClearlyVisible.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-green-500 font-bold mt-0.5 shrink-0">·</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Video quality / visibility limits */}
      <Section
        icon={<Camera className="w-4 h-4 text-blue-600" />}
        title="Video Quality & Visibility Limits"
      >
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_ROWS.map((row) => {
            const cell = vq[row.key] as { quality: VisibilityQuality; note: string };
            return (
              <div key={row.key} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-600">{row.label}</span>
                  <QualityChip quality={cell.quality} />
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{cell.note}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1">
            {vq.contactVisible ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
            Contact {vq.contactVisible ? 'was visible' : 'not clearly visible'}
          </span>
          <span className="inline-flex items-center gap-1">
            {vq.fullMotionCaptured ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
            Full motion {vq.fullMotionCaptured ? 'captured' : 'partially captured'}
          </span>
        </div>
        <div className="flex items-start gap-2 mt-3 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{vq.nextCaptureRecommendation}</p>
        </div>
      </Section>

      {/* Top priorities */}
      <Section
        icon={<Target className="w-4 h-4 text-red-600" />}
        title="Top Mechanical Priorities"
      >
        <div className="space-y-3">
          {analysis.topPriorities.map((p, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-golf-fairway text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-gray-900">{p.issue}</h4>
                </div>
                <ConfidenceChip level={p.confidence} />
              </div>
              <dl className="space-y-1.5 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-gray-500">Why it matters</dt>
                  <dd className="text-gray-700">{p.whyItMatters}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500">Evidence from your video</dt>
                  <dd className="text-gray-700">{p.evidenceFromVideo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500">Corrective focus</dt>
                  <dd className="text-gray-700">{p.correctiveFocus}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </Section>

      {/* Practice plan */}
      <Section
        icon={<Sparkles className="w-4 h-4 text-purple-600" />}
        title="Personalized Practice Plan"
      >
        <div className="space-y-3">
          {analysis.practicePlan.map((d, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">{d.name}</p>
              <p className="text-sm text-gray-700 mt-1">{d.purpose}</p>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                  <p className="text-xs font-semibold text-gray-500">Reps / duration</p>
                  <p className="text-sm text-gray-700">{d.repsOrDuration}</p>
                </div>
                <div className="rounded-lg bg-golf-fairway/5 border border-golf-fairway/20 p-2.5">
                  <p className="text-xs font-semibold text-golf-fairway">You&apos;re doing it right when…</p>
                  <p className="text-sm text-gray-700">{d.howToKnowCorrect}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Next upload */}
      <Section
        icon={<Camera className="w-4 h-4 text-gray-700" />}
        title="Your Next Upload — How to Capture It"
      >
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            ['Camera angle', analysis.nextUpload.cameraAngle],
            ['Framing', analysis.nextUpload.framing],
            ['Lighting', analysis.nextUpload.lighting],
            ['Distance', analysis.nextUpload.distance],
            ['Sport notes', analysis.nextUpload.sportNotes],
          ].map(([label, value]) => (
            <li key={label} className="flex gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold text-gray-800">{label}:</span> {value}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Provenance footer */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
        <p className="text-xs text-gray-500">
          Analyzed {analysis.meta.frameCountAnalyzed} frames with {analysis.meta.provider} ·{' '}
          {analysis.meta.model} · schema v{analysis.meta.schemaVersion}. AI-generated guidance from
          your video frames — helpful for self-coaching, not a substitute for an in-person coach.
        </p>
      </div>
    </div>
  );
}
