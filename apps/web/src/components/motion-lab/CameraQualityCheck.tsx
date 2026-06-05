'use client';

// ============================================================
// SwingVantage — Motion Lab: Camera-Quality Report panel
// Renders the honest capture-quality gate so users know how much to
// trust the analysis and how to film better next time.
// ============================================================

import { CheckCircle2, AlertTriangle, XCircle, Camera, Lightbulb } from 'lucide-react';
import type { CameraQualityReport, QualityVerdict } from '@/lib/motion-lab';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const ICON: Record<QualityVerdict, typeof CheckCircle2> = {
  good: CheckCircle2,
  fair: AlertTriangle,
  poor: XCircle,
};
const COLOR: Record<QualityVerdict, string> = {
  good: 'text-success',
  fair: 'text-warning',
  poor: 'text-error',
};

export function CameraQualityCheck({ report, compact }: { report: CameraQualityReport; compact?: boolean }) {
  const Ring = ICON[report.verdict];
  return (
    <Card className={cn('overflow-hidden', report.verdict === 'poor' && 'border-error/40')}>
      <div className="px-4 sm:px-6 py-4 flex items-center gap-4 border-b border-border">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
              className={COLOR[report.verdict]} stroke="currentColor"
              strokeDasharray={`${(report.score / 100) * 97.4} 97.4`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">{report.score}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Capture Quality</h3>
            <span className={cn('inline-flex items-center gap-1 text-xs font-semibold capitalize', COLOR[report.verdict])}>
              <Ring className="w-3.5 h-3.5" />{report.verdict}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {report.subjectVisiblePct}% subject detected · {report.resolution || 'unknown res'} ·{' '}
            {report.estimatedView.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="px-4 sm:px-6 py-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {report.items.map((item) => {
            const I = ICON[item.status];
            return (
              <div key={item.id} className="flex items-start gap-2 py-1">
                <I className={cn('w-4 h-4 mt-0.5 shrink-0', COLOR[item.status])} />
                <div>
                  <p className="text-sm text-foreground font-medium leading-tight">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="px-4 sm:px-6 py-3 bg-muted/50 border-t border-border">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-warning" /> Improve your capture
          </p>
          <ul className="space-y-0.5">
            {report.recommendations.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
