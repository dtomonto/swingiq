// ============================================================
// SwingVantage — admin email allowlist (pure, no server imports)
//
// Split out from admin.ts so the matching logic is unit-testable without
// pulling in next/headers. ADMIN_EMAILS is a comma-separated list.
// ============================================================

/** Parsed, lowercased allowlist from ADMIN_EMAILS. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Secure by default: empty allowlist → nobody matches. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = adminEmails();
  return list.length > 0 && list.includes(email.trim().toLowerCase());
}
