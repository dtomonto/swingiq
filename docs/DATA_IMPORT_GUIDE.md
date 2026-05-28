# SwingIQ — Data Import Guide

This guide explains how to export data from every major launch monitor brand,
what each metric means, and what to do when data is missing.

---

## Understanding Launch Monitor Metrics

Before importing, here is a plain-English explanation of each measurement.

### Ball Flight Metrics (what the ball does)

| Metric | What it means | Why it matters |
|---|---|---|
| Carry Distance | How far the ball travels through the air | Primary distance measurement |
| Total Distance | Carry + roll | Course management |
| Ball Speed | How fast the ball leaves the clubface (mph) | Power / energy transfer |
| Launch Angle | Angle the ball leaves the ground | Too high or low affects carry |
| Spin Rate | How fast the ball is spinning (rpm) | Affects height, distance, stopping |
| Spin Axis | Which direction the ball spins (left or right) | Causes curve |
| Apex Height | How high the ball gets at its peak | Flight shape |
| Descent Angle | Angle the ball is coming down at landing | Stopping power on greens |
| Side Carry | How far left or right of the target (yards) | Accuracy |
| Smash Factor | Ball speed ÷ club speed | Efficiency of contact |

### Club Delivery Metrics (what the club does at impact)

| Metric | What it means | Why it matters |
|---|---|---|
| Club Speed | How fast the clubhead is moving (mph) | Raw power potential |
| Attack Angle | Whether club is going up or down at impact (degrees) | Affects launch and spin |
| Club Path | Which direction the club is swinging (left or right of target) | Affects ball start direction |
| Face Angle | Which direction the clubface is pointing at impact | Primary cause of ball curve |
| Face-to-Path | Face angle relative to club path | The most important metric for shot shape |
| Dynamic Loft | Actual loft delivered at impact | Affects launch angle and spin |
| Spin Loft | Difference between dynamic loft and attack angle | Determines spin rate |
| Low Point | Where the club bottoms out relative to the ball | Fat/thin contact indicator |

### Strike Metrics (where the ball hit on the face)

| Metric | What it means |
|---|---|
| Impact Location X | Left-right position on face (negative = heel, positive = toe) |
| Impact Location Y | Up-down position on face (negative = low, positive = high) |

---

## What "Face-to-Path" Actually Means

Face-to-path is the single most important metric for diagnosing shot shape.

- **Positive number** (e.g., +4°): Face is open relative to path → causes fade or slice
- **Negative number** (e.g., -4°): Face is closed relative to path → causes draw or hook
- **Zero** (0°): Face and path match → ball goes straight (or at least curves predictably)

Target: Between -3° and +3° for most golfers.

---

## How to Export from Each Launch Monitor

### FlightScope Mevo / Mevo+ / Mevo Gen 2

**On iPhone/iPad:**
1. Open the **FS Golf** app.
2. Tap "Sessions" at the bottom.
3. Tap the session you want.
4. Tap the share icon (top right corner — looks like a box with an arrow).
5. Tap "Export Session" → choose CSV.
6. Send to yourself via email or save to Files.

**What data FlightScope provides:**
- Ball speed ✓
- Club speed ✓
- Carry distance ✓
- Launch angle ✓
- Spin rate ✓
- Spin axis ✓
- Smash factor ✓
- Attack angle ✓ (Mevo+ and above)
- Club path ✓ (Mevo+ and above)
- Face angle ✓ (Mevo+ and above)
- Face-to-path ✓ (Mevo+ and above)
- Dynamic loft ✓ (Mevo+ and above)
- Strike location — not available on standard Mevo

---

### TrackMan 4 / TrackMan iO

**TrackMan App:**
1. Open the TrackMan app or web dashboard.
2. Select your session.
3. Tap the share / export icon.
4. Choose "Export to CSV" or "Download Data".
5. Email or download to your computer.

**What TrackMan provides:**
- All ball flight metrics ✓
- All club delivery metrics ✓
- Strike location ✓ (with camera)
- Very high accuracy

---

### Foresight GCQuad / GC3 / Bushnell Launch Pro

**FSX Software (PC/Mac):**
1. Open FSX or FSX Play.
2. Go to the main menu → File → Export Data.
3. Select your session from the history list.
4. Click Export → Choose CSV format.
5. Save to your computer.

**Note:** Foresight sometimes exports distances in meters.
The SwingIQ importer detects this automatically and converts to yards.

**What Foresight provides:**
- All ball data ✓
- Back spin (spin rate in their format) ✓
- Side spin (spin axis in their format) ✓
- Club data: GCQuad provides full club delivery; GC3 provides most
- Strike location ✓ on GCQuad with camera

---

### SkyTrak / SkyTrak+ / ST Max

**SkyTrak App:**
1. Go to the Range or Game Zone where you hit your shots.
2. Tap the session history icon.
3. Tap the session you want.
4. Tap the share icon → Export CSV.
5. Email the file to yourself.

**What SkyTrak provides:**
- Ball speed ✓
- Carry distance ✓
- Launch angle ✓
- Back spin (spin rate) ✓
- Side spin (spin axis) ✓
- Club speed ✓ (SkyTrak+ and above)
- Club path: limited on original SkyTrak; better on SkyTrak+

---

### Uneekor Eye Mini / Eye XO / Eye XO2 / Eye XR

**View Software (PC):**
1. Open View software.
2. Click Reports → Sessions.
3. Select the session you want.
4. Click Export → CSV.
5. Save to your computer.

**What Uneekor provides:**
- All ball data ✓
- All club delivery data ✓ (varies by model)
- Strike location ✓ (with camera ball tracking)
- Swing video if camera is set up

---

### Garmin Approach R10

**Garmin Golf App:**
1. Open the Garmin Golf app on your phone.
2. Tap the Activity icon (bottom bar).
3. Tap the range session.
4. Tap the three dots (more options) in the top right.
5. Tap "Export Activity" → choose CSV or JSON.
6. Email the file to yourself.

**What Garmin provides:**
- Ball speed ✓
- Club speed ✓
- Carry distance ✓
- Launch angle ✓
- Spin rate ✓
- Attack angle ✓ (limited accuracy)
- Club path ✓ (limited accuracy)
- Face angle ✓ (limited accuracy)
- Note: Garmin is a camera-based system. Accuracy on delivery metrics is lower than dual radar systems like TrackMan.

---

### Rapsodo MLM / MLM2PRO

**Rapsodo App:**
1. Open the Rapsodo app.
2. Tap History at the bottom.
3. Tap your session.
4. Tap the share icon.
5. Choose "Export as CSV" or "Send to Email".

**What Rapsodo provides:**
- Ball speed ✓
- Carry distance ✓
- Launch angle ✓
- Spin rate ✓
- Video (MLM2PRO) ✓
- Club delivery data: limited — Rapsodo is primarily a ball-flight device

---

### Full Swing KIT

**Full Swing App:**
1. Open the Full Swing app.
2. Navigate to your session.
3. Tap export or share.
4. Choose CSV export.

---

## What to Do When Data Is Missing

Different launch monitors provide different data. Here is what the app can diagnose with partial data:

### If you have ONLY carry distance:
- Can diagnose: inconsistent carry, distance gaps
- Cannot diagnose: face-to-path, path, attack angle issues

### If you have carry + ball speed:
- Can calculate smash factor
- Can diagnose: strike quality (smash factor)

### If you have carry + ball speed + launch + spin:
- Can diagnose: launch window, spin window, distance
- Cannot diagnose: face/path issues without face-to-path data

### If you have ALL data including face-to-path, path, dynamic loft:
- Full diagnosis available — all 12+ diagnostic rules can run

**The import wizard always tells you what is missing and what can still be diagnosed.**

---

## Manual Data Entry

If you don't have a CSV export, you can enter data manually:

1. Click "Import Data" → select "Manual Entry / Other".
2. Choose your club.
3. Enter numbers one shot at a time.
4. Even entering just carry distance for 10 shots creates a useful baseline.

Manual entry is less efficient than CSV import but works for any situation.

---

## Tips for Better Data

1. **Hit at least 10 shots per club** — the diagnostic engine needs enough data to find patterns.
2. **Use the same ball each session** — different balls have different spin rates, which affects carry.
3. **Note whether you're on mat or grass** — mat shots sometimes play differently.
4. **Tag each session clearly** — "Driver Session May 25" is better than "Session 1".
5. **Don't include warm-up shots** — your first 3–5 shots may not be representative of your swing.
