'use client';

import { cn } from '@/lib/utils';

type CameraAngleOption = 'down_the_line' | 'face_on' | 'unknown';

interface AngleOption {
  value: CameraAngleOption;
  label: string;
  description: string;
  diagram: string; // ASCII diagram inline
  recommended_for: string;
}

const ANGLE_OPTIONS: AngleOption[] = [
  {
    value: 'down_the_line',
    label: 'Down the Line',
    description: 'Camera is behind the golfer, looking toward the target along the ball-target line.',
    diagram: '🎯← camera behind',
    recommended_for: 'Swing plane, path, shaft angle, spine tilt',
  },
  {
    value: 'face_on',
    label: 'Face On',
    description: 'Camera faces the golfer from the target side, perpendicular to the target line.',
    diagram: '📷⟂ target line',
    recommended_for: 'Weight transfer, hip sway, lateral movement, reverse pivot',
  },
  {
    value: 'unknown',
    label: 'Not Sure',
    description: 'Camera angle is unknown or mixed. Analysis will be limited to universal patterns.',
    diagram: '❓ any angle',
    recommended_for: 'General swing patterns only',
  },
];

interface CameraAngleSelectorProps {
  value: CameraAngleOption;
  onChange: (angle: CameraAngleOption) => void;
  disabled?: boolean;
}

export function CameraAngleSelector({ value, onChange, disabled }: CameraAngleSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Camera angle</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Helps the analysis identify which issues are visible from your recording angle.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ANGLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-all duration-150',
              'focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
              value === opt.value
                ? 'border-green-500 bg-green-50 shadow-xs'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.description}</p>
                <p className="text-xs text-green-700 mt-2 font-medium">
                  Best for: {opt.recommended_for}
                </p>
              </div>
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                  value === opt.value ? 'border-green-500 bg-green-500' : 'border-gray-300',
                )}
              >
                {value === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {value === 'down_the_line' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          <strong>Tip:</strong> For the best down-the-line analysis, position your camera at
          hip height, directly behind the ball and pointing at the target.
        </div>
      )}
      {value === 'face_on' && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
          <strong>Tip:</strong> For face-on analysis, position your camera at hip height,
          directly across from the ball, perpendicular to your target line.
        </div>
      )}
    </div>
  );
}
