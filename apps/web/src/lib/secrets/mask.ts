// ============================================================
// Keys & Secrets — value masking (PURE, client-safe)
// ------------------------------------------------------------
// The ONLY representation of a secret value that is ever allowed to reach the
// browser. Keeps a short provider-identifying prefix + the last 4 chars so an
// operator can recognise which key is set, and replaces the middle with dots.
// Never reveals enough to reconstruct the secret.
// ============================================================

/** Mask a secret for display, e.g. `sk-ant-…••••f4a2`. Short values fully dotted. */
export function maskSecret(value: string): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (v.length <= 8) return '•'.repeat(v.length);

  // Keep a leading provider hint up to the first separator (-, _) if short.
  const sep = Math.max(v.indexOf('-'), v.indexOf('_'));
  const prefix = sep > 0 && sep <= 8 ? v.slice(0, sep + 1) : v.slice(0, 3);
  const last4 = v.slice(-4);
  return `${prefix}…••••${last4}`;
}
