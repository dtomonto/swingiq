'use client';

// ============================================================
// SwingVantage — Motion Lab: Video Overlay Lab
// ------------------------------------------------------------
// The slow-motion clip lab. It plays the user's ACTUAL uploaded
// video and draws synchronized, toggleable 2D analysis overlays on
// top of it — skeleton, joint angles, balance / centre of mass,
// contact window, racquet/club path, footwork, and phase labels.
//
// It reuses the already-computed analysis (pose track, detected
// phases, estimated implement path) and renders it in image space,
// so the overlays sit exactly where the body and implement are in
// the real footage. Frame stepping walks the POSE-TRACK frames so
// the video and overlay always advance together.
//
// PRIVACY: the video is an in-memory object URL — it is never
// uploaded and never persisted. When a saved session is reopened
// (video discarded by design), the results view falls back to the
// 3D reconstruction viewer instead of this lab.
//
// HONESTY: every overlay is an ESTIMATE from single-camera pose.
// Low-confidence landmarks fade out rather than asserting a number;
// nothing here is a medical or injury claim.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, ChevronLeft, ChevronRight, Camera, Repeat, Bookmark,
  Maximize2, PersonStanding, Triangle, Scale, Crosshair, Spline, Footprints, Tag,
} from 'lucide-react';
import type {
  MotionPoseTrack, MotionPhaseSegment, ObjectTrackingResult, Handedness,
} from '@/lib/motion-lab';
import type { SportId } from '@swingiq/core';
import {
  OVERLAY_BONES, OVERLAY_JOINTS, LM, frameIndexForTime, overlayJointAngles,
  balanceEstimate, balanceVerdict, stanceRead, leadSide,
  OVERLAY_DENSITY_LABEL, OVERLAY_DENSITY_HINT,
  layersForDensity, densityForLayers,
  type OverlayLayerId, type OverlayDensity,
} from '@/lib/motion-lab';
import { cn } from '@/lib/utils';
// Aliased: this component already has a `track` prop (the pose track).
import { track as trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

// ── Overlay layer registry ────────────────────────────────────

type LayerId = OverlayLayerId;

interface LayerDef {
  id: LayerId;
  label: string;
  icon: typeof PersonStanding;
}

const LAYERS: LayerDef[] = [
  { id: 'skeleton', label: 'Skeleton', icon: PersonStanding },
  { id: 'angles', label: 'Joint angles', icon: Triangle },
  { id: 'balance', label: 'Balance', icon: Scale },
  { id: 'contact', label: 'Contact', icon: Crosshair },
  { id: 'path', label: 'Swing path', icon: Spline },
  { id: 'footwork', label: 'Footwork', icon: Footprints },
  { id: 'phase', label: 'Phase', icon: Tag },
];

const DENSITIES: Array<Exclude<OverlayDensity, 'custom'>> = ['simple', 'coach', 'lab'];

const SPEEDS = [0.25, 0.5, 0.75, 1] as const;
const CONF_FADE = 0.35; // landmarks below this visibility are drawn faint

// Letterbox-aware mapping: where the video content actually sits inside the
// element (object-fit: contain), so overlays land on the body, not the bars.
interface ContentRect { ox: number; oy: number; cw: number; ch: number }

function contentRect(video: HTMLVideoElement, w: number, h: number): ContentRect {
  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  if (vw === 0 || vh === 0) return { ox: 0, oy: 0, cw: w, ch: h };
  const scale = Math.min(w / vw, h / vh);
  const cw = vw * scale;
  const ch = vh * scale;
  return { ox: (w - cw) / 2, oy: (h - ch) / 2, cw, ch };
}

interface Props {
  videoUrl: string;
  track: MotionPoseTrack;
  phases?: MotionPhaseSegment[];
  objectTracking?: ObjectTrackingResult | null;
  handedness: Handedness;
  sport: SportId;
  accent?: string;
  className?: string;
}

export function VideoOverlayLab({
  videoUrl, track, phases = [], objectTracking = null, handedness, accent = '#22C55E', className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const loopRef = useRef<{ start: number; end: number } | null>(null);
  // Fire usage signals at most once per mount so rapid stepping/looping can't
  // flood analytics — what matters is "did the user use this control at all".
  const usedStepRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.5);
  const [duration, setDuration] = useState(0);
  const [frameIdx, setFrameIdx] = useState(0); // current pose-track frame (display)
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loopKey, setLoopKey] = useState<string | null>(null);
  // Default to "Coach" density — a real read without overwhelming a casual user.
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(() => layersForDensity('coach'));

  const frames = track.frames;
  const lead = leadSide(handedness);
  const hasPath = !!objectTracking?.available && (objectTracking?.trace.points.length ?? 0) >= 2;
  const empty = frames.length === 0;

  // Which density preset the current layer-map matches ('custom' once a single
  // layer is toggled by hand) — drives the highlighted Simple/Coach/Lab pill.
  const density = densityForLayers(layers);

  const toggle = (id: LayerId) => setLayers((l) => {
    const next = !l[id];
    trackEvent(ANALYTICS_EVENTS.MOTION_LAB_OVERLAY_TOGGLED, { layer: id, on: next });
    return { ...l, [id]: next };
  });

  const applyDensity = (d: Exclude<OverlayDensity, 'custom'>) => {
    setLayers(layersForDensity(d));
    trackEvent(ANALYTICS_EVENTS.MOTION_LAB_OVERLAY_DENSITY_CHANGED, { density: d });
  };

  // tMs of a pose frame → seconds on the video timeline (frames carry source ts).
  const frameSeconds = useCallback((i: number) => (frames[i]?.tMs ?? 0) / 1000, [frames]);

  // ── Drawing ─────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (empty) return;

    const rect = contentRect(video, w, h);
    const px = (nx: number) => rect.ox + nx * rect.cw;
    const py = (ny: number) => rect.oy + ny * rect.ch;

    const tMs = video.currentTime * 1000;
    const fi = frameIndexForTime(frames, tMs);
    const frame = frames[fi];
    if (!frame) return;
    const lm = frame.landmarks;
    if (lm.length < 33) return;

    // ── Swing / racquet path (drawn first, behind the body) ────
    if (layers.path && hasPath && objectTracking) {
      const pts = objectTracking.trace.points;
      ctx.strokeStyle = 'rgba(249,115,22,0.85)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (p.frame > fi) break;
        const x = px(p.head.x), y = py(p.head.y);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // the implement (grip → head) at the current frame
      const cur = pts.find((p) => p.frame === fi) ?? [...pts].reverse().find((p) => p.frame <= fi);
      if (cur) {
        ctx.strokeStyle = 'rgba(249,115,22,0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px(cur.grip.x), py(cur.grip.y));
        ctx.lineTo(px(cur.head.x), py(cur.head.y));
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(px(cur.head.x), py(cur.head.y), 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── Skeleton ───────────────────────────────────────────────
    if (layers.skeleton) {
      for (const [a, b] of OVERLAY_BONES) {
        const pa = lm[a], pb = lm[b];
        if (!pa || !pb) continue;
        const conf = Math.min(pa.v, pb.v);
        ctx.strokeStyle = conf < CONF_FADE ? 'rgba(148,163,184,0.35)' : accent;
        ctx.lineWidth = conf < CONF_FADE ? 2 : 4;
        ctx.setLineDash(conf < CONF_FADE ? [4, 4] : []);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px(pa.x), py(pa.y)); ctx.lineTo(px(pb.x), py(pb.y)); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const j of OVERLAY_JOINTS) {
        const p = lm[j];
        if (!p) continue;
        ctx.fillStyle = p.v < CONF_FADE ? 'rgba(148,163,184,0.6)' : '#ffffff';
        ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
      }
    }

    // ── Footwork ───────────────────────────────────────────────
    if (layers.footwork) {
      const stance = stanceRead(lm);
      const la = lm[LM.leftAnkle], ra = lm[LM.rightAnkle];
      if (la && ra) {
        const y = py(Math.max(la.y, ra.y)) + 10;
        ctx.strokeStyle = 'rgba(56,189,248,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px(la.x), y); ctx.lineTo(px(ra.x), y); ctx.stroke();
        for (const a of [la, ra]) {
          ctx.beginPath(); ctx.moveTo(px(a.x), y - 5); ctx.lineTo(px(a.x), y + 5); ctx.stroke();
        }
        if (stance.label !== 'unknown') {
          ctx.fillStyle = 'rgba(56,189,248,0.95)';
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${stance.label} stance`, px((la.x + ra.x) / 2), y + 18);
        }
      }
    }

    // ── Balance: COM + base of support ─────────────────────────
    if (layers.balance) {
      const bal = balanceEstimate(lm);
      if (bal) {
        const verdict = balanceVerdict(bal.comOffset);
        const color = verdict === 'stable' ? 'rgba(34,197,94,0.95)' : verdict === 'shifting' ? 'rgba(234,179,8,0.95)' : 'rgba(239,68,68,0.95)';
        // base of support
        ctx.strokeStyle = 'rgba(148,163,184,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px(bal.base.leftX), py(bal.base.y)); ctx.lineTo(px(bal.base.rightX), py(bal.base.y)); ctx.stroke();
        // plumb line from COM down to the ground
        ctx.strokeStyle = color;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(px(bal.com.x), py(bal.com.y)); ctx.lineTo(px(bal.com.x), py(bal.base.y)); ctx.stroke();
        ctx.setLineDash([]);
        // COM dot
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px(bal.com.x), py(bal.com.y), 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // ── Joint angles ───────────────────────────────────────────
    if (layers.angles) {
      const angles = overlayJointAngles(lm, lead);
      ctx.textAlign = 'left';
      for (const a of angles) {
        if (a.value == null || a.confidence < CONF_FADE) continue;
        const v = lm[a.vertex];
        if (!v) continue;
        const alpha = 0.5 + a.confidence * 0.5;
        ctx.fillStyle = `rgba(250,204,21,${alpha})`;
        ctx.font = '600 12px system-ui, sans-serif';
        ctx.fillText(`${a.value}°`, px(v.x) + 8, py(v.y) - 6);
      }
    }

    // ── Contact window ─────────────────────────────────────────
    if (layers.contact && objectTracking?.contactZone) {
      const cz = objectTracking.contactZone;
      const near = Math.abs(fi - cz.frame) <= 2;
      const cx = px(cz.x), cy = py(cz.y);
      ctx.strokeStyle = near ? 'rgba(239,68,68,0.95)' : 'rgba(239,68,68,0.55)';
      ctx.lineWidth = near ? 3 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, near ? 12 : 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16); ctx.stroke();
      // "ideal contact" reference: the lead hip's vertical line — contact ahead
      // of it reads as "out in front".
      const leadHip = lm[lead === 'left' ? LM.leftHip : LM.rightHip];
      if (leadHip) {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px(leadHip.x), rect.oy); ctx.lineTo(px(leadHip.x), rect.oy + rect.ch); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    setFrameIdx(fi);
  }, [frames, layers, accent, lead, hasPath, objectTracking, empty]);

  // ── Animation / sync loop ───────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const loop = loopRef.current;
        if (loop && !video.paused && video.currentTime >= loop.end) {
          video.currentTime = loop.start;
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // ── Playback controls ───────────────────────────────────────
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play().catch(() => {}); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
  }, []);

  const applySpeed = (s: (typeof SPEEDS)[number]) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    if (s < 1) trackEvent(ANALYTICS_EVENTS.MOTION_LAB_SLOWMO_USED, { speed: s });
  };

  const seekTo = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPlaying(false);
    video.currentTime = Math.max(0, Math.min(video.duration || seconds, seconds));
  }, []);

  const stepFrame = useCallback((dir: 1 | -1) => {
    if (empty) return;
    if (!usedStepRef.current) { usedStepRef.current = true; trackEvent(ANALYTICS_EVENTS.MOTION_LAB_FRAME_STEPPED); }
    const next = Math.max(0, Math.min(frames.length - 1, frameIdx + dir));
    seekTo(frameSeconds(next));
  }, [empty, frames.length, frameIdx, frameSeconds, seekTo]);

  const jumpToPhase = (p: MotionPhaseSegment) => {
    trackEvent(ANALYTICS_EVENTS.MOTION_LAB_PHASE_CLICKED, { phase: p.key });
    seekTo((frames[p.keyFrame]?.tMs ?? p.startMs) / 1000);
  };

  const toggleLoop = (p: MotionPhaseSegment) => {
    if (loopKey === p.key) { loopRef.current = null; setLoopKey(null); return; }
    const start = (frames[p.startFrame]?.tMs ?? p.startMs) / 1000;
    const end = (frames[p.endFrame]?.tMs ?? p.endMs) / 1000;
    loopRef.current = { start, end };
    setLoopKey(p.key);
    seekTo(start);
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  };

  const addBookmark = () => {
    const t = videoRef.current?.currentTime ?? 0;
    setBookmarks((b) => (b.some((x) => Math.abs(x - t) < 0.03) ? b : [...b, t].sort((a, z) => a - z)));
  };

  const screenshot = () => {
    const video = videoRef.current, overlay = canvasRef.current;
    if (!video || !overlay) return;
    try {
      const out = document.createElement('canvas');
      out.width = video.videoWidth || overlay.clientWidth;
      out.height = video.videoHeight || overlay.clientHeight;
      const ctx = out.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, out.width, out.height);
      // scale the overlay (element space) onto the native-resolution frame
      ctx.drawImage(overlay, 0, 0, overlay.clientWidth, overlay.clientHeight, 0, 0, out.width, out.height);
      const a = document.createElement('a');
      a.href = out.toDataURL('image/png');
      a.download = `swingvantage-motionlab-frame-${frameIdx}.png`;
      a.click();
    } catch { /* tainted canvas / unsupported — ignore */ }
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  // Keyboard: space = play/pause, ←/→ = step a frame.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); stepFrame(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); stepFrame(1); }
  };

  const activePhase = useMemo(
    () => phases.find((p) => frameIdx >= p.startFrame && frameIdx <= p.endFrame),
    [phases, frameIdx],
  );

  const btn = 'inline-flex items-center justify-center rounded-md p-1.5 text-stage-foreground hover:bg-white/10 transition-colors';
  const scrubTotal = Math.max(1, frames.length - 1);

  return (
    // The player is a composite widget: it takes focus so keyboard users get the
    // roving transport shortcuts (space / arrows). jsx-a11y's heuristics can't
    // model a media-player group, so the two rules are scoped-disabled here.
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={wrapRef}
      className={cn('rounded-xl overflow-hidden border border-border bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="group"
      aria-label="Slow-motion video analysis player. Space to play or pause, left and right arrows to step a frame."
    >
      {/* Video + overlay */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          className="w-full max-h-[460px] block object-contain bg-black"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            v.playbackRate = speed;
            setDuration(v.duration || 0);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        <div className="absolute top-2 left-2 text-[10px] font-medium text-stage-foreground/90 bg-black/50 rounded px-1.5 py-0.5">
          Your clip · overlays are single-camera estimates
        </div>
        {layers.phase && activePhase && (
          <div className="absolute top-2 right-2 text-[11px] font-semibold text-white bg-black/55 rounded px-2 py-0.5">
            {activePhase.label} · {Math.round(activePhase.confidence * 100)}%
          </div>
        )}
        {empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-medium text-white">No body pose was detected in this clip.</p>
            <p className="text-xs text-stage-foreground mt-1">You can still scrub the video — re-film with the full body in frame and good light for overlays.</p>
          </div>
        )}
      </div>

      {/* Overlay density: progressive disclosure (Simple → Coach → Lab) */}
      <div className="bg-stage-panel border-t border-white/10 px-3 py-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-stage-muted mr-0.5">Detail</span>
        <div role="group" aria-label="Overlay detail level" className="inline-flex rounded-full border border-white/15 overflow-hidden">
          {DENSITIES.map((d) => (
            <button
              key={d}
              onClick={() => applyDensity(d)}
              disabled={empty}
              aria-pressed={density === d}
              title={OVERLAY_DENSITY_HINT[d]}
              className={cn(
                'text-[11px] font-medium px-2.5 py-1 transition-colors',
                empty ? 'opacity-35 cursor-not-allowed text-stage-muted'
                  : density === d ? 'bg-sky-500 text-white' : 'text-stage-foreground hover:bg-white/10',
              )}
            >
              {OVERLAY_DENSITY_LABEL[d]}
            </button>
          ))}
        </div>
        {density === 'custom' && (
          <span className="text-[10px] text-stage-muted">Custom — {LAYERS.filter((l) => layers[l.id]).length} layers</span>
        )}
      </div>

      {/* Overlay toggles */}
      <div className="bg-stage-panel border-t border-white/10 px-3 py-2 flex flex-wrap gap-1.5">
        {LAYERS.map((l) => {
          const Icon = l.icon;
          const on = layers[l.id];
          const disabled = (l.id === 'path' && !hasPath) || (l.id === 'contact' && !objectTracking?.contactZone) || empty;
          return (
            <button
              key={l.id}
              onClick={() => toggle(l.id)}
              disabled={disabled}
              aria-pressed={on}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-colors',
                disabled ? 'opacity-35 cursor-not-allowed border-white/10 text-stage-muted'
                  : on ? 'bg-sky-500/20 border-sky-400/50 text-sky-200' : 'border-white/15 text-stage-foreground hover:bg-white/10',
              )}
            >
              <Icon className="w-3 h-3" />{l.label}
            </button>
          );
        })}
      </div>

      {/* Transport */}
      <div className="bg-stage-panel border-t border-white/10 px-3 py-2 space-y-2">
        <div className="flex items-center gap-1">
          <button className={btn} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className={btn} onClick={() => stepFrame(-1)} aria-label="Previous frame"><ChevronLeft className="w-4 h-4" /></button>
          <button className={btn} onClick={() => stepFrame(1)} aria-label="Next frame"><ChevronRight className="w-4 h-4" /></button>

          {/* Phase-segmented scrubber */}
          <button
            type="button"
            className="relative flex-1 h-6 mx-1 rounded cursor-pointer overflow-hidden border border-white/10"
            aria-label="Scrub to frame"
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
              seekTo(frameSeconds(Math.round(frac * scrubTotal)));
            }}
          >
            {phases.length > 0 ? (
              <div className="absolute inset-0 flex">
                {phases.map((p, i) => {
                  const span = Math.max(1, p.endFrame - p.startFrame + 1);
                  return (
                    <div key={p.key + i} title={`${p.label} · ${Math.round(p.confidence * 100)}%`}
                      className="h-full border-r border-black/30 last:border-r-0"
                      style={{ width: `${(span / scrubTotal) * 100}%`, background: accent, opacity: 0.22 + p.confidence * 0.4 }} />
                  );
                })}
              </div>
            ) : <div className="absolute inset-0 bg-white/10" />}
            {/* bookmarks */}
            {duration > 0 && bookmarks.map((t, i) => (
              <span key={i} className="absolute top-0 bottom-0 w-0.5 bg-amber-400" style={{ left: `${(t / duration) * 100}%` }} />
            ))}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.85)] pointer-events-none"
              style={{ left: `${(frameIdx / scrubTotal) * 100}%` }} />
          </button>
          <span className="text-[11px] text-stage-muted tabular-nums w-14 text-right">{empty ? '—' : `${frameIdx + 1}/${frames.length}`}</span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => applySpeed(s)}
              className={cn('text-[11px] rounded px-1.5 py-0.5', speed === s ? 'bg-sky-500 text-white' : 'text-stage-foreground hover:bg-white/10')}>
              {s}×
            </button>
          ))}
          <span className="w-px h-4 bg-white/10 mx-1" />
          <button className={btn} onClick={addBookmark} aria-label="Bookmark this moment" title="Bookmark this moment"><Bookmark className="w-4 h-4" /></button>
          <button className={btn} onClick={screenshot} aria-label="Screenshot frame" title="Save frame as image"><Camera className="w-4 h-4" /></button>
          <button className={btn} onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
          <span className="ml-auto text-[10px] text-stage-muted">Space play · ← → frame</span>
        </div>

        {/* Jump-to-phase + loop */}
        {phases.length > 0 && !empty && (
          <div className="flex flex-wrap gap-1 pt-1">
            {phases.map((p) => (
              <span key={p.key} className="inline-flex items-center rounded-md overflow-hidden border border-white/10">
                <button onClick={() => jumpToPhase(p)} className="text-[10px] text-stage-foreground hover:bg-white/10 px-2 py-1">{p.shortLabel}</button>
                <button onClick={() => toggleLoop(p)} aria-label={`Loop ${p.label}`} title={`Loop ${p.label}`}
                  className={cn('px-1.5 py-1 border-l border-white/10', loopKey === p.key ? 'bg-sky-500/30 text-sky-200' : 'text-stage-muted hover:bg-white/10')}>
                  <Repeat className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
