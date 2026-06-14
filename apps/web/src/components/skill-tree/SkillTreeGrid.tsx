'use client';

// ============================================================
// WS-03 — Skill tree grid: nodes with status, a level bar, and a click-to-
// open evidence detail. Game-like but not childish; mobile-first + a11y.
// ============================================================

import { useEffect, useState } from 'react';
import type { SportId } from '@swingiq/core';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkles } from 'lucide-react';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { useSkillTree } from '@/lib/skill-tree/useSkillTree';
import type { SkillNode, SkillNodeStatus } from '@/lib/skill-tree/generate';

const STATUS_META: Record<SkillNodeStatus, { label: string; dot: string; badge: 'success' | 'info' | 'warning' | 'danger' | 'default' }> = {
  mastered: { label: 'Mastered', dot: 'bg-success', badge: 'success' },
  improving: { label: 'Improving', dot: 'bg-success/70', badge: 'success' },
  active: { label: 'Active', dot: 'bg-accent-secondary', badge: 'info' },
  available: { label: 'Available', dot: 'bg-muted-foreground/40', badge: 'default' },
  needs_attention: { label: 'Needs attention', dot: 'bg-warning', badge: 'warning' },
  regressed: { label: 'Regressed', dot: 'bg-error', badge: 'danger' },
  locked: { label: 'Locked', dot: 'bg-muted-foreground/30', badge: 'default' },
};

export function SkillTreeGrid({ sport }: { sport: SportId }) {
  const tree = useSkillTree(sport);
  const [openId, setOpenId] = useState<string | null>(null);
  const coverage = tree?.coverage;

  useEffect(() => {
    if (coverage) track(ANALYTICS_EVENTS.SKILL_TREE_VIEWED, { sport, skill_level: coverage });
  }, [sport, coverage]);

  if (!tree) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Skill tree in development for this sport"
        description="Your skill tree appears here once this sport's journey is live."
        compact
      />
    );
  }

  const open = tree.nodes.find((n) => n.id === openId) ?? null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tree.nodes.map((node) => (
          <NodeCell
            key={node.id}
            node={node}
            onOpen={() => {
              setOpenId(node.id);
              track(ANALYTICS_EVENTS.SKILL_TREE_NODE_OPENED, {
                sport,
                node_category: node.category,
                status: node.status,
                confidence_score: node.confidenceScore ?? 0,
              });
            }}
          />
        ))}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">{open.name}</p>
            <Badge variant={STATUS_META[open.status].badge}>{STATUS_META[open.status].label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{open.evidence.summary}</p>
          <p className="mt-1 text-2xs text-muted-foreground">
            {open.progressScore === null
              ? 'No measured score yet.'
              : `Progress ${Math.round(open.progressScore)}/100 · confidence ${Math.round((open.confidenceScore ?? 0) * 100)}%`}
          </p>
        </div>
      )}
    </div>
  );
}

function NodeCell({ node, onOpen }: { node: SkillNode; onOpen: () => void }) {
  const meta = STATUS_META[node.status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-border/60 hover:bg-muted/50 focus:outline-hidden focus:ring-2 focus:ring-ring"
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
        <span className="truncate text-xs font-medium text-foreground">{node.name}</span>
      </div>
      <div className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-[var(--primary)]"
          style={{ width: `${node.progressScore ?? 0}%` }}
        />
      </div>
      <span className="mt-1 text-3xs uppercase tracking-wide text-muted-foreground">{meta.label}</span>
    </button>
  );
}
