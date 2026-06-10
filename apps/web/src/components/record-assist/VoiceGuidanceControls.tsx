'use client';

import { cn } from '@/lib/utils';
import { Mic, MessageSquareText, VolumeX, Captions, Vibrate } from 'lucide-react';
import type { VoiceMode } from '@/lib/record-assist/types';

export interface VoiceGuidanceControlsProps {
  mode: VoiceMode;
  onModeChange: (mode: VoiceMode) => void;
  captionsOn: boolean;
  onCaptionsChange: (on: boolean) => void;
  hapticsOn: boolean;
  onHapticsChange: (on: boolean) => void;
  voiceSupported: boolean;
  hapticsSupported: boolean;
  className?: string;
}

const MODES: { id: VoiceMode; label: string; icon: typeof Mic; hint: string }[] = [
  { id: 'coach', label: 'Coach', icon: Mic, hint: 'Full spoken coaching' },
  { id: 'simple', label: 'Simple', icon: MessageSquareText, hint: 'Short cues only' },
  { id: 'silent', label: 'Silent', icon: VolumeX, hint: 'Captions only' },
];

/** Voice mode + captions + haptics controls. Mobile-first segmented control. */
export function VoiceGuidanceControls({
  mode, onModeChange, captionsOn, onCaptionsChange,
  hapticsOn, onHapticsChange, voiceSupported, hapticsSupported, className,
}: VoiceGuidanceControlsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div role="radiogroup" aria-label="Voice guidance mode" className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted p-1">
        {MODES.map(({ id, label, icon: Icon, hint }) => {
          const selected = mode === id;
          const disabled = id !== 'silent' && !voiceSupported;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label} — ${hint}`}
              disabled={disabled}
              onClick={() => onModeChange(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors tap-target',
                selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {!voiceSupported && (
        <p className="text-xs text-muted-foreground">
          Spoken guidance isn’t available on this device — captions will still guide you.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <ToggleChip
          active={captionsOn}
          onClick={() => onCaptionsChange(!captionsOn)}
          icon={Captions}
          label="Captions"
        />
        <ToggleChip
          active={hapticsOn && hapticsSupported}
          disabled={!hapticsSupported}
          onClick={() => onHapticsChange(!hapticsOn)}
          icon={Vibrate}
          label="Haptics"
        />
      </div>
    </div>
  );
}

function ToggleChip({
  active, onClick, icon: Icon, label, disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Captions;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors tap-target',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}
