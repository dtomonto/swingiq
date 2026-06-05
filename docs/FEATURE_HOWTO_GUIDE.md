# SwingIQ — Feature How-To Guide

**The do-this-then-that companion to every feature.** Where
[`WEB_APP_GUIDE.md`](WEB_APP_GUIDE.md) *describes* what each feature is, this guide
walks you through *how to actually use it*, step by step.

## In Plain English (start here)

SwingIQ is a free web app for golf, tennis, baseball, slow-pitch softball, and
fast-pitch softball. You open it in a browser — nothing to install, no account
needed — pick your sport, and start. Everything below is written as plain
numbered steps so anyone (player, parent, coach) can follow along.

Three things that are true everywhere in the app:

1. **Pick your sport first.** The whole app rewires itself to your sport. The
   switcher is at the bottom-left, labeled **Active Sport**.
2. **Your data stays on your device.** No account is required, and your video
   never leaves your browser during analysis.
3. **Every screen has a built-in guide.** Stuck? Tap the **?** (mobile) or click
   **Guide** (desktop) for a step-by-step walkthrough of the screen you're on.

> **Honesty note you'll see throughout:** results from a single phone camera are
> labeled **estimated** with a confidence level; SwingIQ makes no medical,
> injury, or tour-grade claims. That's by design.

---

## Quick start — your first 5 minutes

1. **Open SwingIQ** in your browser (phone, tablet, or computer).
2. **Choose who you are** if asked (athlete / parent / coach) — this sets safe
   defaults. You can change it later in Settings.
3. **Pick your sport** from **Active Sport** (bottom-left).
4. **Fill in your Profile** (a minute is enough) so coaching is personalized.
5. **Analyze something:**
   - Have launch-monitor data (golf)? → **Import Data**.
   - Have a phone video of a swing? → **Motion Lab (3D)** for the full 3D
     breakdown, or **Analyze Swing** for a quick 2D read.
6. **Read your top fix and do the recommended drill.** Come back, re-analyze, and
   use **Retest** to prove it changed.

---

## Getting around

- **Switch sports:** click **Active Sport** (bottom-left) → pick a sport.
  Everything (dashboard, drills, coaching, history) follows your choice and is
  remembered next time.
- **Navigate:** the left sidebar is grouped into a simple journey — **Today →
  Analyze → Practice → Progress → Share** — plus Account and Community below.
  Click a section header to expand its tools.
- **On a phone:** tap the menu icon (☰) at the top-left to open the sidebar.

---

# TODAY

## Dashboard — your home screen

**What it's for:** a daily "what should I do next?" snapshot for your active sport.

**Where:** `/dashboard` (Today).

**How to use it:**
1. Read the **"What should I do next?"** banner at the top — it points you to the
   single best next action.
2. Check your **primary issue / diagnosis** card and its evidence.
3. Tap **Today's focus drill** to jump straight into practice.
4. Glance at your **scores, streak, and recent session** to see where you stand.

**Tip:** the dashboard changes completely by sport — switch sports to see each
one's home screen.

---

# ANALYZE

## Diagnose (Golf) — read your launch-monitor data

**What it's for:** turn a session of launch-monitor numbers into ranked, fixable
patterns.

**Where:** `/diagnose` (Analyze → Diagnose).

**How to use it:**
1. Import a session first (see **Import Data**), or pick one from the dropdown at
   the top.
2. Read the **score rings** (overall, face, path, strike, dispersion).
3. Work down the **diagnosed patterns** — they're ranked by priority. Each shows
   the problem, the evidence, the likely cause, the drill, and a **retest
   protocol** so you can measure success.
4. Start with the top pattern; ignore the rest until it's fixed.

**Tip:** each fault is explained for *your* role — player, coach, or parent — so
the same finding reads the right way for whoever's looking.

## Analyze Swing / Video Analysis — quick 2D read

**What it's for:** a fast, sport-aware read of a swing video with phase timing and
drills.

**Where:** `/video` (Analyze → Video Analysis).

**How to use it:**
1. **Upload** a video (MP4, MOV, or WebM). A side / face-on view works best.
2. **Configure:** confirm the sport and pick your **camera angle**, then click
   **Analyze**.
3. **Read the results:** a phase timeline, detected issues with severity, coaching
   cues, recommended drills (with YouTube links), and a 0–100 visual score.
4. Click **Save to sessions** to keep it in your history.

**Tip:** every detection is labeled **⚠ Estimated** — treat it as a directional
read, not a measurement. For a deeper, 3D breakdown, use **Motion Lab** instead.

## Motion Lab (3D) — the full motion breakdown

**What it's for:** turn one phone clip into a spinnable 3D reconstruction with
phase breakdown, biomechanics, kinetic chain, timing, an implement-path estimate,
a coach's read, and drills — all on your device.

**Where:** `/motion-lab` (Analyze → Motion Lab (3D)).

### A. Run an analysis
1. **Pick your sport and motion** (e.g. driver / iron / wedge / putt for golf;
   forehand / serve for tennis; hitting / pitching for baseball/softball).
2. **Upload or record** a clip. Use **Trim** to keep just the rep, and set your
   **handedness** and **skill level** (skill level sets the targets you're scored
   against).
3. Pick a **tracking accuracy** tier — Fast, Balanced, or Accurate.
4. Click **Analyze**. It runs entirely in your browser; your video never uploads.

### B. Read the 3D viewer
1. **Drag** to orbit, use the **zoom** buttons, and **scrub** the timeline (each
   colored block is a phase — click to jump to it).
2. Toggle overlays with the toolbar buttons: **trails** (hand/head paths),
   **labels** (joint names), and the **crosshair** button for the **estimated
   club/bat/racket path** + contact-zone marker (orange).
3. Use **front / side / top** presets, and the **camera** button to save a PNG.

### C. Read the Scores tab
1. See your **overall Motion Score** plus six components (power, sequencing,
   rotation, balance, timing, consistency), each with a confidence level.
2. Open the **Kinetic chain** card to see the firing order — do your hips, torso,
   arms, then the implement peak in the right sequence? — and any **power-leak
   flags** (e.g. "upper body leads", "early cast").
3. Open the **Timing** card for load / transition / acceleration durations,
   contact-window stability, and tempo.

### D. Read the Coaching tab
1. Start with **Your coach's read** — a short, plain summary in the SwingIQ
   format: main finding → why → evidence → what to feel → one cue → one drill →
   next upload.
2. Below it, the full **coaching report** lets you switch tone (beginner,
   athlete, coach, youth/parent, data) and shows the **top 3 fixes** and what
   *not* to change.

### E. Drills, compare, and repeatability
1. The **Drills** tab gives four drills (immediate, feel, technical, constraint)
   plus a one-week plan.
2. After you've analyzed the same motion a few times, the **Compare** tab overlays
   an earlier session as a grey "ghost", lists what improved, and shows a
   **repeatability** score (how consistent your mechanics are).

### F. Two-camera "true 3D" (optional)
1. Film the **same rep** from two angles about 90° apart.
2. Choose the two-camera mode and upload both clips. SwingIQ triangulates them
   into **measured** 3D — and if they don't line up, it honestly lowers the
   confidence instead of guessing.

### G. Export
- Use **JSON**, **CSV**, or the printable **PDF** coach report buttons. Sessions
  are saved on your device so Compare works over time.

**Tip:** for a quick check anytime, open the **Technical details (AI validation)**
panel under the 3D & Phases tab — it shows per-frame tracking confidence, dropped
frames, and the raw internals.

## Coach & Team — track a whole roster

**What it's for:** coaches and parents grouping Motion Lab sessions by athlete to
see each athlete's progress and the weaknesses a team shares. Everything stays on
your device.

**Where:** `/coach` (Analyze → Coach & Team).

**How to use it:**
1. **Add an athlete:** type a name (e.g. "Jordan" or "#7 Smith") and click **Add
   athlete**. Repeat for everyone.
2. **Assign sessions:** under **Unassigned sessions**, use each row's dropdown to
   tag a Motion Lab session to an athlete.
3. **Read the Team report:** athlete count, total sessions, team average, who's
   been active in the last 7 days, the **most common weakness across the roster**,
   and who **needs attention** (no recent upload or trending down).
4. **Read each athlete card:** their average score, a trend sparkline, best score,
   last-active date, and recurring issues. Remove an athlete with the trash icon
   (their sessions stay, just unassigned).

**Tip:** there are no accounts — the roster lives only on this device. Use the
same device (or restore a backup) to keep it.

## Athlete GI — the cross-sport generalist

**What it's for:** one engine that looks across *all* your sports at once and finds
the single weakness that, if fixed, helps the most sports — and how skills carry
between them.

**Where:** `/agi` (Analyze → Athlete GI). See
[`athlete-general-intelligence.md`](athlete-general-intelligence.md) for depth.

**How to use it:**
1. Analyze a few sessions in **more than one sport** (it needs breadth to compare).
2. Open Athlete GI and read its cross-sport findings — e.g. "this weakness shows
   up in three sports" or "your rotation in golf carries over to tennis."
3. Every conclusion shows *why* it reached it and *how confident* it is.

**Tip:** it gets more useful the more sports and sessions you feed it.

## 3D Swing Avatar

**What it's for:** a 3D avatar view of a swing.

**Where:** `/avatar` (Analyze → 3D Swing Avatar).

**How to use it:** open the page and follow the on-screen prompts to view the
avatar. For the full biomechanical breakdown, use **Motion Lab** instead.

## AI Coach — ask questions about your game

**What it's for:** a chat that answers using *your* actual data.

**Where:** `/ai-coach` (Analyze → AI Coach), or the floating **AI** button.

**How to use it:**
1. Open it and pick one of the **suggested questions**, or type your own.
2. The coach answers in sport-appropriate language, grounded in your stats,
   diagnosis, and analyses.

**Tip:** it works with or without an AI key — with no key it returns
data-grounded summaries from your own analysis (never invented advice).

## Import Data (Golf) / Log Session (non-golf)

**What it's for:** get a practice session into SwingIQ.

**Where:** `/sessions/import` (Analyze → Import Data / Log Session).

**Golf — Import Data:**
1. Choose your launch-monitor **brand**.
2. **Upload your CSV** (drag-and-drop or browse).
3. **Check the column mapping** and fix anything that looks off.
4. Review warnings, **preview the first 10 shots**, name the session, and click
   **Import**.

**Non-golf — Log Session:**
1. Name the session and choose its **type** (tee work, cage BP, match, etc.).
2. Enter optional metrics (swings, duration), note what you worked on, and rate
   how it felt (1–5).
3. Click **Log Session**.

## Import from Image (photo / screenshot)

**What it's for:** get numbers in from a **photo or screenshot** of a
launch-monitor / performance table.

**Where:** `/sessions/import/image` (Sessions → Import from Image).

**How to use it:**
1. **Upload:** pick your sport, movement, and data source (TrackMan, HitTrax,
   etc.), then upload the image (jpg/png/webp, max 10 MB).
2. **Extract & review:** if auto-extraction (OCR) is available it pre-fills the
   table with a confidence note; otherwise enter values yourself. **Check every
   value** — add or delete rows as needed.
3. **Confirm**, then **Analyze** — your reviewed data routes to the diagnostic
   engine.

**Tip:** nothing OCR reads is ever analyzed unreviewed — manual entry is always
the safe default.

---

# PRACTICE

## Training — work your current fix

**What it's for:** the full routine for your active diagnosis, as a checklist.

**Where:** `/training` (Practice → Training).

**How to use it:**
1. Set your **skill level** (Beginner → Elite).
2. Work the **interactive drill checklist** — check off each step to build your
   practice streak.
3. Use the **"Is my training working?"** card to see before/after on your target
   metric, and the **retest protocol** when you're ready to prove it.

## Fix Stack — one fix at a time

**What it's for:** your single highest-impact issue, turned into a 3-step loop.

**Where:** `/fix` (Practice → Fix Stack).

**How to use it:**
1. **Feel it** — read the one body cue.
2. **Drill it** — do the single best-matched drill for your level and gear.
3. **Retest it** — run the fair before/after.

**Tip:** SwingIQ learns from what worked for you, so the next pick gets sharper.

## Drill Library

**What it's for:** 80+ drills across all sports.

**Where:** `/drills` (Practice → Drills).

**How to use it:**
1. Filter by **sport**, **difficulty**, or **search** a keyword.
2. Open a drill card for reps/duration, equipment, safety notes, and a YouTube
   link.

**Tip:** the **Recommended for Your Swing** card up top pulls from your current
diagnosis.

## Practice Schedule

**What it's for:** an auto-built 7-day practice week around your diagnosis.

**Where:** `/practice` (Practice → Practice Schedule).

**How to use it:**
1. Set your **frequency** (1×–5× or Daily) and **session length** (Short / Medium
   / Long).
2. Click any **day card** to expand its blocks (warm-up, main work, retest,
   cool-down) with focus metric and drill links.

## Pre-Round / Pre-Game Warm-Up

**What it's for:** a quick, sport-specific warm-up before you play.

**Where:** `/pre-round` (Practice → Pre-Round / Pre-Game Warm-Up).

**How to use it:**
1. Work down the exercise list, **checking each off** as you go.
2. Read the **key thought** to take into the round/game.

---

# PROGRESS

## Progress — the numbers over time

**What it's for:** trend charts and personal bests for your sport.

**Where:** `/progress` (Progress → Progress).

**How to use it:** open it to see your score trend, biggest changes, personal
bests, and recurring issues. Switch sports to see each one's progress.

## Player Arc — the story behind the numbers

**What it's for:** your recurring patterns ("flaw fingerprint"), which drills
actually worked, and honest retest proof.

**Where:** `/arc` (Progress → Player Arc).

**How to use it:** just keep adding sessions and retests — it builds the narrative
automatically.

## Sessions — your history

**What it's for:** every session for your active sport.

**Where:** `/sessions` (Progress → Sessions).

**How to use it:**
1. Use the **All Sports** toggle (top-right) to see everything at once.
2. **Click a session** for the full detail: score rings, diagnosis, dispersion
   chart, shot table, and a notes editor (**Add Notes**).

## Retest — prove the change

**What it's for:** an honest before/after on whether a fix actually worked.

**Where:** `/retest` (Progress → Retest).

**How to use it:**
1. Wait until a finding is **due for retest** (you'll be reminded).
2. Re-analyze under the **same conditions** (angle, distance, equipment).
3. Read the **before-and-after** read — golf compares launch-monitor data; video
   sports compare a new analysis to the old one.

## Milestones — badges

**What it's for:** achievement badges for your sport.

**Where:** `/milestones` (Progress → Milestones).

**How to use it:** open it to see unlocked/locked badges and a hint for how to
earn each one. They unlock as you build profiles, analyze, and practice.

## SwingIQ Labs — foundations

**What it's for:** deeper, personal tools (daily readiness, a private player
model, cross-sport skill transfer, a performance graph, benchmark mirrors) — each
honest about its confidence.

**Where:** `/labs` (Progress → SwingIQ Labs).

**How to use it:** browse the cards; each gets sharper the more you practice and
retest. Everything is built privately on your own data.

## Compare & References

**What it's for:** compare your swing side-by-side with a pro reference.

**Where:** `/compare` (Progress → Compare & References).

**How to use it:**
1. **Browse References:** filter by sport, handedness, and style; open a card; for
   unverified entries use the provided YouTube search link.
2. Click **Select for Comparison**.
3. On the **Side-by-Side** tab, load **your** swing (upload or pick a saved
   analysis) on the left and the pro on the right; use the **phase checklist**
   below to compare positions.

**Tip:** SwingIQ hasn't analyzed the pro's frames — the comparison is
observational only.

## Benchmarks

**What it's for:** see how your numbers compare to skill-level and pro standards.

**Where:** `/benchmarks` (Progress → Benchmarks).

**How to use it:** open it and browse the benchmark tables for your sport — use
them as honest reference ranges, not a scoreboard.

---

# SHARE

## Reports — share with your coach

**What it's for:** a clean report of your game to send to a coach or fitter.

**Where:** `/reports` (Share & Coach).

**How to use it:**
1. Open the **Share with Your Coach** card.
2. Click **Copy Report** to copy the text, then paste it into a message or email.
3. Or choose the **Image** action to make a ready-to-post square picture (created
   privately on your device; shares on phone, downloads on desktop).

---

# ACCOUNT & SETUP

## My Profile

**What it's for:** the personal details that make every drill and coaching tip fit
you.

**Where:** `/profile` (Account → Profile).

**How to use it:**
1. Fill in your sport's fields (handedness, level, goals, typical miss,
   equipment).
2. Click **Save Profile**. Each sport has its own profile.

## Equipment (+ Loft Gapping for golf)

**What it's for:** store your clubs/bats/rackets; for golf, check your distance
gaps.

**Where:** `/equipment` (Account → Equipment).

**How to use it (golf):**
1. Add a club and pick its type — the **loft autofills** with a source/confidence
   badge (edit it anytime to make it "Custom").
2. Click **Loft Gapping** to see clubs sorted by loft with color-coded gaps
   (🟢 good · 🟡 tight · 🔴 large) and recommendations.

## Settings

**What it's for:** units, look, and coaching tone.

**Where:** `/settings` (bottom of the sidebar).

**How to use it:**
1. Set **Units** (yards/meters) and **Coaching style** (data-first, feel-first,
   balanced, encouragement).
2. Pick a **Theme** under **Appearance** (7 options — visual only, never changes
   coaching).
3. Toggle **Show estimated warnings** on/off.
4. Use **Backup & Restore** (see below) or **Reset App** (clears all data — asks
   first).

---

# COMMUNITY & DATA

## Community & Badges

**What it's for:** challenges, groups, leaderboards, and earned badges.

**Where:** `/community` and `/community/badges`.

**How to use it:** browse challenges and groups, and check **Badges** for what
you've earned and what's next.

## Data Center — Backup & Restore

**What it's for:** save everything SwingIQ knows about you into one file, and move
it between devices.

**Where:** `/data` (Community → Data Center), or **Settings → Backup & Restore**.

**Download a backup:**
1. Open **Data Center**; review the contents summary.
2. Optionally tick **Encrypt with password** (recommended) and set one.
3. Click **Download Backup** and save the file somewhere safe (cloud, USB, email).

> ⚠️ If you encrypt, don't forget the password — there's no recovery.

**Restore / move to a new device:**
1. On the new device, open **Data Center → Restore** and **Select Backup File**.
2. Enter the password if encrypted; **review the preview** of what will be
   restored.
3. Choose **Merge** (adds to current data — recommended) or **Replace** (wipes and
   restores). Read the result summary.

---

# HELP & OFFLINE

## In-app guides

Every major screen has a step-by-step guide. Open it with the **?** icon (mobile)
or **Guide** in the sidebar (desktop). Move with **Next/Back** or the arrow keys,
press **Escape** to close. Your progress is saved and included in your backup.

## Offline

If your connection drops (common at the range), a banner tells you, your work is
held safely on the device, and anything needing the internet finishes
automatically when you reconnect. Nothing to set up.

---

## One-page honesty & privacy recap

- **Estimated vs measured:** single-camera results are **estimates** with a
  confidence; only two-camera Motion Lab is labeled **measured**.
- **Private by default:** your video never leaves your browser during analysis;
  your data lives on your device unless you turn on cloud sync.
- **No overclaiming:** no medical, injury-prediction, or guaranteed-result claims
  anywhere. Review big changes with a qualified coach.

---

*Companion docs: [`WEB_APP_GUIDE.md`](WEB_APP_GUIDE.md) (feature reference),
[`BEGINNER_START_HERE.md`](BEGINNER_START_HERE.md), and
[`motion-lab.md`](motion-lab.md) (Motion Lab internals).*
