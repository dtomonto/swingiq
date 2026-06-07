// ============================================================
// SwingVantage — i18n upkeep: stable content hashing
// A tiny, dependency-free FNV-1a hash so the same English string
// produces the same fingerprint in Node (the upkeep CLI) and in
// the browser/route bundle (the exposure gate). We normalize line
// endings first so Windows CRLF ↔ LF churn never looks like a real
// content change.
// ============================================================

/** Normalize so cosmetic whitespace differences don't register as drift. */
function normalize(input: string): string {
  return input.replace(/\r\n/g, '\n').trim();
}

/** Deterministic 32-bit FNV-1a hash, returned as 8-char hex. */
export function hashString(input: string): string {
  const str = normalize(input);
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // 32-bit FNV prime multiply via shifts (stays in 32-bit range)
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
