'use client';

// ============================================================
// SwingVantage — Motion Lab: Coach & Team Dashboard
// ------------------------------------------------------------
// Local-first roster view for coaches, parents, and teams. Group Motion
// Lab sessions by athlete and see per-athlete progress + team-level
// aggregates. Everything stays on this device — "athletes" are labels,
// no accounts or sharing. Honest about the single-camera basis.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Users, UserPlus, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, ClipboardList,
} from 'lucide-react';
import {
  loadCoachView, addAthlete, deleteAthlete, updateSessionMeta, useMotionSessions,
  type AthleteSummary,
} from '@/lib/motion-lab';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          title={`${v}/100`}
          className="w-1.5 rounded-sm bg-primary/60"
          style={{ height: `${Math.max(6, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

function AthleteCard({
  summary,
  onDelete,
}: {
  summary: AthleteSummary;
  onDelete: () => void;
}) {
  const s = summary;
  const Trend = s.improvement == null ? Minus : s.improvement > 0 ? TrendingUp : s.improvement < 0 ? TrendingDown : Minus;
  const trendTone = s.improvement == null ? 'text-muted-foreground' : s.improvement > 0 ? 'text-success' : s.improvement < 0 ? 'text-error' : 'text-muted-foreground';

  return (
    <Card className={s.needsAttention ? 'border-warning/40' : undefined}>
      <CardBody className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{s.athlete.name}</span>
          {s.needsAttention && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 rounded px-1.5 py-0.5">
              <AlertTriangle className="w-3 h-3" /> needs attention
            </span>
          )}
          <button
            onClick={onDelete}
            className="ml-auto text-muted-foreground hover:text-error p-1"
            aria-label={`Remove ${s.athlete.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {s.sessionCount === 0 ? (
          <p className="text-xs text-muted-foreground">No sessions yet. Assign one below or analyse a motion and tag it here.</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground leading-none tabular-nums">{s.averageOverall}</p>
                <p className="text-[10px] text-muted-foreground">avg / 100</p>
              </div>
              <Sparkline values={s.trend.map((t) => t.overall)} />
              <div className={`flex items-center gap-1 text-xs font-semibold ${trendTone}`}>
                <Trend className="w-4 h-4" />
                {s.improvement != null && <span className="tabular-nums">{s.improvement > 0 ? '+' : ''}{s.improvement}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{s.sessionCount} sessions</span>
              <span>best {s.bestOverall}</span>
              {s.daysSinceActive != null && <span>last {s.daysSinceActive === 0 ? 'today' : `${s.daysSinceActive}d ago`}</span>}
            </div>
            {s.recurringFaults.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Recurring: <span className="text-foreground">{s.recurringFaults.map((f) => `${f.fault} (${f.count})`).join(', ')}</span>
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function CoachDashboard() {
  const sessions = useMotionSessions(); // re-render when the session store changes
  const [refresh, setRefresh] = useState(0);
  const [name, setName] = useState('');

  // loadCoachView reads fresh from storage; `sessions` (session store) and
  // `refresh` (roster CRUD) are deliberate recompute triggers.
  const view = useMemo(() => {
    void sessions;
    void refresh;
    return loadCoachView();
  }, [sessions, refresh]);
  const bump = () => setRefresh((n) => n + 1);

  const onAdd = () => {
    if (addAthlete(name)) {
      setName('');
      bump();
    }
  };

  const onAssign = (sessionId: string, athleteId: string) => {
    if (!athleteId) return;
    updateSessionMeta(sessionId, { athleteId });
    bump();
  };

  const team = view.team;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-lg font-bold text-foreground">Coach &amp; Team</h1>
          <p className="text-xs text-muted-foreground">
            Group your Motion Lab sessions by athlete. Everything stays on this device — no accounts, no sharing.
          </p>
        </div>
      </div>

      {/* Add athlete */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Add an athlete (e.g. Jordan, or '#7 Smith')"
            maxLength={60}
            className="flex-1 text-sm rounded-lg border border-border bg-card px-3 py-2 text-foreground"
            aria-label="New athlete name"
          />
          <Button onClick={onAdd} disabled={!name.trim()} size="sm">
            <UserPlus className="w-4 h-4" /> Add athlete
          </Button>
        </CardBody>
      </Card>

      {/* Team report */}
      {team.athleteCount > 0 && (
        <Card className="bg-primary/5 border-primary/30">
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Team report</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{team.athleteCount}</p>
                <p className="text-[10px] text-muted-foreground">athletes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{team.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground">sessions</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{team.averageOverall ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground">avg score</p>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground tabular-nums">{team.recentlyActiveCount}</p>
                <p className="text-[10px] text-muted-foreground">active (7d)</p>
              </div>
            </div>
            {team.aggregateWeaknesses.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  Most common focus across the roster:{' '}
                  <span className="text-foreground font-medium">
                    {team.aggregateWeaknesses.slice(0, 3).map((w) => `${w.fault} (${w.count})`).join(', ')}
                  </span>
                  . A shared team drill block here is efficient coaching.
                </p>
              </div>
            )}
            {team.needsAttention.length > 0 && (
              <p className="text-xs text-warning">
                {team.needsAttention.length} athlete{team.needsAttention.length > 1 ? 's' : ''} need attention (no recent upload or trending down):{' '}
                {team.needsAttention.map((a) => a.athlete.name).join(', ')}.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Athlete cards */}
      {view.athletes.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No athletes yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add an athlete above, then assign Motion Lab sessions to them.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {view.athletes.map((s) => (
            <AthleteCard key={s.athlete.id} summary={s} onDelete={() => { deleteAthlete(s.athlete.id); bump(); }} />
          ))}
        </div>
      )}

      {/* Unassigned sessions → assign to an athlete */}
      {view.unassigned.length > 0 && view.athletes.length > 0 && (
        <Card>
          <CardBody className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Unassigned sessions ({view.unassigned.length})</p>
            <p className="text-[11px] text-muted-foreground">Tag each session to an athlete to track their progress.</p>
            <div className="space-y-1.5">
              {view.unassigned.map((u) => (
                <div key={u.id} className="flex items-center gap-2 text-xs">
                  <span className="shrink-0">{u.emoji}</span>
                  <span className="flex-1 truncate text-foreground">
                    {u.sportLabel} · {u.motionLabel} · {new Date(u.createdAt).toLocaleDateString()} · {u.overall}/100
                  </span>
                  <select
                    defaultValue=""
                    onChange={(e) => onAssign(u.id, e.target.value)}
                    className="text-xs rounded-lg border border-border bg-card px-2 py-1 text-foreground"
                    aria-label={`Assign session from ${u.createdAt} to an athlete`}
                  >
                    <option value="" disabled>Assign to…</option>
                    {view.athletes.map((a) => (
                      <option key={a.athlete.id} value={a.athlete.id}>{a.athlete.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Scores are estimated from single-camera video — directional, not lab measurements. No medical, injury-risk, or guaranteed-improvement claims.
      </p>
    </div>
  );
}
