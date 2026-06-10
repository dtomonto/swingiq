// ============================================================
// Theme Lab — color helpers for the token builder (#3 step 3). The theme tokens
// in globals.css are stored as bare HSL triples ("H S% L%", consumed via
// hsl(var(--token))). The builder edits them with a native color input (hex),
// so we convert between the two. PURE + unit-testable.
// ============================================================

export interface Hsl {
  h: number; // 0..360
  s: number; // 0..100
  l: number; // 0..100
}

/** Parse a token value ("142 71% 45%" or "hsl(142 71% 45%)") → Hsl, or null. */
export function parseHslTriple(value: string): Hsl | null {
  if (!value) return null;
  const m = value
    .trim()
    .replace(/^hsla?\(/i, '')
    .replace(/\)$/, '')
    .match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (!m) return null;
  const h = ((Number(m[1]) % 360) + 360) % 360;
  const s = clamp(Number(m[2]), 0, 100);
  const l = clamp(Number(m[3]), 0, 100);
  return { h, s, l };
}

/** Format an Hsl as the bare token triple globals.css expects ("H S% L%"). */
export function formatHslTriple({ h, s, l }: Hsl): string {
  return `${round(h)} ${round(s)}% ${round(l)}%`;
}

/** Hsl → "#rrggbb". */
export function hslToHex({ h, s, l }: Hsl): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `#${hex2(r + m)}${hex2(g + m)}${hex2(b + m)}`;
}

/** "#rrggbb" (or "#rgb") → Hsl. Returns null on a malformed hex. */
export function hexToHsl(hex: string): Hsl | null {
  const norm = normalizeHex(hex);
  if (!norm) return null;
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

/** Convenience: token triple → hex (null-safe). */
export function tripleToHex(value: string): string | null {
  const hsl = parseHslTriple(value);
  return hsl ? hslToHex(hsl) : null;
}

/** Convenience: hex → token triple (null-safe). */
export function hexToTriple(hex: string): string | null {
  const hsl = hexToHsl(hex);
  return hsl ? formatHslTriple(hsl) : null;
}

// ── internals ──────────────────────────────────────────────
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function round(n: number): number {
  return Math.round(n);
}
function hex2(n: number): string {
  return clamp(Math.round(n * 255), 0, 255).toString(16).padStart(2, '0');
}
function normalizeHex(hex: string): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return `#${h.toLowerCase()}`;
}
