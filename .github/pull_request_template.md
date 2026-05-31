## Summary

<!-- Briefly describe the change and why it was made -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Security fix / hardening
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] Dependency update

## Security Checklist

Please check all items that apply before requesting review.

### Secrets & Environment Variables
- [ ] No secrets, API keys, or tokens are hardcoded in this PR
- [ ] No real credentials appear in test files, fixtures, or comments
- [ ] Any new environment variables are documented in `.env.example` with placeholder values only
- [ ] New server-side secrets do NOT use the `NEXT_PUBLIC_` prefix

### API Routes & Server-Side Code
- [ ] New API routes (`apps/web/src/app/api/`) validate and sanitize all inputs
- [ ] New API routes return appropriate HTTP status codes (401/403 for auth failures)
- [ ] Admin or privileged routes are protected by authentication middleware
- [ ] No sensitive data (keys, passwords, full user records) is returned in API responses unnecessarily
- [ ] No `console.log` statements left in production API route code

### Client-Side Code
- [ ] `dangerouslySetInnerHTML` is not used, or if it is, the value is explicitly sanitized and a comment explains why it is safe
- [ ] `eval()` is not used
- [ ] User-supplied data is never injected directly into the DOM without sanitization

### Dependencies
- [ ] Any new `npm` packages have been reviewed for known vulnerabilities (`npm audit`)
- [ ] No packages with GPL or other restrictive licenses have been added without review

### Auth & Data Access
- [ ] Changes to Supabase queries use Row Level Security (RLS) and do not bypass it
- [ ] The `SUPABASE_SERVICE_ROLE_KEY` is only used in trusted server-side contexts

### General
- [ ] This change does not weaken existing security controls
- [ ] Relevant documentation or comments have been updated

## Testing

<!-- Describe how you tested this change -->

## Screenshots (if applicable)
