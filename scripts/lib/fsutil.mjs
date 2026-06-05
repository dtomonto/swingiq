// Shared helpers for SwingVantage growth/validation scripts.
import { readdirSync, statSync } from 'fs';
import { join, sep } from 'path';

/** Recursively list files under dir matching one of the extensions. */
export function walk(dir, exts) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) out.push(...walk(full, exts));
    else if (!exts || exts.some((x) => full.endsWith(x))) out.push(full);
  }
  return out;
}

/**
 * Collect Next.js App Router routes from an app directory.
 * Returns { staticRoutes: Set<string>, dynamicBases: string[] }.
 * Route groups "(group)" are stripped; dynamic segments "[x]" / "[...x]"
 * become dynamic bases (the parent path).
 */
export function collectAppRoutes(appDir) {
  const staticRoutes = new Set(['/']);
  const dynamicBases = [];
  const pageFiles = walk(appDir, ['page.tsx', 'page.ts', 'page.jsx', 'page.js']);

  for (const file of pageFiles) {
    // path relative to appDir, drop the trailing /page.*
    const rel = file.slice(appDir.length).split(sep).filter(Boolean);
    rel.pop(); // remove page.*
    const segments = rel.filter((s) => !(s.startsWith('(') && s.endsWith(')'))); // drop route groups

    const dynIdx = segments.findIndex((s) => s.startsWith('['));
    if (dynIdx >= 0) {
      const base = '/' + segments.slice(0, dynIdx).join('/');
      dynamicBases.push(base === '/' ? '/' : base);
    } else {
      staticRoutes.add('/' + segments.join('/'));
    }
  }
  return { staticRoutes, dynamicBases };
}
