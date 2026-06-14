'use client';

// ============================================================
// SwingVantage — Motion Lab: 3D Motion Viewer
// ------------------------------------------------------------
// A dependency-free 3D skeleton player rendered on a 2D canvas. It
// projects the REAL MediaPipe landmarks (x, y, and model depth z) with
// a rotation + light-perspective transform, so the user can orbit,
// zoom, scrub, and compare. Frames are interpolated for smooth
// playback even though only ~24 are sampled.
//
// HONESTY: this is an ESTIMATED 3D reconstruction from a single camera
// (MediaPipe depth is relative, not metric). It is labeled as such in
// the UI. The clean provider seam means a true multi-view or trained
// 3D model can replace the source track without touching this viewer.
// ============================================================

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Play, Pause, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Camera, RotateCcw, Tag, Spline, Eye, Crosshair,
} from 'lucide-react';
import type { MotionPoseTrack, MotionPhaseSegment, ObjectTrackingResult } from '@/lib/motion-lab';
import { headingDeg } from '@/lib/motion-lab/kinematics3d';
import { cn } from '@/lib/utils';

interface V3 { x: number; y: number; z: number; v: number }

// MediaPipe pose connections we draw (a clean athletic skeleton).
const BONES: Array<[number, number]> = [
  [11, 12], [11, 23], [12, 24], [23, 24],          // torso
  [11, 13], [13, 15],                              // left arm
  [12, 14], [14, 16],                              // right arm
  [23, 25], [25, 27], [27, 31],                    // left leg + foot
  [24, 26], [26, 28], [28, 32],                    // right leg + foot
];
const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const NOSE = 0, L_SH = 11, R_SH = 12, L_HIP = 23, R_HIP = 24, L_WR = 15, R_WR = 16;

type ViewPreset = 'front' | 'side' | 'top';
const PRESETS: Record<ViewPreset, { yaw: number; pitch: number }> = {
  front: { yaw: 0, pitch: -0.12 },
  side: { yaw: Math.PI / 2, pitch: -0.12 },
  top: { yaw: 0, pitch: -1.35 },
};

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

/** Sample the track at a continuous cursor (index space), interpolating. */
function sampleFrame(track: MotionPoseTrack, cursor: number): V3[] {
  const frames = track.frames;
  if (frames.length === 0) return [];
  const i = Math.floor(cursor);
  const t = cursor - i;
  const a = frames[Math.max(0, Math.min(frames.length - 1, i))];
  const b = frames[Math.max(0, Math.min(frames.length - 1, i + 1))];
  return a.landmarks.map((la, idx) => {
    const lb = b.landmarks[idx] ?? la;
    return { x: lerp(la.x, lb.x, t), y: lerp(la.y, lb.y, t), z: lerp(la.z, lb.z, t), v: Math.min(la.v, lb.v) };
  });
}

interface Motion3DViewerProps {
  track: MotionPoseTrack;
  phases?: MotionPhaseSegment[];
  accent?: string;
  ghost?: MotionPoseTrack | null;
  /** Estimated implement (club/bat/racket) path overlay. */
  implement?: ObjectTrackingResult | null;
  className?: string;
}

export function Motion3DViewer({ track, phases, accent = '#22C55E', ghost = null, implement = null, className }: Motion3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);

  const frameCount = track.frames.length;
  const totalMs = useMemo(() => {
    if (frameCount < 2) return 1000;
    return Math.max(300, track.frames[frameCount - 1].tMs - track.frames[0].tMs);
  }, [track, frameCount]);

  const [playing, setPlaying] = useState(frameCount > 2);
  const [speed, setSpeed] = useState(0.5);
  const [frame, setFrame] = useState(0); // display only
  const [yaw, setYaw] = useState(PRESETS.front.yaw);
  const [pitch, setPitch] = useState(PRESETS.front.pitch);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showImplement, setShowImplement] = useState(true);

  const empty = frameCount === 0;
  const hasImplement = !!implement?.available && (implement?.trace.points.length ?? 0) >= 2;

  // ── Drawing ───────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const w = canvas.clientWidth || 600;
    const h = canvas.clientHeight || 420;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0b1220');
    grad.addColorStop(1, '#060a12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (empty) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No body pose was detected in this clip.', w / 2, h / 2 - 8);
      ctx.fillText('Re-film with the full body in frame and good light.', w / 2, h / 2 + 12);
      return;
    }

    const cx = w / 2;
    const cy = h / 2 + 10;
    const scale = Math.min(w, h) * 0.62 * zoom;

    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

    const lm = sampleFrame(track, cursorRef.current);
    if (lm.length < 33) return;
    // body centre (pelvis-thorax) for stable orbit
    const bcx = (lm[L_SH].x + lm[R_SH].x + lm[L_HIP].x + lm[R_HIP].x) / 4;
    const bcy = (lm[L_SH].y + lm[R_SH].y + lm[L_HIP].y + lm[R_HIP].y) / 4;
    const bcz = (lm[L_SH].z + lm[R_SH].z + lm[L_HIP].z + lm[R_HIP].z) / 4;

    const project = (p: { x: number; y: number; z: number }) => {
      // centre + orient: image x→X, image y→-Y (up), depth z→Z
      let X = p.x - bcx;
      let Y = -(p.y - bcy);
      let Z = p.z - bcz;
      // yaw about vertical (Y) axis
      const x1 = X * cosY + Z * sinY;
      const z1 = -X * sinY + Z * cosY;
      X = x1; Z = z1;
      // pitch about horizontal (X) axis
      const y2 = Y * cosP - Z * sinP;
      const z2 = Y * sinP + Z * cosP;
      Y = y2; Z = z2;
      const persp = 1.9 / (2.3 - Z); // gentle perspective
      return { sx: cx + X * scale * persp, sy: cy - Y * scale * persp, depth: Z };
    };

    // floor grid for depth perception (rotates with the orbit)
    const feetY = Math.max(lm[27].y, lm[28].y);
    ctx.strokeStyle = 'rgba(148,163,184,0.10)';
    ctx.lineWidth = 1;
    const gN = 4;
    const gStep = 0.11;
    for (let gi = -gN; gi <= gN; gi++) {
      ctx.beginPath();
      for (let gj = -gN; gj <= gN; gj++) {
        const p = project({ x: bcx + gi * gStep, y: feetY, z: bcz + gj * gStep });
        if (gj === -gN) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let gj = -gN; gj <= gN; gj++) {
        const p = project({ x: bcx + gj * gStep, y: feetY, z: bcz + gi * gStep });
        if (gj === -gN) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
      }
      ctx.stroke();
    }

    // ground shadow ellipse
    const shadow = project({ x: bcx, y: feetY, z: bcz });
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(shadow.sx, shadow.sy + 4, scale * 0.28, scale * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // ghost (comparison) skeleton, faint
    if (ghost && ghost.frames.length > 0) {
      const gCursor = (cursorRef.current / Math.max(1, frameCount - 1)) * (ghost.frames.length - 1);
      const glm = sampleFrame(ghost, gCursor);
      const gbcx = (glm[L_SH].x + glm[R_SH].x + glm[L_HIP].x + glm[R_HIP].x) / 4;
      const gbcy = (glm[L_SH].y + glm[R_SH].y + glm[L_HIP].y + glm[R_HIP].y) / 4;
      const gbcz = (glm[L_SH].z + glm[R_SH].z + glm[L_HIP].z + glm[R_HIP].z) / 4;
      const gproject = (p: { x: number; y: number; z: number }) => {
        let X = p.x - gbcx, Y = -(p.y - gbcy), Z = p.z - gbcz;
        const x1 = X * cosY + Z * sinY, z1 = -X * sinY + Z * cosY; X = x1; Z = z1;
        const y2 = Y * cosP - Z * sinP, z2 = Y * sinP + Z * cosP; Y = y2; Z = z2;
        const persp = 1.9 / (2.3 - Z);
        return { sx: cx + X * scale * persp, sy: cy - Y * scale * persp };
      };
      ctx.strokeStyle = 'rgba(148,163,184,0.45)';
      ctx.lineWidth = 2;
      for (const [a, b] of BONES) {
        const pa = gproject(glm[a]); const pb = gproject(glm[b]);
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      }
    }

    // motion trails (hands, head)
    if (showTrails) {
      const trailFor = (idx: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const upto = Math.min(frameCount - 1, Math.floor(cursorRef.current));
        let started = false;
        for (let f = 0; f <= upto; f++) {
          const fr = track.frames[f];
          const p = project(fr.landmarks[idx]);
          if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
      };
      trailFor(L_WR, 'rgba(56,189,248,0.7)');
      trailFor(R_WR, 'rgba(56,189,248,0.4)');
      trailFor(NOSE, 'rgba(250,204,21,0.5)');
    }

    // bones with confidence shading
    for (const [a, b] of BONES) {
      const pa = project(lm[a]); const pb = project(lm[b]);
      const conf = Math.min(lm[a].v, lm[b].v);
      ctx.strokeStyle = conf < 0.4 ? 'rgba(148,163,184,0.35)' : accent;
      ctx.lineWidth = conf < 0.4 ? 2 : 4;
      if (conf < 0.4) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
    }
    ctx.setLineDash([]);

    // head
    const head = project(lm[NOSE]);
    const shMid = project({
      x: (lm[L_SH].x + lm[R_SH].x) / 2, y: (lm[L_SH].y + lm[R_SH].y) / 2, z: (lm[L_SH].z + lm[R_SH].z) / 2,
    });
    ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(shMid.sx, shMid.sy); ctx.lineTo(head.sx, head.sy); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(head.sx, head.sy, scale * 0.05, 0, Math.PI * 2); ctx.fill();

    // joints
    for (const j of JOINTS) {
      const p = project(lm[j]);
      ctx.fillStyle = lm[j].v < 0.4 ? 'rgba(148,163,184,0.6)' : '#ffffff';
      ctx.beginPath(); ctx.arc(p.sx, p.sy, 3.2, 0, Math.PI * 2); ctx.fill();
    }

    // estimated implement (club/bat/racket) path overlay — drawn at the wrists'
    // depth (we only estimate head x/y), so it sits coherently in the 3D scene.
    if (showImplement && hasImplement && implement) {
      const pts = implement.trace.points;
      const wristZ = (f: number): number => {
        const fr = track.frames[f];
        if (!fr) return 0;
        return ((fr.landmarks[L_WR]?.z ?? 0) + (fr.landmarks[R_WR]?.z ?? 0)) / 2;
      };
      const upto = Math.min(frameCount - 1, Math.floor(cursorRef.current));
      // head arc up to the current frame
      ctx.strokeStyle = 'rgba(249,115,22,0.85)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (p.frame > upto) break;
        const pr = project({ x: p.head.x, y: p.head.y, z: wristZ(p.frame) });
        if (!started) { ctx.moveTo(pr.sx, pr.sy); started = true; } else ctx.lineTo(pr.sx, pr.sy);
      }
      ctx.stroke();
      // the implement itself (grip → head) at the current frame
      const cf = Math.round(cursorRef.current);
      const cur = pts.find((p) => p.frame === cf) ?? [...pts].reverse().find((p) => p.frame <= cf) ?? pts[0];
      if (cur) {
        const z = wristZ(cur.frame);
        const g = project({ x: cur.grip.x, y: cur.grip.y, z });
        const h = project({ x: cur.head.x, y: cur.head.y, z });
        ctx.strokeStyle = 'rgba(249,115,22,0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(g.sx, g.sy); ctx.lineTo(h.sx, h.sy); ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); ctx.arc(h.sx, h.sy, 4, 0, Math.PI * 2); ctx.fill();
      }
      // contact zone marker
      if (implement.contactZone) {
        const cz = implement.contactZone;
        const c = project({ x: cz.x, y: cz.y, z: wristZ(cz.frame) });
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.sx, c.sy, 7, 0, Math.PI * 2); ctx.stroke();
      }
    }

    if (showLabels) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const labels: Array<[number, string]> = [
        [L_SH, 'L sh'], [R_SH, 'R sh'], [L_HIP, 'L hip'], [R_HIP, 'R hip'],
        [L_WR, 'L wrist'], [R_WR, 'R wrist'],
      ];
      for (const [idx, name] of labels) {
        const p = project(lm[idx]);
        ctx.fillText(name, p.sx + 5, p.sy - 5);
      }
    }
  }, [track, ghost, frameCount, yaw, pitch, zoom, showLabels, showTrails, showImplement, hasImplement, implement, accent, empty]);

  // ── Animation loop ────────────────────────────────────────
  useEffect(() => {
    const tick = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = ts - last;
      lastTsRef.current = ts;
      if (playing && frameCount > 1) {
        const advance = (dt / totalMs) * (frameCount - 1) * speed;
        let c = cursorRef.current + advance;
        if (c >= frameCount - 1) c = 0; // loop
        cursorRef.current = c;
        setFrame(Math.round(c));
      }
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, totalMs, frameCount, draw]);

  // redraw on static control changes when paused
  useEffect(() => { if (!playing) draw(); }, [draw, playing, frame]);

  // ── Pointer orbit ─────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setYaw((y) => y + dx * 0.01);
    setPitch((p) => Math.max(-1.5, Math.min(1.0, p - dy * 0.01)));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const setView = (v: ViewPreset) => { setYaw(PRESETS[v].yaw); setPitch(PRESETS[v].pitch); };
  const stepFrame = (dir: number) => {
    setPlaying(false);
    let c = Math.round(cursorRef.current) + dir;
    if (c < 0) c = frameCount - 1;
    if (c > frameCount - 1) c = 0;
    cursorRef.current = c;
    setFrame(c);
  };
  const scrubToClientX = (clientX: number) => {
    const el = scrubRef.current;
    if (!el || frameCount < 2) return;
    const r = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    setPlaying(false);
    cursorRef.current = frac * (frameCount - 1);
    setFrame(Math.round(cursorRef.current));
  };
  const onScrubDown = (e: React.PointerEvent) => {
    scrubbingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    scrubToClientX(e.clientX);
  };
  const onScrubMove = (e: React.PointerEvent) => { if (scrubbingRef.current) scrubToClientX(e.clientX); };
  const onScrubUp = () => { scrubbingRef.current = false; };
  const screenshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `swingvantage-motionlab-3d-frame-${frame}.png`;
      a.click();
    } catch { /* ignore */ }
  };

  const activePhase = phases?.find((p) => frame >= p.startFrame && frame <= p.endFrame);

  // Live, depth-aware turn readout at the scrubbed frame — visualizes the same
  // axial rotation (transverse plane) the metric engine now reads, relative to
  // the address pose in frame 0.
  const turnAt = (a: number, b: number, idx: number): number | null => {
    const f = track.frames[Math.max(0, Math.min(frameCount - 1, idx))];
    const f0 = track.frames[0];
    if (!f || !f0 || !f.landmarks[a] || !f.landmarks[b] || !f0.landmarks[a] || !f0.landmarks[b]) return null;
    const h = headingDeg(f.landmarks[b].x - f.landmarks[a].x, f.landmarks[b].z - f.landmarks[a].z);
    const h0 = headingDeg(f0.landmarks[b].x - f0.landmarks[a].x, f0.landmarks[b].z - f0.landmarks[a].z);
    let d = h - h0;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return Math.round(d);
  };
  const liveShoulder = empty ? null : turnAt(11, 12, frame);
  const liveHip = empty ? null : turnAt(23, 24, frame);
  const scrubTotal = phases && phases.length ? Math.max(1, phases[phases.length - 1].endFrame) : Math.max(1, frameCount - 1);

  const btn = 'inline-flex items-center justify-center rounded-md p-1.5 text-stage-foreground hover:bg-white/10 transition-colors';

  return (
    <div ref={wrapRef} className={cn('rounded-xl overflow-hidden border border-border bg-stage', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-[360px] sm:h-[420px] touch-none cursor-grab active:cursor-grabbing block"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {/* Honest label — reflects whether this is measured (multi-view) or estimated 3D */}
        <div className="absolute top-2 left-2 text-[10px] font-medium text-stage-foreground/80 bg-black/40 rounded px-1.5 py-0.5">
          {track.basis === 'measured' ? 'Measured 3D · multi-view · drag to orbit' : 'Estimated 3D · drag to orbit'}
        </div>
        {activePhase && (
          <div className="absolute top-2 right-2 text-[11px] font-semibold text-white bg-black/50 rounded px-2 py-0.5">
            {activePhase.label}
          </div>
        )}
        {!empty && (liveShoulder != null || liveHip != null) && (
          <div className="absolute top-9 right-2 text-[10px] font-medium text-stage-foreground bg-black/45 rounded px-2 py-0.5 tabular-nums flex gap-2">
            {liveShoulder != null && <span>Shoulders <span className="text-sky-300">{liveShoulder >= 0 ? '+' : ''}{liveShoulder}°</span></span>}
            {liveHip != null && <span>Hips <span className="text-amber-300">{liveHip >= 0 ? '+' : ''}{liveHip}°</span></span>}
          </div>
        )}
        {/* View presets */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {(['front', 'side', 'top'] as ViewPreset[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className="text-[11px] font-medium text-stage-foreground bg-black/40 hover:bg-black/60 rounded px-2 py-1 capitalize">
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-stage-panel border-t border-white/10 px-3 py-2 space-y-2">
        <div className="flex items-center gap-1">
          <button className={btn} onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className={btn} onClick={() => stepFrame(-1)} aria-label="Previous frame"><ChevronLeft className="w-4 h-4" /></button>
          <button className={btn} onClick={() => stepFrame(1)} aria-label="Next frame"><ChevronRight className="w-4 h-4" /></button>
          <div
            ref={scrubRef}
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerLeave={onScrubUp}
            className="relative flex-1 h-6 mx-1 rounded cursor-pointer select-none touch-none overflow-hidden border border-white/10"
            role="slider"
            aria-label="Scrub frame (phase-segmented)"
            aria-valuemin={1}
            aria-valuemax={frameCount}
            aria-valuenow={frame + 1}
          >
            {phases && phases.length > 0 ? (
              <div className="absolute inset-0 flex">
                {phases.map((p, i) => {
                  const span = Math.max(1, p.endFrame - p.startFrame + 1);
                  return (
                    <div
                      key={p.key + i}
                      title={`${p.label} · ${Math.round(p.confidence * 100)}%`}
                      className="h-full border-r border-black/25 last:border-r-0"
                      style={{ width: `${(span / scrubTotal) * 100}%`, background: accent, opacity: 0.22 + p.confidence * 0.4 }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="absolute inset-0 bg-white/10" />
            )}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.85)] pointer-events-none"
              style={{ left: `${(frame / Math.max(1, frameCount - 1)) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-stage-muted tabular-nums w-14 text-right">{frame + 1}/{frameCount}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {[0.25, 0.5, 1].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={cn('text-[11px] rounded px-1.5 py-0.5', speed === s ? 'bg-sky-500 text-white' : 'text-stage-foreground hover:bg-white/10')}>
              {s}×
            </button>
          ))}
          <span className="w-px h-4 bg-white/10 mx-1" />
          <button className={btn} onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
          <button className={btn} onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
          <button className={cn(btn, showTrails && 'text-sky-400')} onClick={() => setShowTrails((t) => !t)} aria-label="Toggle trails"><Spline className="w-4 h-4" /></button>
          {hasImplement && (
            <button className={cn(btn, showImplement && 'text-orange-400')} onClick={() => setShowImplement((t) => !t)} aria-label="Toggle estimated implement path" title="Estimated club/bat/racket path"><Crosshair className="w-4 h-4" /></button>
          )}
          <button className={cn(btn, showLabels && 'text-sky-400')} onClick={() => setShowLabels((t) => !t)} aria-label="Toggle labels"><Tag className="w-4 h-4" /></button>
          <button className={btn} onClick={() => setView('front')} aria-label="Reset view"><RotateCcw className="w-4 h-4" /></button>
          <button className={btn} onClick={screenshot} aria-label="Screenshot"><Camera className="w-4 h-4" /></button>
          {ghost && (
            <span className="ml-auto text-[10px] text-stage-muted flex items-center gap-1"><Eye className="w-3 h-3" /> ghost = compare</span>
          )}
        </div>
      </div>
    </div>
  );
}
