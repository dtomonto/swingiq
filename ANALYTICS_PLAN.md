# SwingIQ Analytics Plan

_Last updated: May 2026_

---

## 📘 In Plain English (start here)

**What this page is:** The plan for what SwingIQ would measure about how people use it — things like sign-ups, first analysis, and return visits — once you switch usage tracking on.

**What you actually need to know:**
- This is **strategy, not a task**, and **nothing is being tracked until you turn analytics on** (the simple how-to is in [docs/analytics-events.md](docs/analytics-events.md)).
- The numbers here (like "target 40%") are **goals to aim for**, not current results.
- "Funnel" just means the step-by-step path a person takes from first visit to becoming a regular user; this page maps those steps so you can see where people drop off.

**What to do next:** Nothing required. If and when you turn on analytics, this page tells you which numbers actually matter so you don't drown in data.

> The event tables, funnel diagrams, and "Implementation Notes" below are reference for a developer or an AI assistant wiring up tracking. You don't need them to use SwingIQ.

---

## Event Taxonomy

Events are referenced as `ANALYTICS_EVENTS` constants in the codebase. All events follow the naming convention: `object_action` (e.g., `session_imported`, `diagnosis_viewed`).

### Acquisition Events
| Event | Properties | Purpose |
|---|---|---|
| `page_viewed` | `page`, `sport`, `referrer` | Track SEO page performance |
| `signup_started` | `source`, `sport` | Conversion funnel start |
| `signup_completed` | `method` (email/google/magic_link) | Activation |
| `login_completed` | `method` | Retention measurement |

### Activation Events
| Event | Properties | Purpose |
|---|---|---|
| `sport_selected` | `sport`, `previous_sport` | Sport adoption |
| `session_imported` | `sport`, `source`, `row_count`, `method` (csv/image/manual) | Core activation |
| `diagnosis_viewed` | `sport`, `top_fault`, `confidence`, `session_id` | Value delivery |
| `drill_viewed` | `drill_id`, `fault_id`, `sport` | Drill engagement |
| `routine_generated` | `sport`, `days_per_week`, `focus_area` | Plan creation |

### Engagement Events
| Event | Properties | Purpose |
|---|---|---|
| `video_uploaded` | `sport`, `camera_angle`, `file_size_mb` | Video feature usage |
| `ai_coach_message_sent` | `sport`, `message_length`, `session_context` | AI feature usage |
| `session_saved` | `sport`, `row_count`, `source` | Persistence |
| `benchmark_viewed` | `metric`, `sport`, `skill_level` | Research interest |
| `image_import_started` | `sport`, `source_device` | OCR funnel start |
| `image_import_completed` | `sport`, `source_device`, `row_count` | OCR funnel complete |

### Retention Events
| Event | Properties | Purpose |
|---|---|---|
| `return_visit` | `days_since_last`, `sport` | Retention signal |
| `session_n` | `session_number`, `sport` | Session frequency |
| `subscription_started` | `tier`, `sport`, `method` | Revenue |
| `subscription_cancelled` | `tier`, `reason` | Churn analysis |

---

## Key Funnels

### 1. Landing → Analysis → Save → Return
```
Landing page view
  → Signup / Login (conversion rate target: 15%)
    → Sport selected (target: <24h from signup)
      → First session imported (activation: target <7 days)
        → Diagnosis viewed (value delivery)
          → Drill/routine saved (deep activation)
            → Return visit within 7 days (early retention)
              → Session 5+ (established user)
```

### 2. SEO → Free Tool → Signup
```
SEO page visit (golf-swing-analysis, etc.)
  → CTA click (Import CSV / Upload Video)
    → Signup wall hit OR skip to guest mode
      → Session import completed
        → Signup prompted (save your data)
          → Account created
```

### 3. Image Import Funnel
```
/sessions/import/image page view
  → Step 1 completed (sport + source selected)
    → Step 2 reached (data entry)
      → At least 1 row entered
        → Step 3 reached (confirm)
          → Data saved (step 4)
            → Diagnosis link clicked
```

---

## KPIs

### Activation
- **Activation rate:** % of signups who import at least one session within 7 days (target: 40%)
- **Time to first analysis:** median hours from signup to first diagnosis viewed
- **Sport distribution:** % of sessions per sport

### Engagement
- **Analyses per user per month:** target 4+ for retained users
- **Drill click-through rate:** % of diagnoses where user clicks at least one drill
- **AI Coach usage rate:** % of Pro users who send 1+ messages per month

### Retention
- **7-day retention:** % of activated users who return within 7 days (target: 35%)
- **30-day retention:** target 20%
- **Session frequency:** average sessions per user per month

### Revenue (once monetized)
- **Free → Pro conversion rate:** target 5% of activated free users
- **Monthly recurring revenue (MRR)**
- **Churn rate:** monthly % of Pro subscribers who cancel

### AI Quality
- **Diagnosis confidence distribution:** % high / medium / low across all analyses
- **Fault accuracy rate:** % of diagnoses where user marks the fault as accurate (self-reported)
- **Drill relevance score:** user rating on drill usefulness (1–5)

---

## Dashboard Recommendations

### PostHog (recommended)
- Self-hostable for privacy compliance
- Session recording for UX analysis
- Feature flags for gradual rollout
- Cohort analysis for sport segments

### GA4 (alternative / SEO complement)
- Use GA4 for SEO page performance only
- Do not send PII or session data to GA4
- Set up conversion events for signup, first analysis

### Implementation Notes
- Fire events in `apps/web/src/lib/analytics.ts`
- Use a single `track(event, properties)` function wrapping PostHog client
- Always include `sport` and `user_id` (hashed) in event properties
- Batch events client-side; flush on page unload
- Respect Do Not Track headers

---

## AI Quality Metrics

| Metric | How Measured | Target |
|---|---|---|
| Fault detection rate | % of sessions with at least 1 fault identified | >80% where sufficient data |
| False positive rate | User marks fault as "not applicable" | <20% |
| Drill relevance | User rates drill as relevant (1–5) | Avg >3.8 |
| Confidence calibration | High-confidence findings confirmed accurate | >85% |
| Missing data flag rate | % of analyses where data is flagged as insufficient | Track for product improvement |
