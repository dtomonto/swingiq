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

The left sidebar has 17 pages. Labels change based on your active sport:

| Page | Golf label | Tennis/Baseball/Softball label |
|---|---|---|
| Profile | My Golfer Profile | My Tennis/Hitter Profile |
| Equipment | Equipment (with Loft Gapping) | Equipment |
| Sessions | Sessions | Hitting/Training Sessions |
| Import | Import Data | Log Session |
| Diagnose | Diagnose | Analyze Swing |
| Pre-Round | Pre-Round | Pre-Game Warm-Up |
| Drills | Drill Library | Drills |
| Compare & References | Compare & References | Compare & References |

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

## 17. Compare & References

Two-tab page: **Browse References** and **Side-by-Side Comparison**.

### Browse References tab
- Browse professional athlete swing references filtered by sport, sex, movement type, handedness, and style tags
- Cards show athlete name, active status, and style tags
- Entries marked "Pending Admin Verification" need YouTube IDs confirmed before videos show
- Click a card to open the detail drawer — shows bio, movement types, and video slots
- For unverified entries: a YouTube search link is provided so you can find the athlete's swing yourself
- Click "Select for Comparison" to send an athlete to the comparison tab

### Side-by-Side Comparison tab
- **Your Swing (left):** Upload a new video or select a saved video analysis from your history
- **Professional Reference (right):** Shows the selected athlete reference; use "Browse References →" if none selected
- **Phase Checklist:** Sport-specific swing phase labels below both panels
- **Limitation notice:** SwingIQ has not analyzed the professional video frames — comparisons are observational only
- Mobile: panels stack vertically

> Note: YouTube video embeds are privacy-enhanced (youtube-nocookie.com) for any verified references.

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
- **Backup & Restore:** Full backup and restore system (see below)
- **Reset App:** Clears all data (asks for confirmation)

---

## 21. Backup & Restore

Found at **Settings → Backup & Restore**.

### Downloading a backup
1. The page shows live counts of your data (sessions, clubs, video analyses)
2. Optionally toggle "Encrypt with password" and enter a password (recommended for sensitive data)
3. Click **Download Backup**
4. The file saves as `swingiq-backup-YYYY-MM-DD.json` (or `.swingiqbackup` if encrypted)
5. Store the file somewhere safe — iCloud Drive, Google Drive, email, or USB

> ⚠️ If you encrypt the backup, do not forget your password. There is no recovery option.

### Restoring from a backup
1. Tap **Upload Backup File** and select your `.json` or `.swingiqbackup` file
2. If encrypted, enter your password
3. The page shows a preview: new records, duplicates, warnings
4. Choose your restore mode:
   - **Merge** — adds backup data to your current data (safe, recommended)
   - **Replace** — replaces your current data with the backup (requires confirmation)
5. The result summary shows what was restored, skipped, and any warnings

### What is included
- Golf profile and all sport-specific profiles
- Equipment (clubs, racquets, bats)
- All sessions with shots and diagnoses
- Video analysis results
- Training progress (streak, drills, milestones)
- Settings and preferences

### What is NOT included
- API keys, passwords, or tokens (never stored in the app)
- Raw video files (metadata and analysis results are included; raw video files are not)

---

## 22. Equipment — Loft Autofill & Gapping (Golf)

When adding or editing a golf club:

1. Select the club type (Driver, 3 Wood, 7 Iron, etc.)
2. The **Loft** field autofills based on known manufacturer data or generic defaults
3. A badge next to the field shows the source and confidence:
   - **TaylorMade Stealth 2 (manufacturer spec)** — high confidence
   - **Generic default — editable** — medium confidence
   - **Custom (manually entered)** — your own value
4. You can always edit the loft manually — it becomes "Custom"
5. A **Reset to default** link appears when you've set a custom value

### Loft Gapping view
Click the **Loft Gapping** button on the Equipment page to see:
- All your clubs sorted by loft angle
- Gap between each adjacent club
- Color coding: 🟢 Good gap · 🟡 Overlap or tight · 🔴 Large gap (>6°)
- Recommendations for gaps that need attention

---

## 23. Screenshot / Image Import

Found at **Sessions → Import from Image** (or the image icon on the Import page).

Use this to get data into SwingIQ from a screenshot or photo of a performance table.

1. **Upload:** Select your sport and movement type, choose the data source (FlightScope, TrackMan, HitTrax, etc.), and upload your image (jpg, png, webp — max 10 MB)
2. **Review:** Enter your data values into the editable table. Columns are pre-populated based on the source you selected. Add or delete rows as needed.
3. **Confirm:** Review your final data before saving. A privacy notice confirms your data stays local.
4. **Analyze:** Your confirmed data is saved and routed to the diagnostic engine.

> Auto-extraction (OCR) is coming in a future release. For now, manual entry is the supported workflow.
