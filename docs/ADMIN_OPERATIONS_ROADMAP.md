# SwingVantage Admin & Operations Roadmap

_Last updated: June 2026_

---

## 📘 In Plain English (start here)

**What this page is:** The plan for the behind-the-scenes "running the business" tools — verifying that a coach is really a coach, handling people's requests to download or delete their data, double-checking AI quality, and answering support emails.

**What you actually need to know:**
- **Most of this is not built yet.** It's a roadmap for when you have real users — not a list of things broken today.
- A few useful nuggets for you right now: your support email is **support@swingvantage.com**; there's a ready-made "what to say" script for the most common questions (like *"I can't import my CSV"* or *"my diagnosis seems wrong"*); and the **Compliance Checklist** at the bottom lists the legal must-dos before you scale up.
- "GDPR" and "CCPA" are privacy laws (Europe and California) that give people the right to download or delete their data. This page sketches how SwingVantage would honor those requests.

**What to do next:** Nothing now. Revisit this when you start getting real users and support emails — then it becomes your operations playbook.

> The step-by-step workflows, table names, and admin-screen paths below are reference for a developer or an AI assistant building these tools. You don't need them to use SwingVantage.

---

## Admin Needs Overview

| Need | Priority | Status |
|---|---|---|
| Professional video verification workflow | High | Not yet built |
| User data export | High | Stub (encryption layer exists) |
| User data delete / GDPR | High | Not yet built |
| AI quality review system | Medium | Not yet built |
| Support workflow | Medium | Not yet built |
| Abuse/report system | Low | Not yet built |
| Billing management | Low | Pre-monetization |

---

## Professional Video Verification Workflow

Coaches and facilities applying for verified professional status need a manual review step to prevent misrepresentation.

### Step-by-Step Workflow

**Step 1 — Application**
- User submits form from `/settings/verify-professional`
- Fields: credential type (teaching pro, USPTA, PGA certified, etc.), issuing org, credential number, LinkedIn URL, optional video introduction
- Form stores to `professional_applications` table in Supabase with status `pending`

**Step 2 — Automated Pre-Screen**
- Check for complete fields
- Verify credential number format matches known patterns (e.g., USPTA formats)
- Flag suspicious applications (duplicate accounts, invalid URLs)
- Notify admin via email (Resend / SendGrid) that a new application is pending

**Step 3 — Admin Review**
- Admin accesses `/admin/professional-applications`
- Reviews credentials, LinkedIn profile, and intro video
- Options: Approve, Reject (with reason), Request More Info
- Approval triggers: badge added to user profile, coach features unlocked, confirmation email sent to applicant

**Step 4 — Ongoing Monitoring**
- Quarterly re-verification prompt for active professionals
- Report system allows users to flag misrepresented credentials
- Admin reviews flagged accounts within 48 hours

### Admin UI Needed
- `/admin/professional-applications` — list with filter by status
- `/admin/professional-applications/[id]` — detail view with approve/reject buttons
- `/admin/users/[id]` — manual credential override

---

## User Data Delete / Export Workflow

### Data Export (GDPR Art. 20 — Right to Portability)

**User-facing flow:**
1. User visits `/settings/data` → clicks "Export My Data"
2. System queues an export job (runs async — can take up to 10 minutes for large accounts)
3. Export generates a JSON file containing:
   - User profile
   - All sessions (with full shot data)
   - All diagnoses
   - All saved routines and drills
   - All AI Coach conversations
4. Email sent to user with a signed download URL (expires in 24 hours)
5. Download link resolves to Supabase Storage signed URL

**Implementation:**
- Supabase Edge Function: `export-user-data`
- Trigger: POST `/api/user/export`
- Output: AES-256 encrypted ZIP (key = user's email hash) + plain JSON option
- Log export events for compliance audit trail

### Account Delete (GDPR Art. 17 — Right to Erasure)

**User-facing flow:**
1. User visits `/settings/data` → clicks "Delete My Account"
2. Confirmation modal: "This will permanently delete all your data. This cannot be undone."
3. User must type their email address to confirm
4. Optional: user selects reason (improving our product)
5. System initiates deletion

**Deletion sequence (in order):**
1. Revoke all active sessions (Supabase Auth signOut + revoke tokens)
2. Delete all sessions, shots, diagnoses, routines from Supabase (cascade)
3. Delete all uploaded files from Supabase Storage (videos, images)
4. Delete AI Coach conversation history
5. Anonymize billing records (retain for tax purposes, strip PII)
6. Delete auth user from Supabase Auth
7. Log deletion event with timestamp and reason (retain log for 90 days, anonymized)
8. Send confirmation email to user's address (final email before deletion completes)

**Retention exceptions:**
- Billing records: retain anonymized records for 7 years (tax compliance)
- Abuse reports: retain flagged content metadata for 12 months (legal hold)
- Aggregate analytics events: already anonymized at collection — not deleted

---

## AI Quality Review System

### Purpose
Catch systematic AI errors before they erode user trust.

### Workflow

**Step 1 — Automated Sampling**
- 5% of all diagnoses are randomly selected for quality review
- Selection criteria: low confidence scores, user-flagged responses, new fault types

**Step 2 — AI Self-Evaluation**
- A secondary AI call reviews the primary diagnosis against the input data
- Checks: Is the fault consistent with the data? Is the confidence appropriate? Are the drills relevant?
- Flags potential false positives or misleading language

**Step 3 — Human Spot Check**
- Flagged diagnoses appear in `/admin/ai-quality-review`
- Admin (or contracted sport expert) reviews and rates: Accurate / Minor Issue / Major Issue
- Major issues trigger a review of all similar diagnoses from the same time window

**Step 4 — Feedback Loop**
- Major issues are documented as test cases in the diagnostic engine test suite
- Prompt improvements are made and validated before deployment
- Monthly AI quality report generated

### Quality Metrics Dashboard (in `/admin/ai-quality`)
- Accuracy rate by sport
- False positive rate by fault type
- User-reported accuracy rate (opt-in rating after viewing diagnosis)
- Confidence calibration charts

---

## Support Workflow

### Tiers

**Tier 0 — Self-Service**
- In-app help tooltips and contextual guidance
- FAQ pages at `/help` (to be created)
- Email auto-responder with common answers

**Tier 1 — Email Support**
- Inbox: support@swingvantage.com
- Target response time: 48 hours (free tier), 24 hours (Pro tier)
- Categories: billing, data issues, technical bugs, feature requests
- Use Linear or Notion for ticket tracking

**Tier 2 — Account Issues**
- Data recovery requests
- Billing disputes
- Professional credential issues
- Escalated to admin via internal ticket

### Common Support Scenarios

**"I can't import my CSV"**
1. Confirm brand/format (FlightScope, TrackMan, etc.)
2. Check for UTF-8 encoding issues
3. Provide column mapping guide
4. Offer manual entry as fallback

**"My diagnosis seems wrong"**
1. Ask user to share session data (optional)
2. Check if confidence was low (and whether warning was shown)
3. Log for AI quality review if systematic error suspected
4. Offer manual diagnosis walkthrough

**"I want to delete my account but need my data first"**
1. Walk user through export flow at `/settings/data`
2. Confirm export email received
3. Then guide through account deletion
4. Confirm deletion completed

**"I'm a coach and want to add my athletes"**
1. Explain team accounts are on the roadmap
2. Offer current workaround: athletes create individual accounts
3. Add to coach waitlist for team feature beta

---

## Compliance Checklist

- [ ] Privacy policy published at `/privacy`
- [ ] Terms of service published at `/terms`
- [ ] GDPR data export flow implemented
- [ ] GDPR account deletion flow implemented
- [ ] Cookie consent banner (if using GA4 or similar)
- [ ] CCPA opt-out (California users)
- [ ] Data processing agreement template for EU users
- [ ] Security incident response plan documented
- [ ] Annual security audit scheduled
