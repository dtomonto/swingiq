// ============================================================
// SwingIQ — Share Card image generator (client-only, no keys)
//
// Renders a 1080×1080 "Instagram-ready" PNG of a swing report
// summary onto an off-screen canvas. Fully self-contained — no
// network, no provider, no fonts to load (uses system sans).
// Shares only a text/image summary, never raw video.
// ============================================================

import type { ReportData } from '@/components/report/ShareableReportCard';

const SIZE = 1080;
const PAD = 80;

const COLORS = {
  bg: '#0b1220',
  panel: '#111c30',
  accent: '#22c55e',
  accentSoft: 'rgba(34,197,94,0.14)',
  text: '#f8fafc',
  muted: '#94a3b8',
  warn: '#fbbf24',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Word-wrap `text` to `maxWidth`, returning the y after the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        // last allowed line — append remaining words, ellipsize if needed.
        let rest = words.slice(i).join(' ');
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 1) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(words.slice(i).join(' ') === rest ? rest : `${rest}…`, x, y);
        return y + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

/** Render a ReportData to a 1080×1080 PNG Blob. Returns null off the main thread / no canvas. */
export async function generateShareCard(data: ReportData): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Accent top bar
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, 0, SIZE, 14);

  // Header
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.accent;
  ctx.font = `800 44px ${sans}`;
  ctx.fillText('SwingIQ', PAD, 150);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `600 30px ${sans}`;
  ctx.textAlign = 'right';
  ctx.fillText(data.sport.toUpperCase(), SIZE - PAD, 150);
  ctx.textAlign = 'left';

  // Top priority panel
  const panelY = 210;
  const panelH = 250;
  ctx.fillStyle = COLORS.accentSoft;
  roundRect(ctx, PAD, panelY, SIZE - PAD * 2, panelH, 28);
  ctx.fill();
  ctx.fillStyle = COLORS.accent;
  ctx.font = `700 26px ${sans}`;
  ctx.fillText('TOP PRIORITY', PAD + 40, panelY + 60);
  ctx.fillStyle = COLORS.text;
  ctx.font = `800 52px ${sans}`;
  const afterIssue = wrapText(ctx, data.topIssue, PAD + 40, panelY + 125, SIZE - PAD * 2 - 80, 62, 3);
  if (data.confidence) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `500 26px ${sans}`;
    ctx.fillText(`Confidence: ${data.confidence}`, PAD + 40, Math.min(afterIssue + 6, panelY + panelH - 30));
  }

  // Drills
  let y = panelY + panelH + 80;
  ctx.fillStyle = COLORS.text;
  ctx.font = `700 36px ${sans}`;
  ctx.fillText('Drills to work on', PAD, y);
  y += 56;
  ctx.font = `500 30px ${sans}`;
  data.drills.slice(0, 3).forEach((d, i) => {
    ctx.fillStyle = COLORS.accent;
    ctx.font = `800 30px ${sans}`;
    ctx.fillText(`${i + 1}.`, PAD, y);
    ctx.fillStyle = COLORS.text;
    ctx.font = `500 30px ${sans}`;
    y = wrapText(ctx, d, PAD + 50, y, SIZE - PAD * 2 - 50, 42, 2) + 14;
  });

  // Practice plan panel
  y += 10;
  const planH = 170;
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, PAD, y, SIZE - PAD * 2, planH, 24);
  ctx.fill();
  ctx.fillStyle = COLORS.muted;
  ctx.font = `700 24px ${sans}`;
  ctx.fillText('PRACTICE PLAN', PAD + 36, y + 50);
  ctx.fillStyle = COLORS.text;
  ctx.font = `500 28px ${sans}`;
  wrapText(ctx, data.planSummary, PAD + 36, y + 92, SIZE - PAD * 2 - 72, 38, 2);

  // Footer
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 24px ${sans}`;
  ctx.fillText('Free AI swing analysis · swingiq.app', PAD, SIZE - 70);
  ctx.fillStyle = COLORS.warn;
  ctx.font = `400 20px ${sans}`;
  ctx.fillText('AI estimate — not certified instruction.', PAD, SIZE - 40);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function filename(data: ReportData): string {
  const date = new Date().toISOString().slice(0, 10);
  return `swingiq-${data.sport.toLowerCase().replace(/\s+/g, '-')}-${date}.png`;
}

/** Trigger a browser download of the share card. */
export async function downloadShareCard(data: ReportData): Promise<boolean> {
  const blob = await generateShareCard(data);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename(data);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/**
 * Share the image via the Web Share API (mobile). Returns 'shared',
 * 'downloaded' (fallback), or 'failed'. Never throws.
 */
export async function shareCardImage(data: ReportData): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await generateShareCard(data);
  if (!blob) return 'failed';
  const file = new File([blob], filename(data), { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `My SwingIQ ${data.sport} summary` });
      return 'shared';
    } catch {
      return 'failed';
    }
  }
  // Fallback: download.
  const ok = await downloadShareCard(data);
  return ok ? 'downloaded' : 'failed';
}
