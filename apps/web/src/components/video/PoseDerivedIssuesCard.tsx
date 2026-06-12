'use client';

// ============================================================
// SwingVantage — Pose-derived findings (non-golf)
// Honest, deterministic faults detected from the on-device MediaPipe pose
// track (rotation/sway/head-stability proxies) — NOT the AI vision read.
// These are estimated from single-camera 2D pose, so confidence is
// conservative and every item is clearly labelled a movement proxy.
// Works even when no AI provider is configured (keyless value).
// (Intelligence Learning Audit P3.)
// ============================================================

import { Gauge } from 'lucide-react';
import type { SportDetectedIssue } from '@swingiq/core';

const SEVERITY_TONE: Record<string, string> = {
  critical: 'text-error-text',
  notable: 'text-link',
  minor: 'text-muted-foreground',
  watch: 'text-muted-foreground',
};

export function PoseDerivedIssuesCard({ issues }: { issues: SportDetectedIssue[] }) {
  const poseIssues = issues.filter((i) => i.detection_basis === 'pose');
  if (poseIssues.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Gauge className="w-4 h-4 text-accent-secondary" />
        <h3 className="text-sm font-bold text-foreground">Detected from your motion</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Found from on-device pose geometry — estimated from single-camera tracking (a motion proxy,
        not a lab measurement), so these are conservative.
      </p>
      <ul className="space-y-2">
        {poseIssues.map((issue) => (
          <li key={issue.id} className="rounded-lg border border-border bg-muted p-3">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-semibold ${SEVERITY_TONE[issue.severity] ?? 'text-foreground'}`}>{issue.label}</p>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {Math.round(issue.confidence * 100)}% est.
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{issue.description}</p>
            {issue.likely_cause && (
              <p className="mt-1 text-[11px] text-muted-foreground/80"><span className="font-medium">Likely cause:</span> {issue.likely_cause}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
