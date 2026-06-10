# Prompt 3 - Theme Lab + UI/UX Intelligence OS (BOTH)  -  verbatim, session 048cf68c @ 2026-06-09 19:46

> Source of truth: extracted verbatim from the chat transcript. Do not paraphrase requirements away.

---

Cookie banner fix goes now. And then: Below is a master Claude Code prompt you can paste directly.

⸻

Claude Code Expert Prompt: Build Theme Lab + UI/UX Intelligence OS

You are an elite senior full-stack architect, product designer, UX systems lead, growth engineer, design systems engineer, experimentation architect, and SaaS platform strategist.

Your task is to audit, design, and implement a robust Theme Lab + UI/UX Intelligence OS inside this application.

This system should allow an admin to design, preview, test, learn from, and publish UI/UX themes and interface strategies from a centralized Lab environment.

The goal is not just to add a theme picker. The goal is to create a scalable internal operating system for visual experimentation, user preference learning, seasonal theme launches, controlled rollouts, and long-term UI/UX optimization.

⸻

Product Context

This application is a premium multi-sport swing improvement platform. It serves golfers, tennis players, baseball players, softball players, pickleball players, padel players, coaches, parents, teams, and recreational athletes.

The product needs to feel:

* Premium
* Polished
* Trustworthy
* Mobile-first
* Sport-specific
* Commercially credible
* Easy to navigate
* Fun when appropriate
* Serious when appropriate
* Scalable across future sports, features, pages, and user segments

Each sport or theme should feel like a distinct branded experience while still belonging to the same parent platform.

⸻

Core Idea

Create a system where I can:

1. Enter a Lab environment.
2. Choose what UI/UX ideas, themes, components, layouts, colors, typography, motion, page treatments, or experience variants I want to test.
3. Preview them across major user journeys.
4. Save them as drafts.
5. Publish them from the Lab.
6. Push themes or UI/UX variants to:
    * Myself only
    * Internal admins
    * Specific users
    * Specific user segments
    * A percentage of users
    * Specific sports
    * Specific pages
    * All users
7. Learn from user behavior and preferences over time.
8. Use those learned preferences to recommend future UI/UX changes.
9. Launch seasonal, promotional, experimental, or premium themes, such as:
    * Christmas theme
    * Halloween theme
    * Tournament theme
    * Golf major championship theme
    * Summer training theme
    * Coach mode theme
    * Youth athlete theme
    * Performance lab theme
10. Roll back safely if anything harms usability, conversion, trust, accessibility, performance, or user satisfaction.

⸻

Primary Build Objective

Build a complete Theme Lab + UI/UX OS that functions as an internal admin-controlled experimentation, theming, and personalization engine.

This should include:

* Theme creation
* Theme editing
* Theme preview
* Theme publishing
* Targeted rollouts
* User-level theme assignment
* Segment-level theme assignment
* Global theme publishing
* Seasonal theme scheduling
* Theme analytics
* UI/UX preference learning
* Admin recommendations
* Safe rollback
* Version history
* Accessibility checks
* Performance checks
* Conversion impact tracking
* User-facing theme selection where appropriate

⸻

Important Strategic Principle

Do not build this as a one-off Christmas theme feature.

Build this as a long-term UI/UX operating system that allows future themes, future design strategies, future interface experiments, and future personalization logic to be created, tested, deployed, measured, and improved.

The Christmas theme should simply be one example of what the system can support.

⸻

Phase 1: Audit Existing System

Before implementing anything, audit the current codebase and identify:

1. Current theme system
2. Current design tokens
3. Tailwind configuration
4. CSS variables
5. Component library structure
6. Layout system
7. Admin dashboard structure
8. User settings or preference storage
9. Authentication and user roles
10. Existing analytics
11. Existing feature flag logic, if any
12. Existing database schema
13. Any existing theme picker
14. Any existing preview/staging functionality
15. Any existing sport-specific styling logic
16. Any existing personalization logic
17. Any places where theme logic is hardcoded
18. Any places where color, spacing, typography, border radius, shadows, or animation are duplicated instead of tokenized

After the audit, produce a concise implementation plan before coding.

⸻

Phase 2: Create the Theme Lab Architecture

Implement a scalable architecture with the following conceptual modules:

1. Theme Registry

Create a centralized theme registry that defines every available theme.

Each theme should support:

* Theme ID
* Theme name
* Theme description
* Theme category
* Status
* Version
* Author/admin
* Created date
* Updated date
* Published date
* Active/inactive status
* Visibility rules
* Rollout rules
* Sport compatibility
* Page compatibility
* Seasonal availability
* Accessibility score
* Performance score
* Conversion impact data
* User satisfaction data
* Rollback version
* Preview URL or preview mode

Theme categories should include:

* Core
* Sport-specific
* Seasonal
* Experimental
* Premium
* Coach-focused
* Youth/family
* Performance-focused
* Admin-only
* Archived

Theme statuses should include:

* Draft
* In Review
* Approved
* Scheduled
* Published
* Paused
* Archived
* Rolled Back

⸻

2. Design Token System

Create or improve a tokenized theme system.

Each theme should be powered by design tokens, not hardcoded styles.

Token categories should include:

* Colors
* Backgrounds
* Surfaces
* Text colors
* Border colors
* Accent colors
* Gradients
* Shadows
* Border radius
* Spacing scale
* Typography scale
* Font pairings if supported
* Button styling
* Card styling
* Form styling
* Navigation styling
* Badge styling
* Report styling
* Sport-specific accent styling
* Motion and animation preferences
* Density/compactness
* Elevation
* Success/warning/error states
* Trust/safety visual treatment

Create a clean structure that allows new themes to be added without rewriting components.

Avoid scattered CSS overrides. Prefer centralized tokens and predictable inheritance.

⸻

3. Theme Lab Admin Interface

Create a new admin area called:

Theme Lab

This should be a premium internal control center.

The Theme Lab should include:

Main Dashboard

Show:

* Active global theme
* Active experiments
* Scheduled themes
* Recently edited themes
* Theme performance overview
* User theme adoption
* Conversion impact
* Accessibility warnings
* Performance warnings
* Recommended UI/UX opportunities
* Rollback controls

Theme Library

Show all themes with filters:

* Draft
* Published
* Scheduled
* Experimental
* Seasonal
* Sport-specific
* Archived

Each theme card should show:

* Preview thumbnail
* Theme name
* Status
* Version
* Target audience
* Current rollout percentage
* Performance score
* Accessibility score
* Conversion trend
* Last edited date
* Publish controls

Theme Builder

Allow an admin to create or edit a theme.

The builder should support:

* Theme name
* Description
* Category
* Token editing
* Color palette
* Background style
* Card style
* Button style
* Navigation style
* Typography style
* Sport-specific accents
* Motion level
* Density level
* Hero treatment
* Report page treatment
* Dashboard treatment
* Upload flow treatment
* Seasonal decorative elements
* Custom CSS only if safely sandboxed or validated

Do not let unsafe or broken styling corrupt the application.

Preview Mode

Allow the admin to preview a theme across critical pages:

* Homepage
* Sport landing page
* Upload flow
* Sample report
* User dashboard
* Coach dashboard if applicable
* Admin dashboard
* Pricing or monetization page if applicable
* Updates page
* Trust/privacy page
* Mobile layout
* Tablet layout
* Desktop layout

Preview should not publish the theme.

Preview should support shareable internal preview links if feasible.

Publishing Center

Allow publishing to:

* Admin only
* Specific user
* Specific list of users
* Beta group
* Specific sport users
* Returning users
* New users
* Users who selected a specific preference
* Percentage rollout
* Everyone

Publishing controls should support:

* Publish now
* Schedule publish date
* Schedule expiration date
* Seasonal activation window
* Rollout percentage
* Gradual rollout
* Kill switch
* Automatic rollback conditions
* Manual rollback

Example:

“Publish Christmas Performance Theme to all users from December 1 to December 31, then automatically return users to their previous theme.”

⸻

Phase 3: User-Facing Theme Selection

Add or improve a user-facing theme selection experience.

Users should be able to choose from themes made available to them.

User-facing theme options should respect admin visibility rules.

For example:

* Standard
* Dark Performance
* Coach Mode
* Heritage Club
* Field & Court
* Arcade Practice
* Malbon Bird Print
* Christmas Swing Lab

The user-facing theme selector should be intuitive, polished, and optional.

Each theme should include:

* Preview thumbnail
* Theme name
* Short description
* Best for label
* Sport compatibility
* Accessibility note if relevant

Examples:

* Standard — Best for clean everyday use
* Dark Performance — Best for focused training
* Coach Mode — Best for instruction and analysis
* Field & Court — Best for multi-sport athletes
* Christmas Swing Lab — Limited-time holiday theme

Add a setting that allows users to either:

* Lock their selected theme
* Allow seasonal themes
* Allow recommended themes
* Return to default

Respect user preference wherever possible unless an admin explicitly forces a theme for testing or platform-wide operation.

⸻

Phase 4: UI/UX Preference Learning System

Create a privacy-conscious learning system that helps the product improve over time based on user behavior.

The system should learn from aggregated and user-level signals where appropriate.

Track signals such as:

* Theme selected by user
* Theme switched away from
* Time spent using theme
* Upload completion rate
* Report view completion
* CTA click-through rate
* Return visits
* Bounce or exit behavior
* Sport selected
* Device type
* Dark/light preference
* Accessibility preference
* Motion reduction preference
* User engagement by theme
* User satisfaction feedback
* Conversion behavior
* Navigation behavior
* Feature discovery behavior

Do not create creepy personalization. Do not expose sensitive user profiling. Use privacy-safe, product-relevant preference learning.

Create a preference model that can answer:

* Which themes perform best overall?
* Which themes perform best by sport?
* Which themes perform best for new users?
* Which themes perform best for returning users?
* Which themes improve upload completion?
* Which themes improve report engagement?
* Which themes reduce confusion?
* Which themes create higher retention?
* Which themes users actively choose?
* Which themes users abandon?
* Which design patterns work best?

Create an admin-facing recommendation system that says things like:

* “Dark Performance is improving report completion among golf users.”
* “Arcade Practice has strong engagement among younger recreational users but lower trust scores on privacy pages.”
* “Coach Mode increases time on report pages but lowers upload-start conversion on mobile.”
* “Christmas Swing Lab is performing well with returning users but should not be shown on trust-heavy pages.”
* “Users who choose Field & Court tend to explore multiple sports.”

⸻

Phase 5: Segmentation and Targeting

Implement targeting rules for publishing and experiments.

Segments should support:

* All users
* Logged-out visitors
* Logged-in users
* New users
* Returning users
* Beta testers
* Admins
* Specific users
* Specific emails or user IDs
* Sport interest
* Sport path
* Device type
* Theme preference
* Language/locale if available
* Geography only if already available and privacy-safe
* Traffic source if analytics already supports it
* Random percentage bucket
* Manually defined cohort

Create clean logic so admins can define who sees each theme.

Avoid brittle hardcoding.

⸻

Phase 6: Experimentation and Rollout Logic

Build or integrate feature-flag-style rollout logic.

A theme should be able to be assigned through the following hierarchy:

1. Forced admin override
2. Specific user assignment
3. Active experiment assignment
4. User-selected theme
5. Segment-based default
6. Seasonal default
7. Global default
8. System fallback

Make sure the hierarchy is documented in code.

Create deterministic bucketing for percentage rollouts so users do not randomly change themes on every visit.

Support A/B testing between themes.

Example experiments:

* Standard vs Dark Performance
* Coach Mode vs Heritage Club
* Christmas Theme vs Standard for returning users
* Sport-specific landing-page treatment vs generic treatment

Each experiment should track:

* Experiment ID
* Theme variants
* Target segment
* Start date
* End date
* Rollout percentage
* Primary metric
* Secondary metrics
* Status
* Winner
* Notes
* Rollback decision

⸻

Phase 7: Seasonal Theme System

Add support for scheduled seasonal themes.

Examples:

* Christmas theme
* Halloween theme
* New Year training theme
* Summer grind theme
* Tournament week theme
* Major championship golf theme
* Opening day baseball theme
* Back-to-school athlete theme

Seasonal themes should support:

* Start date
* End date
* Optional automatic activation
* Optional automatic deactivation
* Optional user opt-in
* Optional admin force
* Region or locale if supported
* Return-to-previous-theme behavior
* Decorative intensity level:
    * Subtle
    * Balanced
    * Full festive

The Christmas theme example should be implemented as a sample seasonal theme if feasible.

It should feel premium, not childish.

Possible direction:

* Deep winter navy
* Warm gold accents
* Subtle snow/glow effects
* Premium holiday cards
* Festive but clean CTA states
* Sport icons with subtle holiday accents
* No distracting animations during upload/report flows
* Respect reduced-motion settings

⸻

Phase 8: Safety, Quality, and Governance

This system must be safe to operate.

Add safeguards:

* Theme validation before publish
* Contrast/accessibility checks
* Mobile preview required before publishing
* Broken token fallback
* Rollback button
* Publish confirmation
* Audit log
* Version history
* Role-based permissions
* Draft/published separation
* Preview/published separation
* Automatic fallback to standard theme if a theme fails
* Error monitoring hooks where applicable
* No unsafe arbitrary CSS unless validated

Audit log should capture:

* Who created a theme
* Who edited a theme
* Who published a theme
* Who rolled back a theme
* What changed
* When it changed
* Which users or segments were targeted

⸻

Phase 9: Data Model

Design the database schema or storage model needed.

Suggested entities:

Theme

Fields:

* id
* name
* slug
* description
* category
* status
* version
* token_json
* preview_image
* created_by
* updated_by
* created_at
* updated_at
* published_at
* archived_at
* accessibility_score
* performance_score
* notes

ThemeVersion

Fields:

* id
* theme_id
* version_number
* token_json
* change_summary
* created_by
* created_at

ThemeAssignment

Fields:

* id
* theme_id
* assignment_type
* target_user_id
* target_segment_id
* rollout_percentage
* starts_at
* ends_at
* priority
* is_forced
* created_by
* created_at

UserThemePreference

Fields:

* id
* user_id
* selected_theme_id
* allows_seasonal_themes
* allows_recommended_themes
* reduced_motion
* last_changed_at

ThemeExperiment

Fields:

* id
* name
* description
* status
* target_segment
* variants
* primary_metric
* secondary_metrics
* rollout_percentage
* starts_at
* ends_at
* winner_theme_id
* notes

ThemeAnalyticsEvent

Fields:

* id
* user_id nullable
* anonymous_id nullable
* theme_id
* event_type
* page_path
* sport_context
* device_type
* metadata_json
* created_at

ThemeAuditLog

Fields:

* id
* actor_user_id
* action
* theme_id
* previous_value_json
* new_value_json
* created_at

Adjust the schema to fit the existing stack and database conventions.

⸻

Phase 10: Admin Recommendation Engine

Create a first version of an admin recommendation engine.

It does not need to be overly complex at first, but it should be designed to scale.

The system should generate recommendations such as:

* Keep
* Improve
* Pause
* Roll back
* Expand rollout
* Reduce rollout
* Make available to users
* Retire theme
* Test against another theme

Recommendation inputs should include:

* Engagement
* Upload completion
* Report completion
* CTA conversion
* Theme adoption
* Theme abandonment
* Device performance
* Accessibility score
* User feedback
* Error rate
* Page speed impact

Recommendation examples:

* “Expand Dark Performance from 20% to 50% for returning golf users because report completion improved.”
* “Pause Arcade Practice on the upload flow because mobile completion decreased.”
* “Make Christmas Swing Lab opt-in instead of forced because seasonal engagement is high but some users switched away.”
* “Promote Coach Mode to coaches and team accounts because dashboard engagement improved.”

⸻

Phase 11: Component and Page Requirements

The Theme Lab should include these core components:

* ThemeLabDashboard
* ThemeLibrary
* ThemeCard
* ThemeBuilder
* ThemeTokenEditor
* ThemePreviewPanel
* ThemePreviewDeviceFrame
* ThemePublishModal
* ThemeRolloutControls
* ThemeScheduleControls
* ThemeTargetingRules
* ThemeExperimentBuilder
* ThemeAnalyticsPanel
* ThemeRecommendationPanel
* ThemeAuditLogTable
* UserThemeSelector
* SeasonalThemeBanner
* ThemeFallbackBoundary

Use reusable components, not one-off pages.

⸻

Phase 12: Critical UX Requirements

The Lab should feel like a premium internal product, not a basic settings page.

Design principles:

* Clear publishing hierarchy
* Strong visual previews
* Confidence before publishing
* Obvious draft vs live state
* Low-risk experimentation
* Easy rollback
* Executive-level clarity
* No clutter
* No accidental global publishing
* Strong mobile preview
* Theme cards that feel polished
* Helpful empty states
* Clear warnings when a theme has accessibility or performance risks

Publishing should require confirmation when targeting all users.

For example:

“You are about to publish Christmas Swing Lab to all users from December 1 to December 31. Current user-selected themes will be temporarily overridden only if seasonal themes are allowed. Continue?”

⸻

Phase 13: Theme Resolution Logic

Implement a reliable function or service similar to:

resolveThemeForUser({
  user,
  anonymousId,
  currentPath,
  sportContext,
  deviceContext,
  now
})

It should return:

{
  themeId,
  themeTokens,
  source,
  assignmentId,
  experimentId,
  isForced,
  expiresAt,
  fallbackThemeId
}

The source should indicate whether the theme came from:

* Admin override
* Specific user assignment
* Experiment
* User preference
* Seasonal theme
* Segment default
* Global default
* Fallback

This function should be tested thoroughly.

⸻

Phase 14: Analytics Events

Track key events:

* theme_viewed
* theme_selected
* theme_previewed
* theme_published
* theme_scheduled
* theme_rolled_back
* theme_assignment_created
* theme_experiment_started
* theme_experiment_completed
* theme_switched_away
* seasonal_theme_accepted
* seasonal_theme_declined
* upload_started
* upload_completed
* report_viewed
* report_completed
* cta_clicked
* navigation_completed
* theme_error_triggered

Use existing analytics infrastructure if available. If not available, create a lightweight internal analytics model that can later integrate with tools like PostHog, GA4, or Microsoft Clarity.

⸻

Phase 15: Accessibility and Performance

Every theme should be checked for:

* Color contrast
* Reduced motion support
* Keyboard navigation visibility
* Focus states
* Text readability
* Mobile usability
* Tap target sizing
* Loading performance
* Layout stability
* Overly distracting animation
* Upload flow clarity
* Report readability

A theme should not be published globally if it fails critical accessibility requirements unless an admin explicitly marks it as experimental and limits the rollout.

⸻

Phase 16: Testing Requirements

Add tests for:

* Theme resolution hierarchy
* User theme preference
* Seasonal theme activation
* Seasonal theme expiration
* Percentage rollout consistency
* Specific user targeting
* Segment targeting
* Admin publishing
* Rollback behavior
* Fallback theme behavior
* Preview mode isolation
* Theme token validation
* Accessibility validation where feasible

Add Playwright tests for:

* Admin creates a draft theme
* Admin previews a theme
* Admin publishes to self only
* Admin publishes to a percentage of users
* Admin schedules a seasonal theme
* User selects an available theme
* User opts out of seasonal themes
* Rollback restores previous theme

Add component tests where appropriate.

⸻

Phase 17: Implementation Rules

Follow these rules:

1. Preserve existing functionality.
2. Do not break current themes.
3. Do not hardcode new theme logic across random components.
4. Centralize theme resolution.
5. Centralize theme tokens.
6. Make the system extensible.
7. Make the admin controls safe.
8. Make publishing reversible.
9. Make user preference respected where possible.
10. Build the system for future scale.
11. Use clear naming.
12. Document the architecture.
13. Add comments only where they clarify non-obvious logic.
14. Avoid overengineering, but design the foundation correctly.
15. If the existing app lacks required infrastructure, create the simplest robust version that can scale later.

⸻

Phase 18: Deliverables

When finished, provide:

1. Summary of what was audited
2. Summary of what was built
3. Files changed
4. New components created
5. New database models or migrations
6. New admin routes
7. New user-facing routes/settings
8. Theme resolution hierarchy
9. Publishing workflow
10. Rollback workflow
11. Testing performed
12. Known limitations
13. Recommended next improvements

⸻

Phase 19: First Sample Themes to Include

Where feasible, include sample theme configurations for:

Standard

The default clean, trusted, premium theme.

Dark Performance

A focused dark-mode training theme.

Coach Mode

A clear, instructional, analysis-heavy theme.

Heritage Club

A premium traditional golf/club-inspired visual style.

Field & Court

A multi-sport theme for baseball, softball, tennis, pickleball, and padel.

Arcade Practice

A more energetic, fun practice theme.

Christmas Swing Lab

A premium seasonal holiday theme.

Christmas Swing Lab should be scheduled-ready, opt-in capable, and suitable for targeted rollout.

⸻

Final Instruction

Think deeply before coding.

First audit the current system. Then propose the architecture. Then implement in clean phases.

The finished result should feel like the foundation of a true UI/UX OS: a system where the product can continuously learn, evolve, test, and publish better user experiences over time without requiring every design change to be manually hardcoded.