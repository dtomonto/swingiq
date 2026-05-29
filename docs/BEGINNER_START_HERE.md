# SwingIQ — BEGINNER START HERE

**Read this first. Every step is numbered. Do not skip steps.**

---

## What Is SwingIQ?

SwingIQ is a golf performance system that lives on your computer (the web app) and on your phone (the mobile app).

It does five things:

1. **Accepts launch-monitor data** from your device (FlightScope, TrackMan, Garmin, SkyTrak, or any other brand)
2. **Diagnoses your swing patterns** — it tells you what is wrong and why
3. **Generates a training routine** — it tells you exactly what to practice and how many balls to hit
4. **Links to YouTube drills** — it finds the right drill videos for your specific issue
5. **Tracks your improvement** — it shows you whether your data is getting better over time

---

## What You Need Before You Start

You will need:

- [ ] A computer (Windows or Mac)
- [ ] A phone (iPhone or Android)
- [ ] Internet connection
- [ ] About 30 minutes for the initial setup

You do NOT need to know anything about programming, coding, databases, or software development.

---

## Part 1: Install Required Software on Your Computer

### Step 1: Install Node.js

Node.js is a program that lets your computer run the SwingIQ app code.

1. Open your web browser and go to: **https://nodejs.org**
2. Click the big green button that says **"LTS"** (Long-Term Support). This is the safe version.
3. Download the installer for your computer (Windows or Mac).
4. Open the downloaded file and click through the installer. Accept all defaults.
5. When the installer finishes, click Finish.

**How to verify it worked:**
1. On Windows: Press the Windows key, type "Command Prompt", and press Enter.
   On Mac: Press Command + Space, type "Terminal", press Enter.
2. Type exactly this and press Enter:
   ```
   node --version
   ```
3. You should see something like `v20.11.0`. Any number is fine. If you see a version number, it worked.

---

### Step 2: Install Visual Studio Code (VS Code)

VS Code is a free program that lets you view and edit the project files.

1. Go to: **https://code.visualstudio.com**
2. Click the big blue download button.
3. Install it like any normal program.

---

### Step 3: Download or Copy the SwingIQ Project

The SwingIQ project folder should already be on your Desktop at:
`C:\Users\YourName\OneDrive\Desktop\swingiq`

If it is there, skip to Part 2.

---

## Part 2: Create a Supabase Account (Your Database)

Supabase is the system that stores all your golf data securely in the cloud.
Think of it like a secure spreadsheet in the sky that only you can access.

### Step 1: Create a Supabase Account

1. Open your web browser.
2. Go to: **https://supabase.com**
3. Click **"Start your project"** or **"Sign Up"**.
4. Create a free account using your email.
5. Verify your email by clicking the link Supabase sends you.

---

### Step 2: Create a New Supabase Project

1. After logging in, click **"New Project"**.
2. Choose your organization (it will say your name or "Personal").
3. Fill in:
   - **Name**: SwingIQ
   - **Database Password**: Create a strong password (write it down somewhere safe)
   - **Region**: Choose the closest to where you live
4. Click **"Create new project"**.
5. Wait about 1 minute while the project is created. A loading spinner will show.

---

### Step 3: Find Your Supabase Keys

These are like the secret passwords that let SwingIQ talk to your database.

1. In your Supabase project, look at the left sidebar.
2. Click the gear icon at the bottom (Settings).
3. Click **"API"** in the settings menu.
4. You will see two important values:
   - **Project URL** — looks like: `https://abcxyz123.supabase.co`
   - **anon public** key — a very long string of letters and numbers

5. Leave this page open. You will need these in the next step.

---

### Step 4: Add Your Supabase Keys to SwingIQ

> **Important note about dot files:** The file you need (`.env.example`) starts with a dot.
> Windows File Explorer **hides files that start with a dot** by default, so you will NOT see it
> if you look in the swingiq folder using File Explorer.
> **Use VS Code instead** — it shows all files including hidden ones.
> Do not go looking for this file in Windows Explorer. Follow the steps below exactly.

1. Open VS Code.

2. Click **File** in the top menu bar, then click **"Open Folder…"**

3. A file browser window opens.
   - Navigate to your Desktop.
   - Find the folder named `swingiq`.
   - Single-click on `swingiq` to highlight it (do not open it).
   - Click the **"Select Folder"** button.

4. VS Code now shows the swingiq project. On the **left side** you will see a panel called
   **"Explorer"** with a folder tree. If you do not see it, press **Ctrl+Shift+E** to open it.

5. In the Explorer panel, you will see these top-level items:
   ```
   📁 apps
   📁 docs
   📁 packages
   📁 server
   📄 package.json
   📄 README.md
   ```

6. Click the arrow next to **`apps`** to expand it.
   You will now see:
   ```
   📁 apps
     📁 mobile
     📁 web
   ```

7. Click the arrow next to **`web`** to expand it.
   You will now see a list of files. Look for **`.env.example`** in that list.
   It will appear at the **top of the list** because files starting with `.` sort first.

   > **Still don't see it?** Try clicking somewhere else in VS Code first, then look again.
   > If `.env.example` is truly missing, skip to the **"If the file is missing"** section at the
   > bottom of this step.

8. Right-click on **`.env.example`** and choose **"Copy"**.

9. Right-click on the **`web`** folder (one level up from `.env.example`) and choose **"Paste"**.

10. A new file named `.env.example copy` or `.env (1)` appears. You need to rename it.
    Right-click the new file and choose **"Rename"**. Type exactly:
    ```
    .env.local
    ```
    Press Enter. (The name must start with a dot.)

11. Click on `.env.local` to open it. You will see text like this:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    ```

12. Go back to your Supabase browser tab (the one with your API keys from Step 3).

13. In VS Code, click at the end of the line that says:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    ```
    Select and delete everything after the `=` sign on that line.
    Paste your actual **Project URL** from Supabase.
    The line should now look like:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://abcxyz123456.supabase.co
    ```
    (Your URL will have a different code where `abcxyz123456` is.)

14. Do the same for the next line:
    Select and delete everything after `=` on the `NEXT_PUBLIC_SUPABASE_ANON_KEY=` line.
    Paste your actual **anon public** key from Supabase.

15. Press **Ctrl+S** (Windows) or **Command+S** (Mac) to save the file.

---

#### If the file is missing (`.env.example` does not appear in VS Code)

The file should be there. If you cannot see it:

1. In VS Code, click **View** in the top menu → click **"Explorer"**.
2. Make sure you have the `swingiq` folder open (the title bar should say "swingiq").
3. Look in: `apps` → `web` → the `.env.example` file should be there.

If it is truly gone, you can create the file manually:

1. Right-click the `web` folder in VS Code Explorer.
2. Click **"New File"**.
3. Name it `.env.local` (with the dot at the start) and press Enter.
4. The file opens blank. Paste exactly this text into it:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Replace the two placeholder values with your real Supabase URL and anon key.
6. Press **Ctrl+S** to save.

---

### Step 5: Set Up the Database Tables

Now you need to create the database tables where SwingIQ will store your golf data.

1. Go back to your Supabase dashboard in your browser.
2. In the left sidebar, click **"SQL Editor"** (the icon that looks like a code symbol `<>`).
3. Click **"New query"**.
4. Go back to VS Code.
5. Navigate to: `server/supabase_schema.sql`
6. Click on the file to open it.
7. Press **Ctrl+A** (Windows) or **Command+A** (Mac) to select all the text.
8. Press **Ctrl+C** (or Command+C) to copy it.
9. Go back to Supabase SQL Editor.
10. Click in the big white text box.
11. Press **Ctrl+V** (or Command+V) to paste the SQL.
12. Click the green **"Run"** button (or press F5).
13. You should see a success message at the bottom. If you see errors, see TROUBLESHOOTING.md.

---

## Part 3: Install App Dependencies

"Dependencies" means the software packages that SwingIQ needs to run. Think of it like installing the parts before assembling furniture.

### Step 1: Open a Terminal in VS Code

1. In VS Code, click **Terminal** in the top menu.
2. Click **New Terminal**.
3. A black panel will appear at the bottom of VS Code.

---

### Step 2: Install All Dependencies

In the terminal, type exactly this and press Enter:

```
npm install
```

Wait for this to finish. It may take 2–5 minutes. You will see a lot of text scrolling. That is normal.

When it is done, you will see the cursor blinking again and a message like:
`added 1234 packages in 45s`

---

## Part 4: Run the Web App

### Step 1: Start the Web App

In the terminal at the bottom of VS Code, type:

```
npm run dev:web
```

Press Enter.

Wait about 10 seconds. You will see output that includes:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

### Step 2: Open the Web App in Your Browser

1. Open any web browser (Chrome, Edge, Firefox, Safari).
2. In the address bar at the top, type:
   ```
   http://localhost:3000
   ```
3. Press Enter.
4. You should see the SwingIQ dashboard.

**Congratulations! The web app is running.**

---

### What "localhost" Means

"Localhost" means the app is running on YOUR computer, not on the internet.
Think of it like a store that is only open for you inside your own house.
You can see it on your computer. Other people cannot.

This is fine for testing and using the app yourself.
To share it with others (like a coach), the app needs to be "deployed" — see the OWNER_TASKS.md file for that step.

---

## Part 5: Use SwingIQ on Your Phone

SwingIQ is a web app that works on **any device** — phone, tablet, or computer — using your browser. There is no separate app to install.

### Using It on Your Phone

While the web app is running on your computer (`npm run dev:web` is active):

1. Make sure your phone is connected to the **same Wi-Fi network** as your computer.
2. On your computer, find your computer's local network address:
   - Press **Windows key + R**, type `cmd`, press Enter.
   - Type `ipconfig` and press Enter.
   - Look for the line that says **IPv4 Address** — it will look like `192.168.1.xxx`.
3. On your phone, open your browser (Safari or Chrome).
4. Type your computer's IP address followed by `:3000`, like:
   ```
   192.168.1.42:3000
   ```
   (Use your actual IP address, not this example.)
5. The full SwingIQ app will open on your phone, just like on your computer.

> **Tip:** You can add it to your phone's home screen. In Safari on iPhone, tap the Share icon → "Add to Home Screen". On Android in Chrome, tap the three-dot menu → "Add to Home Screen". It will look and feel like a regular app.

---

## Part 6: First Use — Setting Up Your Profile

### Step 1: Create Your Golfer Profile (Web)

1. Open the web app at `http://localhost:3000`.
2. Click **"My Profile"** in the left sidebar.
3. Fill in your information:
   - Your name
   - Your handicap (your best guess is fine)
   - Your typical miss (e.g., "push fade with driver")
   - Your launch monitor brand
   - How often you practice
4. Click **Save Profile**.

---

### Step 2: Add Your Clubs

1. Click **"Golf Bag"** in the left sidebar.
2. Click **"Add Club"**.
3. Add each club in your bag. Start with at least:
   - Driver
   - 7-Iron
   - Pitching Wedge
4. For each club, fill in:
   - Club name (e.g., "7-Iron")
   - Category (e.g., "Mid Iron")
   - Typical carry distance if you know it

---

### Step 3: Import Your First Session

1. Click **"Import Data"** in the left sidebar.
2. Follow the 7-step wizard.
3. Start with your simplest export file — for example, a 7-iron or driver session.

If you don't have a CSV file yet, see the section below: **"How to Export from Your Launch Monitor"**.

---

## How to Export from Your Launch Monitor

### FlightScope (Mevo, Mevo+, X3)

1. Open the **FS Golf** app on your phone or tablet.
2. Tap **"Sessions"** at the bottom.
3. Tap the session you want to export.
4. Tap the **share icon** (usually top right).
5. Choose **"Export CSV"**.
6. Send the file to yourself via email or AirDrop.
7. Open on your computer.

### Garmin Approach R10

1. Open the **Garmin Golf** app.
2. Tap the **Activity** icon (golf bag).
3. Tap your most recent range session.
4. Tap the **three dots** (more options).
5. Tap **"Export"** → choose CSV.
6. Email the file to yourself.

### SkyTrak

1. Open the **SkyTrak** app or web portal.
2. Go to **"My Range"** or **"Sessions"**.
3. Click the session you want.
4. Look for a **download/export button**.
5. Download as CSV.

### TrackMan

1. Open the **TrackMan** app.
2. Select your session.
3. Tap **"Share"** → **"Export to CSV"**.

### Foresight Sports (GCQuad, GC3, Bushnell Launch Pro)

1. Open **FSX** or **FSX Play** software.
2. Go to **File → Export Data**.
3. Select your session.
4. Export as CSV.

### Rapsodo MLM / MLM2PRO

1. Open the **Rapsodo** app.
2. Tap **History** → select your session.
3. Tap the **share icon**.
4. Choose **Export CSV**.

---

## Part 7: Read Your First Diagnosis

After importing a session:

1. Click **"Diagnose"** in the left sidebar.
2. The app will analyze your data automatically.
3. You will see:
   - **Primary Diagnosis** — the biggest issue
   - **Evidence** — the data that proves it
   - **Likely Cause** — what the swing might be doing
   - **Training Routine** — what to practice
   - **YouTube Drills** — videos for your issue

---

## Part 8: Follow Your Training Routine

1. Click **"Training"** in the left sidebar.
2. Read the **Setup** section — gather what you need before hitting balls.
3. Work through the **Drill Steps** — check them off as you complete each one.
4. Click the **YouTube Drill** links to watch matching videos.
5. After practice, import a new session and **Diagnose** again to see if the numbers improved.

---

## Common Questions

**Q: The app is slow or not loading.**
A: Wait 30 seconds. If still stuck, see TROUBLESHOOTING.md.

**Q: My CSV file didn't import correctly.**
A: Make sure you selected the correct launch monitor brand in Step 1 of the import wizard. If columns are missing, manually map them in Step 3.

**Q: I don't have a launch monitor. Can I still use the app?**
A: Yes. Choose "Manual Entry" and enter your carry distances and any other numbers you know. The app will give you what diagnosis it can with the data available.

**Q: I can't find my CSV export button.**
A: Every app is different. Search on YouTube: "[your device name] CSV export" — there are usually tutorial videos.

**Q: The data looks wrong in the preview.**
A: Go back to Step 3 (Map Columns) in the import wizard and manually match the columns. Some devices use different column names.

---

## What to Do Next After MVP 1 is Working

Once the app is running and you have imported your first session:

1. Run the diagnosis on your first session.
2. Follow the recommended training routine for 2–3 practice sessions.
3. Import a new session after practicing.
4. Run the diagnosis again and compare results.
5. Repeat.

See **OWNER_TASKS.md** for a full checklist of what to do next.
