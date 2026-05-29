'use client';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OverlaySettings {
  showSkeleton: boolean;
  showPlane: boolean;
  showShaft: boolean;
}

interface OverlayControlsProps {
  settings: OverlaySettings;
  onChange: (settings: OverlaySettings) => void;
  className?: string;
}

const CONTROLS = [
  { key: 'showSkeleton' as const, label: 'Body outline', description: 'Estimated skeleton' },
  { key: 'showPlane' as const,    label: 'Swing plane',  description: 'Estimated plane line' },
  { key: 'showShaft' as const,    label: 'Club shaft',   description: 'Estimated shaft line' },
];

export function OverlayControls({ settings, onChange, className }: OverlayControlsProps) {
  const toggle = (key: keyof OverlaySettings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  const anyOn = Object.values(settings).some(Boolean);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-xs text-gray-500 font-medium">Overlay:</span>

      {CONTROLS.map(({ key, label, description }) => {
        const on = settings[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            title={description}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-green-500',
              on
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:border-gray-300',
            )}
            aria-pressed={on}
          >
            {on ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {label}
          </button>
        );
      })}

      {anyOn && (
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          ⚠ Estimated
        </span>
      )}
    </div>
  );
}
