// ============================================================
// SwingVantage Admin — Audit Reports: owner status overlay (SERVER-ONLY)
// ------------------------------------------------------------
// The findings themselves come from the synced report snapshot (read-only).
// This module stores the OWNER's tracking status per finding — open /
// in-progress / done — in a small versioned data file:
//
//   src/data/audit-status-overrides.json   ({ "F-01": "in-progress", … })
//
// Same honest model as updates-store.ts: a write edits the file on disk, so
// the change is a reviewable git diff you commit & push. Production's runtime
// filesystem is read-only, so the hub is view-only there.
//
// NEVER import from a client component — it uses node:fs. The client gets
// plain data via props and calls the guarded API route to mutate.
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { AuditTrackStatus } from './types';

const FILE = 'audit-status-overrides.json';
const VALID: ReadonlySet<AuditTrackStatus> = new Set(['open', 'in-progress', 'done']);

export type StatusOverrides = Record<string, AuditTrackStatus>;

/**
 * Whether status writes can be persisted. A write is a local-dev operation
 * (it becomes a git diff you push); Vercel's runtime FS is read-only. An
 * explicit override supports self-hosted writable deployments.
 */
export function canWriteAuditStatus(): boolean {
  if (process.env.ALLOW_AUDIT_WRITE === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

/** Resolve the data file whether cwd is apps/web (turbo) or the repo root. */
function resolveFile(): string {
  const candidates = [
    path.join(process.cwd(), 'src', 'data', FILE),
    path.join(process.cwd(), 'apps', 'web', 'src', 'data', FILE),
  ];
  return candidates.find((c) => existsSync(c)) ?? candidates[0];
}

/** Read the overrides map (missing/corrupt file → empty, never throws). */
export function readStatusOverrides(): StatusOverrides {
  try {
    const file = resolveFile();
    if (!existsSync(file)) return {};
    const raw = readFileSync(file, 'utf8').trim();
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: StatusOverrides = {};
    for (const [id, status] of Object.entries(parsed)) {
      if (VALID.has(status as AuditTrackStatus)) out[id] = status as AuditTrackStatus;
    }
    return out;
  } catch {
    return {};
  }
}

export type SetStatusResult =
  | { ok: true; status: AuditTrackStatus }
  | { ok: false; reason: 'read-only' | 'invalid' | 'io-error' };

/**
 * Set (or clear) the owner's tracking status for a finding. Passing 'open'
 * with no prior override removes the key, keeping the file minimal & diffs
 * clean. Surgical: only the targeted finding changes.
 */
export function setFindingStatus(findingId: string, status: AuditTrackStatus): SetStatusResult {
  if (!canWriteAuditStatus()) return { ok: false, reason: 'read-only' };
  if (!findingId || !VALID.has(status)) return { ok: false, reason: 'invalid' };

  const file = resolveFile();
  let map: StatusOverrides;
  try {
    map = readStatusOverrides();
  } catch {
    return { ok: false, reason: 'io-error' };
  }

  if (status === 'open') {
    delete map[findingId];
  } else {
    map[findingId] = status;
  }

  try {
    // Stable key order for clean, reviewable diffs.
    const ordered: StatusOverrides = {};
    for (const k of Object.keys(map).sort()) ordered[k] = map[k];
    writeFileSync(file, JSON.stringify(ordered, null, 2) + '\n');
  } catch {
    return { ok: false, reason: 'io-error' };
  }
  return { ok: true, status };
}
