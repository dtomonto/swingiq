'use client';

// ============================================================
// SwingVantage — Motion Lab: Analysis Debug / Validation Panel
// ------------------------------------------------------------
// A collapsible, transparency-first view of the raw pipeline output so
// the AI can be VALIDATED (spec Feature 22): pipeline meta, per-frame
// pose confidence, dropped frames, phase timestamps, raw metric values,
// object-tracking + kinetic-chain internals, and device capabilities.
//
// It only reads what the pipeline already produced — it never recomputes
// or fabricates. Safe to show to anyone (no private data, no video).
// ============================================================

import { useSyncExternalStore } from 'react';
import { Bug } from 'lucide-react';
import type { MotionSession } from '@/lib/motion-lab';
import { skillLabel } from '@/lib/motion-lab';
import { detectMotionCapabilities, type MotionEngineCapabilities } from '@/lib/motion';

// Device capabilities read `navigator`, so they're client-only. Cache the
// snapshot module-side so useSyncExternalStore gets a STABLE reference (a fresh
// object each call would loop). Server snapshot is null → renders "Detecting…",
// then React swaps to the client value with no hydration mismatch.
let capsCache: MotionEngineCapabilities | null = null;
const getCaps = (): MotionEngineCapabilities => (capsCache ??= detectMotionCapabilities());
const noopSubscribe = () => () => {};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** Mean landmark visibility for one stored frame. */
function frameVis(landmarks: { v: number }[]): number {
  if (landmarks.length === 0) return 0;
  return landmarks.reduce((s, l) => s + l.v, 0) / landmarks.length;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function KV({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
      {items.map(([k, v]) => (
        <div key={k}>
          <p className="text-muted-foreground">{k}</p>
          <p className="text-foreground font-medium break-words">{v}</p>
        </div>
      ))}
    </div>
  );
}

interface Props {
  session: MotionSession;
}

export function AnalysisDebugPanel({ session }: Props) {
  // Client-only device caps (see note above) — no setState-in-effect, no mismatch.
  const caps = useSyncExternalStore<MotionEngineCapabilities | null>(noopSubscribe, getCaps, () => null);

  const track = session.poseTrack;
  const dropped = Math.max(0, track.attemptedFrames - track.frames.length);
  const ot = session.objectTracking;
  const kc = session.kineticChain;
  const tp = session.temporal;

  return (
    <details className="rounded-xl border border-border bg-card group">
      <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-muted-foreground flex items-center gap-2">
        <Bug className="w-3.5 h-3.5" /> Technical details (AI validation)
        <span className="ml-auto text-[10px] group-open:hidden">show</span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <Section title="Pipeline">
          <KV
            items={[
              ['Frames detected', `${track.frames.length} / ${track.attemptedFrames}`],
              ['Dropped frames', `${dropped}${track.attemptedFrames > 0 ? ` (${pct(dropped / track.attemptedFrames)})` : ''}`],
              ['Tracking confidence', pct(track.trackingConfidence)],
              ['Data basis', track.basis],
              ['Pose model', session.modelVersion],
              ['Engine', session.analysisVersion],
              ['Processing time', session.processingMs != null ? `${session.processingMs} ms` : '—'],
              ['Detected view', session.quality.estimatedView.replace(/_/g, ' ')],
              ['Est. frame rate', session.quality.estimatedFps != null ? `${Math.round(session.quality.estimatedFps)} fps` : 'unknown'],
              ['Resolution', session.quality.resolution || 'unknown'],
              ['Skill level', skillLabel(session.capture.skillLevel ?? 'intermediate')],
              ['Quality score', `${session.quality.score}/100 (${session.quality.verdict})`],
            ]}
          />
        </Section>

        {/* Per-frame pose confidence — a tiny inline bar chart of mean visibility. */}
        {track.frames.length > 0 && (
          <Section title={`Per-frame pose confidence (${track.frames.length} frames)`}>
            <div className="flex items-end gap-px h-10" aria-hidden>
              {track.frames.map((f, i) => {
                const v = frameVis(f.landmarks);
                return (
                  <div
                    key={i}
                    title={`frame ${i + 1}: ${pct(v)} @ ${f.tMs}ms`}
                    className="flex-1 min-w-px rounded-sm"
                    style={{
                      height: `${Math.max(4, Math.round(v * 100))}%`,
                      background: v < 0.4 ? '#94a3b8' : v < 0.7 ? '#d97706' : '#16a34a',
                    }}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">Green ≥70% · amber 40–70% · grey &lt;40% (low-confidence frames).</p>
          </Section>
        )}

        {/* Phase timestamps */}
        {session.phases.length > 0 && (
          <Section title="Phase timestamps">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1 pr-3 font-medium">Phase</th>
                    <th className="py-1 pr-3 font-medium">Frames</th>
                    <th className="py-1 pr-3 font-medium">ms</th>
                    <th className="py-1 pr-3 font-medium">Conf.</th>
                    <th className="py-1 font-medium">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {session.phases.map((p) => (
                    <tr key={p.key} className="border-t border-border/60">
                      <td className="py-1 pr-3 text-foreground">{p.label}</td>
                      <td className="py-1 pr-3 tabular-nums">{p.startFrame}–{p.endFrame}</td>
                      <td className="py-1 pr-3 tabular-nums">{p.startMs}–{p.endMs}</td>
                      <td className="py-1 pr-3 tabular-nums">{pct(p.confidence)}</td>
                      <td className="py-1">{p.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Object tracking internals */}
        <Section title="Implement / object tracking">
          {ot ? (
            <>
              <KV
                items={[
                  ['Implement', ot.implement],
                  ['Available', String(ot.available)],
                  ['Method', ot.trace.method],
                  ['Basis', ot.basis],
                  ['Confidence', pct(ot.confidence)],
                  ['Path points', String(ot.trace.points.length)],
                  ['Contact frame', ot.contactZone ? String(ot.contactZone.frame) : '—'],
                  ['Approach', `${ot.swingPath.approach}${ot.swingPath.verticalApproachDeg != null ? ` (${ot.swingPath.verticalApproachDeg}°)` : ''}`],
                ]}
              />
              {ot.warnings.length > 0 && (
                <ul className="list-disc list-inside text-[10px] text-warning/90 mt-1">
                  {ot.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">Not computed for this session.</p>
          )}
        </Section>

        {/* Kinetic chain internals */}
        {kc && kc.comparableLinks > 0 && (
          <Section title="Kinetic chain">
            <KV
              items={[
                ['Sequence', `${kc.sequenceQuality}/100`],
                ['Overall', `${kc.overall}/100`],
                ['Ordered links', `${kc.orderedLinks}/${kc.comparableLinks}`],
                ['Lower body', kc.lowerBodyTiming != null ? pct(kc.lowerBodyTiming) : '—'],
                ['Torso', kc.torsoTiming != null ? pct(kc.torsoTiming) : '—'],
                ['Arms', kc.armTiming != null ? pct(kc.armTiming) : '—'],
                ['Implement', kc.implementTiming != null ? pct(kc.implementTiming) : '—'],
                ['Power leaks', kc.powerLeakFlags.length ? kc.powerLeakFlags.map((f) => f.id).join(', ') : 'none'],
              ]}
            />
          </Section>
        )}

        {/* Temporal internals */}
        {tp && tp.confidence > 0 && (
          <Section title="Temporal">
            <KV
              items={[
                ['Tempo', tp.tempoRatio != null ? `${tp.tempoRatio}:1` : '—'],
                ['Load', tp.loadDurationMs != null ? `${tp.loadDurationMs} ms` : '—'],
                ['Transition', tp.transitionDurationMs != null ? `${tp.transitionDurationMs} ms` : '—'],
                ['Acceleration', tp.accelerationDurationMs != null ? `${tp.accelerationDurationMs} ms` : '—'],
                ['Peak speed @', tp.peakSpeedTimePct != null ? pct(tp.peakSpeedTimePct) : '—'],
                ['Contact stability', tp.contactWindowStability != null ? `${tp.contactWindowStability}/100` : '—'],
                ['Deceleration', tp.decelerationControl != null ? `${tp.decelerationControl}/100` : '—'],
                ['Flags', tp.flags.length ? tp.flags.map((f) => f.id).join(', ') : 'none'],
              ]}
            />
          </Section>
        )}

        {/* Raw metric values */}
        <Section title="Raw metrics">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="py-1 pr-3 font-medium">Metric</th>
                  <th className="py-1 pr-3 font-medium">Value</th>
                  <th className="py-1 pr-3 font-medium">Score</th>
                  <th className="py-1 pr-3 font-medium">Conf.</th>
                  <th className="py-1 font-medium">Basis</th>
                </tr>
              </thead>
              <tbody>
                {session.metrics.map((m) => (
                  <tr key={m.id} className="border-t border-border/60">
                    <td className="py-1 pr-3 text-foreground">{m.name}</td>
                    <td className="py-1 pr-3 tabular-nums">{m.value != null ? `${m.value}${m.unit}` : '—'}</td>
                    <td className="py-1 pr-3 tabular-nums">{m.normalizedScore ?? '—'}</td>
                    <td className="py-1 pr-3 tabular-nums">{pct(m.confidence)}</td>
                    <td className="py-1">{m.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Device / runtime capabilities */}
        <Section title="Device capabilities (this browser)">
          {caps ? (
            <KV
              items={[
                ['WebGPU', caps.webgpu ? 'yes' : 'no'],
                ['WebNN', caps.webnn ? 'yes' : 'no'],
                ['OffscreenCanvas', caps.offscreenCanvas ? 'yes' : 'no'],
                ['WebAssembly', caps.wasm ? 'yes' : 'no'],
              ]}
            />
          ) : (
            <p className="text-[11px] text-muted-foreground">Detecting…</p>
          )}
        </Section>
      </div>
    </details>
  );
}
