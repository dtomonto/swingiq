// ============================================================
// SwingVantage — Safe JSON-LD serialization (shared)
//
// Structured-data blocks are embedded inside <script type="application/ld+json">
// via dangerouslySetInnerHTML. A raw JSON.stringify lets a "</script>" sequence
// in ANY string field break out of the script context — a classic stored-XSS
// sink. SwingVantage's JSON-LD is assembled from page titles, FAQ answers,
// video titles/descriptions and other copy (some AI-generated), so "typed
// input" is NOT a guarantee the bytes are safe.
//
// We escape the HTML-significant characters (< > &) plus the two Unicode line
// terminators that are valid in JSON but illegal in JS string literals
// (U+2028, U+2029). The output stays valid JSON, so crawlers parse it
// identically — it simply cannot terminate the surrounding <script> tag.
//
// This is the single source of truth: every JSON-LD emitter must serialize
// through here rather than calling JSON.stringify directly.
// ============================================================

// Pure-ASCII source: the RegExp is built from a string so U+2028/U+2029 appear
// as \u escapes, never as raw (invisible) characters in this file.
const UNSAFE_JSON_LD_CHARS = new RegExp('[<>&\\u2028\\u2029]', 'g');

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    UNSAFE_JSON_LD_CHARS,
    (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
  );
}
