# Prompt 2 - Admin-Dashboard / PublishingOS Rebuild (BACK-END)  -  verbatim, session dc620d52 @ 2026-06-09 18:42

> Source of truth: extracted verbatim from the chat transcript. Do not paraphrase requirements away.

---

You are my senior full-stack architect, product systems designer, admin-dashboard architect, design-systems lead, DevOps strategist, security engineer, UX strategist, implementation lead, and QA owner.

You are working on SwingVantage.

Your mission is to audit, redesign, architect, and implement a premium admin-dashboard operating system that allows admin decisions to safely become live product changes through a controlled, secure, scalable publishing workflow.

This is not a cosmetic dashboard refresh. This is a full operating-layer upgrade.

The end result should feel like a serious SaaS command center: calm, powerful, intuitive, trustworthy, secure, and production-grade.

Use the following toolchain and workflow:

1. Claude Code
   - Audit the codebase.
   - Identify architecture constraints.
   - Implement the publishing system.
   - Refactor admin pages.
   - Build server actions/API routes.
   - Add schema validation.
   - Add tests.
   - Add documentation.
   - Preserve existing functionality unless clearly broken.
   - Execute incrementally and safely.

2. Google Stitch / stitch.withgoogle.com
   - Use Stitch as a rapid UI ideation and layout-generation tool for the admin dashboard experience.
   - Generate multiple high-fidelity visual directions for:
     - PublishingOS dashboard
     - Publish queue
     - Draft editor
     - Preview mode
     - Version history
     - Rollback flow
     - Publishable areas audit
     - Risk confirmation modal
     - Deployment status timeline
     - SEO publishing workflow
     - Sport configuration publishing workflow
   - Treat Stitch output as inspiration and rapid concept exploration, not the final source of truth.
   - Extract the strongest layout patterns, information hierarchy, visual rhythm, status treatments, and interaction patterns.
   - Do not blindly copy Stitch output into production without design-system normalization, accessibility review, and implementation QA.

3. Figma Paid
   - Treat Figma as the final design-system source of truth.
   - Create or update a professional admin-dashboard design system before implementation where appropriate.
   - Use Figma for:
     - Design tokens
     - Component variants
     - Responsive frames
     - Auto-layout structure
     - Interaction flows
     - Prototype states
     - Developer handoff annotations
     - Design QA references
     - Empty states
     - Error states
     - Confirmation states
     - Loading states
     - Permission states
     - Mobile/tablet/desktop behavior
   - If Figma MCP/API/file access is available, inspect and align with the existing Figma file.
   - If Figma access is not available, create a detailed Figma implementation specification that I can manually recreate or import into Figma.
   - The production UI must map cleanly from Figma concepts into shadcn/ui, Tailwind CSS, and the existing codebase conventions.

Primary problem:
The current admin dashboard appears to treat some production content as view-only because publishing edits a versioned data file that the production filesystem cannot write to. The current product message says something like:

“View-only here. Publishing edits a versioned data file, which the production filesystem can’t write. Run SwingVantage locally to publish, then commit & push — the page goes live on the next deploy.”

That is not acceptable for a premium admin experience.

I want the admin dashboard to become a true operating system where I can make decisions, approve changes, publish updates, roll back mistakes, and push live product behavior without manually running the project locally, editing files, committing, and pushing.

This publishing concept is not limited to update posts. It should apply to any admin-controlled change that reasonably belongs in the dashboard.

Core objective:
Design and implement a centralized admin publishing layer called PublishingOS.

PublishingOS should allow admin decisions to move through:

Draft → Review → Validated → Scheduled or Published → Live → Archived or Rolled Back

The system must be durable, secure, observable, validated, and production-safe.

Do not hack around the production filesystem. Assume the deployed environment may be read-only, stateless, or ephemeral. Build the correct durable architecture for the actual stack.

Before coding:
Perform a complete audit of the existing codebase and admin dashboard. Then create an implementation plan. Then execute.

Do not ask me broad questions unless blocked. Make expert assumptions based on the repository.

============================================================
PART 1 — CODEBASE AUDIT
============================================================

Audit the entire repository and produce a concise implementation plan before making large changes.

Inspect:

1. Admin dashboard structure
   - All admin pages
   - Admin layouts
   - Admin navigation
   - Admin components
   - Admin route groups
   - Admin API routes
   - Server actions
   - Admin-only utilities
   - Admin auth/permission logic
   - Admin data sources
   - Admin mock data
   - File-backed admin content
   - Hardcoded dashboard values
   - View-only controls
   - Local-only publishing behavior

2. Current publishing logic
   - Existing publishing buttons
   - Update forms
   - Developer update forms
   - Content editors
   - Versioned data files
   - Generated update pages
   - SEO page generation
   - Sitemap generation
   - Milestone generation
   - Admin save actions
   - Any current write operations
   - Any current file writes
   - Any current deployment assumptions

3. Public rendering model
   - Where public pages read content from
   - Whether public content comes from static files, database, config files, generated files, markdown, JSON, CMS-like utilities, or hardcoded arrays
   - Which public pages need to consume published admin-controlled content
   - Which pages should never show drafts or failed records

4. Data and persistence layer
   - Existing database
   - ORM
   - migrations
   - auth provider
   - environment variables
   - cache utilities
   - server actions
   - route handlers
   - deployment host assumptions
   - storage providers
   - GitHub/deployment integrations if present

5. Design system
   - shadcn/ui usage
   - Tailwind config
   - CSS variables
   - component library
   - layout primitives
   - dashboard card patterns
   - table patterns
   - badge patterns
   - modal patterns
   - form patterns
   - empty states
   - loading states
   - accessibility patterns
   - mobile responsiveness

6. Testing and quality
   - Unit test framework
   - Integration test setup
   - Playwright setup
   - Accessibility tooling
   - Lint/typecheck/build scripts
   - CI assumptions

Output an audit summary with:
- What exists
- What is broken
- What is view-only
- What is file-backed
- What is mock-backed
- What can become instant-publish
- What requires deploy-backed publishing
- What should remain static
- Recommended architecture
- Migration plan
- Risk assessment

============================================================
PART 2 — TOOLCHAIN DESIGN WORKFLOW
============================================================

Use this design workflow before final UI implementation.

A. Stitch ideation workflow

Create Stitch prompts for the following admin experiences:

1. PublishingOS Command Center
   Goal: A premium SaaS admin command center for managing live product publishing.
   Include:
   - Publish queue
   - Recently published
   - Failed publishes
   - Drafts
   - Scheduled publishes
   - Risk status cards
   - Deployment status timeline
   - Quick actions
   - Health indicators
   - Audit trail preview

2. Publishable Areas Audit
   Goal: A dashboard map showing every admin-controlled product area and its publishing readiness.
   Include:
   - Area name
   - Entity type
   - Current source
   - Live connection status
   - Publish mode
   - Risk level
   - Last published
   - Owner
   - Recommended next action
   - Filters for Live-connected, Draft-only, View-only, File-backed, Mock-backed, Needs integration, High-risk, Ready

3. Publish Detail Page
   Goal: A single item workflow for reviewing, validating, previewing, publishing, scheduling, or rolling back an item.
   Include:
   - Content summary
   - Before/after diff
   - Validation checklist
   - SEO preview
   - Affected routes
   - Risk explanation
   - Version history
   - Audit trail
   - Primary action
   - Confirmation state

4. SEO Publishing Flow
   Goal: Admin workflow for publishing SEO/AEO/GEO pages.
   Include:
   - Metadata editor
   - H1/title/meta preview
   - Canonical preview
   - schema JSON validation
   - internal link checklist
   - sitemap inclusion
   - index/noindex control
   - content quality score
   - duplicate/thin content warning
   - preview URL

5. Sport Configuration Publishing Flow
   Goal: Admin workflow for publishing sport-specific product configuration.
   Include:
   - Sport selector
   - Config editor
   - Before/after diff
   - Affected modules
   - Affected landing pages
   - Coaching configuration preview
   - Risk confirmation
   - Rollback target

6. Rollback Flow
   Goal: Safe rollback interface.
   Include:
   - Previous versions
   - Compare current vs selected
   - Impact summary
   - Confirmation modal
   - Rollback reason
   - Audit log entry
   - Revalidation status

Use Stitch to explore multiple visual directions:
- Premium dark command center
- Clean enterprise SaaS
- Sport-tech performance dashboard
- Calm editorial publishing suite

Select the best interaction ideas, not necessarily one full concept.

B. Figma design-system workflow

Create or update a Figma specification with:

1. Pages
   - 00 Cover / Product Intent
   - 01 Design Tokens
   - 02 Admin Components
   - 03 PublishingOS Screens
   - 04 Publishing Flows
   - 05 States & Edge Cases
   - 06 Responsive Behavior
   - 07 Developer Handoff
   - 08 QA Checklist

2. Tokens
   - Color tokens
   - Status color tokens
   - Risk-level tokens
   - Typography scale
   - Spacing scale
   - Radius scale
   - Shadow/elevation scale
   - Border tokens
   - Chart/status visualization tokens
   - Light/dark compatibility if existing system supports it

3. Components
   - Admin shell
   - Page header
   - Command card
   - Status badge
   - Risk badge
   - Publish mode badge
   - Validation checklist
   - Deployment timeline
   - Before/after diff block
   - Publish queue table
   - Draft card
   - Version history row
   - Audit log row
   - Empty state
   - Error state
   - Permission denied state
   - Confirmation modal
   - Rollback modal
   - SEO preview card
   - Sitemap/indexing card
   - Affected routes list
   - Entity type selector

4. Interaction states
   - idle
   - loading
   - validating
   - validation failed
   - ready to publish
   - publishing
   - queued
   - deploying
   - live
   - failed
   - rolled back
   - archived
   - unauthorized
   - stale version conflict

5. Design QA rules
   - Every screen must have one obvious primary action.
   - Every risky action must include context and confirmation.
   - Every failed state must explain what happened and what to do next.
   - Every empty state must educate and guide action.
   - Every table must be scannable.
   - Every status must be understandable without engineering knowledge.
   - Every admin action must feel reversible where possible.
   - The dashboard should feel like a command center, not a CMS dump.

C. Claude Code implementation mapping

After Stitch/Figma planning, implement using:
- Existing design system first
- shadcn/ui where available
- Tailwind CSS
- TypeScript
- Server components/server actions/route handlers if Next.js
- Existing auth/database/ORM conventions
- Zod or equivalent validation
- Existing test tools
- Existing deployment conventions

Do not implement a disconnected design. The UI must be wired to real publishing behavior or clearly documented local mocks only where secrets/integrations are missing.

============================================================
PART 3 — ARCHITECTURAL DECISION
============================================================

Choose the correct publishing architecture based on the codebase.

Evaluate three options:

1. Database-backed publishing
Use this for fast-changing product controls and content:
- Admin-editable content
- Dashboard settings
- Feature flags
- Theme controls
- Coaching configurations
- Sport configuration
- Homepage modules
- Navigation copy
- Trust/privacy copy
- Sample report content
- Onboarding copy
- Public announcements
- Drill libraries
- Milestone definitions
- Ad monetization controls
- Internal admin recommendations
- Public roadmap entries
- Changelog entries

Requirements:
- Durable database persistence
- Server-side write helpers
- Server-side read helpers for public published content
- Status transitions
- Versioning
- Rollback
- Audit logs
- Cache invalidation
- Published-only public reads
- indexes on entityType, slug, status, publishedAt, updatedAt

2. Git-backed publishing
Use this where repository-backed versioning is strategically valuable:
- Static SEO pages
- Generated SEO/AEO/GEO pages
- Documentation
- Major update reports
- Static structured content that should live in source control
- Generated route files if the current architecture requires them
- Sitemap/static route artifacts if unavoidable

Requirements:
- Secure GitHub API/GitHub App abstraction
- Never expose tokens client-side
- Create branch or PR
- Commit generated content
- Track commit SHA
- Track branch
- Track PR URL
- Track deployment status
- Show publish pipeline status in admin
- Support failure states
- Support rollback strategy
- Add environment variable docs

3. Hybrid publishing
Prefer this if the codebase benefits from both:
- Database for instant operational publishing
- Git/deploy-backed publishing for static/versioned SEO content

The likely target should be hybrid unless the codebase strongly indicates otherwise.

Create a document explaining:
- Chosen architecture
- Why it was chosen
- Which entity types use instant publish
- Which entity types use deploy-backed publish
- How admins experience the difference
- Limitations
- Future migration path

The admin should not need to understand engineering complexity. The UI should simply show:
- Instant publish
- Requires deploy
- Queued
- Deploying
- Live
- Failed
- Rollback available

============================================================
PART 4 — PUBLISHINGOS CORE REQUIREMENTS
============================================================

Create a centralized system called PublishingOS.

PublishingOS must support:
- Draft creation
- Editing
- Review state
- Preview
- Validation
- Scheduling
- Publishing
- Unpublishing
- Archiving
- Rollback
- Version history
- Audit trail
- Publish status tracking
- Error handling
- Admin permissions
- Confirmation modals for risky changes
- Production-safe persistence
- Deployment status awareness
- Cache invalidation
- Clear admin UI feedback

Core conceptual data model:

PublishableEntity:
- id
- entityType
- entityId
- title
- slug
- status: draft | review | scheduled | published | archived | failed | rolled_back
- publishMode: instant | deploy_backed | hybrid
- content
- config
- metadata
- seo
- createdBy
- updatedBy
- reviewedBy
- publishedBy
- createdAt
- updatedAt
- reviewedAt
- publishedAt
- scheduledFor
- version
- previousVersionId
- rollbackTargetId
- validationStatus
- validationErrors
- deploymentStatus
- deploymentId
- source
- destination
- riskLevel: low | medium | high | critical
- affectedRoutes
- affectedComponents
- cacheTags
- notes

PublishEvent:
- id
- publishableEntityId
- eventType
- actorId
- actorEmail
- fromStatus
- toStatus
- version
- message
- metadata
- createdAt

PublishValidationResult:
- id
- publishableEntityId
- version
- status
- errors
- warnings
- checks
- createdAt

PublishJob:
- id
- publishableEntityId
- jobType
- publishMode
- status
- startedAt
- completedAt
- failedAt
- branch
- commitSha
- pullRequestUrl
- deploymentUrl
- deploymentId
- deploymentStatus
- errorMessage
- retryCount
- metadata

Adapt the actual schema to the existing stack.

============================================================
PART 5 — PUBLISHABLE AREAS AUDIT
============================================================

Audit the admin dashboard and identify every area where PublishingOS should apply.

Include, but do not limit to:

- Public updates
- Developer updates
- Milestones
- SEO/AEO/GEO pages
- Sport-specific landing pages
- Homepage modules
- Navigation items
- Internal announcements
- Feature flags
- Experiments
- Theme controls
- Coaching style settings
- Drill libraries
- Educational content pages
- Sport vertical configuration
- Pricing controls
- Ad monetization controls
- Trust/privacy copy
- Sample report content
- Onboarding copy
- Admin recommendations
- Public roadmap
- Changelog
- Schema/metadata controls
- Sitemap inclusion controls
- Robots/indexing controls where appropriate
- User-facing dashboard modules
- Report templates
- Email/notification copy if present
- Any other admin decision that should influence live product behavior

Create a Publishable Areas Audit dashboard view with:

Columns:
- Area
- Entity Type
- Current Source
- Current Status
- Publish Mode
- Risk Level
- Live Connection
- Last Updated
- Last Published
- Owner/System
- Recommended Action

Status labels:
- Live-connected
- Draft-only
- View-only
- File-backed
- Mock-backed
- Hardcoded
- Needs integration
- High-risk
- Ready
- Deprecated
- Unknown

============================================================
PART 6 — RISK CLASSIFICATION
============================================================

Classify every publishable item:

Low-risk instant publish:
- Small copy changes
- Labels
- Internal announcements
- Non-critical modules
- Public update cards
- Minor UI content
- Basic changelog entries

Medium-risk publish:
- Sport configuration
- SEO metadata
- Generated pages
- Homepage sections
- Navigation changes
- Educational pages
- Drill library changes
- Public roadmap changes

High-risk publish:
- Routing
- Indexing controls
- Authentication-facing copy or behavior
- Pricing
- Monetization
- Feature gates
- Major SEO pages
- Sitemap/robots decisions
- Trust/privacy copy
- Data model changes
- Any change that could affect acquisition, revenue, legal risk, or platform access

Critical-risk publish:
- Auth logic
- Permission logic
- Billing logic
- Secrets
- Production deployment settings
- Security-sensitive configuration

Risk rules:
- Low-risk: simple confirmation
- Medium-risk: preview + affected routes/components
- High-risk: explicit confirmation + validation + rollback plan
- Critical-risk: block or require manual engineering review unless safe automation exists

============================================================
PART 7 — ADMIN UI REQUIREMENTS
============================================================

Create or improve the admin dashboard so PublishingOS feels like a real operating layer, not scattered buttons.

Add a central admin area. Use the best name based on existing product language:
- PublishingOS
- Publish Center
- Command Publish
- Admin Publishing Center

Recommended default: PublishingOS.

PublishingOS should include:

1. Overview
   - Publishing health
   - Items waiting for review
   - Drafts
   - Scheduled publishes
   - Failed publishes
   - Recently live
   - High-risk pending changes
   - Deployment-backed jobs in progress
   - Last successful publish
   - Last failed publish

2. Publish Queue
   - Items waiting to be reviewed, scheduled, or published
   - Filter by entity type
   - Filter by risk
   - Filter by publish mode
   - Filter by status
   - Primary action per row

3. Recently Published
   - Items that recently went live
   - Who published them
   - What changed
   - Affected routes
   - Rollback availability

4. Failed Publishes
   - Validation failures
   - API write failures
   - Git commit failures
   - Deploy failures
   - Cache revalidation failures
   - Clear next action for each failure

5. Drafts
   - In-progress admin decisions
   - Stale draft warnings
   - Resume editing action

6. Version History
   - Inspect previous versions
   - Compare versions
   - Restore/rollback where feasible

7. Publishable Areas Audit
   - Visual operating map of what the admin dashboard controls
   - Readiness labels
   - Recommendations for next integrations

8. Preview Mode
   - For pages: preview links
   - For configuration: before/after diff
   - For SEO: title, description, canonical, schema, indexing state, sitemap impact
   - For sport configuration: affected sport/product vertical
   - For updates: list-card preview and dedicated page preview

9. Publish Confirmation
   - Low-risk: simple confirmation
   - Medium-risk: affected pages/components
   - High-risk: explicit confirmation, validation output, rollback plan
   - Critical-risk: block unless manual engineering override is implemented securely

10. Rollback
   - One-click rollback to previous published version where feasible
   - Rollback preview
   - Rollback reason
   - Rollback logged as its own publish event

11. Status Messaging
   Replace the current “view-only here” dead-end message.

   Instead show intelligent messaging:
   - If instant publish is available: “Ready to publish.”
   - If deploy-backed publish is required: “This change requires a deploy-backed publish job.”
   - If credentials are missing: “Publishing integration is configured locally but missing production credentials.”
   - If validation fails: “This item cannot publish yet because…”
   - If public rendering is not connected: “This area is not live-connected yet. Create integration task.”
   - If file-backed: “This area is currently file-backed. PublishingOS can migrate it to database or deploy-backed publishing.”

   Provide appropriate action buttons:
   - Create Publish Job
   - Validate
   - Preview
   - Publish
   - Schedule
   - Open PR
   - Queue Deploy
   - Retry
   - Roll Back
   - Connect Live Source
   - Migrate to PublishingOS

============================================================
PART 8 — PUBLIC RENDERING REQUIREMENTS
============================================================

Update public pages/components so they consume published data from the new PublishingOS source.

Rules:
- Drafts must never appear publicly.
- Review items must never appear publicly.
- Failed items must never appear publicly.
- Archived items must not appear publicly unless explicitly requested in admin preview.
- Published items should appear reliably.
- Scheduled items should go live only when scheduledFor is reached.
- SEO pages should enter sitemap/indexing only when published and indexable.
- Unpublished content should not leak into public routes.
- Admin-only metadata must never leak into public pages.

If using Next.js:
- Use server components where appropriate.
- Use server actions or route handlers for writes.
- Use revalidatePath/revalidateTag/ISR where appropriate.
- Make cache invalidation precise.
- Do not globally revalidate unless necessary.
- Protect all write paths server-side.
- Never expose secrets to client bundles.

Create server-side read helpers:
- getPublishedEntity(entityType, slug)
- getPublishedEntities(entityType, filters)
- getPublishedSeoPage(slug)
- getPublishedUpdates()
- getPublishedMilestones()
- getPublishedSportConfig(sport)
- getPreviewEntityForAdmin(id, version)

Names may vary based on conventions.

============================================================
PART 9 — VALIDATION REQUIREMENTS
============================================================

Every publishable entity must run validation before going live.

Global validation:
- Required fields
- Slug uniqueness
- Route collision detection
- Required status transition validity
- Broken internal links where feasible
- Canonical URL sanity
- Schema JSON validity
- Sitemap eligibility
- Published date validity
- Sport/category validity
- Image/media path validity where feasible
- No obvious placeholder text
- No admin-only metadata leaking into public rendering
- Content length minimums for rank-intended pages
- Risk-level specific checks
- Permissions check
- Stale version conflict check

SEO/AEO/GEO validation:
- Title exists and is reasonable length
- Meta description exists and is reasonable length
- H1 exists
- Canonical exists and is sane
- Schema is valid JSON
- Internal links exist
- Sitemap inclusion is valid
- index/noindex decision is valid
- Content is not obviously thin
- Sport/category/topic taxonomy is valid
- URL slug does not collide
- Page has clear search intent
- Page has appropriate structured data where applicable

Update/developer-update validation:
- Update list card has title/date/summary/category
- Dedicated update page is generated or linked if strategy requires it
- List and page update together
- Metadata is generated
- Structured data is valid
- Sitemap updates when published
- No duplicate update slug

Milestone validation:
- Milestone definition exists
- Trigger logic exists if automatic
- Manual publish is supported
- Page content is not thin
- Duplicate milestone pages are avoided
- Domain-authority pages are meaningful, not spammy

Sport configuration validation:
- Sport is valid
- Required fields exist
- Affected pages/components are detected
- Before/after diff is available
- Coaching/drill settings are internally consistent

Feature flag validation:
- Flag key is unique
- Default value exists
- Rollout rule is valid
- Kill switch exists where appropriate
- High-risk flag changes require confirmation

============================================================
PART 10 — DEPLOYMENT-BACKED PUBLISHING
============================================================

If the selected architecture needs Git-backed or deploy-backed publishing, implement a publish job abstraction.

Publish job flow:
1. Admin creates or approves publish job.
2. System validates payload.
3. System determines destination.
4. System writes to durable queue/job record.
5. System writes file/content to correct Git destination if configured.
6. System creates branch, commit, and/or PR.
7. System tracks commit SHA.
8. System tracks branch.
9. System tracks PR URL if available.
10. System tracks deployment URL/status if available.
11. Dashboard displays each stage.
12. If deploy fails, dashboard shows error and rollback path.
13. If secrets are missing, system fails safely with configuration instructions.

Security:
- Never expose GitHub tokens client-side.
- Use secure environment variables.
- Prefer GitHub App workflow if already available or appropriate.
- Do not auto-merge high-risk changes unless explicitly safe.
- Add docs for all required env vars.

Possible environment variables:
- GITHUB_APP_ID
- GITHUB_APP_PRIVATE_KEY
- GITHUB_INSTALLATION_ID
- GITHUB_OWNER
- GITHUB_REPO
- GITHUB_DEFAULT_BRANCH
- GITHUB_PUBLISH_BRANCH_PREFIX
- VERCEL_TOKEN or deployment provider token if applicable
- VERCEL_PROJECT_ID if applicable
- VERCEL_TEAM_ID if applicable
- PUBLISHINGOS_WEBHOOK_SECRET
- PUBLISHINGOS_REVALIDATION_SECRET

Use actual variable names that fit the existing project.

============================================================
PART 11 — DATABASE-BACKED PUBLISHING
============================================================

If using a database:
- Add schema/migrations.
- Add read helpers for public published content.
- Add write helpers for admin actions.
- Add indexes for entityType, slug, status, publishedAt, updatedAt.
- Add versioning.
- Add rollback.
- Add audit logs.
- Add validation results.
- Add publish jobs if needed.
- Ensure public rendering uses only published content.
- Add cache invalidation after publish.
- Add seed data or migration from existing file-backed content where appropriate.

If there is existing file-backed content:
- Do not delete it immediately.
- Create migration/import utilities.
- Preserve old data.
- Create a safe fallback only if needed.
- Document the source-of-truth transition.

============================================================
PART 12 — SECURITY REQUIREMENTS
============================================================

Implement production-grade admin protection.

Requirements:
- Only authenticated admins can create, edit, publish, roll back, unpublish, schedule, or archive.
- All write operations validate permissions server-side.
- No admin API route trusts client-side role state alone.
- Payloads are validated with Zod or equivalent.
- No secrets are exposed in browser bundles.
- GitHub/deployment tokens are server-only.
- Add rate limiting or abuse protection where appropriate.
- Audit logs capture who changed what and when.
- Risky operations require confirmation.
- Preview links must not expose unpublished content publicly.
- Admin preview should require admin auth or secure preview tokens.
- Prevent stale write conflicts.
- Prevent route collision accidents.
- Prevent draft leakage.
- Prevent privilege escalation.
- Log unauthorized attempts.

============================================================
PART 13 — UX QUALITY BAR
============================================================

The dashboard must feel premium, calm, and decisive.

Design principles:
- Make the admin feel like a command center.
- Use clear status badges.
- Use before/after diffs.
- Use plain-English risk explanations.
- Use strong empty states.
- Use confirmation flows that reduce mistakes.
- Use one primary action per screen.
- Use shadcn/ui and Tailwind patterns already present.
- Match the existing design system.
- Desktop-first for admin productivity.
- Still responsive for tablet/mobile emergency edits.
- Avoid clutter.
- Avoid generic CMS feel.
- Avoid fake controls.
- Avoid disconnected buttons.
- Avoid ambiguous statuses.
- Avoid technical dead-end messages.

The UI should answer:
- What is waiting for me?
- What is safe to publish?
- What is risky?
- What failed?
- What went live?
- What changed?
- Who changed it?
- Can I preview it?
- Can I roll it back?
- What happens next?

============================================================
PART 14 — REQUIRED ADMIN FLOWS
============================================================

Flow 1: Publish update
- Admin drafts update.
- System validates update.
- System previews list card and dedicated page.
- Admin clicks publish.
- System writes to durable source.
- System revalidates affected routes.
- Update appears live.
- Audit log records event.

Flow 2: Publish developer update
- Admin drafts developer update.
- System validates technical metadata.
- System previews public card and dedicated report.
- Admin publishes.
- System updates list page, detail page, sitemap, metadata.
- Dashboard confirms live status.

Flow 3: Publish SEO page
- Admin creates or approves SEO/AEO/GEO page.
- System validates metadata, slug, schema, internal links, sitemap eligibility, indexability, and content quality.
- Admin previews page.
- Admin publishes.
- Page becomes publicly available and enters sitemap if indexable.

Flow 4: Publish sport configuration
- Admin edits golf/tennis/baseball/softball/etc. configuration.
- System shows before/after diff.
- System lists affected pages/modules.
- Admin confirms.
- Published configuration updates the live sport experience.

Flow 5: Publish homepage module
- Admin edits module copy/config/order.
- System validates required fields.
- System previews homepage impact.
- Admin publishes.
- Homepage revalidates precisely.

Flow 6: Publish milestone
- Admin creates/edits milestone definition.
- System validates trigger rules, page quality, slug, metadata, sitemap decision.
- Admin publishes manually or enables automatic trigger.
- Milestone appears only when criteria are met or manual publish is confirmed.

Flow 7: Rollback
- Admin opens version history.
- Admin selects previous version.
- System previews rollback diff.
- Admin confirms with reason.
- Rollback is published, revalidated, and logged.

Flow 8: Failed publish recovery
- Publish fails validation, API write, Git operation, deploy, or revalidation.
- Dashboard shows exact failure category.
- System recommends next action.
- Admin can retry, edit, archive, or roll back.

============================================================
PART 15 — TESTING REQUIREMENTS
============================================================

Add meaningful tests.

Include:
- Unit tests for validation logic
- Unit tests for status transitions
- Unit tests for risk classification
- Unit tests for published-only public reads
- Unit tests for slug/route collision detection where feasible
- Integration tests for admin publish action/API
- Integration tests for rollback
- Integration tests for scheduled publish where feasible
- Integration tests for cache revalidation where feasible
- Integration tests for unauthorized access blocking
- Playwright tests for:
  - creating a draft
  - previewing a change
  - publishing a low-risk item
  - blocking invalid publish
  - viewing published result
  - rolling back
  - viewing failed publish status
- Accessibility checks for new admin screens
- No test should require real production secrets
- Mock GitHub/deployment integrations in tests

Run:
- typecheck
- lint
- test
- build
- Playwright if configured

If a command fails because the repo lacks setup, document the limitation and create the missing structure if appropriate.

============================================================
PART 16 — OBSERVABILITY AND LOGGING
============================================================

Add practical logging around:
- publish attempts
- validation failures
- successful publishes
- failed writes
- deployment status updates
- rollback events
- scheduled publish execution
- unauthorized attempts
- cache revalidation failures
- Git/deploy-backed job failures

Logs should be useful without leaking secrets.

If the project has an observability system, integrate with it. Otherwise create a clean abstraction that can later connect to one.

============================================================
PART 17 — DOCUMENTATION
============================================================

Create or update documentation explaining:

1. PublishingOS architecture
2. Chosen publishing model
3. Which areas are publishable
4. Which areas are instant vs deploy-backed
5. Required environment variables
6. How to add a new publishable entity type
7. How validation works
8. How preview works
9. How rollback works
10. How sitemap/indexing is affected
11. How cache revalidation works
12. How Git/deploy-backed publishing works if used
13. Known limitations
14. Local development workflow
15. Production workflow
16. How Stitch was used for ideation
17. How Figma maps to implemented components
18. Design QA checklist
19. Security checklist
20. Testing checklist

Create a practical README or docs file such as:
- docs/publishing-os.md
- docs/admin-dashboard-design-system.md
- docs/publishing-os-entity-types.md

Use file names that match the project’s conventions.

============================================================
PART 18 — DELIVERABLES
============================================================

Deliver:

1. Complete admin dashboard audit
2. Implementation plan
3. PublishingOS architecture
4. PublishingOS data model
5. Publishing service/server actions/API routes
6. Admin Publish Center UI
7. Updated existing admin pages where appropriate
8. Public rendering changes to consume published data
9. Validation system
10. Version history
11. Rollback system
12. Cache/revalidation strategy
13. Security hardening
14. Tests
15. Documentation
16. Design-system mapping
17. Stitch prompt pack or Stitch workflow notes
18. Figma design specification or Figma handoff notes
19. Migration plan for file-backed content
20. Final summary of what changed and what remains

============================================================
PART 19 — EXECUTION RULES
============================================================

Follow these rules strictly:

- Preserve existing functionality unless clearly broken.
- Do not remove current pages or admin tools without replacing them.
- Do not introduce fake publishing that only changes local state.
- Do not rely on production filesystem writes.
- Do not expose secrets client-side.
- Do not create a scattered one-off solution only for updates.
- Build the reusable publishing foundation first.
- Then migrate the highest-value admin areas into it.
- Prefer incremental, safe changes over risky rewrites.
- Use existing project conventions wherever possible.
- If the codebase already has a database, auth system, ORM, CMS layer, or deployment integration, use it unless there is a strong reason not to.
- If credentials or production services are missing, build the abstraction, local mock, environment variable interface, and documentation so it can be connected cleanly.
- Do not leave dead-end admin messages.
- Do not let drafts leak publicly.
- Do not let failed publishes appear live.
- Do not overbuild speculative complexity before solving the current blocked publishing problem.
- Make the first implementation useful immediately.
- Keep code typed, validated, documented, and testable.

============================================================
PART 20 — PRIORITIZATION
============================================================

Phase 1: Make current blocked publishing actionable
- Audit current blocked publish path.
- Replace view-only dead-end with real PublishingOS action.
- Create durable publish record/job.
- Support validation and status tracking.
- Connect at least the current update/developer-update publish problem to the new system.

Phase 2: Generalize PublishingOS
- Add flexible entity model.
- Add publishable areas audit.
- Add admin Publish Center.
- Add instant vs deploy-backed separation.
- Migrate highest-value admin areas.

Phase 3: Add enterprise-grade controls
- Preview
- Versioning
- Rollback
- Audit logs
- Risk confirmations
- Validation depth
- Cache/revalidation precision
- Security hardening

Phase 4: Polish and scale
- Improve UX
- Apply Figma-aligned components
- Add tests
- Add docs
- Add observability
- Add migration utilities
- Improve responsive behavior
- Prepare for future SaaS scale

============================================================
PART 21 — FINAL RESPONSE FORMAT
============================================================

When finished, provide:

1. Audit summary
2. Architecture decision
3. What was implemented
4. Files changed
5. New admin workflows
6. Security improvements
7. Testing performed
8. Documentation added
9. Known limitations
10. Recommended next steps

Start now by auditing the codebase, then produce the implementation plan, then execute the highest-impact safe implementation. work in tandem with other agents, especially the agent working on the front end UI/UX. also make sure to provide a few variations just like the front end agent i can test and try them out before deciding on a final.