'use client';

// ============================================================
// SwingVantage — Motion Lab: 3D Avatar Viewer (three.js)
// ------------------------------------------------------------
// A real WebGL humanoid avatar — volumetric limbs (cylinders), joints
// (spheres) and a head — rigged to the REAL MediaPipe landmarks and
// driven frame-by-frame by the session's pose track. Where the canvas
// Motion3DViewer draws a line skeleton, this renders a solid 3D body you
// can orbit, zoom, scrub and play back.
//
// HONESTY: the figure is a generic mannequin posed by the SAME estimated
// (single-camera) or measured (multi-view) pose track the rest of Motion
// Lab uses — it is not a body scan of the user. The basis label reflects
// that. The rig is fed purely from `track`, so a future skinned glb model
// can replace the primitive mesh without touching the pipeline.
//
// RESPONSIBLE LOADING: this module statically imports `three`; it is only
// ever pulled in via next/dynamic({ ssr:false }) from the Motion Lab
// results viewer, so the WebGL bundle never reaches the server or
// marketing pages.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play, Pause, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Camera, RotateCcw,
} from 'lucide-react';
import type { MotionPoseTrack, MotionPhaseSegment } from '@/lib/motion-lab';
import { cn } from '@/lib/utils';

interface V3 { x: number; y: number; z: number; v: number }

// MediaPipe landmark indices.
const NOSE = 0, L_SH = 11, R_SH = 12, L_EL = 13, R_EL = 14, L_WR = 15, R_WR = 16;
const L_HIP = 23, R_HIP = 24, L_KN = 25, R_KN = 26, L_AN = 27, R_AN = 28, L_FT = 31, R_FT = 32;

// Limb segments drawn as volumetric cylinders: [from, to, radius].
const SEGMENTS: Array<[number, number, number]> = [
  [L_SH, L_EL, 0.035], [L_EL, L_WR, 0.028],   // left arm
  [R_SH, R_EL, 0.035], [R_EL, R_WR, 0.028],   // right arm
  [L_HIP, L_KN, 0.05], [L_KN, L_AN, 0.04], [L_AN, L_FT, 0.025],  // left leg
  [R_HIP, R_KN, 0.05], [R_KN, R_AN, 0.04], [R_AN, R_FT, 0.025],  // right leg
];
// Joints drawn as spheres: [index, radius].
const JOINTS: Array<[number, number]> = [
  [L_SH, 0.045], [R_SH, 0.045], [L_EL, 0.035], [R_EL, 0.035],
  [L_WR, 0.032], [R_WR, 0.032], [L_HIP, 0.05], [R_HIP, 0.05],
  [L_KN, 0.045], [R_KN, 0.045], [L_AN, 0.035], [R_AN, 0.035],
];

const SCALE = 2.4;          // normalized-units → world-units (body ≈ 1.7 tall)
const FLOOR_Y = -1.05;      // grid height (≈ feet, pelvis-centred)
const UP = new THREE.Vector3(0, 1, 0);

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

type ViewPreset = 'front' | 'side' | 'top';
// Spherical camera angles per preset: theta = azimuth, phi = polar.
const PRESETS: Record<ViewPreset, { theta: number; phi: number }> = {
  front: { theta: 0, phi: Math.PI / 2 - 0.12 },
  side: { theta: Math.PI / 2, phi: Math.PI / 2 - 0.12 },
  top: { theta: 0, phi: 0.45 },
};

interface Rig {
  group: THREE.Group;
  segments: THREE.Mesh[];
  joints: THREE.Mesh[];
  spine: THREE.Mesh;
  shoulders: THREE.Mesh;
  hips: THREE.Mesh;
  neck: THREE.Mesh;
  head: THREE.Mesh;
}

interface Props {
  track: MotionPoseTrack;
  phases?: MotionPhaseSegment[];
  accent?: string;
  className?: string;
}

export function MotionAvatarViewer({ track, phases, accent = '#22C55E', className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frameCount = track.frames.length;
  const empty = frameCount === 0;
  const totalMs = useMemo(() => {
    if (frameCount < 2) return 1000;
    return Math.max(300, track.frames[frameCount - 1].tMs - track.frames[0].tMs);
  }, [track, frameCount]);

  // Display state (React) — kept in sync with the imperative loop sparingly.
  const [playing, setPlaying] = useState(frameCount > 2);
  const [speed, setSpeed] = useState(0.5);
  const [frame, setFrame] = useState(0);

  // Live values the animation loop reads without re-subscribing.
  const cursorRef = useRef(0);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const thetaRef = useRef(PRESETS.front.theta);
  const phiRef = useRef(PRESETS.front.phi);
  const radiusRef = useRef(3.4);
  const lastFrameRef = useRef(-1);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rigRef = useRef<Rig | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);

  // ── three.js scene init (once) ────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || empty) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060a12');
    scene.fog = new THREE.Fog('#060a12', 5, 11);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const target = new THREE.Vector3(0, 0.05, 0);

    // Lights
    scene.add(new THREE.AmbientLight('#9fb4d8', 0.65));
    const key = new THREE.DirectionalLight('#ffffff', 1.5);
    key.position.set(2.5, 4, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1; key.shadow.camera.far = 14;
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, 0.5);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    // Floor: grid + shadow-catching plane
    const grid = new THREE.GridHelper(6, 24, new THREE.Color('#2a3650'), new THREE.Color('#161e30'));
    grid.position.y = FLOOR_Y;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    scene.add(grid);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShadowMaterial({ opacity: 0.35 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Humanoid rig ──
    const accentColor = new THREE.Color(accent);
    const limbMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.15, roughness: 0.55 });
    const jointMat = new THREE.MeshStandardMaterial({ color: '#e8eef9', metalness: 0.1, roughness: 0.4 });
    const torsoMat = new THREE.MeshStandardMaterial({ color: accentColor.clone().multiplyScalar(0.85), metalness: 0.2, roughness: 0.5 });
    const headMat = new THREE.MeshStandardMaterial({ color: '#f0f4fb', metalness: 0.1, roughness: 0.45 });

    const group = new THREE.Group();
    scene.add(group);

    const cylinder = (radius: number) => {
      const g = new THREE.CylinderGeometry(radius, radius, 1, 12);
      const m = new THREE.Mesh(g, limbMat);
      m.castShadow = true;
      group.add(m);
      return m;
    };
    const sphere = (radius: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
      m.castShadow = true;
      group.add(m);
      return m;
    };

    const segments = SEGMENTS.map(([, , r]) => cylinder(r));
    const joints = JOINTS.map(([, r]) => sphere(r, jointMat));
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 1, 14), torsoMat);
    spine.castShadow = true; group.add(spine);
    const shoulders = cylinder(0.045); shoulders.material = torsoMat;
    const hips = cylinder(0.05); hips.material = torsoMat;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1, 10), torsoMat);
    neck.castShadow = true; group.add(neck);
    const head = sphere(0.09, headMat);

    rigRef.current = { group, segments, joints, spine, shoulders, hips, neck, head };

    // Place a bone-cylinder between two world points.
    const tmpDir = new THREE.Vector3();
    const tmpMid = new THREE.Vector3();
    const placeBone = (mesh: THREE.Mesh, pa: THREE.Vector3, pb: THREE.Vector3, visible: boolean) => {
      mesh.visible = visible;
      if (!visible) return;
      tmpDir.subVectors(pb, pa);
      const len = tmpDir.length() || 0.0001;
      tmpMid.copy(pa).addScaledVector(tmpDir, 0.5);
      mesh.position.copy(tmpMid);
      mesh.quaternion.setFromUnitVectors(UP, tmpDir.normalize());
      mesh.scale.set(1, len, 1);
    };

    const toWorld = (l: V3, c: { x: number; y: number; z: number }) =>
      new THREE.Vector3((l.x - c.x) * SCALE, -(l.y - c.y) * SCALE, -(l.z - c.z) * SCALE);

    const updateRig = (lm: V3[]) => {
      if (lm.length < 33) return;
      const cx = (lm[L_HIP].x + lm[R_HIP].x) / 2;
      const cy = (lm[L_HIP].y + lm[R_HIP].y) / 2;
      const cz = (lm[L_HIP].z + lm[R_HIP].z) / 2;
      const c = { x: cx, y: cy, z: cz };
      const W = lm.map((l) => toWorld(l, c));
      const vis = (i: number) => lm[i] && lm[i].v > 0.15;

      SEGMENTS.forEach(([a, b], i) => placeBone(segments[i], W[a], W[b], vis(a) && vis(b)));
      JOINTS.forEach(([idx], i) => {
        joints[i].visible = vis(idx);
        if (vis(idx)) joints[i].position.copy(W[idx]);
      });

      const shMid = W[L_SH].clone().add(W[R_SH]).multiplyScalar(0.5);
      const hipMid = W[L_HIP].clone().add(W[R_HIP]).multiplyScalar(0.5);
      placeBone(spine, hipMid, shMid, true);
      placeBone(shoulders, W[L_SH], W[R_SH], vis(L_SH) && vis(R_SH));
      placeBone(hips, W[L_HIP], W[R_HIP], vis(L_HIP) && vis(R_HIP));

      const noseW = W[NOSE];
      const neckTop = shMid.clone().lerp(noseW, 0.45);
      placeBone(neck, shMid, neckTop, true);
      head.visible = vis(NOSE);
      if (vis(NOSE)) head.position.copy(noseW);
    };

    // Resize handling
    const resize = () => {
      const w = wrap.clientWidth || 600;
      const h = 420;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Animation loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta() * 1000;
      if (playingRef.current && frameCount > 1) {
        let c2 = cursorRef.current + (dt / totalMs) * (frameCount - 1) * speedRef.current;
        if (c2 >= frameCount - 1) c2 = 0;
        cursorRef.current = c2;
      }
      const rounded = Math.round(cursorRef.current);
      if (rounded !== lastFrameRef.current) {
        lastFrameRef.current = rounded;
        setFrame(rounded);
      }
      updateRig(sampleFrame(track, cursorRef.current));

      // Camera from spherical coords around the target.
      const r = radiusRef.current, th = thetaRef.current, ph = phiRef.current;
      camera.position.set(
        target.x + r * Math.sin(ph) * Math.sin(th),
        target.y + r * Math.cos(ph),
        target.z + r * Math.sin(ph) * Math.cos(th),
      );
      camera.lookAt(target);
      renderer.render(scene, camera);
    });

    return () => {
      ro.disconnect();
      renderer.setAnimationLoop(null);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) (mat as THREE.Material).dispose();
      });
      renderer.dispose();
      rendererRef.current = null;
      rigRef.current = null;
    };
    // Rebuild only when the underlying track / accent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, accent, empty, totalMs, frameCount]);

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
    thetaRef.current -= dx * 0.01;
    phiRef.current = Math.max(0.15, Math.min(Math.PI - 0.15, phiRef.current - dy * 0.01));
  };
  const onPointerUp = () => { dragRef.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    radiusRef.current = Math.max(1.8, Math.min(6, radiusRef.current + (e.deltaY > 0 ? 0.3 : -0.3)));
  };

  const setView = (v: ViewPreset) => { thetaRef.current = PRESETS[v].theta; phiRef.current = PRESETS[v].phi; };
  const zoom = (d: number) => { radiusRef.current = Math.max(1.8, Math.min(6, radiusRef.current + d)); };

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
      a.download = `swingvantage-motionlab-avatar-frame-${frame}.png`;
      a.click();
    } catch { /* ignore */ }
  };

  const activePhase = phases?.find((p) => frame >= p.startFrame && frame <= p.endFrame);
  const scrubTotal = phases && phases.length ? Math.max(1, phases[phases.length - 1].endFrame) : Math.max(1, frameCount - 1);
  const btn = 'inline-flex items-center justify-center rounded-md p-1.5 text-stage-foreground hover:bg-white/10 transition-colors';

  return (
    <div ref={wrapRef} className={cn('rounded-xl overflow-hidden border border-border bg-stage', className)}>
      <div className="relative">
        {empty ? (
          <div className="h-[360px] sm:h-[420px] flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-stage-foreground">No body pose was detected in this clip.</p>
            <p className="text-xs text-stage-muted mt-1">Re-film with the full body in frame and good light.</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-[360px] sm:h-[420px] touch-none cursor-grab active:cursor-grabbing block"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={onWheel}
          />
        )}
        <div className="absolute top-2 left-2 text-[10px] font-medium text-stage-foreground/80 bg-black/40 rounded px-1.5 py-0.5">
          {track.basis === 'measured' ? 'Measured 3D avatar · multi-view · drag to orbit' : 'Estimated 3D avatar · generic mannequin posed by your pose · drag to orbit'}
        </div>
        {activePhase && (
          <div className="absolute top-2 right-2 text-[11px] font-semibold text-white bg-black/50 rounded px-2 py-0.5">
            {activePhase.label}
          </div>
        )}
        {!empty && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {(['front', 'side', 'top'] as ViewPreset[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className="text-[11px] font-medium text-stage-foreground bg-black/40 hover:bg-black/60 rounded px-2 py-1 capitalize">
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {!empty && (
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
            <button className={btn} onClick={() => zoom(-0.4)} aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            <button className={btn} onClick={() => zoom(0.4)} aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
            <button className={btn} onClick={() => setView('front')} aria-label="Reset view"><RotateCcw className="w-4 h-4" /></button>
            <button className={btn} onClick={screenshot} aria-label="Screenshot"><Camera className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MotionAvatarViewer;
