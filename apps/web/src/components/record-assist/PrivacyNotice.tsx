'use client';

import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

export interface PrivacyNoticeProps {
  /** Compact single-line variant for in-flow reassurance. */
  compact?: boolean;
  className?: string;
}

/**
 * Privacy-first reassurance. RecordAssist processes the preview ON-DEVICE for
 * framing guidance; nothing is uploaded or stored unless the user records and
 * chooses to analyze. Parent-friendly language for minors.
 */
export function PrivacyNotice({ compact, className }: PrivacyNoticeProps) {
  if (compact) {
    return (
      <p className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        Framing runs on your device. Nothing is uploaded until you choose to analyze.
      </p>
    );
  }
  return (
    <div className={cn('rounded-xl border border-border bg-muted/40 p-4', className)}>
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-success/15 p-2 text-success">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1.5 text-sm">
          <h3 className="font-semibold text-foreground">Your privacy</h3>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>Camera framing and body tracking run entirely on your device.</li>
            <li>The live preview is never uploaded or saved.</li>
            <li>A clip is only kept if you record and choose to continue to analysis.</li>
            <li>You can delete or export your clips anytime from Settings.</li>
            <li>Guidance is for setup help only — not medical or professional motion-capture measurement.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Recording someone under 13? A parent or guardian should set up and supervise.
          </p>
        </div>
      </div>
    </div>
  );
}
