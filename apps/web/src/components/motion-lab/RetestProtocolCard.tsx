'use client';

// ============================================================
// SwingVantage — Motion Lab: Retest Protocol Card
// ------------------------------------------------------------
// Closes the "One fix. One plan. One retest." loop. Shows the athlete
// exactly how to re-film and re-measure the SAME motion so a change is
// comparable — reusing the session's own phase markers — and the
// measurable bar that says the fix worked.
// ============================================================

import { RotateCcw, Target, Camera, ListChecks, CheckCircle2, Repeat } from 'lucide-react';
import type { MotionSession } from '@/lib/motion-lab';
import { buildRetestProtocol } from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';

interface Props {
  session: MotionSession;
  accent?: string;
}

export function RetestProtocolCard({ session, accent = '#22C55E' }: Props) {
  const protocol = buildRetestProtocol(session);

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start gap-2">
          <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
          <div>
            <p className="text-sm font-semibold text-foreground">{protocol.title}</p>
            <p className="text-xs text-muted-foreground">
              Practise for ~{protocol.timeframeDays} days, then re-film to measure the change.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5">
          <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground"><span className="font-semibold">Retesting:</span> {protocol.focus}</p>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
            <Camera className="w-3.5 h-3.5 text-muted-foreground" /> Reproduce the capture
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
            {protocol.reproduce.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
            <ListChecks className="w-3.5 h-3.5 text-muted-foreground" /> Re-watch these phases
          </p>
          <div className="space-y-1.5">
            {protocol.checkpoints.map((c) => (
              <div key={c.phaseKey} className="rounded-md border border-border bg-card/60 p-2">
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <p className="text-2xs text-muted-foreground">{c.watchFor}</p>
              </div>
            ))}
          </div>
        </div>

        {protocol.movementCheck && (
          <div className="flex items-start gap-2 rounded-lg bg-sky-500/5 border border-sky-500/20 p-2.5">
            <Repeat className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground"><span className="font-semibold">Movement check:</span> {protocol.movementCheck}</p>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-success/5 border border-success/20 p-2.5">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          <p className="text-xs text-foreground"><span className="font-semibold">Success looks like:</span> {protocol.successCriterion}</p>
        </div>

        {protocol.basis !== 'measured' && (
          <p className="text-3xs text-muted-foreground/80">
            Comparisons are directional single-camera estimates — keep the camera setup consistent for the fairest read.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
