# SwingVantage — Web App Guide

A plain-English guide to every feature in the app.

> **Want step-by-step instructions instead of descriptions?** See the
> [Feature How-To Guide](FEATURE_HOWTO_GUIDE.md) — it walks through *how to use*
> each feature, click by click.

---

## 1. The Basics

SwingVantage is a web app. There is no separate mobile app to install — everything runs in your browser at either:
- `http://localhost:3000` (when running on your own computer)
- Your Vercel URL (when deployed — accessible anywhere)

It works on phones, tablets, and computers. The layout adjusts automatically.

**No account needed to start.** You can open SwingVantage and jump straight in — your data is saved privately on your own device. If you ever want an account (for example, to sync across devices), you can create one anytime from the sign-in screen; sign-up, sign-in, and password reset all work when cloud sync is turned on.

**Works offline.** If your connection drops — common at a range or a back field — a clear banner lets you know, your work is held safely on your device, and anything that needs the internet is queued to finish automatically once you reconnect. Nothing to set up.

---

## 2. The Sport Switcher

**This is the most important control in the app.**

The Sport Switcher is at the bottom of the left sidebar, labeled **Active Sport**. Clicking it opens a dropdown of all seven sports:
- ⛳ Golf
- 🎾 Tennis
- 🏓 Pickleball
- 🎾 Padel
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

The left sidebar lists the main pages. Labels change based on your active sport:

| Page | Golf label | Tennis/Baseball/Softball label |
|---|---|---|
| Profile | My Golfer Profile | My Tennis/Hitter Profile |
| Equipment | Equipment (with Loft Gapping) | Equipment |
| Sessions | Sessions | Hitting/Training Sessions |
| Import | Import Data | Log Session |
| Diagnose | Diagnose | Analyze Swing |
| Pre-Round | Pre-Round | Pre-Game Warm-Up |
| Drills | Drill Library | Drills |
| Retest | Retest | Retest |
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

The video analyzer supports all seven sports with sport-specific phase timing and coaching.

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

## 9b. Motion Lab — 3D Motion Analysis

Found at **Analyze → Motion Lab (3D)** in the sidebar (or `/motion-lab`). Motion Lab turns a clip into a **3D figure of your motion** you can spin, slow down, and step through — for all seven sports.

**The flow:**
1. **Pick your sport and motion** — e.g. driver, iron, wedge, or putt for golf; forehand, backhand, serve, volley, or return for tennis; hitting, pitching, throwing, or fielding for baseball/softball.
2. **Upload or record** a clip. You can **trim** it to just the rep, and set your handedness and skill level.
3. **Analyze.** Everything runs on your own device — your video never leaves the browser.

**What you get:**
- A **3D viewer** you can rotate (drag), zoom, scrub frame-by-frame, and screenshot, with motion trails, an optional "ghost" of an earlier session to compare against, and an optional **estimated club/bat/racket path** overlay (the head arc + contact point).
- A **phase timeline** (setup → top → impact → finish, and the right phases for each sport).
- **Scores** for overall motion, power, sequencing, rotation, balance, timing, and consistency — each with a confidence level.
- A **kinetic-chain read** (does your power fire ground-up: hips → torso → arms → implement?) with power-leak flags, and a **timing breakdown** (load, transition, acceleration, contact-window stability, tempo).
- A conversational **coach's read** in the SwingVantage format (main finding → why → evidence → what to feel → one cue → one drill → next upload), grounded in your numbers.
- A **coaching report** in your choice of tone (beginner, athlete, coach, youth/parent, or data), with the **top 3 fixes**, what *not* to change, and a **practice plan**.
- A **drill plan** (an immediate fix, a feel drill, a technical drill, and a constraint drill) plus a one-week schedule.
- A **repeatability** score once you've logged a few sessions (how consistent your mechanics are).
- **Export** your report as JSON, CSV, or a printable **PDF**, and save sessions to **compare** over time.

**Coaching a team or a child?** The **Coach & Team** page (Analyze → Coach & Team, or `/coach`) lets you group sessions by athlete, see each athlete's progress and recurring issues, and spot the weakness a whole roster shares — all kept on your device.

**Single camera vs. two cameras:**
- **One camera** (the default) gives an *estimated* 3D reconstruction. A "Pro 3D depth" option uses SwingVantage's trained model to sharpen the depth.
- **Two cameras** ("true 3D" mode): film the *same rep* from two angles about 90° apart and SwingVantage combines them into **measured** 3D. If the two clips don't line up well, it honestly shows lower confidence instead of guessing.

> Honesty by design: single-camera results are labeled estimates, two-camera results are labeled measured, and every number carries a confidence. Motion Lab makes **no** medical, injury, or tour-grade claims.

---

## 9c. Athlete GI — Your Cross-Sport Read

Found at **Analyze → Athlete GI** in the sidebar (or `/agi`). Where every other tool is a *specialist* (one reads biomechanics, one matches drills, one tracks progress), **Athlete GI is the generalist** — it looks at everything you've analyzed, across every sport, at once.

**What it tells you:**
- Your **keystone** — the single skill that, once it improves, helps the most sports at the same time.
- What **transfers** between your sports (e.g. the rotation you've built in golf showing up in your tennis).
- **Recurring faults and plateaus**, and how your whole profile is trending over time — not just one number.
- **One plan**, scaled to how ready you are today, that leads with the drills *you* have already marked as helpful.

**How honest it is:** every conclusion shows *why* it reached it and *how confident* it is, and the whole picture carries a single **A–D trust grade** (with what would raise it). Single-camera inputs are always called estimates, never lab measurements. Nothing here is medical advice.

**Commit and prove it:** you can **commit to your plan** — Athlete GI sets a 2-week retest date and reminds you when it's due, so the loop actually closes. You can also copy, email, web-share, or print your cross-sport report to give to a coach. A compact summary shows up on your Today dashboard once you have a session, a stated goal, or a readiness signal.

It builds on the data you already have and gets sharper the more you analyze. No AI account required.

---

## 9d. 3D Swing Avatar

Found at **Analyze → 3D Swing Avatar** in the sidebar (or `/avatar`). A lightweight, rotatable **3D avatar view** of a swing for a quick visual read. For the full biomechanical breakdown — phases, metrics, scores, and a drill plan — use **Motion Lab** instead.

---

## 9e. Athletic Journey — Your Development Roadmap

Found at **Athletic Journey** in the sidebar (or `/journey`). Where Diagnose answers "what's wrong with this swing?", the Athletic Journey answers "where am I on the path, and what gets me to the next level?"

**What it does:**
- Places you on a sport-specific stage ladder (e.g. G0–G10 for golf, T0–T10 for tennis) from a **blend of signals** — your profile, any ratings, your videos, logged play, and practice.
- Shows the **evidence for and against** your stage, so it explains the call instead of just labeling you.
- Lays out **what to improve next** and builds a **weekly plan** to get there.

**Sport availability:** live now for **golf, tennis, pickleball, and padel**. Baseball, fast-pitch, and slow-pitch softball are shown honestly as **in development** (a real waitlist, never a faked score). Optional handicap, UTR/NTRP, or DUPR sharpen the read but are never required.

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

**Fault explanations adapt to you.** On Diagnose, Training, and Retest, each fault is explained for your role: players get a plain "here's what to feel" version, coaches get the technical cause and cue, and parents get a supportive, jargon-free version. Same finding, told the right way for whoever is reading.

---

## 11b. Retest — Prove the Change

A diagnosis is a starting point, not a verdict. The **Retest** page (in the main navigation) closes the improvement loop.

- It reminds you when a diagnosed finding is **due for a retest** — after you've had time to work the drills.
- Re-analyze under the **same conditions** (same camera angle, distance, and equipment) so the comparison is fair.
- SwingVantage then shows an honest **before-and-after read** of whether the finding actually changed.
- **Golf:** retests match curated faults against your fresh launch-monitor data.
- **Video sports:** retests compare a new video analysis to the earlier one.
- Reminders for what's due and the results you've already earned also appear on your dashboard.

> Retest comparisons are **directional reads** from your data and video — an honest "looks like it's moving the right way," not lab-measured biomechanics.

---

## 11c. Fix Stack — One Fix at a Time

Found at **Practice → Fix Stack** in the sidebar (or `/fix`).

Instead of a long list of everything that's a little off, the Fix Stack picks your **single highest-impact issue** and turns it into a simple three-step loop:

1. **Feel it** — one body cue you can actually feel, not ten swing thoughts.
2. **Drill it** — the single best-matched drill for your issue, your level, and the gear you have.
3. **Retest it** — a fair before/after so you know the fix actually worked, not just that you practised.

SwingVantage learns from what worked for you, so the next recommendation gets sharper. It runs on the data you already have — no AI account needed — and links straight to the Practice Schedule if you want to build a full week around your fix.

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

80+ drills across all seven sports, defaulting to your active sport.

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

## 15b. Player Arc — The Story of Your Improvement

Found at **Progress → Player Arc** in the sidebar (or `/arc`).

Where the Progress page shows the numbers, the Player Arc tells the **story** behind them:
- The patterns that keep coming back — your "flaw fingerprint."
- Which drills have actually worked for you (and which haven't).
- Honest proof of what each retest changed.

It builds automatically with every session and retest you add — no setup required.

---

## 15c. SwingVantage Labs — Foundations

Found at **Progress → SwingVantage Labs** in the sidebar (or `/labs`).

Labs is where SwingVantage's deeper, more personal tools grow up. Each one is **honest about its confidence and what it doesn't know yet** — some are early v1s. It currently includes:
- A daily **readiness score** (how primed you are to practise today).
- A private **player model** that learns your tendencies.
- **Cross-sport skill transfer** — how your skills carry between sports.
- Your personal **performance graph**.
- **Benchmark mirrors** that compare you to skill-level standards.

Everything is built privately on your own data and gets sharper the more you practise and retest.

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
- **Limitation notice:** SwingVantage has not analyzed the professional video frames — comparisons are observational only
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

**Share as an image.** Open your shareable report card and choose the **Image** action to turn it into a clean, ready-to-post square picture — your top priority, recommended drills, and practice plan in one shot. The image is created privately on your own device. On a phone it shares straight to your messages or social apps; on a computer it downloads so you can save or post it.

---

## 20. Settings

- **Units:** Yards or meters
- **Theme:** 7 curated themes (Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, Bird Print Lifestyle) under **Settings → Appearance** — visual layer only, never changes layout or coaching logic
- **Show estimated warnings:** Toggle the ⚠ Estimated labels
- **Coaching style:** Data-first, feel-first, balanced, encouragement
- **Default club for diagnose:** Pre-selects a club in the diagnostic dropdown
- **Backup & Restore:** Full backup and restore system (see below)
- **Reset App:** Clears all data (asks for confirmation)

---

## 20b. In-App Help Guides

Every major screen has a built-in step-by-step guide available at any time.

**How to open a guide:**
- **Mobile:** Tap the **?** icon in the top navigation bar
- **Desktop:** Click **Guide** in the bottom section of the left sidebar

The guide opens a panel on the right side (desktop) or slides up from the bottom (mobile). It explains what the current screen does and walks you through it step by step.

**Navigation:**
- Use **Next** and **Back** buttons to move between steps
- Use the `←` and `→` arrow keys on a keyboard
- Press `Escape` to close
- Tap the dot indicators to jump to any step

**Saving progress:**
- Your guide history is saved automatically
- Completed guides are marked so you know you've been through them
- You can re-open any guide as many times as you want
- To reset all guide progress: **Settings → Data Management → In-App Guides → Reset Guides**

**Guides are included in your backup.** When you restore from a backup on a new device, your guide history comes with it.

---

## 21. Data Center & Backup / Restore

There are two ways to access backup and restore:
- **Data Center** — primary hub at `/data` (link in the sidebar under Community)
- **Settings → Backup & Restore** — for a focused backup-only view

---

### What your backup includes (v1.2.0)

Everything SwingVantage knows about you is in one file:

| Category | Examples |
|---|---|
| Golf profile | Handicap, goals, skill level, miss tendency |
| Sport profiles | Tennis, pickleball, padel, baseball, slow/fast softball profiles |
| All sessions | Every session with shot data, scores, diagnoses, notes |
| Equipment | All clubs, bats, rackets with specs |
| Video analyses | All analysis results, scores, identified issues |
| Training progress | Drill history, streaks, milestones |
| **Badges & XP** | Every earned badge, total XP, challenge history |
| **Tutorial progress** | Which in-app guides you have completed or dismissed |
| Settings | Language, units, coaching style, display preferences |

> **Not included:** Raw video files, passwords, API keys, or payment data (none of these are stored).

---

### Downloading a backup

1. Open the **Data Center** (`/data`) or **Settings → Backup & Restore**
2. Review the contents list — it shows a live summary of everything that will be exported
3. Optionally toggle "Encrypt with password" and enter a password (recommended)
4. Click **Download Backup**
5. Save the file somewhere safe — iCloud, Google Drive, USB drive, or email it to yourself

> ⚠️ If you encrypt, do not forget your password — there is no recovery option.

---

### Restoring from a backup

1. Click **Select Backup File** under "Restore from Backup"
2. Select your `.json` or `.swingiqbackup` file
3. If the file is encrypted, enter your backup password
4. **Review the preview** — it shows every category being restored with counts before anything changes
5. Old backups (v1.0.0, v1.1.0) are automatically upgraded to the current format
6. Choose your restore mode:
   - **Merge** — adds new records from the backup to your current data (recommended; deduplicates automatically)
   - **Replace** — clears all current data and fully restores the backup (requires confirmation)
7. A result summary shows what was restored, skipped, and any warnings

---

### Transferring progress to a new device

1. Download a backup on your old device
2. Email it to yourself or save it to cloud storage
3. Open SwingVantage on the new device
4. Go to Data Center → Restore → select the backup file → Merge

---

### Protecting your backup file

The backup contains your personal training history. Treat it like a private document:
- Do not share it publicly
- Store it in cloud storage or a password manager
- If you use encryption, record the password somewhere secure separately

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

Use this to get data into SwingVantage from a screenshot or photo of a performance table.

1. **Upload:** Select your sport and movement type, choose the data source (FlightScope, TrackMan, HitTrax, etc.), and upload your image (jpg, png, webp — max 10 MB)
2. **Extract & Review:** If auto-extraction is available, SwingVantage reads the numbers off your image and pre-fills the table with a confidence note (e.g. "Auto-extracted 6 rows at medium confidence — please review every value"). Otherwise the table starts blank. Either way, you enter or correct values into the editable table. Columns are pre-populated based on the source you selected. Add or delete rows as needed.
3. **Confirm:** Review your final data before saving. A privacy notice confirms your data stays local.
4. **Analyze:** Your confirmed data is saved and routed to the diagnostic engine.

> Auto-extraction (OCR) runs only when an extraction provider is configured, and it's purely a head start — every value lands in the review table for you to check before anything is saved. Manual entry is always the default, fully supported workflow, and no unreviewed OCR output is ever analyzed.

---

## 24. Newer Features

These shipped recently and each has a fuller how-to of its own.

- **Athletic Journey** (`/journey`) — your stage-by-stage development roadmap (see section 9e). Live for golf, tennis, pickleball, and padel. Full doc: [`ATHLETIC_JOURNEY.md`](ATHLETIC_JOURNEY.md).
- **Daily Notes** (`/notes`) — a quick "How did you play today?" capture (a 1–5 self-rating plus free text). SwingVantage reads honest fault tags from your own words and feeds them into your cross-sport profile; recurring issues get flagged as patterns. Self-ratings are clearly labeled low-confidence self-reports, never measurements.
- **BodySync** (`/bodysync`) — an opt-in, consent-gated health-and-readiness layer for **adults 18+**. A daily wellness check-in becomes a readiness score that scales how hard to train today, with a fatigue heads-up and health-aware practice adjustments. Not medical advice; data is yours to export or delete. Full doc: [`BODYSYNC.md`](BODYSYNC.md).
- **Recruiting Hub** (`/recruiting`, public coach view at `/player/[slug]`) — build a recruiting profile where every stat is labeled **verified vs. self-reported**, with a film library, highlight-reel builder, downloadable recruiting packet, coach outreach, and analytics. You control exactly what each coach can see. Full doc: [`recruiting-hub.md`](recruiting-hub.md).
- **Video Library** (`/library`) — one hub for every feature walkthrough plus a growing catalogue of training videos (swing path, launch monitors, drills, coaching, film study). Full doc: [`VIDEO_LIBRARY.md`](VIDEO_LIBRARY.md).

Pickleball and padel are now first-class sports across the whole app — pick them from **Active Sport** and every tool (Diagnose, Drills, Equipment, Athletic Journey) retargets to them.
