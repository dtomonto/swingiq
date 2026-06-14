'use client';

// ============================================================
// SwingVantage — Motion Lab: Recording Guidance (pre-upload)
// ------------------------------------------------------------
// Sport-specific "how to film this" tips + a self-confirm angle
// checklist, shown in the capture step BEFORE the user uploads so the
// clip is actually analysable. Reads from lib/motion-lab/recording-
// guidance (pure data). Collapsible and touch-friendly.
// ============================================================

import { useState } from 'react';
import { Clapperboard, ChevronDown, Video, ListChecks } from 'lucide-react';
import type { SportId, MotionTypeId } from '@/lib/motion-lab';
import { getRecordingGuide, recordingTipsFor, ANGLE_CHECKLIST } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';

interface Props {
  sport: SportId;
  motionType: MotionTypeId | null;
  accent?: string;
  /** Start expanded (default) or collapsed. */
  defaultOpen?: boolean;
}

export function RecordingGuidance({ sport, motionType, accent = '#22C55E', defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const guide = getRecordingGuide(sport);
  const tips = recordingTipsFor(sport, motionType);
  const doneCount = ANGLE_CHECKLIST.filter((i) => checked[i.id]).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}22` }}>
          <Clapperboard className="w-4 h-4" style={{ color: accent }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{guide.headline} — get a clip we can read</span>
          <span className="block text-xs text-muted-foreground truncate">{guide.bestAngle}</span>
        </span>
        {doneCount > 0 && (
          <span className="text-2xs font-semibold tabular-nums text-muted-foreground shrink-0">
            {doneCount}/{ANGLE_CHECKLIST.length}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
          {/* Sport-specific tips */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
              <Video className="w-3.5 h-3.5 text-muted-foreground" /> Tips for {guide.headline.replace(/^Filming /, '')}
            </p>
            <ul className="space-y-1.5">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Self-confirm angle checklist */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
              <ListChecks className="w-3.5 h-3.5 text-muted-foreground" /> Angle-quality checklist
            </p>
            <ul className="space-y-1">
              {ANGLE_CHECKLIST.map((item) => (
                <li key={item.id}>
                  {/* Implicit association (input nested in the label) + visible
                      text; jsx-a11y can't see the label text inside the spans. */}
                  {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                  <label className="flex items-start gap-2 cursor-pointer rounded-md px-1.5 py-1 -mx-1.5 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={!!checked[item.id]}
                      onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                      className="mt-0.5 rounded-sm border-border text-primary shrink-0"
                    />
                    <span className="min-w-0">
                      <span className={cn('block text-xs', checked[item.id] ? 'text-muted-foreground line-through' : 'text-foreground')}>{item.label}</span>
                      <span className="block text-2xs text-muted-foreground">{item.why}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-2xs text-muted-foreground mt-2">
              This is a guide, not a gate — you can still analyse any clip. After analysis, the Capture Quality report shows how much to trust each read.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
