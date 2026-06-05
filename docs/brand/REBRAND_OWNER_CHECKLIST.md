# SwingVantage — Rebrand Owner Checklist

## In Plain English (start here)

The codebase is now fully **SwingVantage**. But a brand also lives in places code can't
reach — your domain, email, analytics accounts, social handles, and printed materials. This
is your tick-list for those. Nothing here is automatic; each item is something **you** do in
an external dashboard or account. None of it blocks the app from running locally or on the
current deployment.

> **Legal review recommended before a major public launch.** Where this list touches legal
> or trademark matters, get a qualified attorney — that's the one place not to skimp.

---

## 1. Domain & email (do first)

- [ ] Confirm you control **swingvantage.com** (registrar access).
- [ ] Point DNS at your host (Vercel) and add the domain to the project.
- [ ] Set up **email forwarding** for the public role addresses so mail actually reaches you:
  - `support@swingvantage.com`
  - `privacy@swingvantage.com`
  - `security@swingvantage.com`
  - Use your domain host's email routing — e.g. **Cloudflare Email Routing** (free) or
    **ImprovMX** — and forward all three to the private inbox you actually monitor.
  - **The private destination address is intentionally not written down in this repo.** Enter
    it directly in the email-host dashboard so it never ends up in source control or on the
    public site.
- [ ] (Optional) Set the **email sender name** to "SwingVantage" when you wire up
  transactional email.

## 2. Hosting / deploy

- [ ] Rename the Vercel project to `swingvantage` (cosmetic; the current
  `swingiq-web-*.vercel.app` URL keeps working until you switch the primary domain).
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://swingvantage.com` in the production environment.
- [ ] If you previously published anything on `swingiq.app`, add a 301 redirect to the
  matching `swingvantage.com` path.

## 3. Search & analytics

- [ ] Add **swingvantage.com** to **Google Search Console** and submit `/sitemap.xml`
  (set `NEXT_PUBLIC_GSC_VERIFICATION` to the token, see `apps/web/src/app/layout.tsx`).
- [ ] Add the site to **Bing Webmaster Tools**.
- [ ] Update the **Plausible/analytics** domain to `swingvantage.com`
  (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, see `apps/web/.env.example`).
- [ ] Rename any analytics property/dashboard label to "SwingVantage". (Event *names* in
  code were intentionally left unchanged to preserve historical continuity — see the rebrand
  report.)

## 4. Social & profiles

- [ ] Check availability and claim handles: **@swingvantage** (X/Twitter, Instagram, TikTok,
  YouTube). When claimed, add them to `apps/web/src/config/site.ts` → `siteConfig.social`
  (empty handles are omitted from metadata, so leave blank until real).
- [ ] Update bios on LinkedIn company page / Product Hunt to "SwingVantage".

## 5. Payments (when you turn on billing)

- [ ] Rename the product/brand in your payment processor (e.g. Stripe) to "SwingVantage".

## 6. Print & offline collateral

Update to SwingVantage + the **SV** mark + swingvantage.com before printing:

- [ ] Business cards, one-pagers, pitch/investor decks
- [ ] QR-code landing cards (point at swingvantage.com)
- [ ] Coach / parent handouts, team onboarding sheets
- [ ] Range / academy / event signage and banners, stickers, apparel
- [ ] Coach-referral cards, sponsorship/sales packets

## 7. Legal & trademark

- [ ] Run a **trademark clearance** check on "SwingVantage" with a qualified attorney before
  major public launch.
- [ ] Have legal/privacy pages reviewed (the brand name was swapped in-place; no legal claims
  were changed — see `docs/SECURITY_AND_PRIVACY.md`, `docs/privacy-and-youth-safety-notes.md`).

---

## Things the codebase intentionally kept as "swingiq" (don't try to change these)

These are internal identifiers, not the brand. Changing them would break existing users or
infrastructure (full rationale in `docs/REBRAND_SWINGVANTAGE_REPORT.md`):

- The local-storage key `swingiq-store` and other persisted keys (changing them wipes saved
  progress for existing users).
- The npm workspace scope `@swingiq/*` and package names (internal build wiring).
- The backup file format (`swingiq-backup-v1`, `.swingiqbackup`, the `swingiq_encrypted`
  marker) — needed so existing exported backups still restore and decrypt.
- The on-disk repo folder name `swingiq`.

_See also: [BRAND_GUIDE.md](BRAND_GUIDE.md)._
