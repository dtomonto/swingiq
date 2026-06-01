import { Smartphone, Cpu, EyeOff } from 'lucide-react';

const STEPS = [
  { icon: Smartphone, title: 'You choose a video', text: 'Pick a swing video from your device. Nothing uploads until you start an analysis.' },
  { icon: Cpu, title: 'It is analyzed in your browser', text: 'Pose estimation runs on your device. Your raw footage is not sent to an external server by default.' },
  { icon: EyeOff, title: 'It stays private', text: 'Videos are never shared publicly by default. You decide if and when to share a summary.' },
];

/**
 * Explains, step by step, what happens to an uploaded video.
 * Place directly in or beside the upload/analyze flow.
 */
export function WhatHappensToMyVideo({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50 p-6 ${className}`}>
      <h3 className="mb-4 text-base font-bold text-gray-900">What happens to my video?</h3>
      <ol className="space-y-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Icon size={15} className="text-green-700" aria-hidden="true" />
                {title}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
