// ============================================================
// SwingVantage — Video Studio: Mock / Template Provider
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the always-available, ZERO-KEY video generator. It can't
//   render real footage (that needs a paid provider), but it produces
//   everything else a placement needs RIGHT NOW: a branded poster image,
//   a properly-timed captions track (WebVTT), and a transcript — all
//   generated from the creative brief, with no network and no API keys.
//
//   It marks its output `isPlaceholder: true` so the player is honest:
//   it shows the poster + the written walkthrough (exactly like the
//   tutorial "coming soon" pattern) until a real provider fills in the
//   `src`. That means the whole pipeline — scan → brief → generate →
//   place → measure — works end-to-end on day one, for free.
// ============================================================

import type { VideoCreativeBrief } from '../types';
import type {
  VideoProvider,
  ProviderAssetParts,
  ProviderGenerateResult,
  ProviderJobStatus,
} from './types';

// In-memory store of generated parts so checkJobStatus/retrieveAsset work.
// (The mock completes synchronously, so this is just a short-lived cache.)
const JOBS = new Map<string, ProviderAssetParts>();

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 1280, h: 720 },
  '9:16': { w: 720, h: 1280 },
  '1:1': { w: 1000, h: 1000 },
  '4:5': { w: 1000, h: 1250 },
};

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Wrap a title into <= maxChars lines for SVG rendering. */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

/** Build a branded SVG poster as a data URI from the brief. */
export function buildPoster(brief: VideoCreativeBrief): string {
  const { w, h } = ASPECT_DIMS[brief.aspectRatio] ?? ASPECT_DIMS['16:9'];
  const titleLines = wrap(brief.seo.title || brief.keyMessage, brief.aspectRatio === '9:16' ? 16 : 26);
  const lineHeight = Math.round(h * 0.072);
  const startY = Math.round(h * 0.46) - ((titleLines.length - 1) * lineHeight) / 2;
  const tspans = titleLines
    .map(
      (l, i) =>
        `<tspan x="${Math.round(w * 0.08)}" y="${startY + i * lineHeight}">${xmlEscape(l)}</tspan>`,
    )
    .join('');
  const cx = Math.round(w * 0.5);
  const cy = Math.round(h * 0.8);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${xmlEscape(brief.seo.title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#15233b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#34d399"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${Math.round(w * 0.08)}" y="${Math.round(h * 0.16)}" width="${Math.round(w * 0.12)}" height="6" rx="3" fill="url(#accent)"/>
  <text x="${Math.round(w * 0.08)}" y="${Math.round(h * 0.27)}" fill="#9fb3c8" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${Math.round(h * 0.03)}" font-weight="700" letter-spacing="2">SWINGVANTAGE</text>
  <text fill="#f8fafc" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${Math.round(h * 0.06)}" font-weight="800">${tspans}</text>
  <circle cx="${cx}" cy="${cy}" r="${Math.round(h * 0.06)}" fill="url(#accent)"/>
  <path d="M ${cx - Math.round(h * 0.02)} ${cy - Math.round(h * 0.03)} L ${cx + Math.round(h * 0.035)} ${cy} L ${cx - Math.round(h * 0.02)} ${cy + Math.round(h * 0.03)} Z" fill="#0b1220"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function fmtTime(totalSec: number): string {
  const ms = Math.round((totalSec - Math.floor(totalSec)) * 1000);
  const s = Math.floor(totalSec) % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const hh = Math.floor(totalSec / 3600);
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(hh)}:${p(m)}:${p(s)}.${p(ms, 3)}`;
}

/** Build a real, scene-timed WebVTT track from the brief's storyboard. */
export function buildVtt(brief: VideoCreativeBrief): string {
  let t = 0;
  const cues: string[] = ['WEBVTT', ''];
  const scenes = brief.storyboard.length
    ? brief.storyboard
    : brief.script.map((voiceover, i) => ({
        index: i + 1,
        durationSec: Math.max(2, Math.round(brief.durationTargetSec / Math.max(1, brief.script.length))),
        visual: '',
        voiceover,
      }));
  scenes.forEach((scene, i) => {
    const start = t;
    const end = t + scene.durationSec;
    t = end;
    cues.push(String(i + 1));
    cues.push(`${fmtTime(start)} --> ${fmtTime(end)}`);
    cues.push(scene.voiceover);
    cues.push('');
  });
  return cues.join('\n');
}

function vttDataUri(vtt: string): string {
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

function buildParts(brief: VideoCreativeBrief): ProviderAssetParts {
  const poster = buildPoster(brief);
  const vtt = buildVtt(brief);
  return {
    // No real footage from the mock — poster + captions + transcript only.
    src: undefined,
    poster,
    thumbnail: poster,
    captions: [{ lang: 'en', src: vttDataUri(vtt), label: 'English' }],
    transcript: brief.script.join('\n'),
    durationSec: brief.durationTargetSec,
    isPlaceholder: true,
  };
}

export const mockProvider: VideoProvider = {
  id: 'mock',
  label: 'Built-in template (no API key)',
  capabilities: ['video', 'voiceover', 'captions', 'thumbnail', 'compose'],
  maxCostPerJobCents: 0,

  isConfigured() {
    return true; // always available
  },

  async generateVideo(brief): Promise<ProviderGenerateResult> {
    const parts = buildParts(brief);
    const providerJobId = `mock_${brief.id}_${Date.now().toString(36)}`;
    JOBS.set(providerJobId, parts);
    return {
      ok: true,
      providerJobId,
      status: 'completed',
      estimatedCostCents: 0,
      asset: parts,
      message: 'Generated branded poster, timed captions, and transcript (placeholder footage).',
    };
  },

  async generateVoiceover(brief) {
    // The mock does not synthesize audio; it returns the script timing only.
    return { ok: true, durationSec: brief.durationTargetSec, message: 'Script ready for VO synthesis.' };
  },

  generateCaptions(brief) {
    const vtt = buildVtt(brief);
    return { src: vttDataUri(vtt), vtt };
  },

  generateThumbnail(brief) {
    const poster = buildPoster(brief);
    return { poster, thumbnail: poster };
  },

  async composeVideo(parts) {
    // Nothing to encode without a real renderer; pass parts through.
    return parts;
  },

  async checkJobStatus(providerJobId): Promise<ProviderJobStatus> {
    return JOBS.has(providerJobId)
      ? { status: 'completed', progress: 100 }
      : { status: 'failed', progress: 0, message: 'Unknown job id' };
  },

  async retrieveAsset(providerJobId) {
    return JOBS.get(providerJobId) ?? null;
  },

  async cancelJob(providerJobId) {
    return JOBS.delete(providerJobId);
  },
};
