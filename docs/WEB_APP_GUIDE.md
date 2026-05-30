# SwingIQ — Web App Guide

A plain-English guide to every feature in the app.

---

## 1. The Basics

SwingIQ is a web app. There is no separate mobile app to install — everything runs in your browser at either:
- `http://localhost:3000` (when running on your own computer)
- Your Vercel URL (when deployed — accessible anywhere)

It works on phones, tablets, and computers. The layout adjusts automatically.

---

## 2. The Sport Switcher

**This is the most important control in the app.**

The Sport Switcher is at the bottom of the left sidebar, labeled **Active Sport**. Clicking it opens a dropdown of all five sports:
- ⛳ Golf
- 🎾 Tennis
- ⚾ Baseball
- 🥎 Slow Pitch Softball
- 🥎 Fast Pitch Softball

When you switch sports, the entire app changes:
- Dashboard content and cards
- Profile form fields
- Sessions list (filtered to that sport)
- Training page content
- Pre-game warm-up
- Drill library default
- Milestones
- AI Coach language and suggested questions
- Progress tracker
- Reports

Your sport choice is saved in your browser, so it persists after page refreshes.

---

## 3. Navigation

The left sidebar has 16 pages. Labels change based on your active sport:

| Page | Golf label | Tennis/Baseball/Softball label |
|---|---|---|
| Profile | My Golfer Profile | My Tennis/Hitter Profile |
| Equipment | Equipment | Equipment |
| Sessions | Sessions | Hitting/Training Sessions |
| Import | Import Data | Log Session |
| Diagnose | Diagnose | Analyze Swing |
| Pre-Round | Pre-Round | Pre-Game Warm-Up |
| Drills | Drill Library | Drills |

On mobile, tap the menu icon (☰) at the top left to open the sidebar.

---

## 4. Dashboard

The dashboard is the home screen. It changes completely by sport.

**Golf dashboard includes:**
- "What should I do next?" banner (5-step onboarding flow)
- Practice reminder (if 2+ days since last practice)
- Primary diagnosis card with evidence and stroke savings potential
- Retest protocol
- Today's focus drill
- Recent session summary
- Swing scores (overall, face, path, strike, consistency, dispersion)
- Player DNA (typical miss, face tendency, path tendency, avg carry, smash factor)
- Progress (streak, sessions, drills)
- Club list with scores
- Club gap analysis

**Non-golf dashboard includes:**
- "What should I do next?" banner (profile → video → training plan)
- Primary issue from latest video analysis
- Recent analyses list
- Overview stats (videos analyzed, sessions logged, latest score)
- Setup completion progress bar
- AI Coach CTA
- Benchmark/evidence note for the sport

---

## 5. My Profile

Each sport has its own profile form with sport-specific fields.

**Golf:** Name, handicap, scoring average, low round, skill level, typical miss, desired shot shape, practice frequency, practice environment, indoor/outdoor, launch monitor owned, ball used, coaching style.

**Tennis:** Dominant hand, backhand style (1H or 2H), playing level, primary strokes, common miss, racquet brand/model, string setup, court surface, practice frequency, primary goal.

**Baseball:** Batting side, throwing hand, position, competition level, bat brand/model, common hitting result, common miss, timing tendency, training frequency, primary goal.

**Slow Pitch:** Batting side, throwing hand, position, league type (recreational/church/corporate/competitive/tournament), bat brand/model, bat certification, typical hitting result, desired hitting style, common miss, timing tendency.

**Fast Pitch:** Batting side, throwing hand, position, competition level, bat brand/model, pitch speed range faced, common hitting result, timing tendency, contact point tendency.

Click **Save Profile** after filling it in. Your profile is used to personalize every drill, training plan, and AI Coach response.

---

## 6. Equipment (Bag)

For golf: manage your clubs with carry distances, loft, shaft flex, brand, and model. The gap analysis button shows whether your carry gaps between clubs are ideal, too large, or too close.

For other sports: this page can store equipment notes (bat specs, racquet info, etc.) — primarily entered through the Profile form.

---

## 7. Sessions

Shows all sessions for your active sport. Switch to a different sport to see that sport's sessions.

An **All Sports** toggle in the top right shows everything across all sports with sport emoji badges.

Clicking a session opens the full detail view:
- Score rings (overall, face, path, strike, dispersion)
- Primary diagnosis with stroke savings estimate
- "What do I do next?" green card
- Shot dispersion chart (SVG scatter plot with 95% confidence ellipse)
- Within-session trend (first half vs second half comparison)
- All diagnosed patterns
- Full shot table (carry, ball speed, launch, spin, face-to-path, lateral miss)
- Session notes editor (click "Add Notes" to attach observations)

---

## 8. Import Data (Golf) / Log Session (Non-Golf)

**Golf — Import Data:**
1. Choose your launch monitor brand
2. Upload your CSV file (drag and drop or browse)
3. Review column mapping — adjust anything that looks wrong
4. Check for validation warnings
5. Preview the first 10 shots
6. Name your session
7. Click Import

**Non-Golf — Log Session:**
1. Give your session a name
2. Choose the session type (tee work, cage BP, live BP, match, etc.)
3. Enter optional metrics (swings taken, duration)
4. Note what you worked on and how it went
5. Rate how the session felt (1–5)
6. Click Log Session

Both pages also have a blue "Analyze Video" CTA card linking to the video analyzer.

---

## 9. Video Analysis

The video analyzer supports all five sports with sport-specific phase timing and coaching.

**Step 1 — Upload:**
Choose your sport and upload a video file. Supported formats: MP4, MOV, WebM. Side view (face-on) gives the best results.

**Step 2 — Configure:**
- Confirm the sport
- Select your camera angle (sport-specific options: Open Side, Catcher View, Pitcher View, Behind Hitter, etc.)
- Click Analyze

**Step 3 — Results:**
- Phase timeline with estimated timing (clearly labeled as estimated)
- Detected issues with severity (Critical / Notable / Minor / Watch)
- Phase-specific coaching cues
- Recommended drills with YouTube search links
- Overall visual score (0–100)
- "Save to sessions" to store in your history

All detections are heuristic estimates based on pose analysis — labeled ⚠ Estimated throughout. This is honest by design.

---

## 10. Diagnose (Golf)

The golf diagnostic engine analyzes your most recent session's launch-monitor data.

You can switch to any other session using the dropdown at the top.

The page shows:
- Session score rings (overall, face, path, strike, dispersion)
- "What should I do next?" summary card
- Key metric cards (avg carry, face-to-path, lateral miss, smash factor)
- All diagnosed patterns (ranked by priority) with:
  - Problem description
  - Evidence data points
  - Likely cause
  - What improvement looks like
  - Training routine + drill steps
  - YouTube drill links
  - Retest protocol (how to measure success)

---

## 11. Training

**Golf:** Shows the full training routine for your active diagnosis. Includes:
- Skill level selector (Beginner → Elite)
- Training effectiveness card ("Is my training working?") comparing before/after on the target metric
- Interactive drill checklist — check off each step to track your practice streak
- Common mistakes to avoid
- YouTube drill links
- Retest protocol

**Non-Golf:** Shows a drill checklist matched to your sport and the primary issue from your latest video analysis. Includes phase reference card and evidence note from the sport config.

---

## 12. Practice Schedule

Auto-generates a 7-day practice week based on your active diagnosis.

Controls:
- **Frequency:** 1×, 2×, 3×, 4×, 5×/week, or Daily
- **Session length:** Short (20 min), Medium (45 min), Long (90 min)

Each day shows blocks (warm-up, main work, retest, cool-down) with:
- Duration and ball count
- Focus metric
- YouTube search link for the drill

Click any day card to expand the full block details.

---

## 13. Pre-Round / Pre-Game Warm-Up

**Golf:** Personalized warm-up exercises matched to your active diagnosis. Includes a key thought for the round and an on-course reminder.

**Tennis:** 8 exercises including arm circles, hip circles, lateral shuffle, shadow groundstrokes, mini-rally, and serve warm-up.

**Baseball:** 7 exercises including shoulder rotation, hip flexor stretch, load practice, tee work, and soft toss.

**Slow Pitch:** 7 exercises including arc pitch visualization, hip drive practice, and timing drills.

**Fast Pitch:** 8 exercises including wrist snaps, quick load reps, compact swing practice, and rise ball mental simulation.

Each exercise has a category badge, duration, reps, and a coaching cue. Check each one off as you complete it. Progress bar tracks completion.

---

## 14. Drill Library

80+ drills across all five sports, defaulting to your active sport.

Filters:
- **Sport:** All sports or specific sport
- **Difficulty:** All, Beginner, Intermediate, Advanced
- **Search:** Name or goal keyword

Each drill card shows:
- Sport emoji
- Drill name and goal
- Reps or duration
- Equipment needed
- Safety note (if applicable)
- YouTube search link

**Recommended for Your Swing** card at the top shows drills from your active golf diagnosis (if available).

---

## 15. Progress

**Golf:** Score trend chart (SVG line chart), score changes breakdown with before/after bars, ball data trend (avg carry, smash factor, face-to-path deltas), personal bests, handicap estimate, most improved/needs work summary, session history list.

**Non-Golf:** Video analysis score sparkline, summary strip (latest score, best score, practice streak), recurring issues frequency chart, full analysis history.

---

## 16. Milestones

Achievement badges for your active sport.

**Golf milestones:** Profile built, first club added, full bag (8+), first session, consistency (5 sessions), data veteran (10 sessions), hundred shots, range warrior (500 shots), first diagnosis, pattern seeker, score thresholds (50/65/80/90), drill milestones, practice streaks (3/7/30 days).

**Non-golf milestones:** Profile built, first video analyzed, film student (5 videos), issue identified, sessions logged (5/10), drill milestones, practice streaks.

Progress bar, category groupings, locked/unlocked state, and hints on how to earn each badge.

---

## 17. Compare Sessions

Side-by-side comparison of any two sessions.

Select Session A and Session B from dropdowns. The page shows:
- Score rings for each session
- Key metrics side-by-side (carry, smash factor, face-to-path, lateral miss)
- Dispersion stats comparison
- Verdict: Session A wins / Tie / Session B wins
- "Go to Training" and "Run New Diagnosis" CTAs

---

## 18. AI Coach

Chat interface for asking questions about your game.

The coach receives context from your actual data:
- Golf: launch-monitor stats, diagnosis, skill level, typical miss
- Non-golf: video analysis results, sport profile summary, skill level

Sport-specific suggested questions appear before your first message. The AI responds in sport-appropriate language — no golf terminology when you're asking about your baseball swing.

Works with OpenAI or Anthropic (see OWNER_TASKS.md). Returns data-grounded placeholder responses if no API key is configured.

---

## 19. Reports

The **Share with Your Coach** card generates a formatted text report for your active sport. Click **Copy Report** to copy it to your clipboard.

**Golf report includes:** Player profile, golf bag (clubs with carry distances), latest session scores and key metrics, diagnoses with confidence, training progress.

**Non-golf report includes:** Sport player profile (batting side, goals, equipment), latest video analysis score and primary issue, sessions logged, training progress.

Paste into a message, email, or notes app to share with your coach or club fitter.

---

## 20. Settings

- **Units:** Yards or meters
- **Theme:** Light, dark, or system
- **Show estimated warnings:** Toggle the ⚠ Estimated labels
- **Coaching style:** Data-first, feel-first, balanced, encouragement
- **Default club for diagnose:** Pre-selects a club in the diagnostic dropdown
- **Export Data:** Downloads a full JSON backup of all your sessions, clubs, profile, and training data
- **Import Data:** Restores from a previous JSON backup
- **Reset App:** Clears all data (asks for confirmation)
