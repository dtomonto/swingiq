'use client';

// ============================================================
// SwingVantage — Flaw Fingerprint Card
// ------------------------------------------------------------
// The recurring-pattern summary: the issue that keeps returning,
// the issues that travel with it, which drills the user actually
// found helpful (from the DrillMatch feedback loop), and the next
// intervention to try.
// ============================================================

import Link from 'next/link';
import { Fingerprint, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { SPORT_EMOJI } from '@/lib/progress/display';
import type { FlawFingerprint } from '@/lib/progress';

export function FlawFingerprintCard({ fingerprint }: { fingerprint: FlawFingerprint }) {
  const fp = fingerprint;

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Fingerprint size={13} /> Flaw Fingerprint
        </div>

        {fp.mostCommonFlaw ? (
          <>
            <div>
              <p className="text-lg font-bold text-foreground">{fp.mostCommonFlaw}</p>
              <p className="text-xs text-muted-foreground">
                Your most common focus — seen in {fp.occurrences} session{fp.occurrences > 1 ? 's' : ''}
                {fp.sportsAffected.length > 0 && (
                  <span> · {fp.sportsAffected.map((s) => SPORT_EMOJI[s] ?? '🏷️').join(' ')}</span>
                )}
              </p>
            </div>

            <p className="text-sm text-foreground/90">{fp.patternExplanation}</p>

            {fp.relatedFlaws.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Often shows up with</p>
                <div className="flex flex-wrap gap-1.5">
                  {fp.relatedFlaws.map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(fp.drillsThatHelped.length > 0 || fp.drillsThatDidNot.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fp.drillsThatHelped.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-success mb-1.5">
                      <ThumbsUp size={12} /> Helped you
                    </p>
                    <ul className="space-y-1">
                      {fp.drillsThatHelped.map((d) => (
                        <li key={d.drillId} className="text-xs text-foreground">{d.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {fp.drillsThatDidNot.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                      <ThumbsDown size={12} /> Didn&apos;t move the needle
                    </p>
                    <ul className="space-y-1">
                      {fp.drillsThatDidNot.map((d) => (
                        <li key={d.drillId} className="text-xs text-muted-foreground">{d.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{fp.patternExplanation}</p>
        )}

        {/* Next intervention */}
        <Link
          href="/fix"
          className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 hover:bg-muted/70 transition-colors"
        >
          <span className="text-sm text-foreground">{fp.nextIntervention}</span>
          <ArrowRight size={15} className="text-primary shrink-0" />
        </Link>
      </CardBody>
    </Card>
  );
}
