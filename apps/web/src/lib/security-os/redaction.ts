// ============================================================
// securityOS — secret/PII redaction (PURE, isomorphic)
// ------------------------------------------------------------
// Audit-log entries must never persist raw secrets. This redactor masks
// anything that looks like an API key, token, JWT, bearer header, private
// key block, or email before an entry is stored. Conservative by design:
// it would rather over-mask than leak. Mirrors the existing leak-guard ethic
// (auto-publish findLeak) used elsewhere in the app.
// ============================================================

/** Patterns that indicate a likely secret/credential in a string. */
const SECRET_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /-----BEGIN[\s\S]*?PRIVATE KEY-----[\s\S]*?-----END[\s\S]*?PRIVATE KEY-----/g, label: '[redacted:private-key]' },
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, label: '[redacted:jwt]' },
  { re: /\b(?:sk|pk|rk)-[A-Za-z0-9]{16,}\b/g, label: '[redacted:api-key]' },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, label: '[redacted:token]' },
  { re: /\bghp_[A-Za-z0-9]{20,}\b/g, label: '[redacted:token]' },
  { re: /\bAKIA[0-9A-Z]{16}\b/g, label: '[redacted:aws-key]' },
  { re: /\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi, label: 'Bearer [redacted]' },
  { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, label: '[redacted:email]' },
  // Generic high-entropy token assigned to a secret-ish key, e.g. token=abc123...
  { re: /\b([A-Za-z0-9_-]{32,})\b/g, label: '[redacted:secret]' },
];

/** Keys whose VALUE should always be masked regardless of content. */
const SENSITIVE_KEY_RE = /(secret|token|password|passwd|api[_-]?key|authorization|cookie|private[_-]?key|credential)/i;

/** Mask secrets inside a single string. */
export function redactString(input: string): string {
  let out = input;
  for (const { re, label } of SECRET_PATTERNS) {
    out = out.replace(re, label);
  }
  return out;
}

/**
 * Deep-redact an arbitrary value for safe persistence. Strings are scrubbed;
 * any object key that looks sensitive has its value fully masked; arrays and
 * nested objects are walked. Non-serializable/oversized inputs degrade to a
 * placeholder rather than throwing.
 */
export function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[redacted:too-deep]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactDeep(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_RE.test(k) ? '[redacted]' : redactDeep(v, depth + 1);
    }
    return out;
  }
  return '[redacted:unserializable]';
}

/** Redact a metadata bag for an audit entry. Returns undefined when empty. */
export function redactMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;
  return redactDeep(metadata) as Record<string, unknown>;
}
