// ============================================================
// SwingVantage Admin — Drill Library aggregation (isomorphic, pure)
// ------------------------------------------------------------
// Unifies the app's real drill catalogs into ONE browsable inventory
// for the admin Drill Library:
//   • DRILLS_CONTENT          (data/drills-content.ts)
//   • ALL_DRILL_CANDIDATES    (lib/drillmatch/catalog.ts)
//
// It does NOT create or own drills — it normalizes the existing ones so
// an operator can see coverage across sports, difficulty and source, and
// spot gaps or cross-catalog duplicates. Pure + structurally typed so it
// is fully unit testable without importing the heavy catalogs.
// ============================================================

export type DrillDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type DrillSource = 'drills-content' | 'drillmatch';

/** Minimal shape of a DRILLS_CONTENT entry (the real type is a superset). */
export interface DrillContentLike {
  id: string;
  sport: string;
  title: string;
  category: string;
  difficulty: DrillDifficulty;
  duration: string;
  targetFault: string;
  steps: unknown[];
}

/** Minimal shape of a DrillMatch candidate (the real type is a superset). */
export interface DrillCandidateLike {
  id: string;
  sport: string;
  name: string;
  families: string[];
  faultIds: string[];
  goal: string;
  repsOrDuration: string;
  difficulty: DrillDifficulty;
  equipment: string[];
  steps: unknown[];
  safetyNote: string | null;
}

/** One normalized drill across every source. */
export interface LibraryDrill {
  id: string;
  source: DrillSource;
  sport: string;
  name: string;
  category: string;
  difficulty: DrillDifficulty;
  /** The fault/skill this drill targets. */
  targetFault: string;
  /** Reps or duration text. */
  duration: string;
  /** Lower-cased equipment tokens; [] = none/bodyweight or unknown. */
  equipment: string[];
  hasSteps: boolean;
  safetyNote: string | null;
}

export function normalizeContentDrill(d: DrillContentLike): LibraryDrill {
  return {
    id: d.id,
    source: 'drills-content',
    sport: d.sport,
    name: d.title,
    category: d.category || 'General',
    difficulty: d.difficulty,
    targetFault: d.targetFault || '—',
    duration: d.duration || '—',
    equipment: [],
    hasSteps: d.steps.length > 0,
    safetyNote: null,
  };
}

export function normalizeCandidateDrill(d: DrillCandidateLike): LibraryDrill {
  return {
    id: d.id,
    source: 'drillmatch',
    sport: d.sport,
    name: d.name,
    category: d.families[0] ? titleCase(d.families[0]) : 'Fault fix',
    difficulty: d.difficulty,
    targetFault: d.faultIds[0] ?? d.goal ?? '—',
    duration: d.repsOrDuration || '—',
    equipment: d.equipment ?? [],
    hasSteps: d.steps.length > 0,
    safetyNote: d.safetyNote,
  };
}

function titleCase(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DrillLibraryStats {
  total: number;
  bySport: Record<string, number>;
  bySource: Record<DrillSource, number>;
  byDifficulty: Record<DrillDifficulty, number>;
  withEquipment: number;
  withSafety: number;
  sports: number;
}

export interface DrillLibrary {
  drills: LibraryDrill[];
  stats: DrillLibraryStats;
  /** Names appearing in more than one drill (case-insensitive) — possible dupes. */
  duplicateNames: { name: string; ids: string[] }[];
}

/**
 * Aggregate every catalog into one inventory + stats. Sorted by sport
 * then name for stable rendering. Pure and deterministic.
 */
export function aggregateDrillLibrary(
  content: DrillContentLike[],
  candidates: DrillCandidateLike[],
): DrillLibrary {
  const drills: LibraryDrill[] = [
    ...content.map(normalizeContentDrill),
    ...candidates.map(normalizeCandidateDrill),
  ].sort((a, b) => a.sport.localeCompare(b.sport) || a.name.localeCompare(b.name));

  const bySport: Record<string, number> = {};
  const bySource: Record<DrillSource, number> = { 'drills-content': 0, drillmatch: 0 };
  const byDifficulty: Record<DrillDifficulty, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  let withEquipment = 0;
  let withSafety = 0;

  for (const d of drills) {
    bySport[d.sport] = (bySport[d.sport] ?? 0) + 1;
    bySource[d.source] += 1;
    byDifficulty[d.difficulty] += 1;
    if (d.equipment.length > 0) withEquipment += 1;
    if (d.safetyNote) withSafety += 1;
  }

  // Duplicate names across the combined set (case-insensitive).
  const nameMap = new Map<string, string[]>();
  for (const d of drills) {
    const key = d.name.trim().toLowerCase();
    const arr = nameMap.get(key) ?? [];
    arr.push(d.id);
    nameMap.set(key, arr);
  }
  const duplicateNames = [...nameMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([name, ids]) => ({ name, ids }));

  return {
    drills,
    stats: {
      total: drills.length,
      bySport,
      bySource,
      byDifficulty,
      withEquipment,
      withSafety,
      sports: Object.keys(bySport).length,
    },
    duplicateNames,
  };
}

/** Group the aggregated drills by sport in descending count order. */
export function groupDrillsBySport(library: DrillLibrary): { sport: string; drills: LibraryDrill[] }[] {
  const sports = Object.keys(library.stats.bySport).sort(
    (a, b) => library.stats.bySport[b] - library.stats.bySport[a] || a.localeCompare(b),
  );
  return sports.map((sport) => ({
    sport,
    drills: library.drills.filter((d) => d.sport === sport),
  }));
}
