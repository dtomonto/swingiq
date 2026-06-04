# SwingIQ — Troubleshooting Guide

Step-by-step fixes for the most common problems.

---

## Problem 1: "npm install" gives an error

**What you see:** Red error text after typing `npm install`

**Fix 1 — Node.js not installed or outdated:**
1. Type `node --version` and press Enter.
2. If you see an error, go to https://nodejs.org, download the LTS version, and reinstall.
3. Close and reopen VS Code after installing, then try `npm install` again.

**Fix 2 — Terminal is in the wrong folder:**
1. Look at the terminal prompt — it should end with `swingiq`.
2. If it doesn't: in VS Code, click **Terminal → New Terminal** (this automatically opens in the project folder).
3. Try `npm install` again.

---

## Problem 2: "npm run dev:web" gives an error

**Fix A — Missing .env.local file:**
1. In VS Code Explorer, go to `apps` → `web`.
2. If you don't see `.env.local`, you haven't created it.
3. Right-click `.env.example` → Copy → Paste into the same `web` folder → rename the copy to `.env.local`.
4. Try again.

**Fix B — Port 3000 is already in use:**
- You see: `Error: listen EADDRINUSE: address already in use :::3000`
- Close any other terminal windows that may be running `npm` commands.
- On Windows: open Task Manager → find any `node.exe` processes → end them.
- On Mac: in Terminal, type `lsof -ti:3000 | xargs kill` and press Enter.
- Try again.

**Fix C — Stale build cache (EINVAL error):**
- You see something like: `EINVAL: invalid argument, readlink`
- Delete the cache folder: in VS Code terminal, type:
  ```
  npm run build
  ```
  If that also fails, delete `apps/web/.next` manually:
  1. In VS Code Explorer, right-click `apps/web/.next` → Delete.
  2. Run `npm run dev:web` again.

---

## Problem 3: Browser shows "This site can't be reached"

**Why:** The app isn't running yet, or it crashed.

**Fix:**
1. Check the VS Code terminal — does it say `Local: http://localhost:3000`?
2. If not, run `npm run dev:web` again.
3. Wait 15 seconds, then refresh your browser.

---

## Problem 4: The app loads but shows a blank white page

**Fix 1 — JavaScript error in browser:**
1. Press F12 to open browser developer tools.
2. Click the **Console** tab.
3. Look for red errors. Copy the error text.
4. Usually caused by a missing or malformed `.env.local` — check that file.

**Fix 2 — Build cache issue:**
1. Close the terminal running the dev server (press Ctrl+C).
2. Delete `apps/web/.next` folder.
3. Run `npm run dev:web` again.

---

## Problem 5: CSV import shows "0 shots detected" or "no data found"

**Fix 1 — Wrong file format:**
1. Open your CSV file in Excel or Google Sheets.
2. Make sure the first row contains column headers (like "Carry Distance", "Ball Speed").
3. Make sure there is real data below the headers.
4. Re-save from Excel as **CSV (Comma-Separated Values)**.
5. Try importing the new file.

**Fix 2 — Wrong launch monitor brand selected:**
1. In Step 1 of the import wizard, make sure you selected your actual device.
2. Different brands use different column names. Selecting the wrong brand causes mismatches.

**Fix 3 — Manual column mapping:**
1. In Step 3 of the import wizard, manually match your file's columns to SwingIQ's fields.
2. Check your CSV file in Excel to see exactly what each column is named.

---

## Problem 6: The diagnostic engine says "No critical issues detected"

**Why:** The engine needs enough data and the right metrics to detect patterns.

**Fix:**
1. Make sure you imported **at least 10 shots** from the same club.
2. Make sure the CSV includes face-to-path, club path, or spin axis data — without these, face/path diagnoses cannot run.
3. Basic devices (Garmin R10, entry SkyTrak) may not capture all club delivery data. The app will tell you what it can and cannot diagnose with your available data.
4. Check the "Key Metrics" section even if no critical diagnosis appears — individual metric values are still shown.

---

## Problem 7: Sport switcher isn't working or the wrong dashboard shows

**Fix:**
1. Click the **Active Sport** selector in the bottom of the left sidebar.
2. Select your sport from the dropdown.
3. The dashboard, profile, sessions, and training pages should all update immediately.
4. If the page content doesn't change: try a hard refresh (Ctrl+Shift+R on Windows, Command+Shift+R on Mac).
5. If it still doesn't change: open browser DevTools (F12) → Application → Local Storage → find `swingiq_active_sport` → confirm it shows your sport.

---

## Problem 8: AI Coach returns placeholder text instead of real answers

**Why:** No AI API key is configured, or the key is in the wrong place.

**Fix:**
1. Open `apps/web/.env.local` in VS Code.
2. Confirm these lines are present and correct:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
   or
   ```
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
3. Make sure the file is at `apps/web/.env.local` — **not** at the root `swingiq/.env.local`.
4. Restart the dev server: press Ctrl+C in the terminal, then run `npm run dev:web` again.
5. Refresh the AI Coach page and try again.

---

## Problem 9: My data disappeared after refreshing the page

**Why:** SwingIQ saves data in your browser's localStorage. Clearing browser data or switching browsers erases it.

**Fix:**
1. If you cleared browser history or cookies, the data is gone from that browser.
2. Going forward: use the same browser every time.
3. To protect your data now: open **Data Center** (`/data`) or **Settings → Backup & Restore** → **Download Backup**. Save the file somewhere safe — for an extra layer, set a password to export an encrypted `.swingiqbackup`. You can restore it on any device or browser.
4. For optional cross-device cloud sync, set up Supabase accounts later (see [OWNER_TASKS.md](OWNER_TASKS.md)).

---

## Problem 10: Video upload fails or shows "unsupported format"

**Why:** The video file format may not be supported, or the file is too large.

**Fix:**
1. Supported formats: MP4 (H.264), MOV, WebM. Convert if needed using a free tool like Handbrake.
2. File size: keep under 100MB for reliable uploads. Trim the video to just the swing if needed.
3. If the video plays fine locally but won't upload: try a different browser (Chrome works best).
4. Very long videos (over 5 minutes) may be too large — trim to just the swing clips.

---

## Problem 11: The app is deployed to Vercel but shows an error

**Fix 1 — Environment variables missing:**
1. Go to Vercel → your project → **Settings → Environment Variables**.
2. Confirm `NEXT_PUBLIC_APP_URL` is set to your actual Vercel URL.
3. If you added Supabase or AI keys, confirm those are there too.
4. After adding/changing env vars: go to **Deployments** tab → click **Redeploy**.

**Fix 2 — Build failed:**
1. Go to Vercel → your project → **Deployments** tab.
2. Click the failed deployment to see the build log.
3. Look for the first red error line — it will tell you what went wrong.

---

## When to Ask for Help

If none of the above fixes work, describe the problem with:

1. Which step you were on
2. Exactly what you typed or clicked
3. The full error message (copy and paste it)
4. Your operating system (Windows 10, Windows 11, Mac)
5. Your Node.js version (type `node --version`)
6. Which browser you are using

With this information, almost any problem can be diagnosed and fixed quickly.
