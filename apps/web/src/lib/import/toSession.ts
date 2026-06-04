// ============================================================
// SwingIQ — Reviewed table → saved session
//
// Turns a confirmed headers/rows table (from the photo importer or any
// manual table) into a LocalSession ready for the store, reusing the
// universal launch-monitor normalizer so the data flows straight into the
// diagnostic engine — exactly like a CSV import.
// ============================================================

import {
  detectColumnMapping,
  normalizeRow,
  sourceToBrand,
} from '@swingiq/core';
import type { Shot, ClubCategory, SportId, SwingType } from '@swingiq/core';
import type { LocalSession } from '@/store/types';

/** Best-effort club-category from a club name (mirrors the CSV importer). */
export function inferClubCategory(clubName: string): ClubCategory {
  const n = clubName.toLowerCase();
  if (n.includes('driver') || n === 'dr' || n === '1w') return 'driver';
  if (n.includes('fairway') || /[2-5]w/.test(n)) return 'fairway_wood';
  if (n.includes('hybrid') || /[2-5]h/.test(n)) return 'hybrid';
  if (/^(2|3|4)\s?i(ron)?$/.test(n) || n === '2-iron' || n === '3-iron' || n === '4-iron') return 'long_iron';
  if (/^(5|6|7)\s?i(ron)?$/.test(n) || n === '5-iron' || n === '6-iron' || n === '7-iron') return 'mid_iron';
  if (/^(8|9)\s?i(ron)?$/.test(n) || n.includes('pw') || n.includes('pitching')) return 'short_iron';
  if (n.includes('wedge') || n.includes('aw') || n.includes('sw') || n.includes('lw') || n.includes('gap')) return 'wedge';
  if (n.includes('putter') || n === 'pt') return 'putter';
  return 'mid_iron';
}

export interface BuiltSession {
  /** Ready to hand to the store's addSession(). */
  session: Omit<LocalSession, 'id' | 'created_at'>;
  shotCount: number;
  primaryClub: string;
}

export interface BuildSessionOptions {
  headers: string[];
  rows: string[][];
  /** Device/source label, e.g. "trackman" — mapped to a normalizer brand. */
  source: string;
  sport: SportId;
  sessionName?: string;
  /** Club detected from a single-shot screen, used when rows omit a club. */
  detectedClub?: string | null;
}

/** Convert a reviewed table into a LocalSession (shots normalized to the schema). */
export function buildSessionFromTable(opts: BuildSessionOptions): BuiltSession {
  const brand = sourceToBrand(opts.source);
  const mapping = detectColumnMapping(opts.headers, brand);
  const now = new Date().toISOString();
  const stamp = Date.now();

  const records = opts.rows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const rec: Record<string, string> = {};
      opts.headers.forEach((h, i) => {
        rec[h] = row[i] ?? '';
      });
      return rec;
    });

  const shots: Shot[] = records.map((rec, i) => {
    const ns = normalizeRow(rec, mapping, brand);
    const clubName =
      ns.club_name && ns.club_name !== 'Unknown'
        ? ns.club_name
        : opts.detectedClub || ns.club_name || 'Unknown';
    return {
      id: `shot_${stamp}_${i}`,
      session_id: 'pending',
      user_id: 'local',
      club_id: null,
      club_name: clubName,
      club_category: inferClubCategory(clubName),
      shot_number: i + 1,
      date_time: now,
      swing_type: 'full' as SwingType,
      intended_shot_shape: null,
      actual_shot_shape: ns.ball_data.shot_shape ?? null,
      is_outlier: false,
      user_notes: '',
      ball_data: ns.ball_data,
      club_data: ns.club_data,
      strike_data: ns.strike_data,
      created_at: now,
    };
  });

  const clubCounts: Record<string, number> = {};
  shots.forEach((s) => {
    clubCounts[s.club_name] = (clubCounts[s.club_name] ?? 0) + 1;
  });
  const primaryClub = Object.entries(clubCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Mixed';

  const session: Omit<LocalSession, 'id' | 'created_at'> = {
    name: opts.sessionName || `Imported ${new Date().toLocaleDateString()}`,
    date: now,
    sport: opts.sport,
    club_name: primaryClub,
    club_category: inferClubCategory(primaryClub),
    launch_monitor: brand,
    indoor_outdoor: 'outdoor',
    mat_or_grass: 'mat',
    notes: 'Imported from photo',
    shot_count: shots.length,
    shots,
    diagnoses: [],
    swing_score: null,
  };

  return { session, shotCount: shots.length, primaryClub };
}
