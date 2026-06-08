// ============================================================
// securityOS — posture-check catalog (PURE)
// ------------------------------------------------------------
// The single source of truth for WHAT we check, WHY it matters, and HOW a
// raw signal maps to pass / partial / fail / unknown. Each check carries its
// framework mapping (OWASP ASVS / Top 10 / LLM Top 10 / NIST SSDF), business
// impact, fix steps and remediation metadata (effort, canClaudeFix,
// needsCredentials, addToCi).
//
// PURE: `evaluate` takes a plain PostureInput (gathered server-side in
// posture.server.ts) and returns a result + grounded evidence. That keeps
// every rule unit-testable and the output stable for a given input.
//
// To ADD a check: append a PostureCheck here. The score engine, findings
// deriver, recommendations and dashboard all pick it up automatically.
// ============================================================

import type { CheckResult, PostureCheck, PostureInput } from './types';

/** Helper: map a tri-state-ish boolean|null signal to a check result. */
function triState(
  v: boolean | null,
  passEvidence: string,
  failEvidence: string,
  unknownEvidence: string,
): { result: CheckResult; evidence: string[] } {
  if (v === null) return { result: 'unknown', evidence: [unknownEvidence] };
  return v
    ? { result: 'pass', evidence: [passEvidence] }
    : { result: 'fail', evidence: [failEvidence] };
}

export const POSTURE_CHECKS: PostureCheck[] = [
  // ── Identity & Access ──────────────────────────────────────────────────────
  {
    id: 'iam-admin-allowlist',
    category: 'identity_access',
    riskDomain: 'Authorization',
    title: 'Admin access is restricted by an email allowlist',
    description:
      'ADMIN_EMAILS limits the admin dashboard to specific accounts. Without it, admin access depends solely on the secret header (or is open in dev).',
    severity: 'critical',
    weight: 2,
    frameworks: { owaspTop10: 'A01: Broken Access Control', owaspAsvs: 'V1/V4 Access Control', nistSsdf: 'PW.4' },
    businessImpact: 'An unrestricted admin area exposes every user’s data and every operational control.',
    whatCouldHappen: 'Anyone who obtains the secret header — or any logged-in user in a misconfigured deploy — could reach admin tools.',
    recommendedFix: 'Set ADMIN_EMAILS to the exact set of operator emails and confirm non-listed accounts are redirected.',
    stepByStepActions: [
      'Set ADMIN_EMAILS="you@domain.com" (comma-separated for multiple) in the environment.',
      'Redeploy and confirm a non-listed account is redirected away from /admin.',
      'Review the list whenever an operator joins or leaves.',
    ],
    effort: 'S',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) =>
      triState(
        i.adminAllowlist,
        'ADMIN_EMAILS is set — admin access is allowlisted.',
        'ADMIN_EMAILS is not set — admin access is not restricted by email.',
        'Could not read ADMIN_EMAILS.',
      ),
  },
  {
    id: 'iam-admin-roles',
    category: 'identity_access',
    riskDomain: 'Authorization',
    title: 'Least-privilege admin roles are enforced (ADMIN_ROLES)',
    description:
      'Without ADMIN_ROLES every allowlisted admin is a Super Admin. Mapping emails to finer roles limits blast radius if one account is compromised.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspTop10: 'A01: Broken Access Control', owaspAsvs: 'V1.2 Least Privilege', nistSsdf: 'PW.4' },
    businessImpact: 'A single compromised operator account can change everything, not just their area.',
    whatCouldHappen: 'A phished support-level admin could alter monetization, AI config or user data.',
    recommendedFix: 'Define ADMIN_ROLES to grant each operator the narrowest role that lets them work.',
    stepByStepActions: [
      'Open /admin/security to see the role → permission matrix.',
      'Set ADMIN_ROLES="alice@x.com:content_manager,bob@x.com:analyst".',
      'Confirm each operator now sees only their sections.',
    ],
    effort: 'S',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) =>
      i.adminRoles
        ? { result: 'pass', evidence: ['ADMIN_ROLES is set — finer roles are enforced server-side.'] }
        : { result: 'partial', evidence: ['ADMIN_ROLES is not set — every admin defaults to Super Admin.'] },
  },
  {
    id: 'iam-supabase-auth',
    category: 'identity_access',
    riskDomain: 'Authentication',
    title: 'Real account authentication is configured (Supabase)',
    description:
      'Supabase auth provides real sessions so the allowlist can identify the logged-in admin and users own their data.',
    severity: 'high',
    weight: 1,
    frameworks: { owaspTop10: 'A07: Identification & Authentication Failures', owaspAsvs: 'V2 Authentication' },
    businessImpact: 'Without real auth there is no reliable identity behind any action.',
    whatCouldHappen: 'Access decisions fall back to a shared secret with no per-user accountability.',
    recommendedFix: 'Configure the Supabase URL + keys and verify a real login flow.',
    stepByStepActions: [
      'Set NEXT_PUBLIC_SUPABASE_URL and the anon + service keys.',
      'Confirm sign-in works and the admin email is recognized.',
    ],
    effort: 'M',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) =>
      triState(
        i.supabaseAuth,
        'Supabase auth is configured — real sessions back the allowlist.',
        'Supabase auth is not configured — identity falls back to the secret header.',
        'Could not read Supabase configuration.',
      ),
  },

  // ── Application Security ────────────────────────────────────────────────────
  {
    id: 'appsec-rate-limit',
    category: 'application_security',
    riskDomain: 'API',
    title: 'A distributed rate limiter protects public endpoints',
    description:
      'A shared (Upstash/KV) rate limiter throttles abuse of public + AI endpoints across all server instances, not just one.',
    severity: 'high',
    weight: 2,
    frameworks: { owaspTop10: 'A04: Insecure Design', owaspAsvs: 'V11 Business Logic', owaspLlm: 'LLM04: Model Denial of Service' },
    businessImpact: 'Unthrottled AI endpoints can be abused to run up cost or degrade service for everyone.',
    whatCouldHappen: 'A scripted attacker hammers /api analysis routes, inflating AI spend and starving real users.',
    recommendedFix: 'Configure the Upstash/KV rate-limiter credentials so limits apply across instances.',
    stepByStepActions: [
      'Provision an Upstash Redis (or Vercel KV) instance.',
      'Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the KV equivalents).',
      'Confirm repeated requests to a public AI route are throttled.',
    ],
    effort: 'M',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) =>
      i.rateLimiter
        ? { result: 'pass', evidence: ['A distributed rate-limiter backend is configured.'] }
        : { result: 'partial', evidence: ['No distributed limiter detected — limits, if any, are per-instance only.'] },
  },
  {
    id: 'appsec-csp',
    category: 'application_security',
    riskDomain: 'Headers',
    title: 'A Content-Security-Policy is enforced',
    description:
      'A CSP (with base-uri/form-action/frame-ancestors) is the browser-side backstop against XSS, clickjacking and injection.',
    severity: 'high',
    weight: 2,
    frameworks: { owaspTop10: 'A05: Security Misconfiguration', owaspAsvs: 'V14.4 HTTP Security Headers' },
    businessImpact: 'Without CSP, a single injected script can run with full page privileges.',
    whatCouldHappen: 'An XSS payload exfiltrates session data or defaces pages with no browser-side brake.',
    recommendedFix: 'Confirm middleware sets a strict Content-Security-Policy and tighten any unsafe directives.',
    stepByStepActions: [
      'Open middleware.ts and verify the Content-Security-Policy header is set.',
      'Remove any unsafe-inline / unsafe-eval you can, using nonces/hashes.',
      'Verify with a headers checker (e.g. securityheaders.com) on a deployed URL.',
    ],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      triState(
        i.cspHeaders,
        'middleware sets a Content-Security-Policy header.',
        'No Content-Security-Policy detected in middleware.',
        'Could not read middleware to confirm CSP.',
      ),
  },
  {
    id: 'appsec-hsts',
    category: 'application_security',
    riskDomain: 'Headers',
    title: 'Strict-Transport-Security (HSTS) is set',
    description: 'HSTS forces HTTPS for return visits, preventing protocol-downgrade and cookie interception.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspAsvs: 'V9.1 Transport Security', owaspTop10: 'A05: Security Misconfiguration' },
    businessImpact: 'A downgraded connection can leak session cookies on hostile networks.',
    whatCouldHappen: 'A man-in-the-middle strips TLS on first request and reads traffic.',
    recommendedFix: 'Emit Strict-Transport-Security with a long max-age (and includeSubDomains) in middleware.',
    stepByStepActions: [
      'Add Strict-Transport-Security: max-age=63072000; includeSubDomains; preload in middleware.',
      'Confirm the header appears on a deployed response.',
    ],
    effort: 'S',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      triState(
        i.hstsHeaders,
        'Strict-Transport-Security is emitted.',
        'No Strict-Transport-Security header detected.',
        'Could not read middleware to confirm HSTS.',
      ),
  },

  // ── Data Protection ─────────────────────────────────────────────────────────
  {
    id: 'data-rls',
    category: 'data_protection',
    riskDomain: 'Database',
    title: 'Row-Level Security isolates user data in the database',
    description:
      'RLS policies ensure a user can only read/write their own rows, even if an application bug or stolen anon key reaches the database.',
    severity: 'critical',
    weight: 2,
    frameworks: { owaspTop10: 'A01: Broken Access Control', owaspAsvs: 'V4 Access Control', nistSsdf: 'PW.4' },
    businessImpact: 'Without RLS, one query bug can expose every user’s performance data.',
    whatCouldHappen: 'A leaked anon key or IDOR bug returns other users’ rows directly from the DB.',
    recommendedFix: 'Apply the relational schema with RLS enabled and a policy on every user-scoped table.',
    stepByStepActions: [
      'Apply supabase-relational-schema.sql (and confirm "enable row level security" on each table).',
      'Add a per-user policy to any table missing one.',
      'Test that a user’s token cannot read another user’s rows.',
    ],
    effort: 'L',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) =>
      triState(
        i.rlsApplied,
        'RLS-enabled relational schema is present.',
        'No RLS-enabled schema detected — user-data isolation is unverified.',
        'Could not read the schema to confirm RLS.',
      ),
  },
  {
    id: 'data-secret-scanning',
    category: 'data_protection',
    riskDomain: 'Secrets',
    title: 'Secret scanning runs in CI',
    description:
      'Automated secret scanning (Gitleaks/TruffleHog/GitHub) blocks API keys and tokens from ever being committed.',
    severity: 'high',
    weight: 2,
    frameworks: { owaspTop10: 'A05: Security Misconfiguration', nistSsdf: 'PW.4 / RV.1' },
    businessImpact: 'A committed key can compromise third-party integrations and incur cost or data loss.',
    whatCouldHappen: 'An accidental key in git history is harvested by a bot within minutes of pushing.',
    recommendedFix: 'Add a Gitleaks (or TruffleHog) job to CI that fails the build on a detected secret.',
    stepByStepActions: [
      'Add a Gitleaks GitHub Action that runs on pull_request and push.',
      'Fail CI on any finding; allowlist false positives explicitly.',
      'Enable GitHub push-protection / secret scanning on the repo as a second layer.',
    ],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    addToCi: true,
    evaluate: (i) =>
      triState(
        i.secretScanCi,
        'A secret-scanning job is present in CI.',
        'No secret-scanning job found in CI workflows.',
        'Could not read CI workflows to confirm secret scanning.',
      ),
  },

  // ── AI Security ─────────────────────────────────────────────────────────────
  {
    id: 'ai-budget-killswitch',
    category: 'ai_security',
    riskDomain: 'AI',
    title: 'A global AI spend kill-switch is armed',
    description:
      'AI_DAILY_BUDGET_CENTS caps total AI spend per day across every paid route, so abuse or a bug can’t produce a runaway bill.',
    severity: 'high',
    weight: 2,
    frameworks: { owaspLlm: 'LLM04: Model Denial of Service / Unbounded Consumption', nistSsdf: 'PW.4' },
    businessImpact: 'A pre-revenue product with uncapped AI spend is one abuse spike away from a painful bill.',
    whatCouldHappen: 'Scripted abuse of public AI analysis drains the budget and the AI features go dark for real users.',
    recommendedFix: 'Set AI_DAILY_BUDGET_CENTS to a sensible daily ceiling so the kill-switch is armed.',
    stepByStepActions: [
      'Decide a safe daily ceiling (e.g. a few dollars while pre-revenue).',
      'Set AI_DAILY_BUDGET_CENTS to that value (in cents).',
      'Confirm /admin/system-health shows the budget guard as active.',
    ],
    effort: 'S',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) => {
      if (!i.aiConfigured) {
        return { result: 'pass', evidence: ['No paid AI provider is configured — there is no live AI spend to cap (keyless mode).'] };
      }
      return i.aiBudgetKillSwitch
        ? { result: 'pass', evidence: ['AI_DAILY_BUDGET_CENTS is set — the spend kill-switch is armed.'] }
        : { result: 'fail', evidence: ['A paid AI provider is configured but AI_DAILY_BUDGET_CENTS is not set — spend is uncapped.'] };
    },
  },
  {
    id: 'ai-prompt-injection-tests',
    category: 'ai_security',
    riskDomain: 'AI',
    title: 'A prompt-injection / adversarial test suite exists',
    description:
      'A stored, runnable set of adversarial prompts (reveal system prompt, bypass role, exfiltrate data, force unsafe advice) regression-tests AI safety as the product evolves.',
    severity: 'high',
    weight: 2,
    frameworks: { owaspLlm: 'LLM01: Prompt Injection / LLM02: Insecure Output Handling', nistSsdf: 'PW.7 / PW.8' },
    businessImpact: 'AI-generated coaching that can be manipulated erodes trust and could surface unsafe advice.',
    whatCouldHappen: 'A crafted input makes the assistant leak its instructions or produce unsafe recommendations.',
    recommendedFix: 'Add a non-destructive red-team prompt suite and wire its results into securityOS findings.',
    stepByStepActions: [
      'Author a set of safe adversarial prompts covering system-prompt leakage, role bypass and data exfiltration.',
      'Run them against the AI surfaces and assert safe refusals/handling.',
      'Record failures as securityOS findings and re-run in CI where safe.',
    ],
    effort: 'L',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      triState(
        i.aiPromptInjectionTests,
        'A prompt-injection / red-team test suite is present.',
        'No prompt-injection test suite found — AI safety is not regression-tested.',
        'Could not scan the repo for an AI red-team suite.',
      ),
  },

  // ── Infrastructure & Deployment ─────────────────────────────────────────────
  {
    id: 'infra-prod-secret',
    category: 'infrastructure',
    riskDomain: 'Authorization',
    title: 'Production is locked down (no open dev fallback)',
    description:
      'In production, the admin area must require a real allowlist or secret — never the development "open" fallback.',
    severity: 'critical',
    weight: 2,
    frameworks: { owaspTop10: 'A05: Security Misconfiguration', owaspAsvs: 'V1.14 Configuration' },
    businessImpact: 'A production deploy with the dev fallback active would leave admin tools wide open.',
    whatCouldHappen: 'If neither ADMIN_SECRET nor ADMIN_EMAILS is set in prod, the guard could fail open.',
    recommendedFix: 'Ensure either ADMIN_SECRET or ADMIN_EMAILS is set in every production environment.',
    stepByStepActions: [
      'Confirm NODE_ENV=production on the live deploy.',
      'Confirm at least one of ADMIN_SECRET or ADMIN_EMAILS is set there.',
    ],
    effort: 'S',
    canClaudeFix: false,
    needsCredentials: true,
    evaluate: (i) => {
      if (!i.productionEnv) {
        return { result: 'pass', evidence: ['Not a production environment — dev fallback is expected and acceptable.'] };
      }
      return i.adminSecret || i.adminAllowlist
        ? { result: 'pass', evidence: ['Production admin access requires a secret or allowlist.'] }
        : { result: 'fail', evidence: ['Production has neither ADMIN_SECRET nor ADMIN_EMAILS set — admin guard may fail open.'] };
    },
  },

  // ── Monitoring & Incident Response ──────────────────────────────────────────
  {
    id: 'mon-admin-audit-log',
    category: 'monitoring_ir',
    riskDomain: 'Logging',
    title: 'Admin actions are recorded in an audit log',
    description:
      'A record of who changed what and when (the /admin/audit-log + this security audit log) makes admin actions accountable and supports incident review.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspTop10: 'A09: Security Logging & Monitoring Failures', owaspAsvs: 'V7 Error Handling & Logging', nistSsdf: 'RV.1' },
    businessImpact: 'Without an audit trail, you can’t reconstruct what happened during an incident.',
    whatCouldHappen: 'A misconfiguration or compromise leaves no trail to scope the damage.',
    recommendedFix: 'Keep using the admin audit log; consider mirroring it to a server-side table later.',
    stepByStepActions: [
      'Confirm mutating admin actions write to /admin/audit-log.',
      'Plan an admin_audit_log table for a shared, cross-device trail (deferred).',
    ],
    effort: 'S',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      i.adminAuditLog
        ? { result: 'pass', evidence: ['An admin audit log is present (local-first ring buffer).'] }
        : { result: 'partial', evidence: ['Admin audit logging is not consistently wired across actions.'] },
  },
  {
    id: 'mon-incident-runbook',
    category: 'monitoring_ir',
    riskDomain: 'Incident Readiness',
    title: 'An incident-response runbook exists',
    description:
      'A written runbook (what to do if a secret leaks, an admin is compromised, AI leaks data, etc.) turns a panic into a checklist.',
    severity: 'medium',
    weight: 1,
    frameworks: { nistSsdf: 'RV.2 / RV.3', owaspAsvs: 'V7 Logging & Monitoring' },
    businessImpact: 'In an incident, minutes matter — improvising loses time and increases damage.',
    whatCouldHappen: 'A leaked key sits live for hours because no one knows the rotation steps.',
    recommendedFix: 'Keep docs/security/incident-response-runbook.md current and rehearse it.',
    stepByStepActions: [
      'Read docs/security/incident-response-runbook.md.',
      'Fill in any environment-specific rotation/contact details.',
      'Do a 15-minute tabletop walk-through of the secret-leak scenario.',
    ],
    effort: 'S',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      triState(
        i.incidentRunbook,
        'An incident-response runbook is present in docs/security.',
        'No incident-response runbook found.',
        'Could not read docs/security to confirm the runbook.',
      ),
  },

  // ── Secure Development Lifecycle ─────────────────────────────────────────────
  {
    id: 'sdlc-dependency-scan',
    category: 'secure_dev_lifecycle',
    riskDomain: 'Dependencies',
    title: 'Dependency vulnerability scanning runs in CI',
    description:
      'A scheduled npm audit / OSV / Dependabot pass surfaces known-vulnerable packages before they ship.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspTop10: 'A06: Vulnerable & Outdated Components', nistSsdf: 'PW.4 / RV.1' },
    businessImpact: 'A known CVE in a dependency is the most common, most automated attack path.',
    whatCouldHappen: 'A vulnerable transitive package ships and is exploited by a commodity scanner.',
    recommendedFix: 'Add an npm-audit (or OSV-Scanner) CI job and enable Dependabot.',
    stepByStepActions: [
      'Add a CI job running `npm audit --audit-level=high` (or OSV-Scanner).',
      'Enable Dependabot version + security updates on the repo.',
      'Triage findings into securityOS and patch or accept-risk each.',
    ],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    addToCi: true,
    evaluate: (i) =>
      triState(
        i.depScanCi,
        'A dependency-audit job is present in CI.',
        'No dependency-audit job found in CI workflows.',
        'Could not read CI workflows to confirm dependency scanning.',
      ),
  },
  {
    id: 'sdlc-sast',
    category: 'secure_dev_lifecycle',
    riskDomain: 'API',
    title: 'Static application security testing (SAST) runs in CI',
    description:
      'CodeQL / Semgrep / ESLint-security catch injection, auth and unsafe-pattern bugs automatically on every change.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspTop10: 'A03: Injection', nistSsdf: 'PW.7 / PW.8' },
    businessImpact: 'Manual review misses patterns a scanner catches every time, for free.',
    whatCouldHappen: 'An injection or unsafe-redirect bug ships because nothing flagged the pattern.',
    recommendedFix: 'Add CodeQL or Semgrep to CI and an eslint-plugin-security pass to lint.',
    stepByStepActions: [
      'Enable GitHub CodeQL (or add a Semgrep CI job with the OWASP ruleset).',
      'Add eslint-plugin-security to the lint config.',
      'Route high-confidence findings into securityOS.',
    ],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    addToCi: true,
    evaluate: (i) =>
      triState(
        i.sastCi,
        'A SAST job (CodeQL/Semgrep) is present in CI.',
        'No SAST job found in CI workflows.',
        'Could not read CI workflows to confirm SAST.',
      ),
  },
  {
    id: 'sdlc-security-tests',
    category: 'secure_dev_lifecycle',
    riskDomain: 'Authorization',
    title: 'Critical security flows have automated tests',
    description:
      'Regression tests for admin-route authorization and RBAC denial keep access-control from silently breaking.',
    severity: 'medium',
    weight: 1,
    frameworks: { owaspAsvs: 'V1 Architecture / V4 Access Control', nistSsdf: 'PW.8' },
    businessImpact: 'Access-control regressions are easy to introduce and catastrophic to miss.',
    whatCouldHappen: 'A refactor drops a guard and a non-admin can suddenly reach admin data.',
    recommendedFix: 'Keep admin-access + RBAC denial tests green; add coverage for new guarded surfaces.',
    stepByStepActions: [
      'Confirm tests assert non-admin roles are denied securityOS + admin APIs.',
      'Add a test whenever you add a new guarded route.',
    ],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    evaluate: (i) =>
      triState(
        i.securityTests,
        'Security/authorization tests are present.',
        'No dedicated security/authorization tests found.',
        'Could not scan the repo for security tests.',
      ),
  },
];

/** Evaluate every check against the gathered signals. PURE + deterministic. */
export function evaluateChecks(input: PostureInput): import('./types').EvaluatedCheck[] {
  return POSTURE_CHECKS.map((c) => {
    let outcome: { result: CheckResult; evidence: string[] };
    try {
      outcome = c.evaluate(input);
    } catch {
      outcome = { result: 'unknown', evidence: ['Check evaluation failed — treated as unknown.'] };
    }
    // Strip the function so the result is plain/serializable for the client.
    const { evaluate: _evaluate, ...meta } = c;
    void _evaluate;
    return { ...meta, result: outcome.result, evidence: outcome.evidence };
  });
}
