# SwingVantage — Beginner Start Here

**Read this first. Every step is numbered. Do not skip steps.**

---

## What Is SwingVantage?

SwingVantage is a web-based swing performance platform. It runs in your browser — no app to install from any app store. It works on your phone, tablet, or computer.

SwingVantage supports seven sports:

| Sport | How it analyzes your swing |
|---|---|
| ⛳ Golf | Import CSV data from your launch monitor |
| 🎾 Tennis | Upload a video of your strokes |
| 🏓 Pickleball | Upload a video of your strokes |
| 🎾 Padel | Upload a video of your strokes |
| ⚾ Baseball | Upload a video of your swing |
| 🥎 Slow Pitch Softball | Upload a video of your swing |
| 🥎 Fast Pitch Softball | Upload a video of your swing |

For every sport, SwingVantage tells you:
1. What your primary issue is
2. Why it happens
3. What to practice
4. Which YouTube drills to watch
5. Whether you are improving over time

---

## What You Need Before You Start

- [ ] A computer (Windows or Mac)
- [ ] Internet connection
- [ ] About 20 minutes for initial setup
- [ ] For golf: a CSV file exported from your launch monitor
- [ ] For other sports: a video of your swing (phone video is fine)

You do NOT need to know anything about programming, coding, or software development.

---

## Part 1: Install Required Software

### Step 1: Install Node.js

Node.js is a program that lets your computer run the SwingVantage code.

1. Open your web browser and go to: **https://nodejs.org**
2. Click the big button labeled **"LTS"** (Long-Term Support).
3. Download and run the installer. Click through and accept all defaults.

**How to verify it worked:**
1. On Windows: press the Windows key, type "Command Prompt", press Enter.
   On Mac: press Command+Space, type "Terminal", press Enter.
2. Type `node --version` and press Enter.
3. You should see something like `v20.11.0`. Any number is fine.

---

### Step 2: Install Visual Studio Code

VS Code is a free program for viewing and editing project files.

1. Go to: **https://code.visualstudio.com**
2. Download and install it like any normal program.

---

### Step 3: Confirm the SwingVantage folder is on your computer

The SwingVantage project should be at:
`C:\Users\YourName\OneDrive\Desktop\swingiq`

If it is there, continue to Part 2.

---

## Part 2: Install Dependencies and Run the App

### Step 1: Open the project in VS Code

1. Open VS Code.
2. Click **File → Open Folder…**
3. Navigate to your Desktop and select the `swingiq` folder.
4. Click **Select Folder**.

---

### Step 2: Open a terminal

1. In VS Code, click **Terminal → New Terminal**.
2. A black panel appears at the bottom.

---

### Step 3: Install all packages

In the terminal, type exactly this and press Enter:

```
npm install
```

Wait 2–5 minutes. You will see a lot of scrolling text. That is normal. When finished, you will see the cursor blinking again.

---

### Step 4: Set up your environment file

The app needs a small configuration file to know its own address.

1. In VS Code's left panel (Explorer), go to: `apps` → `web`
2. Find the file named `.env.example`
3. Right-click it → **Copy**
4. Right-click the `web` folder → **Paste**
5. Rename the copy to exactly: `.env.local`
6. Open `.env.local` and verify this line is present:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   If it says `http://localhost:3000`, you are done. If it says something else, change it to `http://localhost:3000` and save.

> **Note:** Supabase keys and AI keys are optional. The app works completely without them using local storage. See **OWNER_TASKS.md** to add them later.

---

### Step 5: Start the web app

In the terminal at the bottom of VS Code, type:

```
npm run dev:web
```

Press Enter. Wait about 10 seconds. You will see:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

### Step 6: Open the app in your browser

1. Open Chrome, Edge, Firefox, or Safari.
2. Go to: `http://localhost:3000`
3. You should see the SwingVantage dashboard.

**The app is running.**

---

## Part 3: First Use

### Step 1: Choose your sport

When you first open the app, look at the bottom of the left sidebar for the **Active Sport** selector. Click it and choose your sport.

The entire app — dashboard, profile, sessions, training, drills, and AI Coach — will change to match the sport you selected.

---

### Step 2: Create your profile

1. Click **My Profile** in the left sidebar (the label changes by sport: "My Golfer Profile", "My Tennis Profile", "My Hitter Profile", etc.)
2. Fill in the form with your information.
3. Click **Save Profile**.

Each sport has its own profile fields. No golf fields appear when you're working on a baseball swing.

---

### Step 3: Add your first data

**If you play golf:**
1. Click **Import Data** in the sidebar.
2. Follow the 7-step import wizard.
3. Choose your launch monitor brand, upload your CSV file, and name your session.

See the [Data Import Guide](DATA_IMPORT_GUIDE.md) for how to export from each launch monitor brand.

**If you play tennis, baseball, or softball:**
1. Click **Video Analysis** in the sidebar.
2. Select your sport in the sport selector at the top.
3. Upload a video of your swing from any angle (side view is best for initial analysis).
4. The app will analyze phase by phase and identify your primary issue.

**No launch monitor? No video yet?**
Click **Log Session** (non-golf) or use **Manual Entry** (golf) to record a session by hand. Even basic notes count as a session.

---

### Step 4: Review your diagnosis

**Golf:** Click **Diagnose** in the sidebar to see your primary swing issue, evidence from your data, the likely cause, and a drill plan.

**Other sports:** After video analysis, your dashboard shows the primary issue detected. Click **Training** for a drill checklist.

---

### Step 5: Follow your training plan

1. Click **Training** in the sidebar.
2. Work through the drill checklist — check off each step as you complete it.
3. Click the YouTube drill links to watch matching videos.
4. After practice, upload a new video or import a new session to check if it improved.

---

## Using SwingVantage on Your Phone

SwingVantage is a web app. There is nothing to install from any app store. Just open a browser on your phone.

**While running locally (on your home computer):**

1. Make sure your phone is on the **same Wi-Fi network** as your computer.
2. On Windows: press Windows+R, type `cmd`, press Enter, type `ipconfig`. Find the line "IPv4 Address" (looks like `192.168.1.42`).
3. On your phone's browser, go to: `192.168.1.42:3000` (use your actual IP address).

**When deployed to the internet (Vercel):**
Just open your Vercel URL on any device, anywhere.

> **Tip:** On iPhone in Safari, tap the Share icon → "Add to Home Screen". On Android in Chrome, tap the three-dot menu → "Add to Home Screen". The app will look like a native app on your home screen.

---

## Quick Reference: Every Page in the App

| Page | What it does |
|---|---|
| **Dashboard** | Home screen — changes completely by sport |
| **My Profile** | Sport-specific profile and goals |
| **Equipment** | Golf: club bag with gap analysis. Other sports: equipment notes |
| **Sessions** | History of all sessions for the active sport |
| **Import Data / Log Session** | Golf: CSV import wizard. Other sports: manual session log |
| **Import from Image** | Upload a photo of a launch-monitor screen to import numbers (all sports) |
| **Diagnose / Analyze Swing** | Golf: full diagnostic engine. Other sports: links to video analysis |
| **Video Analysis** | Upload a video for a quick sport-aware phase-by-phase read (all 7 sports) |
| **Motion Lab (3D)** | Full 3D motion breakdown — rotatable viewer, biomechanical scores, kinetic chain, drills, PDF export (all 7 sports) |
| **Coach & Team** | Group Motion Lab sessions by athlete, track each athlete's progress, see team-wide weaknesses |
| **Athlete GI** | Reasons across all your sports at once — finds your keystone skill, cross-sport transfers, and one unified plan |
| **Athletic Journey** | Stage-by-stage roadmap from beginner to the next level (golf, tennis, pickleball, padel live; baseball/softball in development) |
| **Daily Notes** | "How did you play today?" — turns your own words into honest fault tags that feed your coaching |
| **3D Swing Avatar** | Quick rotatable 3D avatar view of a swing |
| **AI Coach** | Ask questions about your game — answers grounded in your data |
| **Fix Stack** | Surfaces your single highest-impact fix as a 3-step loop: feel it → drill it → retest it |
| **Training** | Interactive drill checklist based on your issue |
| **Practice Schedule** | Auto-generated 7-day practice week |
| **Pre-Round / Pre-Game** | Sport-specific warm-up checklist |
| **Drill Library** | 80+ drills across all sports — defaults to your active sport |
| **Progress** | Score trends over time (golf: launch monitor; others: video scores) |
| **Player Arc** | The story of your improvement: recurring faults, which drills worked, honest retest outcomes |
| **SwingVantage Labs** | Personal tools (readiness score, player model, skill transfer, performance graph, benchmark mirrors) |
| **BodySync** | Daily readiness from a quick wellness check-in, plus health-aware coaching (adults 18+, opt-in, never medical advice) |
| **Video Library** | Every feature walkthrough plus a growing set of training videos, in one place |
| **Retest** | Reminds you when a finding is due for a recheck, then shows an honest before-and-after read once you re-analyze under the same conditions |
| **Milestones** | Achievement badges for your active sport |
| **Compare & References** | Browse professional swing references; compare your video side-by-side with a pro |
| **Reports** | Text summary (or shareable image) to send to your coach |
| **Recruiting Hub** | Build a verified, shareable recruiting profile coaches can trust (public coach view at `/player/[slug]`) |
| **Community** | Badges, XP, challenges, streaks, leaderboards |
| **Data Center** | Download/restore a complete backup of your data |
| **Settings** | Units, coaching style, language, theme, guide resets |
| **? (Help button)** | Step-by-step guide for whatever screen you are on |

---

## Common Questions

**Q: Do I need a launch monitor?**
A: Only for golf data-driven analysis. Golf video analysis works too. For tennis, baseball, and softball, video is the primary input.

**Q: Do I need to pay for anything?**
A: The app itself is free to run locally. Supabase (cloud storage) has a free tier. Vercel (deployment) has a free tier. An AI key (for live AI Coach answers) costs a few dollars per month at most.

**Q: Do I have to create an account?**
A: No. SwingVantage starts keyless — open it and jump straight in, with your data saved privately on your own device. An account is optional and only matters if you turn on cloud sync (Supabase); then sign-up, sign-in, and password reset are available whenever you choose.

**Q: Does it work without internet?**
A: Yes for the on-device parts. If your connection drops (common at a range), a banner lets you know, your work is held safely on your device, and anything that needs the network is queued to finish automatically once you reconnect.

**Q: Can other people see my data?**
A: When running locally, only you can see it. When deployed to Vercel, only people with your URL can access it, and data is stored in your own Supabase account.

**Q: How do I save my progress so I don't lose it?**
A: Go to **Data Center** in the sidebar and click **Download Backup**. Save that file somewhere safe (cloud drive, email). If you ever switch browsers or devices, upload that file on the new device to restore everything — sessions, badges, equipment, training history, and more.

**Q: What is the ? button in the top corner?**
A: That opens a step-by-step guide for whatever screen you are on. Tap it on any page to learn what it does. Guides are built in plain language for athletes and parents, not developers.

**Q: Something looks wrong or the app won't start.**
A: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for step-by-step fixes.

**Q: I want to share the app with my coach.**
A: See [OWNER_TASKS.md](OWNER_TASKS.md) for the Vercel deployment steps.
