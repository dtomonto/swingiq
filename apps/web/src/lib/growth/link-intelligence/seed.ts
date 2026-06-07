// ============================================================
// Link Intelligence Agent — repository seeds
// ------------------------------------------------------------
// The internal-link kinds are COMPUTED from your real pages, so they seed
// EMPTY: the hub renders a live run on every load (never empty), and the
// Internal Links / Link Audit tables populate the moment you run the agent.
// (Backlink + competitor + content-gap records reuse GrowthOS kinds that are
// already seeded in mock-data.ts.)
// ============================================================

import type { InternalLinkRecommendation, LinkFinding, LinkAgentRun } from './types';

export const INTERNAL_LINK_RECS_SEED: InternalLinkRecommendation[] = [];
export const LINK_FINDINGS_SEED: LinkFinding[] = [];
export const LINK_RUNS_SEED: LinkAgentRun[] = [];
