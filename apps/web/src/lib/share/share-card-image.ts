// ============================================================
// SwingIQ — Share-Card Image Generator (client-only)
// ------------------------------------------------------------
// Renders an Instagram-ready 1080×1080 PNG of a swing summary on a
// canvas, entirely on-device. No video, no network, no PII beyond what
// the user already chose to put in the report. Used by ShareableReportCard.
//
// Colors are literal hex (a flattened PNG can't use CSS theme tokens) —
// a neutral dark "performance" look that reads on any social feed.
// ============================================================

import { siteConfig } from '@/config/site';
import type { ReportData } from '@/components/report/ShareableReportCard';

const SIZE = 1080;
const PAD = 80;

const COLORS = {
  bgTop: '#0d2a20',
  bgBottom: '#0a1a14',
  panel: 'rgba(255,255,255,0.06)',
  panelBorder: 'rgba(255,255,255,0.12)',
  accent: '#f5c542',
  text: '#f8fafc',
  muted: '#9fb4ab',
  brand: '#34d399',
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
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
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) {
        // Last allowed line — fit remaining with ellipsis if needed.
        let rest = words.slice(words.indexOf(word)).join(' ');
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 1) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(words.indexOf(word) === words.length - 1 ? rest : `${rest}…`, x, cursorY);
        return cursorY + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

/**
 * Draw the share card and return it as a PNG Blob. Returns null if a canvas
 * is unavailable (SSR or unsupported environment).
 */
export async function generateShareCardPng(data: ReportData): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Header: brand + sport
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.brand;
  ctx.font = '700 46px Arial, sans-serif';
  ctx.fillText('SwingIQ', PAD, PAD + 30);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '600 28px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(data.sport.toUpperCase(), SIZE - PAD, PAD + 28);
  ctx.textAlign = 'left';

  // Top-priority panel
  let y = PAD + 90;
  const panelW = SIZE - PAD * 2;
  const panelH = 230;
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, PAD, y, panelW, panelH, 28);
  ctx.fill();
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, PAD, y, panelW, panelH, 28);
  ctx.stroke();

  ctx.fillStyle = COLORS.accent;
  ctx.font = '700 26px Arial, sans-serif';
  ctx.fillText('TOP PRIORITY', PAD + 40, y + 56);

  ctx.fillStyle = COLORS.text;
  ctx.font = '700 52px Arial, sans-serif';
  const afterIssue = wrapText(ctx, data.topIssue, PAD + 40, y + 116, panelW - 80, 60, 3);

  if (data.confidence) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '400 26px Arial, sans-serif';
    ctx.fillText(`Confidence: ${data.confidence}`, PAD + 40, Math.min(afterIssue + 6, y + panelH - 28));
  }

  // Drills
  y += panelH + 56;
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillText('Work on this', PAD, y);
  y += 50;
  ctx.font = '400 30px Arial, sans-serif';
  data.drills.slice(0, 4).forEach((drill, i) => {
    ctx.fillStyle = COLORS.brand;
    ctx.fillText(`${i + 1}.`, PAD, y);
    ctx.fillStyle = COLORS.text;
    y = wrapText(ctx, drill, PAD + 44, y, panelW - 44, 40, 2);
    y += 8;
  });

  // Practice plan
  y += 24;
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 34px Arial, sans-serif';
  ctx.fillText('This week', PAD, y);
  y += 46;
  ctx.fillStyle = COLORS.muted;
  ctx.font = '400 28px Arial, sans-serif';
  wrapText(ctx, data.planSummary, PAD, y, panelW, 38, 3);

  // Footer
  ctx.fillStyle = COLORS.muted;
  ctx.font = '400 24px Arial, sans-serif';
  ctx.fillText('AI estimate · not certified instruction', PAD, SIZE - PAD + 10);
  ctx.fillStyle = COLORS.brand;
  ctx.font = '600 26px Arial, sans-serif';
  ctx.textAlign = 'right';
  const url = siteConfig.liveSiteUrl.replace(/^https?:\/\//, '');
  ctx.fillText(url, SIZE - PAD, SIZE - PAD + 10);
  ctx.textAlign = 'left';

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function fileName(data: ReportData): string {
  const slug = data.sport.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `swingiq-${slug}-summary.png`;
}

/** Generate + download the share card. Returns false on failure. */
export async function downloadShareCardImage(data: ReportData): Promise<boolean> {
  const blob = await generateShareCardPng(data);
  if (!blob || typeof document === 'undefined') return false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName(data);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share the card image via the Web Share API (with the file) when the
 * browser supports sharing files; otherwise fall back to a download.
 */
export async function shareCardImage(data: ReportData): Promise<boolean> {
  const blob = await generateShareCardPng(data);
  if (!blob) return false;
  const file = new File([blob], fileName(data), { type: 'image/png' });

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: `My SwingIQ ${data.sport} summary` });
      return true;
    } catch {
      return false; // user cancelled or share failed
    }
  }
  return downloadShareCardImage(data);
}
