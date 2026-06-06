# SwingVantage Academy — Internal Enablement Platform

_Status: **Phase 1 in progress** (foundation + core learner experience). Internal-only, lives at
`/admin/academy/*` behind the existing admin guard. Branch: built on `master` (local commits)._

> **📘 In Plain English (start here).** SwingVantage Academy is the company's internal "university" —
> the place every employee, coach, and partner goes to become genuinely fluent in the product. It's
> built like a modern learning platform (guided paths → courses → lessons → quizzes → hands-on
> challenges → badges → certifications), tuned for a sports-tech company. It is **internal-only** (not
> public, not indexed) and reuses the same login/guard as the rest of the admin tools. This document is
> the blueprint: what it is, how it's structured, the data model, the pages, and the phased plan. We
> build it in phases so each piece ships working rather than waiting on the whole thing.

---

## 1. Goals

1. Make every employee an **expert** in SwingVantage — not just where features are, but *why* they
   matter, *how* they work, *who* they serve, and how to demo/troubleshoot/explain them.
2. **Role-based** learning — each role gets its own required + optional curriculum, certifications,
   and progress.
3. A **living** system — as the product evolves, new release notes can seed new draft training.

Inspiration (strategy only, no copied IP): Trailhead's guided paths, Duolingo's progression,
HubSpot Academy's role tracks, Apple's product training polish, a high-end performance-certification
feel. All SwingVantage-native naming and content.

---

## 2. Branded vocabulary (SwingVantage-native)

| Concept | SwingVantage name |
|---|---|
| Learning path | **Vantage Path** |
| Skill area within a role | **Skill Track** |
| Earnable mark of skill | **Performance Badge** |
| Per-feature competence score | **Feature Fluency Score** |
| Demo competence | **Demo Readiness Score** |
| Support competence | **Support Readiness Score** |
| Progression tiers | **Mastery Levels**: Rookie → Qualified → Pro → Elite |
| Certifications | SwingVantage Certified **Operator / Coach / Support Specialist / Product Expert / AI Workflow Specialist / 3D Motion Specialist / Admin / QA / Marketing / Sales Demo** |

---

## 3. Learning-object hierarchy

```
Academy
└── Vantage Path        (role-oriented journey; may grant a Certification)
    └── Course          (a coherent topic; may grant a Performance Badge)
        └── Module      (a group of lessons inside a course)
            └── Lesson  (the atomic unit; uses the standard lesson template)
                ├── Knowledge Check   (Quiz: MC / multi-select / true-false / scenario)
                └── Hands-on Challenge (simulation / roleplay / task / flag-review)
Certification = required Courses + required Challenges + a final Assessment → Badge + expiry
```

Data model lives in [`apps/web/src/lib/academy/types.ts`](../apps/web/src/lib/academy/types.ts). Content
(seed) lives in `apps/web/src/lib/academy/content/*`. Pure progress/readiness/recommendation logic in
[`apps/web/src/lib/academy/engine.ts`](../apps/web/src/lib/academy/engine.ts). Learner progress is a
Zustand slice (`store/slices/academy.ts`), local-first like the rest of the app.

### Standard lesson template (every lesson)
`title · estMinutes · roleIds · difficulty · prerequisites · objectives · whyItMatters ·
walkthrough · scenario · steps · mistakes · bestPractices · knowledgeCheck(quiz) ·
challenge · completionCriteria · relatedFeatures · docLinks · supportNotes · version`

---

## 4. Roles (role-based academies)

Executive · Product · Engineering · AI/ML · QA · Customer Support · Sales · Marketing · Content ·
Coach · Partner · Admin · New Hire · Power User. Each maps to recommended Vantage Paths and a target
certification. A learner picks their role on first visit; it drives recommendations and the dashboard.

---

## 5. Foundational Vantage Paths (seed)

| Path | Audience | Grants |
|---|---|---|
| **SwingVantage Foundations** | everyone | Foundations Certified |
| **New-Hire Onboarding (30 days)** | new hires | (sequences other paths) |
| **Video Analysis Mastery** | product, support, coach, QA | Product Expert (partial) |
| **Coach Mode Certification** | coaches | Certified Coach |
| **Customer Support Readiness** | support | Certified Support Specialist |
| **Sales & Demo Readiness** | sales, partners | Certified Sales Demo |
| **Admin & Operations Mastery** | admin | Certified Admin |

Additional paths from the full spec (AI Coaching Engine, 3D Motion Mapping, Marketing Enablement,
Product QA, Executive Fluency) are modeled and seeded incrementally.

---

## 6. Routes (under the internal guard)

```
/admin/academy                       Academy Home (role-aware hero, featured paths, momentum)
/admin/academy/dashboard             My Learning (progress, readiness scores, next-up, badges)
/admin/academy/catalog               Course & path catalog (filter by role/sport/difficulty/cert)
/admin/academy/path/[slug]           Vantage Path detail (courses, % complete, cert progress)
/admin/academy/course/[slug]         Course detail (modules, lessons, badge)
/admin/academy/lesson/[id]           Lesson (template render + knowledge check + challenge + complete)
/admin/academy/badges                Badge gallery
/admin/academy/certifications        Certification Center (earned + readiness)
/admin/academy/advisor               AI Learning Advisor (Phase 4)
/admin/academy/admin                 CMS (Phase 3)
/admin/academy/analytics             Manager/exec dashboards (Phase 5)
```

---

## 7. Assessment & gamification

- **Assessment types:** multiple-choice, multi-select, true-false, scenario; (Phase 6: support-ticket
  sim, sales roleplay, AI-reviewed written response). Passing thresholds, attempt tracking,
  randomization, retakes, certification expiry.
- **Gamification (premium, not childish):** points, Performance Badges, Mastery Levels, streaks,
  completion %, Feature Fluency / Demo Readiness / Support Readiness scores, "recommended next",
  optional department leaderboards. No confetti-spam; performance-oriented tone.

---

## 8. Quality guardrails (enforced in content + review)

No overpromising AI accuracy · no medical / injury-prevention claims · plain language (no needless
jargon) · no unreviewed AI-generated content published · roadmap-sensitive content gated by role · no
fake/rigorless certifications · lessons kept short · staleness flagged via `version` + release-based
refresh. Mirrors the product's own honesty standard (see `feedback_no_misleading_local_only_copy`).

---

## 9. Phased delivery

| Phase | Scope | State |
|---|---|---|
| **1** | Foundation: types, engine, seed content, store slice; Home / Catalog / Path / Course / Lesson / Quiz / Dashboard / Badges / Certifications | **in progress** |
| 2 | Gamification polish, full certification flow, more assessments | planned |
| 3 | Admin CMS (authoring, draft→review→published→archived, versioning) | planned |
| 4 | AI Learning Advisor + AI tutor + release-note→draft-course generation | planned |
| 5 | Analytics + manager/exec dashboards + assignments + notifications | planned |
| 6 | Advanced simulations (support tickets, sales roleplay, AI-reviewed responses) | planned |

---

## 10. Risks & mitigations

- **Scope** is very large → phased; Phase 1 ships a real, navigable academy with seed content.
- **Content volume** (40+ lessons) → schema supports it; lessons are data; seeded in batches, with the
  3 spec "sample lessons" authored in full first.
- **RBAC depth** → Phase 1 uses the existing admin guard (internal-only) + an in-app role selector;
  true per-role RBAC + Supabase-backed records deferred to Phase 3/5.
- **Theme bleed** under the dark admin chrome → the academy uses its own themed canvas container.
- **Tandem agents on master** → commit only with explicit pathspec; never `-A`.

---

## 11. Future roadmap (beyond Phase 6)

Supabase-backed records (cross-device, manager rollups) · SSO role mapping · certificate PDF export ·
partner-facing external academy tier · content effectiveness A/B · multilingual lessons (reuse i18n).
