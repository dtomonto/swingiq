// ============================================================
// /admin/motion-lab — MotionLab control surface
// ------------------------------------------------------------
// One read-only operating surface for the movement-intelligence layer:
// every sport's motion profile (phases, movement model, overlay
// expectations), how the Motion Score is composed, the overlay density
// presets, and a low-confidence review queue (computed on-device, since
// analyses never touch a server). Mirrors the real lib/motion-lab
// config — no duplicated numbers, honest about single-camera estimates.
// ============================================================

import type { Metadata } from 'next';
import { Activity, Layers, Trophy, Eye, ListChecks, Repeat } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import {
  OVERLAY_DENSITY_LABEL, OVERLAY_DENSITY_HINT, OVERLAY_DENSITY_PRESETS, OVERLAY_LAYER_META,
} from '@/lib/motion-lab';
import { buildMotionProfileInventory } from '@/lib/admin/motion-lab/profiles';
import { MotionLabReviewQueue } from './MotionLabReviewQueue';

export const metadata: Metadata = { title: 'MotionLab | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const DENSITIES = ['simple', 'coach', 'lab'] as const;

export default function AdminMotionLabPage() {
  const inv = buildMotionProfileInventory();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="MotionLab"
        icon={Activity}
        description="The movement-intelligence control surface. Every sport's motion profile, how the Motion Score is composed, the overlay density presets, and a low-confidence review queue. Read-only: this reflects the real lib/motion-lab config so you can see coverage without touching live data."
        actions={<StatusBadge tone="info">{inv.stats.sports} sports · {inv.stats.motions} motions</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Sports" icon={Layers} value={String(inv.stats.sports)} hint="distinct profiles" />
        <MetricStat label="Motions" icon={Activity} value={String(inv.stats.motions)} hint="across sports" />
        <MetricStat label="Continuous" icon={Repeat} value={String(inv.stats.continuousSports)} hint="rally sports" tone="success" />
        <MetricStat label="Discrete" icon={Trophy} value={String(inv.stats.discreteSports)} hint="swing sports" />
        <MetricStat label="Score parts" icon={ListChecks} value={String(inv.stats.scoreComponents)} hint="weighted" />
        <MetricStat label="Overlays" icon={Eye} value={String(OVERLAY_LAYER_META.length)} hint="layers" />
      </div>

      {/* ── Sport motion profiles ─────────────────────────────── */}
      <SectionCard
        title="Sport motion profiles"
        description="Each sport's motions, their movement model and the canonical phase template. Rally sports (tennis · pickleball · padel) carry the continuous-movement read (ready → contact → recover → next-ready); swing sports are scored as discrete reps."
      >
        <div className="space-y-4">
          {inv.profiles.map((p) => (
            <div key={p.sport} className="rounded-lg border border-border bg-card/40 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-lg" aria-hidden>{p.emoji}</span>
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                <StatusBadge tone={p.continuous ? 'accent' : 'neutral'}>
                  {p.continuous ? 'Continuous rally' : 'Discrete swing'}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">{p.motions.length} motions</span>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {p.motions.map((m) => (
                  <div key={m.id} className="rounded-md border border-border/80 bg-background/40 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{m.label}</span>
                      {m.rotational && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">rotational</span>
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground">{m.movementModelLabel}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.phases.map((ph, i) => (
                        <span key={ph.key} className="inline-flex items-center rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <span className="mr-1 text-muted-foreground/70">{i + 1}</span>{ph.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Score composition ─────────────────────────────────── */}
      <SectionCard
        title="Motion Score composition"
        description="How the 0–100 Motion Score is built. Each component is a confidence-weighted blend of proxy metrics; the weights below determine its pull on the overall score."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Component</th>
                <th className="py-2 pr-4 font-medium">Weight</th>
                <th className="py-2 font-medium">Metrics</th>
              </tr>
            </thead>
            <tbody>
              {inv.scoreComponents.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4 font-medium text-foreground">{c.label}</td>
                  <td className="py-2 pr-4 tabular-nums text-foreground">×{c.weight}</td>
                  <td className="py-2 text-xs text-muted-foreground">{c.metricIds.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Overlay density presets ───────────────────────────── */}
      <SectionCard
        title="Overlay density presets"
        description="Progressive disclosure for the slow-motion lab. Each preset turns on a curated set of the seven overlay layers so a casual user, an athlete and a coach each see the right amount of detail."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DENSITIES.map((d) => {
            const preset = OVERLAY_DENSITY_PRESETS[d];
            const on = OVERLAY_LAYER_META.filter((l) => preset[l.id]);
            return (
              <div key={d} className="rounded-lg border border-border bg-card/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{OVERLAY_DENSITY_LABEL[d]}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{on.length}/{OVERLAY_LAYER_META.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{OVERLAY_DENSITY_HINT[d]}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {OVERLAY_LAYER_META.map((l) => (
                    <span
                      key={l.id}
                      className={
                        preset[l.id]
                          ? 'rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] text-link'
                          : 'rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground/70 line-through'
                      }
                    >
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Low-confidence review queue ───────────────────────── */}
      <SectionCard
        title="Low-confidence review queue"
        description="Analyses worth a human look — low confidence or a poor camera angle. Computed on this device, since MotionLab runs on-device and never uploads video or stores analyses on a server."
      >
        <MotionLabReviewQueue />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A single operating surface for the
          MotionLab movement-intelligence layer. Profiles, phases, score weights and overlay presets are read
          straight from <code className="mx-1 rounded bg-muted px-1">lib/motion-lab</code> so this never
          drifts from what the product actually ships.
        </p>
        <p>
          <strong className="text-foreground">Continuous vs discrete.</strong> Tennis, pickleball and padel are
          scored as continuous rally movement — the engine reads ready position, contact spacing, recovery and
          the next-ready step, not just the strike frame. Golf, baseball and softball are discrete swings.
        </p>
        <p>
          <strong className="text-foreground">Changing config.</strong> Phase templates live in
          <code className="mx-1 rounded bg-muted px-1">taxonomy.ts</code>, score weights in
          <code className="mx-1 rounded bg-muted px-1">scoring.ts</code>, and overlay presets in
          <code className="mx-1 rounded bg-muted px-1">overlay-density.ts</code>. Edit there and commit to
          roll a change out to everyone.
        </p>
      </HelpPanel>
    </div>
  );
}
