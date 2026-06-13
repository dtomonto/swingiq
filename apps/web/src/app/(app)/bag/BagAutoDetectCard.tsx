'use client';

// ============================================================
// SwingVantage — Bag auto-detection card (Phase 4)
// ------------------------------------------------------------
// Surfaces the bag SwingVantage inferred from imported shots:
//   • clubs you've hit but haven't added → one-tap "Add"
//   • clubs whose typical carry has drifted from your sessions → "Update"
// Source-of-truth hierarchy is respected: this only ever offers changes,
// flags carries you set by hand, and stamps applied items as `imported`
// so a later manual edit (→ `user`) still wins.
// ============================================================

import { useMemo, useState } from 'react';
import { Sparkles, Plus, RefreshCw, X, AlertTriangle, Undo2, Check } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSwingVantageStore } from '@/store';
import { detectBagFromSessions, reconcileBag, type DetectedClub, type DetectionConfidence } from '@/lib/equipment/bag-detection';

const CONF_BADGE: Record<DetectionConfidence, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  high: { variant: 'success', label: 'High confidence' },
  medium: { variant: 'warning', label: 'Some data' },
  low: { variant: 'default', label: 'Few shots' },
};

export function BagAutoDetectCard() {
  const { clubs, sessions, addClub, applyCarryUpdate, undoCarryUpdate } = useSwingVantageStore();
  const [dismissed, setDismissed] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  const golfSessions = useMemo(
    () => sessions.filter((s) => (s.sport === 'golf' || !s.sport) && s.shots.length > 0),
    [sessions],
  );
  const detected = useMemo(() => detectBagFromSessions(golfSessions), [golfSessions]);
  const { newClubs, baselineUpdates } = useMemo(() => reconcileBag(clubs, detected), [clubs, detected]);

  const visibleNew = newClubs.filter((c) => !addedNames.has(c.name));
  // Clubs with a stored undo snapshot have an applied, still-revertible update.
  const appliedUpdates = clubs.filter((c) => c.carry_undo);
  // Still-pending updates (applied ones drop out of reconcileBag once the carry
  // matches, but filter defensively too).
  const visibleUpdates = baselineUpdates.filter((u) => !appliedUpdates.some((c) => c.id === u.clubId));

  if (
    dismissed ||
    golfSessions.length === 0 ||
    (visibleNew.length === 0 && visibleUpdates.length === 0 && appliedUpdates.length === 0)
  ) {
    return null;
  }

  const addClubFrom = (d: DetectedClub) => {
    addClub({
      name: d.name,
      category: d.category,
      brand: '',
      model: '',
      loft: null,
      typical_carry: d.carryAvg,
      typical_total: d.totalAvg,
      shaft_flex: '',
      notes: '',
      sort_order: clubs.length,
      source_of_truth: 'imported',
      imported_carry_avg: d.carryAvg,
      imported_shot_count: d.shotCount,
      active: true,
    });
    setAddedNames((prev) => new Set(prev).add(d.name));
  };

  const addAll = () => visibleNew.forEach(addClubFrom);

  const applyUpdate = (clubId: string, importedCarry: number, shotCount: number) => {
    // The store snapshots the prior carry baseline onto the club record, so the
    // undo survives a reload until it's reverted or the club is hand-edited.
    applyCarryUpdate(clubId, {
      typical_carry: importedCarry,
      imported_carry_avg: importedCarry,
      imported_shot_count: shotCount,
    });
  };

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" aria-hidden="true" /> Detected from your sessions
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Built from {golfSessions.length} session{golfSessions.length === 1 ? '' : 's'} of imported shots.
            Add what&rsquo;s missing or refresh a carry — you stay in control.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground p-1 -m-1">
          <X size={16} />
        </button>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* New clubs to add */}
        {visibleNew.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clubs you&rsquo;ve hit but haven&rsquo;t added ({visibleNew.length})
              </p>
              {visibleNew.length > 1 && (
                <Button size="sm" variant="outline" onClick={addAll}>
                  <Plus size={14} /> Add all
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {visibleNew.map((d) => (
                <div key={d.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.carryAvg !== null ? `~${d.carryAvg} yds carry` : 'no carry data'} · {d.shotCount} shot{d.shotCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Badge variant={CONF_BADGE[d.confidence].variant} className="shrink-0">{CONF_BADGE[d.confidence].label}</Badge>
                  <Button size="sm" onClick={() => addClubFrom(d)} className="shrink-0">
                    <Plus size={14} /> Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Baseline updates */}
        {visibleUpdates.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Carry baselines that have drifted ({visibleUpdates.length})
            </p>
            <div className="space-y-2">
              {visibleUpdates.map((u) => (
                <div key={u.clubId} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      You have <span className="font-medium">{u.currentCarry ?? '—'}</span> yds ·
                      sessions show <span className="font-medium text-foreground">{u.importedCarry}</span> yds ({u.shotCount} shots)
                    </p>
                    {u.userConfirmed && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle size={11} /> You set this by hand — updating replaces your value.
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => applyUpdate(u.clubId, u.importedCarry, u.shotCount)} className="shrink-0">
                    <RefreshCw size={13} /> Update
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applied updates — confirm + offer a one-tap revert */}
        {appliedUpdates.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recently updated ({appliedUpdates.length})
            </p>
            <div className="space-y-2">
              {appliedUpdates.map((c) => {
                const prevCarry = c.carry_undo?.typical_carry;
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-2.5">
                    <Check size={15} className="shrink-0 text-success" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Carry set to <span className="font-medium text-foreground">{c.typical_carry}</span> yds
                        {prevCarry !== null && prevCarry !== undefined && (
                          <> · was <span className="font-medium">{prevCarry}</span> yds</>
                        )}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => undoCarryUpdate(c.id)} className="shrink-0">
                      <Undo2 size={13} /> Undo
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
