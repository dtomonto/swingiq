import { Smartphone, Cpu, EyeOff } from 'lucide-react';

const STEPS = [
  { icon: Smartphone, title: 'You choose a video', text: 'Pick a swing video from your device. Nothing is sent anywhere until you start an analysis.' },
  { icon: Cpu, title: 'AI reviews a small sample', text: 'When you start an analysis, SwingVantage sends only a small sample of your swing — not your full video file — to an AI vision provider for review.' },
  { icon: EyeOff, title: 'Your footage stays yours', text: 'Your original video never leaves your device, the sample is not stored after analysis, and your video is never used to train a shared model.' },
];

/**
 * Explains, step by step, what happens to an uploaded video.
 * Place directly in or beside the upload/analyze flow.
 */
export function WhatHappensToMyVideo({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-muted p-6 ${className}`}>
      <h3 className="mb-4 text-base font-bold text-foreground">What happens to my video?</h3>
      <ol className="space-y-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon size={15} className="text-primary" aria-hidden="true" />
                {title}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
