# SwingVantage — Data Import Guide

How to get your performance data into SwingVantage for every sport.

---

## Golf: Launch Monitor CSV Import

### Step-by-step import

1. Click **Import Data** in the left sidebar (only shows for golf)
2. Choose your launch monitor brand
3. Upload your CSV file (drag-and-drop or browse)
4. Review column mapping — adjust anything that looks wrong
5. Check validation warnings
6. Preview the first 10 shots
7. Name your session
8. Click **Import Session**

---

### Understanding Golf Metrics

#### Ball Flight (what the ball does)

| Metric | Plain English | Why it matters |
|---|---|---|
| Carry Distance | How far the ball travels in the air | Primary distance measurement |
| Total Distance | Carry + roll | Course management |
| Ball Speed | How fast the ball leaves the face (mph) | Measures energy transfer |
| Launch Angle | Angle the ball leaves the ground (°) | Affects carry and height |
| Spin Rate | How fast the ball spins (rpm) | Affects height, distance, stopping |
| Spin Axis | Tilt direction of spin (left = draw, right = fade) | Determines ball curve |
| Apex Height | Highest point of ball flight (yards) | Shows flight shape |
| Descent Angle | Angle ball is falling at landing (°) | Stopping power on greens |
| Side Carry | Lateral distance from target line (yards) | Accuracy measurement |
| Smash Factor | Ball speed ÷ club speed | Strike efficiency |

#### Club Delivery (what the club does at impact)

| Metric | Plain English | Why it matters |
|---|---|---|
| Club Speed | Clubhead speed at impact (mph) | Raw power potential |
| Attack Angle | Whether club moves up or down at impact (°) | Affects launch and spin |
| Club Path | Direction of club swing relative to target (°) | Affects ball start |
| Face Angle | Direction the face points at impact (°) | Primary curve cause |
| Face-to-Path | Face angle relative to club path (°) | **Most important for shot shape** |
| Dynamic Loft | Actual loft delivered (°) | Affects launch and spin |
| Spin Loft | Dynamic loft minus attack angle (°) | Determines spin rate |
| Low Point | Where club bottoms out relative to ball (inches) | Fat/thin indicator |

#### Strike Location

| Metric | Plain English |
|---|---|
| Impact Location X | Left-right on face (negative = heel, positive = toe) |
| Impact Location Y | High-low on face (negative = low, positive = high) |

---

### What Face-to-Path Actually Means

Face-to-path is the most important single metric for diagnosing shot shape.

- **+4°** (positive): Face is open relative to path → causes fade or slice
- **-4°** (negative): Face is closed relative to path → causes draw or hook
- **0°**: Face and path match → ball goes straight or curves predictably

Target range: **-3° to +3°** for most golfers.

---

### How to Export from Each Launch Monitor

#### FlightScope Mevo / Mevo+ / Mevo Gen 2

**iPhone/iPad (FS Golf app):**
1. Open the **FS Golf** app.
2. Tap **Sessions** at the bottom.
3. Tap the session you want.
4. Tap the share icon (top right) → **Export Session** → CSV.
5. Send yourself via email, AirDrop, or save to Files.

**What FlightScope provides:**
- Ball speed, club speed, carry, launch angle, spin rate, spin axis, smash factor ✓
- Attack angle, club path, face angle, face-to-path, dynamic loft ✓ (Mevo+ and above only)
- Strike location: not available on original Mevo

---

#### TrackMan 4 / TrackMan iO

**TrackMan App or Web Dashboard:**
1. Select your session.
2. Tap the export/share icon.
3. Choose **Export to CSV** or **Download Data**.
4. Email or download to computer.

**What TrackMan provides:**
- All ball flight metrics ✓
- All club delivery metrics ✓
- Strike location ✓ (with camera)
- High accuracy across all metrics

---

#### Foresight GCQuad / GC3 / Bushnell Launch Pro

**FSX Software (PC/Mac):**
1. Open FSX or FSX Play.
2. Go to **File → Export Data**.
3. Select your session from the history.
4. Click Export → choose CSV format.

**Note:** Foresight sometimes exports distances in meters. SwingVantage detects this and converts automatically.

**What Foresight provides:**
- All ball data ✓
- Back spin + side spin (converted to spin rate and spin axis) ✓
- Club delivery: GCQuad provides full data; GC3 provides most metrics ✓
- Strike location ✓ on GCQuad with camera

---

#### SkyTrak / SkyTrak+ / ST Max

**SkyTrak App:**
1. Go to the Range or Game Zone session history.
2. Tap the session → Share icon → **Export CSV**.
3. Email to yourself.

**What SkyTrak provides:**
- Ball speed, carry, launch angle, spin rate, spin axis ✓
- Club speed ✓ (SkyTrak+ and above)
- Club path: limited on original SkyTrak; improved on SkyTrak+

---

#### Uneekor Eye Mini / Eye XO / Eye XO2 / Eye XR

**View Software (PC):**
1. Click **Reports → Sessions**.
2. Select the session.
3. Click **Export → CSV**.

**What Uneekor provides:**
- All ball data ✓
- All club delivery data ✓ (varies by model)
- Strike location ✓ (with camera ball tracking)

---

#### Garmin Approach R10

**Garmin Golf App:**
1. Tap the **Activity** icon (bottom bar).
2. Tap the range session.
3. Tap three dots → **Export Activity** → CSV.

**What Garmin provides:**
- Ball speed, club speed, carry, launch angle, spin rate ✓
- Attack angle, club path, face angle ✓ (lower accuracy than dual-radar systems)
- Note: Garmin is camera-based. Delivery metric accuracy is lower than TrackMan or Foresight.

---

#### Rapsodo MLM / MLM2PRO

**Rapsodo App:**
1. Tap **History** → your session.
2. Tap share → **Export as CSV**.

**What Rapsodo provides:**
- Ball speed, carry, launch angle, spin rate, video (MLM2PRO) ✓
- Club delivery data: limited — Rapsodo is primarily a ball-flight device

---

#### Full Swing KIT

**Full Swing App:**
1. Navigate to your session.
2. Tap export/share → **CSV export**.

---

### What Can Be Diagnosed with Partial Data

| Data available | What can be diagnosed |
|---|---|
| Carry distance only | Inconsistent carry, distance gaps |
| + Ball speed | Strike quality (smash factor) |
| + Launch angle + spin rate | Launch window, spin window, distance optimization |
| + Face-to-path + club path | Face control, path pattern, shot shape |
| + Attack angle + dynamic loft | Full diagnosis — all 24 diagnostic rules can run |

**The import wizard always tells you what is missing and what can still be diagnosed.** A partial dataset still produces useful analysis — it just means some rules won't have enough evidence.

---

## All Sports: Screenshot / Photo Import

No CSV export? Snap a photo (or screenshot) of the numbers on your launch monitor, app, or printout and import them directly. This works for **every sport**, not just golf.

### Step-by-step

1. Go to **Sessions → Import from Screenshot/Photo** (`/sessions/import/image`)
2. Upload or drag-and-drop a photo or screenshot of your performance table
3. **Extract & Review** — if an extraction provider is configured, SwingVantage reads the numbers off the image to pre-fill the table (each value carries a confidence note); without a provider it drops straight to manual entry
4. **Review and edit every value** — nothing is analyzed until you confirm it
5. **Confirm** the session name and details
6. Save → the data flows into the same diagnosis and history as a CSV import

**Supported sources:** FlightScope, TrackMan, Foresight, SkyTrak, Uneekor, Garmin, Rapsodo, HitTrax, Blast Motion, Zepp, spreadsheets, and any readable table of numbers.

**Important honesty notes:**
- Manual entry is always the default, supported path — image extraction is an optional accelerator
- No unreviewed extracted output is ever analyzed; you always review and edit before saving
- Extraction reads numbers off an image — it does not measure your swing

---

## Non-Golf: Video Upload

For tennis, baseball, slow pitch softball, and fast pitch softball, video is the primary data source.

### How to record a good swing video

| Angle | Best for | Sport recommendation |
|---|---|---|
| Open Side (face-on) | Hip rotation, stride, contact point | All bat sports (best all-around) |
| Behind player (down-the-line) | Racquet/bat path, extension | Tennis, baseball |
| Catcher view | Bat path, extension through zone | Baseball, fast pitch |
| Pitcher view | Contact point, front-side mechanics | All bat sports |

**Tips for better video:**
- Film at the highest frame rate your phone supports (60fps or 120fps is ideal)
- Ensure good lighting — avoid backlighting
- Keep the full body in frame with some space above the hands
- Phone video in landscape mode gives the best resolution
- 5–15 second clips are ideal (you don't need the whole session)

### Uploading

1. Switch your active sport to the correct sport
2. Click **Video Analysis** in the sidebar
3. Upload or drag-and-drop your video file
4. Select the camera angle
5. Click **Analyze**

Supported formats: MP4, MOV, WebM. Max recommended size: 100MB.

---

## Non-Golf: Manual Session Log

No video? You can still log sessions manually.

1. Click **Log Session** in the sidebar (non-golf)
2. Enter session name, type, duration, and swings taken
3. Describe what you worked on
4. Note the outcome and how it felt
5. Click **Log Session**

Manual sessions build your history, contribute to your practice streak, and add to your milestones — even without video analysis.

---

## Tips for Best Results

1. **Golf:** Import after every range session, even a short one. 10+ shots per club gives the best diagnosis.
2. **Non-golf:** Side-angle video at 60fps or higher gives the most useful phase analysis.
3. **All sports:** Be consistent with your notes — good session names ("Driver session — working on path, May 25") are easy to track later.
4. **Golf:** Use the same ball across sessions when possible — different balls have different spin rates.
5. **Golf:** Mark warm-up shots by deleting the first 3–5 if they are clearly different from your normal swing.
6. **All sports:** Review the AI Coach after each import — it personalizes based on your latest data.
