'use client';

// ============================================================
// SwingVantage — Tempo Sync trainer
// ------------------------------------------------------------
// An audio-visual swing-tempo trainer. Plays three cues per rep —
// Set → Top → Strike — spaced to a back:through ratio (the classic ~3:1
// full-swing rhythm), with a pendulum that swings in time. Can sync to a
// real, measured swing from Motion Lab so you practice at YOUR speed with
// the ideal RATIO. Fully client-side and keyless; nothing is recorded.
// ============================================================

import { useMemo, useState } from 'react';
import { Play, Square, Volume2, VolumeX, Hourglass, Activity, Hand, RotateCcw } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { TemporalIntelligence } from '@/lib/motion-lab';
import {
  TEMPO_PRESETS,
  DEFAULT_PRESET_ID,
  MIN_TEMPO_PCT,
  MAX_TEMPO_PCT,
  getPreset,
  presetTiming,
  scaleTiming,
  beatSchedule,
  repsPerMinute,
  syncFromTemporal,
  tempoFromTaps,
  useTempoMetronome,
  type TempoBeatKind,
  type TempoPreset,
} from '@/lib/tempo-sync';

interface Props {
  /** When provided, unlocks "sync to your swing" using a real measured read. */
  temporal?: TemporalIntelligence | null;
  /** 'page' = full standalone trainer; 'embedded' = compact, inside a results view. */
  variant?: 'page' | 'embedded';
  accent?: string;
}

const VERDICT_TONE: Record<string, string> = {
  rushed: 'text-warning bg-warning/10 border-warning/30',
  loose: 'text-warning bg-warning/10 border-warning/30',
  smooth: 'text-success bg-success/10 border-success/30',
};

const MAX_ANGLE = (68 * Math.PI) / 180;
const PIVOT_X = 110;
const PIVOT_Y = 18;
const ARM = 105;

function easeOut(p: number): number {
  return 1 - (1 - p) * (1 - p);
}

/** Pendulum angle (radians, 0 = straight down) for a given rep progress. */
function armAngle(progress: number, backFrac: number): number {
  if (progress < 0) return 0; // resting at address
  if (progress <= backFrac) {
    const p = backFrac > 0 ? progress / backFrac : 1;
    return MAX_ANGLE * easeOut(p); // up to the top
  }
  const p = (progress - backFrac) / Math.max(1e-6, 1 - backFrac);
  return MAX_ANGLE * (1 - p); // back down through the strike
}

function fmtMs(n: number): string {
  return `${(n / 1000).toFixed(2)}s`;
}

export function TempoSyncTrainer({ temporal = null, variant = 'page', accent = '#22C55E' }: Props) {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET_ID);
  const [tempoPct, setTempoPct] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countIn, setCountIn] = useState(true);
  const [taps, setTaps] = useState<number[]>([]);

  const preset = getPreset(presetId);
  const base = useMemo(() => presetTiming(preset), [preset]);
  const timing = useMemo(() => scaleTiming(base, tempoPct), [base, tempoPct]);
  const beats = useMemo(() => beatSchedule(timing), [timing]);
  const restMs = Math.max(800, timing.totalMs * 1.1);

  const metro = useTempoMetronome({ timing, beats, restMs, soundEnabled, countIn });

  const sync = useMemo(() => (temporal ? syncFromTemporal(temporal) : null), [temporal]);

  const backFrac = timing.totalMs > 0 ? timing.backMs / timing.totalMs : 0.75;
  const angle = armAngle(metro.progress, backFrac);
  const bobX = PIVOT_X + ARM * Math.sin(angle);
  const bobY = PIVOT_Y + ARM * Math.cos(angle);

  const flashColor = (kind: TempoBeatKind) => (metro.lastBeat === kind ? accent : 'hsl(var(--muted-foreground))');

  // Keep the athlete's own speed but groove the ideal-ratio preset: scale the
  // preset so one rep matches the measured total swing time.
  function applyTarget(totalMs: number, recommended: TempoPreset) {
    metro.stop();
    setPresetId(recommended.id);
    const baseTotal = presetTiming(recommended).totalMs;
    const pct = Math.round((baseTotal / Math.max(1, totalMs)) * 100);
    setTempoPct(Math.max(MIN_TEMPO_PCT, Math.min(MAX_TEMPO_PCT, pct)));
  }

  function applySync() {
    if (sync) applyTarget(sync.measuredTotalMs, sync.recommended);
  }

  const TAP_LABELS = ['Set', 'Top', 'Strike'];
  const tapResult = useMemo(
    () => (taps.length === 3 ? tempoFromTaps(taps[0], taps[1], taps[2]) : null),
    [taps],
  );

  function handleTap() {
    metro.stop();
    setTaps((prev) => (prev.length >= 3 ? [performance.now()] : [...prev, performance.now()]));
  }

  return (
    <Card className={cn(variant === 'embedded' && 'bg-card/60')}>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: accent }} />
          <p className="text-sm font-semibold text-foreground">Tempo Sync</p>
          <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground tabular-nums">
            {timing.ratio}:1 · {repsPerMinute(timing, restMs)} reps/min
          </span>
        </div>

        {/* Sync-to-your-swing banner (only with a real measured read) */}
        {sync && (
          <div className={cn('rounded-lg border p-3 text-xs', VERDICT_TONE[sync.verdict.tone] ?? 'border-border bg-muted/40')}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold uppercase tracking-wide">
                Your swing · {sync.measuredRatio.toFixed(1)}:1
              </span>
              <span className="tabular-nums opacity-80">{Math.round(sync.confidence * 100)}% conf.</span>
            </div>
            <p className="mt-1 leading-relaxed text-foreground/90">
              <span className="font-medium">{sync.verdict.label}.</span> {sync.verdict.detail}
            </p>
            <button
              type="button"
              onClick={applySync}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sync trainer to my swing
            </button>
          </div>
        )}

        {/* Pendulum */}
        <div className="flex justify-center">
          <svg viewBox="0 0 220 150" className="h-40 w-full max-w-[280px]" role="img" aria-label="Tempo pendulum">
            {/* arc guide */}
            <path
              d={`M ${PIVOT_X + ARM * Math.sin(MAX_ANGLE)} ${PIVOT_Y + ARM * Math.cos(MAX_ANGLE)}
                  A ${ARM} ${ARM} 0 0 0 ${PIVOT_X} ${PIVOT_Y + ARM}`}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
            {/* top + strike markers */}
            <circle cx={PIVOT_X + ARM * Math.sin(MAX_ANGLE)} cy={PIVOT_Y + ARM * Math.cos(MAX_ANGLE)} r="4" fill={flashColor('top')} />
            <circle cx={PIVOT_X} cy={PIVOT_Y + ARM} r="5" fill={flashColor('impact')} />
            <text x={PIVOT_X + ARM * Math.sin(MAX_ANGLE) + 8} y={PIVOT_Y + ARM * Math.cos(MAX_ANGLE)} className="fill-muted-foreground text-[9px]">Top</text>
            <text x={PIVOT_X - 16} y={PIVOT_Y + ARM + 16} className="fill-muted-foreground text-[9px]">Set · Strike</text>
            {/* arm + bob */}
            <line x1={PIVOT_X} y1={PIVOT_Y} x2={bobX} y2={bobY} stroke="hsl(var(--border))" strokeWidth="2" />
            <circle cx={PIVOT_X} cy={PIVOT_Y} r="3" fill="hsl(var(--muted-foreground))" />
            <circle
              cx={bobX}
              cy={bobY}
              r={metro.lastBeat ? 11 : 9}
              fill={accent}
              opacity={metro.progress < 0 ? 0.4 : 1}
              style={{ transition: 'r 80ms ease-out' }}
            />
          </svg>
        </div>

        {/* status line */}
        <p className="text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {metro.countingIn
            ? 'Counting in…'
            : metro.isPlaying
              ? `Rep ${metro.rep} · ${metro.lastBeat ? metro.lastBeat.toUpperCase() : '…'}`
              : 'Press play to start'}
        </p>

        {/* presets */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tempo presets">
          {TEMPO_PRESETS.map((p) => {
            const active = p.id === presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  metro.stop();
                  setPresetId(p.id);
                  setTempoPct(100);
                }}
                aria-pressed={active}
                title={p.description}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {p.label}
                <span className="ml-1 text-[10px] opacity-60 tabular-nums">{p.backFrames}/{p.downFrames}</span>
              </button>
            );
          })}
        </div>

        {/* speed slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Slower</span>
            <span className="font-medium text-foreground tabular-nums">{fmtMs(timing.totalMs)} swing</span>
            <span>Faster</span>
          </div>
          <input
            type="range"
            min={MIN_TEMPO_PCT}
            max={MAX_TEMPO_PCT}
            value={tempoPct}
            onChange={(e) => setTempoPct(Number(e.target.value))}
            aria-label="Tempo speed"
            className="mt-1 w-full accent-primary"
          />
        </div>

        {/* numbers */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border bg-card/50 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Back</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{fmtMs(timing.backMs)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Through</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{fmtMs(timing.downMs)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ratio</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">{timing.ratio}:1</p>
          </div>
        </div>

        {/* controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={metro.toggle}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors',
              metro.isPlaying
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            aria-pressed={metro.isPlaying}
          >
            {metro.isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {metro.isPlaying ? 'Stop' : 'Play tempo'}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute' : 'Unmute'}
            title={soundEnabled ? 'Mute' : 'Unmute'}
            className="rounded-xl border border-border p-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setCountIn((c) => !c)}
            aria-pressed={countIn}
            aria-label="Toggle count-in"
            title={countIn ? 'Count-in on' : 'Count-in off'}
            className={cn(
              'rounded-xl border p-3 transition-colors',
              countIn ? 'border-primary/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <Hourglass className="h-4 w-4" />
          </button>
        </div>

        {/* Tap your own tempo — no camera needed */}
        <div className="space-y-2 rounded-lg border border-border bg-card/40 p-3">
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">Tap your own tempo</p>
            {taps.length > 0 && (
              <button
                type="button"
                onClick={() => setTaps([])}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Make a practice swing and tap on each beat: <span className="text-foreground">Set</span> at takeaway,{' '}
            <span className="text-foreground">Top</span> at the top, <span className="text-foreground">Strike</span> at the ball.
          </p>
          <button
            type="button"
            onClick={handleTap}
            className="w-full rounded-lg border border-dashed border-primary/40 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 active:translate-y-px"
          >
            {taps.length < 3 ? `Tap: ${TAP_LABELS[taps.length]}` : 'Tap to measure again'}
          </button>
          <div className="flex items-center justify-center gap-3">
            {TAP_LABELS.map((label, i) => (
              <span key={label} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                <span
                  className={cn('h-2 w-2 rounded-full', taps.length > i ? 'bg-primary' : 'bg-border')}
                  aria-hidden="true"
                />
                <span className={taps.length > i ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
              </span>
            ))}
          </div>
          {tapResult ? (
            <div className="rounded-md border border-border bg-background/60 p-2.5">
              <p className="text-xs font-semibold text-foreground tabular-nums">
                Your tempo · {tapResult.ratio}:1 <span className="font-normal text-muted-foreground">({fmtMs(tapResult.totalMs)})</span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{tapResult.verdict.label}.</span> {tapResult.verdict.detail}
              </p>
              <button
                type="button"
                onClick={() => applyTarget(tapResult.totalMs, tapResult.recommended)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Train the ideal rhythm at this speed
              </button>
            </div>
          ) : taps.length === 3 ? (
            <p className="text-[11px] text-warning">Those taps came out of order — reset and try again.</p>
          ) : null}
        </div>

        {!metro.audioSupported && (
          <p className="text-[11px] text-muted-foreground">
            Your browser can&apos;t play tempo audio here — the visual pendulum still keeps time.
          </p>
        )}
        <p className="border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground/80">
          Tempo is the ratio of backswing to downswing time — a smooth ~3:1 is the classic full-swing rhythm
          (about 2:1 for putting). Runs entirely on your device; nothing is recorded or uploaded.
        </p>
      </CardBody>
    </Card>
  );
}
