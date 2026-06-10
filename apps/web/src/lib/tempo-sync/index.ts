// ============================================================
// SwingVantage — Tempo Sync: public API (barrel)
// ============================================================

export type {
  TempoSport,
  TempoPreset,
  TempoTiming,
  TempoBeat,
  TempoBeatKind,
  TempoTone,
  TempoVerdict,
  TempoSyncResult,
} from './types';

export {
  REFERENCE_FPS,
  IDEAL_FULL_RATIO,
  IDEAL_PUTT_RATIO,
  MIN_TEMPO_PCT,
  MAX_TEMPO_PCT,
  FULL_SWING_PRESETS,
  PUTT_PRESET,
  TEMPO_PRESETS,
  DEFAULT_PRESET_ID,
  getPreset,
  idealRatioForPreset,
  framesToMs,
  presetTiming,
  customTiming,
  scaleTiming,
  beatSchedule,
  tempoVerdict,
  nearestFullSwingPreset,
  syncFromTemporal,
  repsPerMinute,
} from './tempo';

export { useTempoMetronome, type TempoMetronomeState } from './useTempoMetronome';
