# Security and Privacy Guide

This document covers everything related to keeping SwingIQ users safe — how data is protected, what security measures are built in, what still needs to be done, and how to respond to security incidents.

**Audience:** App owner (non-developer), developers, and anyone doing a security review.

## 📘 In Plain English (start here)

**What this page is:** How SwingIQ keeps users' information safe, what protection is already built in, and the few safety tasks only you can do before you open the app to the public.

**What you actually need to know:**
- **Already true today (good news):** swing videos stay on the user's own device, secret keys are kept out of the code, and automatic scans check every code change for problems.
- **Your to-do items before launch** (these also appear in [OWNER_TASKS.md](OWNER_TASKS.md)):
  1. Make sure a real security email (`security@swingiq.app`) exists and reaches you.
  2. Turn on the GitHub security switches (secret scanning, Dependabot, branch protection).
  3. Have a lawyer review your Privacy Policy and Terms before you collect real users' data.
- **If data is ever exposed,** there's a step-by-step "Data Breach Response Plan" lower down — find it and follow it in order.

**What to do next:** Work through the security items in [OWNER_TASKS.md](OWNER_TASKS.md). Think of this page as the plain-English "why" behind those checkboxes.

> The deeper sections below (OWASP table, security headers, code examples) are written for a developer or an AI assistant doing a security review. You don't need to understand them to do your part.

---

## Security Philosophy

SwingIQ follows these core security principles:

1. **Least privilege** — each part of the system only has access to what it needs
2. **Defense in depth** — multiple layers of protection so one failure doesn't expose everything
3. **Privacy by design** — sensitive data (videos, youth profiles) is handled with extra care from the start
4. **Transparency** — users can see and export all their data; nothing is hidden

---

## What Security is Built In

### Rate Limiting
All API routes (AI Coach, Video Analysis, Data Import/Export) have rate limiting:
- **What it does:** Blocks someone from making thousands of requests per minute to the API
- **Where it lives:** `apps/web/src/lib/rate-limit.ts`
- **Current limits:** 30 requests per minute per IP address for video analysis; 20/minute for AI coach

### Input Validation
- JSON bodies are validated before being processed
- Video metadata is checked for correct types (numbers are numbers, strings are strings)
- Backup file imports are validated against the schema before any data is written
- **Prototype pollution guard:** A malicious backup file cannot inject harmful properties into the app's state
- **Complexity bomb guard:** A backup file with extremely deep nesting designed to crash the browser is rejected

### File Upload Security
- Video analysis route explicitly does not accept actual video bytes — only metadata and analysis results
- The video stays in the browser; nothing is uploaded to the server
- When file uploads are added for images (session photos, avatars), these accepted types should be enforced: `image/jpeg`, `image/png`, `image/webp` — maximum 10MB

### Server-Side Identity
- API routes do not trust `user_id` from the request body
- User identity must be verified server-side from the authenticated session (Supabase Auth)
- This prevents one user from modifying another user's data (IDOR attack prevention)
- **Current status:** SwingIQ is keyless by default — accounts live privately on the user's own device. When Supabase env keys are present, session middleware activates and API routes verify identity server-side. IDOR protection is already in place on the data routes.

### Secret Management
- API keys are stored in environment variables, never in code
- The `.env.local` file is in `.gitignore` and never committed to GitHub
- Supabase Row Level Security (RLS) means even if a client sends a bad request, the database rejects it

### Security Headers
The following HTTP headers should be configured in `vercel.json` or `next.config.ts`:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
These headers are not harmful to add today. Add them before public launch.

---

## Security Automation

Automated security checks run on every code change. See `docs/security-automation.md` for the full workflow details.

**Quick summary:**

| Check | What It Finds | When It Runs |
|-------|---------------|--------------|
| Secret scan (Gitleaks) | API keys accidentally committed to Git | Every push |
| npm audit | Known vulnerabilities in dependencies | Every push |
| ESLint + TypeScript | Code quality issues that could hide bugs | Every push |
| Custom security scan | Hardcoded secrets, unsafe patterns | Every push |
| CodeQL | SQL injection, XSS, path traversal | Weekly |

**To run security checks manually:**
```bash
npm audit
npm run lint
npm run type-check
```

---

## Privacy by Design

### Video Data
- Videos are processed entirely in the browser
- No video bytes ever reach SwingIQ servers
- Only metadata (duration, camera angle) and analysis results (scores, issues) are saved
- Users keep their original video files — SwingIQ doesn't store them

### AI Data
- When the AI Coach is used, the user's question and a small structured context block are sent to the AI provider (OpenAI or Anthropic)
- Only the first name (if provided) and sport-relevant context are included — never email, password, or full session history
- AI providers have their own data retention policies — review these before launch:
  - OpenAI: https://platform.openai.com/docs/data-usage-policies
  - Anthropic: https://www.anthropic.com/privacy

### Youth Athletes
The app has a usage category system that asks at first launch whether the user is:
- An adult
- A parent/guardian managing a child's account
- A coach
- A minor (13–17)
- A minor (under 13)

**Current limitations:**
- The category is stored locally and self-reported
- No server-side enforcement of age restrictions
- No verified parental consent flow yet

**Before launch:** Add age-appropriate restrictions for accounts identified as under 13 — disable AI features and community features without verified parental consent.

### Community Features
Community features (leaderboards, badges, groups) display:
- Username (if set)
- Badge count and XP level
- Sport and skill level

**Not publicly shown by default:**
- Email address
- Full name
- Session details
- Video content

---

## Dependency Security

### Regular Audit
Run `npm audit` monthly. This checks all project dependencies against a database of known vulnerabilities.

**Critical findings** (CVSS 9.0+) must be fixed before public launch.
**High findings** (CVSS 7.0–8.9) must be reviewed and either fixed or have a documented reason for exception.

### Key Dependencies to Monitor

| Package | Why It's Critical |
|---------|------------------|
| `@supabase/supabase-js` | Handles all database access and authentication |
| `next` | The web framework — vulnerabilities here affect the whole app |
| `openai` / `@anthropic-ai/sdk` | Sends user context to external AI |
| `zustand` | Manages all user state in the browser |

---

## Vulnerability Reporting

A vulnerability disclosure page lives at `/vulnerability-disclosure` in the app. It explains:
- How to report a security issue responsibly
- What to include in a report
- Response time commitment (48 hours acknowledgment, 30 days to remediate)

The `SECURITY.md` file at the root of the repository also documents this for developers.

**Before launch:** Replace the placeholder security contact email in both files with a real address (e.g., `security@swingiq.app`).

---

## AI and Medical Disclaimers

SwingIQ provides AI-generated coaching suggestions. These disclaimers are shown to users:

1. **AI accuracy disclaimer:** AI coaching is based on patterns in your data. It is not a substitute for in-person instruction from a certified professional.

2. **Medical disclaimer:** SwingIQ is not a medical device. Do not use this app to diagnose or treat physical injuries. If you experience pain while practicing, consult a sports medicine professional.

3. **Youth note:** For athletes under 18, parent or guardian review of AI coaching suggestions is recommended.

These disclaimers appear:
- In the AI Coach interface
- In the Terms of Service
- On the Trust page (`/trust`)

---

## Data Breach Response Plan

If you believe user data has been exposed:

### Immediate steps (within 24 hours):
1. Go to Supabase dashboard → Settings → API → Regenerate the service role key
2. Go to Vercel dashboard → Settings → Environment Variables → Update with the new key
3. Redeploy the app (Vercel → Deployments → Redeploy)
4. Rotate any other exposed keys (OpenAI, Anthropic — see `SECURITY.md`)

### Notification (within 72 hours for GDPR):
5. Identify which users may be affected
6. Send affected users an email explaining what happened, what was exposed, and what they should do
7. If more than 250 records or any sensitive data (health, financial), consider whether regulatory notification is required

### Documentation:
8. Document the incident, root cause, and remediation
9. Update security practices to prevent recurrence

---

## Secret Rotation Reference

| Secret | Where to Rotate |
|--------|----------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `ADMIN_SECRET` | Vercel environment variables + `.env.local` |

After rotating: update the key in Vercel environment variables and redeploy.

---

## Manual GitHub Security Settings

These settings cannot be configured by code — a repository admin must do them manually in GitHub:

1. **Enable secret scanning:** Repository → Settings → Security → Secret scanning → Enable
2. **Enable Dependabot alerts:** Repository → Settings → Security → Dependabot alerts → Enable
3. **Enable Dependabot security updates:** Auto-creates PRs when vulnerable packages have fixes
4. **Branch protection on `main`:** Settings → Branches → Add rule → Require pull request reviews before merging
5. **Require status checks:** Add "security-audit" as a required status check so code with security failures can't be merged

---

## OWASP Top 10 Coverage

| Threat | Status | How It's Addressed |
|--------|--------|-------------------|
| Injection (SQL, XSS) | ✅ Mitigated | Supabase parameterized queries; React JSX auto-escapes |
| Broken Authentication | ✅ Mitigated | Keyless local accounts by default; optional Supabase Auth + session middleware activate on env keys; rate limiting active |
| Sensitive Data Exposure | ✅ Mitigated | No sensitive data in frontend code; env vars for secrets |
| XML External Entities | ✅ N/A | No XML processing |
| Broken Access Control | ⚠️ Partial | IDOR protection on data routes; server-side identity checks when auth is enabled; Supabase RLS SQL ready to apply |
| Security Misconfiguration | ✅ Mitigated | Security headers set in middleware/next config (verify post-deploy); production source maps disabled |
| XSS | ✅ Mitigated | React auto-escapes; CSP + security headers set in middleware/next config |
| Insecure Deserialization | ✅ Mitigated | Backup validation includes prototype pollution guard |
| Known Vulnerabilities | ✅ Active | npm audit in CI, Dependabot on GitHub |
| Insufficient Logging | ⚠️ Planned | Error monitoring (Sentry) to be added |

---

## Compliance Readiness

| Regulation | Status | Gap |
|------------|--------|-----|
| GDPR (Europe) | ⚠️ Partial | Privacy policy needs attorney review; data deletion flow needs server-side implementation |
| CCPA (California) | ⚠️ Partial | Privacy policy needs "Do not sell my data" section |
| COPPA (Under 13, USA) | ❌ Not implemented | Age gate + verified parental consent needed before accepting users under 13 |
| PCI-DSS (Payments) | ✅ N/A until Stripe added | Stripe handles card data; SwingIQ never touches raw card numbers |

---

*Last updated: May 2026 | See also: `SECURITY.md`, `docs/security-automation.md`, `docs/DATA_PORTABILITY.md`*
