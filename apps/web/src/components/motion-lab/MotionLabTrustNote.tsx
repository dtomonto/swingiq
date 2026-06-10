'use client';

// ============================================================
// SwingVantage — Motion Lab: trust & privacy disclosure
// ------------------------------------------------------------
// A concise, honest explanation of what Motion Lab analyses, what it
// stores (and doesn't), how to delete, how confidence works, and that
// nothing here is a medical claim (spec §12). Collapsible so it informs
// without cluttering. Pure copy + UI — every line reflects the real
// behaviour of the pipeline (on-device pose, video never persisted).
// ============================================================

import { useState } from 'react';
import { ShieldCheck, ChevronDown, Cpu, HardDriveDownload, Trash2, Gauge, HeartPulse } from 'lucide-react';

interface TrustPoint {
  icon: typeof Cpu;
  title: string;
  body: string;
}

const POINTS: TrustPoint[] = [
  {
    icon: Cpu,
    title: 'Runs on your device',
    body: 'Pose detection and the 3D reconstruction happen in your browser. Your original video is never uploaded to a server.',
  },
  {
    icon: HardDriveDownload,
    title: 'What gets saved',
    body: 'Only the analysis — a compact pose track plus the numbers, phases, and coaching report — is saved, and only to this device. The video itself is never saved.',
  },
  {
    icon: Trash2,
    title: 'Delete anytime',
    body: 'Remove any session with the trash icon and it is gone from this device. Exporting (JSON / CSV / PDF) is always your choice.',
  },
  {
    icon: Gauge,
    title: 'Honest confidence',
    body: 'Every read carries a confidence or quality label, and low-visibility joints fade rather than assert a number. Camera angle, lighting, and how much of the body is visible all affect quality.',
  },
  {
    icon: HeartPulse,
    title: 'Coaching, not medical',
    body: 'These are single-camera coaching estimates — directional, not lab-grade. Nothing here is a medical, diagnostic, or injury assessment.',
  },
];

export function MotionLabTrustNote({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-success" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">How your video &amp; data are handled</span>
          <span className="block text-xs text-muted-foreground truncate">On-device analysis · the video is never uploaded or saved</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.title} className="flex gap-3">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
