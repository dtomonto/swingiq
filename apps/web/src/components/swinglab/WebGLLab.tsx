'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: true-WebGL first-person walk (Phase 4 v2)
// ------------------------------------------------------------
// Upgrades the CSS walk to a REAL web-based 3D environment: a lit lab
// floor with ten kiosk "screens" laid out on the facility floor plan.
// You stand in front of one in first person and Next/Prev physically
// walks the camera across the room to the next kiosk; drag to look
// around. Built on three.js (raw, no React renderer) and rendered into
// a single <canvas>.
//
// RESPONSIBLE LOADING: this module statically imports `three`, but it is
// only ever pulled in via next/dynamic({ ssr:false }) on the admin-gated
// /lab Walk view — so the WebGL bundle never reaches public/marketing
// pages or the server. When WebGL is unavailable or the visitor prefers
// reduced motion, it renders the CSS <FirstPersonLab/> fallback instead.
//
// ACCESSIBILITY: the canvas is decorative (aria-hidden). The real,
// keyboard/SR-accessible layer — station info card, Prev/Next, dot rail,
// live region — is the same shared DOM the CSS walk uses (walkParts).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, Move3d } from 'lucide-react';
import { LAB_STATIONS } from '@/content/swinglab';
import { PREVIEW_PERSONALIZATION, type LabPersonalization } from '@/lib/swinglab/types';
import { RECOMMENDED_PATH, STATION_LAYOUT } from './labLayout';
import {
  ACCENT_HEX,
  EYE_HEIGHT,
  PANEL_HEIGHT,
  clamp,
  easeInOutCubic,
  hexToCss,
  journeyWorldPath,
  stationToWorld,
  viewingPose,
  type Vec3,
} from './labScene3d';
import { StationKiosk, StationRail, useArrowKeyNav } from './walkParts';
import { FirstPersonLab } from './FirstPersonLab';

// ── Texture helpers (client-only; build small canvases for kiosk art) ──

/** A soft radial glow used to bloom each kiosk's accent color. */
function makeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Center-wrapped text drawer for kiosk titles. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lineH: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineH));
}

/** Trace a rounded-rectangle path (caller fills/strokes). */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * A glowing kiosk "screen": role, name, and the first couple of tools it
 * connects, on a rounded accent-framed panel with a tinted header band.
 */
function makePanelTexture(name: string, role: string, connects: string[], accentCss: string): THREE.CanvasTexture {
  const w = 768;
  const h = 480;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Rounded screen backdrop with a vertical sheen.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0e1830');
  bg.addColorStop(1, '#070d1a');
  roundRect(ctx, 6, 6, w - 12, h - 12, 34);
  ctx.fillStyle = bg;
  ctx.fill();

  // Tinted accent header band (clipped to the rounded top).
  ctx.save();
  roundRect(ctx, 6, 6, w - 12, 96, 34);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = accentCss;
  ctx.fillRect(6, 6, w - 12, 96);
  ctx.restore();

  // Accent frame.
  roundRect(ctx, 6, 6, w - 12, h - 12, 34);
  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Role (accent, in the header band).
  ctx.fillStyle = accentCss;
  ctx.font = '700 32px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(role.toUpperCase(), w / 2, 56);

  // Name (white, bold, wrapped).
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 60px system-ui, -apple-system, Segoe UI, sans-serif';
  wrapText(ctx, name, w / 2, 222, w - 110, 70);

  // Accent divider.
  ctx.fillStyle = accentCss;
  ctx.fillRect(w / 2 - 56, 300, 112, 5);

  // Up to two "connects" as pill chips along the bottom.
  const pills = connects.slice(0, 2);
  ctx.font = '600 26px system-ui, -apple-system, Segoe UI, sans-serif';
  const padX = 26;
  const gap = 18;
  const ph = 56;
  const py = 384;
  const widths = pills.map((p) => ctx.measureText(p).width + padX * 2);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, pills.length - 1);
  let px = w / 2 - totalW / 2;
  pills.forEach((p, i) => {
    const pw = widths[i];
    roundRect(ctx, px, py, pw, ph, ph / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(p, px + pw / 2, py + ph / 2 + 2);
    px += pw + gap;
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** A faint back-wall wordmark for ambient depth. */
function makeSignTexture(text: string): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 150px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ── The scene engine (imperative three.js, framework-agnostic) ──

interface LabSceneHandle {
  focus(index: number, opts?: { animate?: boolean }): void;
  setRecommended(id: string | null): void;
  setRunning(on: boolean): void;
  resize(): void;
  dispose(): void;
}

interface BuiltStation {
  id: string;
  world: Vec3;
  eye: THREE.Vector3;
  target: THREE.Vector3;
  /** Materials brightened when this station is the focused one. */
  glowMat: THREE.SpriteMaterial;
  padMat: THREE.MeshBasicMaterial;
}

function createLabScene(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  recommendedId: string | null,
): LabSceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x020617, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.Fog(0x020617, 10, 36);

  const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.1, 140);

  // Everything that holds GPU memory gets tracked so dispose() is exact.
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T): T => {
    disposables.push(x);
    return x;
  };

  // Lighting — mostly ambient; kiosk screens/pads are self-lit.
  scene.add(new THREE.AmbientLight(0x33415a, 1.3));
  const hemi = new THREE.HemisphereLight(0x3b5170, 0x05070d, 0.7);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0x9fb4d8, 0.5);
  dir.position.set(6, 14, 8);
  scene.add(dir);

  // Floor + grid.
  const floor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(90, 90)),
    track(new THREE.MeshStandardMaterial({ color: 0x0a101e, roughness: 1, metalness: 0 })),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(52, 52, 0x1e3252, 0x14203a);
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.5;
  grid.position.y = 0.01;
  scene.add(grid);
  disposables.push(grid.geometry, gridMat);

  // Enclosing room shell (inverted box → walls + ceiling, with fog fade).
  const room = new THREE.Mesh(
    track(new THREE.BoxGeometry(62, 13, 62)),
    track(new THREE.MeshStandardMaterial({ color: 0x070c18, side: THREE.BackSide, roughness: 1 })),
  );
  room.position.y = 6.5;
  scene.add(room);

  // Faint back-wall wordmark (ambient depth, just in front of the far wall).
  const sign = new THREE.Mesh(
    track(new THREE.PlaneGeometry(22, 5.5)),
    track(new THREE.MeshBasicMaterial({ map: track(makeSignTexture('SWINGLAB')), transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false })),
  );
  sign.position.set(0, 6.4, -22);
  scene.add(sign);

  // Glowing "suggested journey" ribbon on the floor (mirrors the Map view).
  const journeyPts = journeyWorldPath(RECOMMENDED_PATH, STATION_LAYOUT).map((p) => new THREE.Vector3(p.x, p.y, p.z));
  if (journeyPts.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(journeyPts, false, 'catmullrom', 0.4);
    const journey = new THREE.Mesh(
      track(new THREE.TubeGeometry(curve, 140, 0.07, 8, false)),
      track(new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    scene.add(journey);
  }

  // Shared glow sprite texture.
  const glowTex = track(makeGlowTexture());

  // Build the ten kiosks from the floor-plan layout.
  const built: BuiltStation[] = [];
  for (const s of LAB_STATIONS) {
    const place = STATION_LAYOUT[s.id];
    if (!place) continue;
    const world = stationToWorld(place);
    const accent = ACCENT_HEX[s.accent];

    const group = new THREE.Group();
    group.position.set(world.x, 0, world.z);
    scene.add(group);

    // Podium.
    const podium = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.72, 0.92, 0.2, 28)),
      track(new THREE.MeshStandardMaterial({ color: 0x121a2c, roughness: 0.7, metalness: 0.1, emissive: accent, emissiveIntensity: 0.06 })),
    );
    podium.position.y = 0.1;
    group.add(podium);

    // Accent floor pad (additive glow disc).
    const padMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }));
    const pad = new THREE.Mesh(track(new THREE.CircleGeometry(1.3, 40)), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    group.add(pad);

    // Support post.
    const postH = PANEL_HEIGHT - 0.45;
    const post = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.1, postH, 0.1)),
      track(new THREE.MeshStandardMaterial({ color: 0x1b2740, roughness: 0.6 })),
    );
    post.position.y = postH / 2 + 0.1;
    group.add(post);

    // Glow bloom behind the screen.
    const glowMat = track(new THREE.SpriteMaterial({ map: glowTex, color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    const glow = new THREE.Sprite(glowMat);
    glow.position.set(0, PANEL_HEIGHT, -0.08);
    glow.scale.set(4.6, 3.2, 1);
    group.add(glow);

    // The kiosk screen, facing the entrance (+z).
    const panel = new THREE.Mesh(
      track(new THREE.PlaneGeometry(2.4, 1.5)),
      track(new THREE.MeshBasicMaterial({ map: track(makePanelTexture(s.name, s.systemRole, s.connects, hexToCss(accent))), side: THREE.DoubleSide, toneMapped: false })),
    );
    panel.position.set(0, PANEL_HEIGHT, 0);
    group.add(panel);

    const pose = viewingPose(world);
    built.push({
      id: s.id,
      world,
      eye: new THREE.Vector3(pose.eye.x, pose.eye.y, pose.eye.z),
      target: new THREE.Vector3(pose.target.x, pose.target.y, pose.target.z),
      glowMat,
      padMat,
    });
  }

  // Recommended-station ring (pulses on the floor; repositioned on demand).
  const ringMat = track(
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const ring = new THREE.Mesh(track(new THREE.RingGeometry(1.42, 1.62, 56)), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  ring.visible = false;
  scene.add(ring);

  function setRecommended(id: string | null) {
    const b = id ? built.find((x) => x.id === id) : null;
    if (b) {
      ring.position.set(b.world.x, 0.03, b.world.z);
      ring.visible = true;
    } else {
      ring.visible = false;
    }
  }
  setRecommended(recommendedId);

  // Camera travel state (tween eye + look-target between stations).
  const eye = new THREE.Vector3();
  const tgt = new THREE.Vector3();
  const eyeFrom = new THREE.Vector3();
  const eyeTo = new THREE.Vector3();
  const tgtFrom = new THREE.Vector3();
  const tgtTo = new THREE.Vector3();
  let tweenT = 1;
  const tweenDur = 0.9;
  let currentFocus = 0;

  const start = built[0];
  if (start) {
    eye.copy(start.eye);
    tgt.copy(start.target);
    eyeTo.copy(start.eye);
    tgtTo.copy(start.target);
  } else {
    eye.set(0, EYE_HEIGHT, 6);
    tgt.set(0, PANEL_HEIGHT, 0);
  }

  // Drag-to-look (additive yaw/pitch offsets on top of the look target).
  let lookYaw = 0;
  let lookPitch = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    lookYaw = clamp(lookYaw - (e.clientX - lastX) * 0.004, -0.6, 0.6);
    lookPitch = clamp(lookPitch + (e.clientY - lastY) * 0.003, -0.32, 0.32);
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  function focus(index: number, animate = true) {
    const b = built[index];
    if (!b) return;
    currentFocus = index;
    lookYaw = 0;
    lookPitch = 0;
    if (animate) {
      eyeFrom.copy(eye);
      tgtFrom.copy(tgt);
      eyeTo.copy(b.eye);
      tgtTo.copy(b.target);
      tweenT = 0;
    } else {
      eye.copy(b.eye);
      tgt.copy(b.target);
      eyeTo.copy(b.eye);
      tgtTo.copy(b.target);
      tweenT = 1;
    }
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  // Render loop.
  const clock = new THREE.Clock();
  let running = true;
  let raf = 0;
  const tmpDir = new THREE.Vector3();
  const tmpSph = new THREE.Spherical();
  const tmpLook = new THREE.Vector3();

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (tweenT < 1) {
      tweenT = Math.min(1, tweenT + dt / tweenDur);
      const e = easeInOutCubic(tweenT);
      eye.lerpVectors(eyeFrom, eyeTo, e);
      tgt.lerpVectors(tgtFrom, tgtTo, e);
    }

    camera.position.copy(eye);
    tmpDir.copy(tgt).sub(eye);
    tmpSph.setFromVector3(tmpDir);
    tmpSph.theta -= lookYaw + Math.sin(t * 0.5) * 0.012; // drag + gentle idle sway
    tmpSph.phi = clamp(tmpSph.phi - lookPitch, 0.25, Math.PI - 0.25);
    tmpLook.setFromSpherical(tmpSph).add(eye);
    camera.lookAt(tmpLook);

    if (ring.visible) {
      ringMat.opacity = 0.35 + Math.sin(t * 2.2) * 0.22;
      const s = 1 + Math.sin(t * 2.2) * 0.05;
      ring.scale.set(s, s, s);
    }

    // Brighten the focused station's glow/pad; ease the rest down.
    const k = Math.min(1, dt * 6);
    for (let i = 0; i < built.length; i++) {
      const b = built[i];
      const active = i === currentFocus;
      b.glowMat.opacity += ((active ? 0.85 : 0.4) - b.glowMat.opacity) * k;
      b.padMat.opacity += ((active ? 0.24 : 0.11) - b.padMat.opacity) * k;
    }

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const onContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  return {
    focus: (index, opts) => focus(index, opts?.animate ?? true),
    setRecommended,
    setRunning: (on) => {
      if (on && !running) {
        running = true;
        clock.start();
        raf = requestAnimationFrame(frame);
      } else if (!on && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    resize,
    dispose: () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      for (const d of disposables) {
        try {
          d.dispose();
        } catch {
          /* best-effort cleanup */
        }
      }
      renderer.dispose();
    },
  };
}

// ── Feature detection: only run WebGL when it's a win for this visitor ──

function supportsWalkWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// ── React shell ──

export function WebGLLab({
  personalization = PREVIEW_PERSONALIZATION,
}: {
  personalization?: LabPersonalization;
}) {
  // Decided once on the client (this component is loaded ssr:false).
  const [enabled] = useState(supportsWalkWebGL);
  if (!enabled) return <FirstPersonLab personalization={personalization} />;
  return <WebGLLabInner personalization={personalization} />;
}

function WebGLLabInner({ personalization }: { personalization: LabPersonalization }) {
  const total = LAB_STATIONS.length;
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LabSceneHandle | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + total) % total), [total]);
  useArrowKeyNav(go);

  const recommendedId = personalization.recommendedStationId;

  // Build the scene once.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let handle: LabSceneHandle | null = null;
    try {
      handle = createLabScene(canvas, container, recommendedId);
      handle.focus(0, { animate: false });
    } catch {
      // Cold error path: detection passed but the renderer failed to init —
      // drop to the CSS fallback. (One-shot state set, not a render loop.)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      handle?.dispose();
      return;
    }
    sceneRef.current = handle;

    const ro = new ResizeObserver(() => handle?.resize());
    ro.observe(container);
    const onVis = () => handle?.setRunning(!document.hidden);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      handle?.dispose();
      sceneRef.current = null;
    };
    // Built once; recommended + focus changes are applied via the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-highlight when the recommended station changes.
  useEffect(() => {
    sceneRef.current?.setRecommended(recommendedId);
  }, [recommendedId]);

  // Walk the camera + announce when the station changes.
  useEffect(() => {
    sceneRef.current?.focus(index, { animate: true });
    if (liveRef.current) {
      liveRef.current.textContent = `Station ${index + 1} of ${total}: ${LAB_STATIONS[index].name}`;
    }
  }, [index, total]);

  if (failed) return <FirstPersonLab personalization={personalization} />;

  return (
    <div>
      <p className="sr-only" aria-live="polite" ref={liveRef} />
      <p className="sr-only">
        First-person 3D walkthrough. Use the previous and next buttons, the left and right arrow keys, or the station rail to walk between stations. Drag the scene to look around.
      </p>

      <div
        ref={containerRef}
        role="group"
        aria-label="First-person 3D lab walkthrough"
        className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} />

        {/* Edge vignette to seat the HUD (decorative). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(2,6,23,0.72)_100%)]" />

        {/* Station detail HUD (real, accessible DOM with the live CTA). */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur-md">
            <StationKiosk station={LAB_STATIONS[index]} personalization={personalization} align="left" />
          </div>
        </div>

        {/* Walk controls */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous station"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white backdrop-blur transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next station"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-900/70 text-white backdrop-blur transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>

        {/* Position label */}
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-2xs font-medium text-slate-300">
          Station {index + 1} / {total}
        </div>

        {/* Look-around hint */}
        <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-2xs font-medium text-slate-400">
          <Move3d size={12} aria-hidden="true" /> Drag to look
        </div>
      </div>

      <StationRail index={index} onSelect={setIndex} />
    </div>
  );
}
