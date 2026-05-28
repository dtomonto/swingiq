# SwingIQ — Troubleshooting Guide

This guide covers the most common problems beginners encounter.
Each problem includes: what happened, why, and how to fix it step by step.

---

## Problem 1: "npm install" gives an error

**What you see:** Red error text after typing `npm install`

**Why it happens:** Node.js might not be installed correctly, or the terminal is in the wrong folder.

**How to fix it:**

1. Check that Node.js is installed:
   - Type `node --version` and press Enter.
   - If you see an error, go back to BEGINNER_START_HERE.md and reinstall Node.js.

2. Make sure the terminal is in the right folder:
   - At the top of the terminal, look at the path shown. It should end with `swingiq`.
   - If it doesn't, in VS Code: click Terminal → New Terminal. VS Code automatically opens the terminal in your project folder.

3. Try again: type `npm install` and press Enter.

---

## Problem 2: The web app won't start ("npm run dev:web" gives an error)

**What you see:** Error message after running `npm run dev:web`

**Common causes and fixes:**

### Fix A — Missing .env.local file
- Go to `apps/web/` in VS Code.
- If you don't see a file called `.env.local`, you haven't created it yet.
- Follow Part 2, Step 4 in BEGINNER_START_HERE.md.

### Fix B — Wrong Supabase URL or key
- Open `apps/web/.env.local`.
- Make sure the URL starts with `https://` and ends with `.supabase.co`.
- Make sure there are no spaces before or after the values.
- Make sure there are no quotation marks around the values.

### Fix C — Port 3000 is already in use
- What you see: `Error: listen EADDRINUSE: address already in use :::3000`
- Another program is using port 3000.
- Close any other terminal windows that might be running npm commands.
- Or, open Task Manager (Windows) or Activity Monitor (Mac) and close any node.js processes.

---

## Problem 3: The browser shows "This site can't be reached"

**What you see:** Browser error when going to http://localhost:3000

**Why it happens:** The web app isn't running yet, or it crashed.

**How to fix it:**
1. Go back to VS Code.
2. Check the terminal. Does it say `Local: http://localhost:3000`? If not, the app is not running.
3. Run `npm run dev:web` again.
4. Wait 15 seconds before refreshing your browser.

---

## Problem 4: Supabase schema gives errors when you run it

**What you see:** Red errors in the Supabase SQL Editor after pasting the schema.

**Common causes:**

### If the error says "already exists":
- The tables were already created from a previous attempt.
- This is usually fine. The schema uses `IF NOT EXISTS` to avoid duplicates.
- Scroll through the errors — if most are just "already exists", the setup worked.

### If the error says "permission denied":
- Make sure you are logged in to the correct Supabase project.
- Try logging out of Supabase and back in.

### If the error says "syntax error":
- The SQL text may have been partially copied.
- Go back to VS Code, open `server/supabase_schema.sql`.
- Press Ctrl+A to select ALL the text.
- Press Ctrl+C to copy.
- Go back to Supabase SQL Editor.
- Click in the text box.
- Press Ctrl+A to select any existing text.
- Press Delete to clear it.
- Press Ctrl+V to paste.
- Click Run.

---

## Problem 5: CSV import says "no data found" or "0 shots detected"

**What you see:** The import wizard shows 0 shots after uploading your file.

**Why it happens:** The CSV file may be empty, or the first row isn't recognized as column headers.

**How to fix it:**
1. Open your CSV file in Microsoft Excel or Google Sheets.
2. Make sure the first row contains column names (like "Carry Distance", "Ball Speed", etc.).
3. Make sure there is actual data in the rows below.
4. If the file looks correct but the import still shows 0, try saving it again from Excel as "CSV (Comma-Separated Values)".
5. Re-upload the new file.

---

## Problem 6: CSV import maps columns incorrectly

**What you see:** Carry distance shows up in the wrong column, or values look way too high or too low.

**Why it happens:** Different launch monitors use different column names. The auto-detection might not match your device's format exactly.

**How to fix it:**
1. In the import wizard, go to Step 3 (Map Columns).
2. For each SwingIQ field on the left, use the dropdown on the right to select the correct column from your file.
3. Look at your CSV file in Excel to find what each column is named.
4. Match them manually if the auto-detection was wrong.

---

## Problem 7: The diagnosis shows no issues detected

**What you see:** After importing, the Diagnose page says "No critical issues detected."

**Why it happens:** You may need more shots, or the data doesn't have enough detail for the diagnostic rules to trigger.

**How to fix it:**
1. Make sure you imported at least 10 shots from the same club.
2. Make sure the CSV includes face-to-path, club path, or spin axis data. Without these, some diagnoses cannot run.
3. Check the "Evidence" section — even if no critical issue is found, key metrics will still show.
4. If you only have carry distance data, the app can diagnose consistency but not face/path patterns.

---

## Problem 8: The mobile app shows a blank screen

**What you see:** The Expo app loads but shows a white or black screen.

**Why it happens:** The app may have crashed or the connection was lost.

**How to fix it:**
1. On your phone, close the Expo Go app completely.
2. Re-open Expo Go.
3. Tap "Recent" and reopen SwingIQ, or scan the QR code again.

---

## Problem 9: The mobile app can't connect to the server

**What you see:** Error about "network request failed" or "CORS"

**Why it happens:** Your phone and computer need to be on the same WiFi network.

**How to fix it:**
1. On your phone: go to Settings → WiFi. Note which network you are on.
2. On your computer: check you are on the same WiFi network.
3. If they don't match, connect both to the same WiFi and try again.

---

## Problem 10: Changes I made don't appear in the app

**What you see:** You saved your profile or added a club, but it's still showing old data.

**Why it happens:** The page may need to be refreshed, or data is being stored locally only (before Supabase is connected).

**How to fix it:**
1. Press F5 (Windows) or Command+R (Mac) to refresh the page.
2. If data is still missing, the Supabase connection may not be set up. Check your `.env.local` file has the correct values.

---

## When to Ask for Help

If you have followed all the steps in this guide and something still isn't working, describe the problem with:

1. Which step number from BEGINNER_START_HERE.md you were on
2. Exactly what you typed or clicked
3. A copy of the error message (if any)
4. What operating system you are using (Windows 10, Windows 11, Mac)
5. What version of Node.js you have (type `node --version` to check)

With this information, the problem can almost always be diagnosed and fixed.
