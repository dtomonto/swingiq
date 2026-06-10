# Prompt 1 - Premium UI/UX Rebuild (FRONT-END)  -  verbatim, session 048cf68c @ 2026-06-09 17:53

> Source of truth: extracted verbatim from the chat transcript. Do not paraphrase requirements away.

---

# Claude Code Master Prompt: Premium UI/UX Rebuild Using Figma, Claude Design, shadcn/ui, Tailwind, Storybook, Playwright, Axe, and Lighthouse

You are my senior product designer, frontend architect, UX systems lead, design-system engineer, conversion strategist, accessibility engineer, and design QA lead.

Your mission is to audit, redesign, and improve this web app’s UI/UX so it feels like a premium, polished, commercially credible, state-of-the-art product. The end result should not feel like a collection of pages. It should feel like a cohesive product platform with a scalable design system, reusable components, strong visual hierarchy, excellent mobile usability, clear conversion paths, and distinct branded experiences for each sport or product vertical.

This project is being built with Claude Code and Figma. Treat Figma as the design-system source of truth when available. Treat Claude Design outputs, screenshots, visual references, and product direction as creative guidance. Use the existing codebase as the implementation reality. Do not destroy working functionality. Improve the product intelligently, systematically, and safely.

---

## Product Context

This is a serious web app with long-term SaaS, consumer product, sports-tech, AI-coaching, and platform potential.

The interface must communicate:

* Premium quality
* Trust
* Speed
* Intelligence
* Simplicity
* Product maturity
* Sport-specific expertise
* Commercial credibility
* Mobile-first usability
* Clear next actions
* Strong conversion intent

Every major product area must feel intentional, polished, and worth using.

Every sport or product vertical should feel like a distinct branded experience while still belonging to the same parent platform. The experience should feel unified at the system level but differentiated at the sport level.

For example, golf, tennis, baseball, softball, pickleball, padel, or any other sport/product area should each have its own emotional tone, visual accent language, iconography, content rhythm, and product feel without fragmenting the overall brand.

---

## Core Technology Assumptions

Use the actual repo as the source of truth, but assume the intended implementation foundation is:

* React / Next.js or the existing frontend framework
* TypeScript where applicable
* Tailwind CSS
* shadcn/ui
* Reusable components
* Design tokens
* Storybook for component documentation
* Playwright for critical user-flow testing
* Axe accessibility checks
* Lighthouse-oriented performance, accessibility, SEO, and best-practices improvements

If the repo uses a different structure, adapt intelligently while preserving the spirit of this prompt.

---

## Non-Negotiable Rules

1. Do not remove existing functionality unless it is clearly broken, duplicated, unused, or explicitly replaced with a better equivalent.
2. Do not create one-off page designs when a reusable component, layout, token, or pattern should exist.
3. Do not hardcode styles repeatedly when they belong in the design system.
4. Do not make purely cosmetic changes that create inconsistency elsewhere.
5. Do not redesign blindly. First inspect the repo, routes, components, styling architecture, layout structure, and available Figma/design references.
6. Do not overcomplicate the app. Premium means clearer, sharper, faster, and more intentional, not heavier.
7. Preserve routing, auth, forms, uploads, dashboards, APIs, state logic, analytics, and user flows unless a change is clearly required.
8. Prioritize mobile-first usability, fast comprehension, trust, and conversion.
9. Use accessible components and semantic HTML.
10. Leave the codebase more scalable, easier to maintain, and more visually coherent than you found it.

---

# Phase 1: Full UI/UX and Frontend Architecture Audit

Begin by auditing the existing app across all available routes, layouts, pages, templates, components, and shared styles.

Inspect:

* Route structure
* Navigation structure
* Homepage
* Landing pages
* Sport/product vertical pages
* Dashboard areas
* Upload flows
* Analysis/report flows
* Onboarding flows
* Auth pages
* Settings/profile pages
* Admin areas if present
* Empty states
* Loading states
* Error states
* Mobile layouts
* Tablet layouts
* Desktop layouts
* CTA placement
* Forms
* Modals
* Cards
* Tables
* Charts/data displays
* Navigation menus
* Footer
* Header
* Component reuse
* Tailwind usage
* shadcn/ui usage
* Accessibility patterns
* SEO metadata patterns
* Page performance risks

Create an internal audit before implementing changes.

Identify:

* Inconsistent spacing
* Inconsistent typography
* Weak visual hierarchy
* Generic sections
* Crowded layouts
* Confusing navigation
* Weak CTA hierarchy
* Low-trust moments
* Missing proof
* Missing onboarding guidance
* Unclear user flows
* Poor mobile ergonomics
* Weak empty states
* Weak loading states
* Inconsistent card patterns
* Duplicated UI logic
* Repeated class patterns that should become components
* Pages that feel unfinished
* Pages that feel too technical
* Pages that feel too plain
* Pages that feel visually disconnected from the rest of the product

Then produce a concise audit summary before implementing.

---

# Phase 2: Product Experience Diagnosis

Evaluate the product from the perspective of:

1. A first-time visitor
2. A skeptical visitor
3. A high-intent user
4. A returning user
5. A mobile user
6. A coach/instructor persona
7. A parent persona, if relevant
8. A serious athlete persona
9. A casual user persona
10. A product evaluator comparing this app to alternatives

For each user type, identify:

* What they are trying to understand
* What they need to trust
* What action they should take
* Where they may hesitate
* What proof they need
* What UX change would increase confidence
* What conversion path should be emphasized

Focus heavily on first-impression clarity. Within five seconds, a visitor should understand:

* What this product is
* Who it is for
* What problem it solves
* How it works
* What result they get
* Why it is credible
* What they should do next

---

# Phase 3: Design-System Strategy

Create or improve a scalable design system.

Audit the current styling system and then define or improve:

## 1. Design Tokens

Create or standardize tokens for:

* Colors
* Sport-specific accent palettes
* Backgrounds
* Surfaces
* Borders
* Shadows
* Radius
* Spacing
* Typography
* Font sizes
* Font weights
* Line heights
* Motion timing
* Z-index
* Layout widths
* Section padding
* Card density
* Button sizes
* Status states
* Confidence states
* Difficulty levels
* Progress states

Prefer centralized tokens in Tailwind config, CSS variables, theme files, or existing design-system locations.

## 2. Typography System

Create a clear hierarchy for:

* Hero headlines
* Page titles
* Section headers
* Subheaders
* Body copy
* Captions
* Labels
* Form text
* Empty-state text
* Data labels
* Report text
* Marketing copy
* Dashboard copy

Typography should feel premium, readable, modern, and mobile-friendly.

## 3. Color System

Use a refined parent-brand palette with controlled sport-specific accents.

Avoid random color usage. Color should communicate:

* Brand identity
* Sport identity
* Action hierarchy
* Status
* Confidence
* Progress
* Risk
* Success
* Warning
* Error
* Informational guidance

## 4. Layout System

Standardize:

* Page shells
* Marketing sections
* Dashboard shells
* Sport landing-page shells
* Report layouts
* Upload-flow layouts
* Split hero layouts
* Content grids
* Feature grids
* Card grids
* Detail pages
* Sticky CTA patterns
* Responsive behavior

## 5. Component System

Create reusable components wherever appropriate.

Prioritize components such as:

* AppShell
* MarketingShell
* SportShell
* DashboardShell
* Section
* Container
* PageHeader
* Hero
* SportHero
* CTAGroup
* CTAButton
* TrustBar
* ProofStrip
* FeatureCard
* SportCard
* MetricCard
* InsightCard
* AnalysisCard
* ReportCard
* RecommendationCard
* DrillCard
* EmptyState
* LoadingState
* ErrorState
* Stepper
* ProgressIndicator
* ConfidenceBadge
* StatusBadge
* SportBadge
* UploadDropzone
* VideoPreviewCard
* ComparisonTable
* FAQAccordion
* TestimonialCard
* ChangelogCard
* AdminCard
* NavigationMenu
* MobileNav
* Footer
* Breadcrumbs
* Tabs
* FilterControls
* DataTable wrapper if needed

Use shadcn/ui as the base where it makes sense. Customize responsibly through tokens and variants rather than scattered overrides.

---

# Phase 4: Distinct Premium Sport/Product Vertical System

Build a brand architecture where each sport or product vertical feels distinct while remaining part of the same parent platform.

For each major sport/product area found in the app, define:

* Accent color
* Secondary accent
* Background treatment
* Icon or visual motif
* Hero treatment
* Card style variation
* CTA language
* Empty-state language
* Report tone
* Coaching tone
* Data visualization style
* Page rhythm
* Microcopy personality

Examples of possible directions:

* Golf: precise, premium, calm, analytical, performance-lab feel
* Tennis: kinetic, sharp, court-speed, responsive, modern
* Baseball: powerful, focused, scouting-report, competitive
* Fast-pitch softball: explosive, technical, confident, athlete-forward
* Slow-pitch softball: approachable, powerful, practical, recreational-performance
* Pickleball: fast, social, tactical, clean, energetic
* Padel: global, modern, fluid, premium-club feel

Do not over-theme to the point of inconsistency. The parent platform must still feel unified.

Implement this through:

* Sport metadata configuration
* Sport theme objects
* Sport-specific component variants
* Reusable SportShell patterns
* Controlled token mapping
* Reusable copy structures

Avoid duplicating entire page templates per sport when a configurable pattern can support them.

---

# Phase 5: Homepage and Landing Page Redesign

Audit and improve the homepage around conversion, trust, and comprehension.

The homepage should quickly answer:

* What is this?
* Who is it for?
* Why should I trust it?
* How does it work?
* What do I get?
* How fast can I get value?
* What should I click first?

Recommended homepage structure:

1. Premium hero section

   * Clear headline
   * Outcome-driven subheadline
   * Primary CTA
   * Secondary CTA
   * Trust cue
   * Product visual or demo preview

2. Problem section

   * Show the user’s pain clearly
   * Avoid generic marketing language

3. Product explanation

   * Explain the product in plain language
   * Make the result tangible

4. How it works

   * Step 1: Upload/input
   * Step 2: Analysis
   * Step 3: Recommendation/report
   * Step 4: Practice/retest/progress

5. Example output or demo

   * Show what the user receives
   * Use realistic cards, report previews, or screenshots

6. Sport/product vertical selector

   * Let users identify their sport quickly
   * Each sport should feel premium and distinct

7. Trust and proof

   * Privacy
   * Data handling
   * Accuracy/confidence labeling
   * Sample reports
   * Product methodology
   * Testimonials or proof if available

8. Benefits

   * Clear, user-centered benefits
   * Not feature dumping

9. Objection handling

   * Is it free?
   * Do I need an account?
   * What happens to my data?
   * How accurate is it?
   * What if I am a beginner?
   * What if I am advanced?

10. Final CTA

* Strong conversion section
* Reassuring microcopy

Improve the homepage visually and structurally without breaking existing logic.

---

# Phase 6: Navigation and Information Architecture

Audit and improve the navigation so users can quickly understand the product.

The navigation should prioritize:

* Start/analyze/upload action
* Sports or product areas
* How it works
* Sample report/demo
* Pricing/free explanation if relevant
* Resources/learning
* Updates/changelog if relevant
* Login/dashboard

Identify pages that should be:

* Promoted
* Demoted
* Merged
* Renamed
* Removed from primary navigation
* Moved to footer
* Converted into landing pages
* Converted into SEO pages
* Converted into support/trust pages

Improve:

* Header hierarchy
* Mobile nav
* Footer structure
* Active states
* Dropdown behavior
* CTA prominence
* Breadcrumbs where appropriate

Navigation should feel intuitive, not like an internal sitemap.

---

# Phase 7: Conversion and Trust System

Improve conversion readiness across the app.

Audit and enhance:

* CTA clarity
* CTA placement
* CTA hierarchy
* Signup friction
* Upload friction
* Form friction
* Dashboard entry points
* Onboarding guidance
* Demo/sample report access
* Trust cues
* Privacy reassurance
* Error recovery
* User reassurance after clicking a CTA

Create a reusable CTA system with variants such as:

* Primary action
* Secondary action
* Sport-specific action
* Low-friction action
* Trust-backed action
* Dashboard action
* Admin action

Create or improve trust-building modules:

* Privacy reassurance strip
* Sample report CTA
* Methodology explainer
* Confidence labeling
* Data deletion/control messaging
* Product transparency section
* FAQ section
* Support/contact visibility
* Changelog/updates preview
* Founder or product credibility module if appropriate

Every major page should have a clear next action.

---

# Phase 8: Mobile-First UX Rebuild

Prioritize mobile. Assume a large share of users arrive from mobile search, social, referrals, or direct links.

Audit and improve:

* Mobile hero clarity
* Mobile navigation
* Thumb-friendly button placement
* Sticky CTA behavior
* Section density
* Font sizes
* Tap targets
* Form inputs
* Upload flows
* Report readability
* Dashboard cards
* Horizontal overflow
* Spacing
* Visual hierarchy
* Speed perception
* Loading states
* Error states

Create mobile patterns for:

* Sticky bottom CTA
* Collapsible sections
* Compact feature cards
* Swipe-friendly sport cards if appropriate
* Mobile-first report cards
* Simplified upload flow
* Mobile trust cues
* Shorter sections with progressive disclosure

Do not simply shrink desktop layouts. Design mobile as a first-class experience.

---

# Phase 9: App States, Empty States, Loading States, and Error States

Premium products feel polished even when there is no data, slow data, or an error.

Audit and improve:

* Empty dashboards
* Empty reports
* Empty search results
* No upload state
* First-time user state
* Loading skeletons
* Upload progress
* Analysis progress
* Failed upload
* Failed analysis
* Network error
* Permission/auth error
* Form validation errors
* 404 pages
* Maintenance or unavailable states

Each state should include:

* Clear explanation
* Helpful next action
* Reassuring tone
* Appropriate visual hierarchy
* Sport/product context where relevant
* Accessible semantics

---

# Phase 10: Accessibility and Inclusive UX

Add or improve accessibility across major pages and components.

Check:

* Semantic HTML
* Heading hierarchy
* Keyboard navigation
* Focus states
* Color contrast
* Button labels
* Form labels
* ARIA usage where needed
* Error announcements
* Alt text
* Reduced motion support
* Touch target sizes
* Color-independent meaning
* Screen reader clarity
* Modal/dialog accessibility
* Menu accessibility
* Tabs accessibility

Add Axe checks for critical pages and components where feasible.

Fix critical accessibility issues before finalizing.

---

# Phase 11: Performance, SEO, and Lighthouse-Oriented Improvements

Improve the app with Lighthouse in mind.

Audit and improve:

* Largest Contentful Paint risks
* Cumulative Layout Shift risks
* Image optimization
* Font loading
* Bundle bloat
* Unnecessary client-side rendering
* Heavy animations
* Metadata
* Open Graph tags
* Structured page headings
* Link semantics
* Button semantics
* Lazy loading
* Responsive images
* Route-level performance
* Unused components/styles where obvious

Do not make speculative optimizations that risk breaking the product. Prioritize safe, high-impact improvements.

---

# Phase 12: Storybook Coverage

If Storybook exists, improve it.

If Storybook does not exist, assess whether it can be added safely. If adding it is too large for this pass, document the setup plan and create stories for the most important components if feasible.

Prioritize Storybook coverage for:

* Buttons
* CTA groups
* Cards
* Sport cards
* Sport shell
* Hero sections
* Badges
* Empty states
* Loading states
* Error states
* Upload components
* Report/analysis cards
* Navigation
* Mobile-specific components where possible

Stories should show:

* Default state
* Hover/focus state where applicable
* Disabled state
* Loading state
* Error state
* Sport variants
* Mobile-friendly layouts where feasible

---

# Phase 13: Playwright User-Flow Testing

Add or improve Playwright tests for critical flows.

Prioritize tests for:

* Homepage loads
* Primary CTA works
* Navigation works
* Mobile navigation opens/closes
* Sport page navigation works
* Upload/start flow works where feasible
* Dashboard route works where feasible
* Auth route behavior works where feasible
* Sample report/demo route works where feasible
* Important forms validate properly
* No obvious broken routes in primary navigation

Do not write brittle tests that depend on constantly changing visual copy unless necessary. Prefer stable selectors and accessible roles.

---

# Phase 14: Design QA Checklist

After implementation, run a design QA pass.

Check:

* Spacing consistency
* Typography consistency
* CTA hierarchy
* Mobile layout quality
* Header/footer consistency
* Sport theme consistency
* shadcn/ui consistency
* Dark/light mode issues if applicable
* Empty/loading/error states
* Accessibility
* Responsive behavior
* Broken links
* Console errors
* Type errors
* Lint errors
* Test failures
* Lighthouse risks

Fix all reasonable issues discovered during QA.

---

# Phase 15: Implementation Prioritization

Work in priority order. Do not attempt a chaotic full rewrite.

Recommended priority:

1. Audit and map existing UI system
2. Stabilize tokens and global styles
3. Improve core layout shells
4. Improve navigation/header/footer
5. Improve homepage and primary landing experience
6. Improve sport/product vertical system
7. Improve CTA and trust components
8. Improve mobile responsiveness
9. Improve empty/loading/error states
10. Improve dashboard/report cards where applicable
11. Add Storybook coverage
12. Add Playwright tests
13. Add Axe checks
14. Optimize for Lighthouse
15. Document everything

If time or complexity constraints exist, prioritize the changes with the highest impact on:

* First impression
* Conversion
* Mobile usability
* Trust
* Product comprehension
* Reusability
* Maintainability

---

# Required Output Before Coding

Before making changes, provide a concise plan that includes:

1. What you found in the repo
2. Current frontend architecture
3. Current design-system maturity
4. Major UX problems
5. Highest-impact improvements
6. Proposed component strategy
7. Proposed sport/product vertical brand strategy
8. Testing and QA strategy
9. Files likely to be changed

Then proceed with implementation.

---

# Required Implementation Behavior

While implementing:

* Make focused, logical changes.
* Prefer reusable components.
* Prefer tokenized styling.
* Use shadcn/ui primitives where appropriate.
* Use Tailwind responsibly.
* Preserve existing behavior.
* Keep components typed and maintainable.
* Avoid unnecessary dependencies.
* Avoid large rewrites unless clearly justified.
* Keep naming clean and scalable.
* Add comments only where they improve maintainability.
* Use existing project conventions.

---

# Required Final Report

After implementation, provide a final report with the following sections:

## 1. Executive Summary

Explain the overall UI/UX improvement and why it matters.

## 2. Before vs. After Strategic Rationale

Explain what the interface felt like before and what it is designed to feel like now.

## 3. Major UX Problems Found

List the most important issues discovered.

## 4. Improvements Implemented

Group by:

* Design system
* Components
* Navigation
* Homepage/landing pages
* Sport/product verticals
* Mobile UX
* Trust/conversion
* Accessibility
* Performance/SEO
* Testing
* Storybook

## 5. Files Changed

List the important files changed and summarize why.

## 6. New Components Created

List each new reusable component and its purpose.

## 7. Design Tokens Added or Improved

Summarize token changes.

## 8. Sport/Product Identity System

Explain how each sport/product vertical now feels distinct while staying unified.

## 9. Accessibility Improvements

Summarize accessibility fixes and remaining issues.

## 10. Test Coverage

Include:

* Storybook coverage added or improved
* Playwright tests added or improved
* Axe checks added or improved
* Commands run
* Results
* Known gaps

## 11. Lighthouse-Oriented Improvements

Summarize performance, SEO, accessibility, and best-practices improvements.

## 12. Remaining Opportunities

List what should be improved next.

## 13. Recommended Next Iterations

Prioritize the next best improvements in phases:

* Phase 1: Immediate polish
* Phase 2: Conversion lift
* Phase 3: Product experience depth
* Phase 4: Sport-specific differentiation
* Phase 5: Advanced intelligence, personalization, and growth loops

## 14. QA Notes

Document any assumptions, risks, skipped areas, or manual checks needed.

---

# Success Criteria

The project is successful if the app now:

* Looks more premium
* Feels more commercially credible
* Is easier to understand in the first five seconds
* Has stronger visual hierarchy
* Has a clearer CTA system
* Uses reusable design-system components
* Has better mobile usability
* Has stronger trust signals
* Has more polished sport/product verticals
* Preserves existing functionality
* Improves accessibility
* Improves performance/SEO fundamentals
* Has stronger Storybook and Playwright coverage
* Is easier to scale as a serious product platform

Execute this like a top-tier product team preparing the app for real users, investors, partners, coaches, athletes, and long-term commercial growth.
Do not launch anything without showing me a preview.