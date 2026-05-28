# SwingIQ Web App Guide

This guide explains everything about the web-based version of SwingIQ.
It is written for someone who is not a developer.

---

## 1. What Is the Web App?

The SwingIQ web app is a website that runs on your computer.
You open it in a browser (like Chrome or Edge) by going to:
`http://localhost:3000`

"Localhost" just means it's running on your own computer, not on the internet.
Think of it as a private app that only you can see.

The web app is the best place for:
- Importing launch monitor CSV files (easier with a mouse and keyboard)
- Reviewing detailed charts and session comparisons
- Generating and printing reports
- Deep analysis with multiple filters
- Reviewing swing video frame-by-frame
- Exploring the 3D avatar model

---

## 2. How Is It Different from the Mobile App?

| Feature | Web App | Mobile App |
|---|---|---|
| Best screen size | Desktop / laptop | Phone |
| Best for | Analysis, import, reports | Quick entry, field use |
| CSV import | Yes — drag and drop | Not yet |
| Video review | Yes — full controls | Basic view |
| 3D avatar | Yes | Web-based link |
| Charts | Large, detailed | Simplified |
| Typing | Easier on keyboard | Harder |

Both apps use the same account, same data, and same diagnoses.

---

## 3. How to Open the Web App Locally

1. Open VS Code.
2. Click Terminal → New Terminal.
3. Type `npm run dev:web` and press Enter.
4. Wait about 10 seconds.
5. Open Chrome or any browser.
6. Go to: `http://localhost:3000`

The app will open.

---

## 4. How to Log In

The login system is powered by Supabase (your database provider).

1. The first time: click "Sign Up" and create an account with your email.
2. Check your email for a confirmation link. Click it.
3. After that, you can log in with your email and password.

---

## 5. How to Create a Golfer Profile

1. In the left sidebar, click **"My Profile"**.
2. Fill in the form:
   - Your name
   - Your handicap
   - Your typical miss (e.g., "push-fade with driver")
   - How often you practice
   - What launch monitor you own
3. Click **"Save Profile"**.

Your profile helps the diagnostic engine personalize every recommendation.

---

## 6. How to Add Clubs

1. In the left sidebar, click **"Golf Bag"**.
2. Click the green **"Add Club"** button.
3. Fill in:
   - Club name (e.g., "7-Iron", "Driver", "52° Gap Wedge")
   - Category (Driver, Fairway Wood, Hybrid, Iron, Wedge, Putter)
   - Brand and model (optional but helpful)
   - Loft angle (check your clubhead if unsure)
   - Typical carry distance (how far it usually goes in the air)
4. Click **"Save Club"**.
5. Repeat for each club.

Start with: Driver, 7-Iron, and Pitching Wedge. You can add more later.

---

## 7. How to Import a CSV File

1. Click **"Import Data"** in the left sidebar.
2. **Step 1:** Choose your launch monitor brand from the list.
3. **Step 2:** Drag your CSV file into the upload box, or click "Browse for file".
4. **Step 3:** The app automatically detects the column names. Adjust any that look wrong.
5. **Step 4:** Review any warnings about missing data.
6. **Step 5:** Preview the first 10 shots to make sure the data looks right.
7. **Step 6:** Give your session a name.
8. **Step 7:** Click "Import Session".

Done. Your shot data is now saved.

---

## 8. How to Review a Session

1. Click **"Sessions"** in the left sidebar.
2. Click on a session name.
3. You will see:
   - Summary (how many shots, which clubs, date)
   - Shot table (each shot listed)
   - Charts (carry distance, face-to-path, dispersion)
   - Primary diagnosis for that session

---

## 9. How to Run a Diagnosis

1. Click **"Diagnose"** in the left sidebar.
2. The diagnostic engine runs automatically on your most recent session.
3. You will see:
   - **Primary Diagnosis** — the biggest issue (e.g., "Open Face / Slice Pattern")
   - **Evidence** — the data numbers that prove it
   - **Likely Cause** — what the swing is probably doing
   - **Training Routine** — what to practice
   - **YouTube Drills** — drill videos for your specific issue
   - **Retest Protocol** — how to check if you improved

---

## 10. How to Upload Video

1. Click **"Video Analysis"** in the left sidebar.
2. Click **"Upload Video"**.
3. Choose a video file from your computer.
4. The video player loads with these controls:
   - Play / Pause
   - Slow Motion (0.25x, 0.5x speed)
   - Frame-by-frame scrubbing
   - Draw lines overlay
5. Click phase buttons to jump to key swing positions.
6. Grade each phase (A/B/C/D/F).

---

## 11. How to Use the 3D Avatar

1. Click **"3D Avatar"** in the left sidebar.
2. The 3D golfer model appears.
3. Use your mouse to:
   - **Rotate**: Click and drag
   - **Zoom**: Scroll wheel
4. Use the phase slider at the bottom to scrub through the swing.
5. Click fault buttons (like "Open Face", "Heel Strike") to see what those look like.
6. The avatar shows your likely swing pattern based on your data.

**Important:** The avatar shows a likely pattern based on data — it is not a guaranteed exact copy of your body movement. The label "Likely movement pattern based on launch-monitor data" will always be shown.

---

## 12. How to Generate a Report

1. Click **"Reports"** in the left sidebar.
2. Choose what to include:
   - Golfer profile summary
   - Session summary
   - Club-by-club breakdown
   - Primary diagnosis
   - Training plan
   - Progress trend
3. Click **"Generate PDF Report"**.
4. The report downloads to your computer.
5. Open it and print it, or email it to your coach.

---

## 13. Common Beginner Problems

### "The page is blank"
- Wait 5 seconds and try refreshing (press F5).
- Make sure you ran `npm run dev:web` in the terminal.

### "I uploaded a CSV but it shows no shots"
- Open the CSV in Excel and confirm it has column headers in row 1.
- Re-save from Excel as "CSV (Comma-Separated Values)".
- Try again.

### "My club names don't match"
- In Step 3 of the import wizard, manually match your club column.
- Look for a column called "Club", "Club Name", or similar.

### "The diagnose page shows nothing"
- Import at least 10 shots from the same club first.
- The engine needs enough data to detect patterns.

### "I can't see my saved profile"
- Make sure Supabase is connected (`.env.local` has your URL and key).
- Refresh the page.

---

## 14. Next Steps After the Web App Is Working

1. Import sessions after every practice and range session.
2. Run the diagnosis each time.
3. Follow the training routine.
4. After 3–5 sessions, check the **Progress** page to see improvement trends.
5. Share a report with your coach or club fitter by generating a PDF.
