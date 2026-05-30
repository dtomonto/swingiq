# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SwingIQ, please report it responsibly.

**Do not open a public GitHub issue.** Public disclosure before remediation puts users at risk.

**Contact:** [Add your security contact email here — e.g., security@yourdomain.com]

Please include:
- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested remediation (optional)

We will acknowledge receipt within 48 hours and aim to resolve confirmed vulnerabilities within 30 days depending on severity.

## Responsible Disclosure Expectations

- Allow us reasonable time to investigate and remediate before public disclosure
- Do not access, modify, or delete user data beyond what is needed to demonstrate the issue
- Do not perform denial-of-service attacks, social engineering, or physical attacks
- Do not use automated scanners against production systems without prior written consent

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| Older   | No — please update |

## Secret Rotation Guidance

If you believe any of the following secrets have been exposed, rotate them immediately:

| Secret | Where to Rotate |
|--------|-----------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → Regenerate |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → Regenerate |
| `ADMIN_SECRET` | Update in hosting environment variables and `.env.local` |
| `CRON_SECRET` | Update in Vercel project settings and `vercel.json` cron config |

After rotating any key: redeploy the application so the new key takes effect.

## User Data Exposure Response

If user data (swing sessions, launch monitor data, video metadata, profiles) is exposed:

1. Immediately revoke the access vector (rotate keys, disable the endpoint, redeploy)
2. Assess scope: which users, what data, what time window
3. Notify affected users if personal data was exposed
4. Document the incident and remediation steps
5. Review related code for similar vulnerabilities

## Environment Variable Safety

- Never commit `.env.local` or any real secret to version control
- Server-side secrets must never use the `NEXT_PUBLIC_` prefix
- `NEXT_PUBLIC_` variables are embedded in the browser bundle — they are not secret
- Rotate any secret that was ever committed to git history

## Production Hardening Checklist

- [ ] `ADMIN_SECRET` set to a 32+ character random string
- [ ] `CRON_SECRET` set and matching Vercel cron configuration
- [ ] Supabase Row Level Security enabled on all tables
- [ ] Supabase storage buckets set to private (not public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never used in client-side code
- [ ] Source maps disabled in production (`productionBrowserSourceMaps: false`)
- [ ] All secrets stored in hosting environment variables, not in code
- [ ] AI API keys stored server-side only (not `NEXT_PUBLIC_` prefixed)
- [ ] Middleware session check activated once Supabase is connected
