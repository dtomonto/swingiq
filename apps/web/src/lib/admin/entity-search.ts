// ============================================================
// Admin entity search (SERVER-ONLY)
// ------------------------------------------------------------
// Lets the command palette jump to actual RECORDS — not just nav sections.
// Searches local registries (milestones; always available) plus service-role
// data (users, swing analyses) when configured. Honest by construction: if the
// service role isn't set, those sources simply return nothing (no fake hits).
//
// Reuses the existing guarded data helpers, so it inherits their admin authz
// and RLS-bypass safety. NEVER import from a client component.
// ============================================================

import { listAdminUsers } from './data/users';
import { listAnalyses } from './data/analyses';
import { indexablePublishedMilestones } from '@/content/milestones/published';
import { milestonePath } from '@/lib/milestones/page-detail';

export type EntityType = 'user' | 'analysis' | 'milestone';

export interface EntityResult {
  type: EntityType;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

const MIN_QUERY = 2;

function matches(haystack: string, term: string): boolean {
  return haystack.toLowerCase().includes(term);
}

/** Search records across milestones, users, and swing analyses. */
export async function searchEntities(query: string, perType = 5): Promise<EntityResult[]> {
  const term = query.trim().toLowerCase();
  if (term.length < MIN_QUERY) return [];

  const results: EntityResult[] = [];

  // Milestones — local registry, always safe.
  for (const m of indexablePublishedMilestones()) {
    if (results.filter((r) => r.type === 'milestone').length >= perType) break;
    if (matches(`${m.verifiedMetric} ${m.slug}`, term)) {
      results.push({
        type: 'milestone',
        id: m.slug,
        label: m.verifiedMetric,
        sublabel: 'Milestone',
        href: milestonePath(m.slug),
      });
    }
  }

  // Users — service-role; honest empty when not connected.
  try {
    const { users } = await listAdminUsers();
    for (const u of users) {
      if (results.filter((r) => r.type === 'user').length >= perType) break;
      if (matches(`${u.email ?? ''} ${u.name ?? ''}`, term)) {
        results.push({
          type: 'user',
          id: u.id,
          label: u.email ?? u.name ?? u.id,
          sublabel: u.name && u.email ? u.name : 'Account',
          href: '/admin/users',
        });
      }
    }
  } catch {
    /* service role unavailable — skip silently */
  }

  // Swing analyses — service-role; honest empty when not connected.
  try {
    const { rows } = await listAnalyses(500);
    for (const a of rows) {
      if (results.filter((r) => r.type === 'analysis').length >= perType) break;
      if (matches(`${a.fileName} ${a.sport} ${a.primaryIssue ?? ''} ${a.userEmail ?? ''}`, term)) {
        results.push({
          type: 'analysis',
          id: a.id,
          label: a.fileName || `${a.sport} analysis`,
          sublabel: `${a.sport} · score ${a.overallScore}`,
          href: `/admin/ai-analyses/${a.id}`,
        });
      }
    }
  } catch {
    /* service role unavailable — skip silently */
  }

  return results;
}
