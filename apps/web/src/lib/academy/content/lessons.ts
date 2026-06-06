// SwingVantage Academy — Lessons (seed content).
// Authored, SwingVantage-specific. The three spec "sample lessons"
// (upload, explain feedback, 3D motion) are written in full depth.
import type { Lesson } from '../types';

const V = '1.0';

export const LESSONS: Lesson[] = [
  // ── SwingVantage Foundations ───────────────────────────────
  {
    id: 'l-what-is-overview', title: 'What SwingVantage Is', estMinutes: 7, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: [
      'State what SwingVantage is in one sentence',
      'Name the five supported sports',
      'Describe the try-first, honest-by-design product philosophy',
    ],
    whyItMatters:
      'Everyone — from support to sales to engineering — needs the same crisp, accurate mental model of the product so we describe it consistently and honestly.',
    walkthrough: [
      'SwingVantage is a multi-sport AI swing-performance platform. A user records or uploads a swing (or imports launch-monitor data), and the product returns the single highest-priority thing to work on, a drill to fix it, and a way to track whether it actually improved.',
      'It supports golf, tennis, baseball, slow-pitch softball, and fast-pitch softball — one app, multiple sports, with sport-specific models and guidance.',
      'It is try-first: users can get value before creating an account. Signing in saves their progress to a private account and syncs it across devices. Their full swing video stays on their device — only sampled still frames are sent when AI video analysis runs.',
    ],
    scenario:
      'A friend asks, "What does your company make?" You should be able to answer in ~10 seconds without jargon or overpromising.',
    steps: [
      { label: 'One-liner', detail: '"An AI swing coach for golf, tennis, baseball and softball that tells you the one thing to work on next."' },
      { label: 'The loop', detail: 'Analyze a swing → learn the top fix → practice it → prove the change with a retest.' },
      { label: 'The promise', detail: 'Confident, data-backed estimates — not medical claims or guaranteed results.' },
    ],
    commonMistakes: [
      'Calling it "golf only" — it is multi-sport.',
      'Describing results as lab-grade or medical.',
      'Saying you must pay first — it is try-first.',
    ],
    bestPractices: [
      'Lead with the user benefit ("the one thing to work on"), not a feature list.',
      'Use the word "estimate" and mention confidence — honesty is a brand asset.',
    ],
    quizId: 'q-what-is',
    completionCriteria: 'Pass the knowledge check and be able to give the one-liner from memory.',
    relatedFeatures: [{ label: 'Dashboard', route: '/dashboard' }, { label: 'How it works', route: '/how-it-works' }],
    docLinks: [{ label: 'Methodology', href: '/methodology' }, { label: 'Trust & Safety', href: '/trust' }],
  },
  {
    id: 'l-what-is-value', title: 'Feature Value: Why It Matters', estMinutes: 6, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Connect each headline feature to the user value it delivers', 'Avoid feature-dumping'],
    whyItMatters: 'We sell and support outcomes, not features. Translating features into value is the core enablement skill.',
    walkthrough: [
      'Every feature maps to a job the user is trying to get done. Video analysis → "tell me what is wrong." Drill recommendations → "tell me how to fix it." Progress tracking → "show me it is working." Coach Mode → "help me manage and coach many athletes."',
      'When in doubt, finish the sentence: "…so that the user can ____."',
    ],
    bestPractices: ['Pair every feature you mention with a "so that…" outcome.'],
    completionCriteria: 'Be able to give the value statement for three features.',
    relatedFeatures: [{ label: 'Features', route: '/features' }],
  },
  {
    id: 'l-sports-overview', title: 'Supported Sports Overview', estMinutes: 6, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Name all five sports', 'Describe how guidance differs by sport at a high level'],
    whyItMatters: 'Multi-sport is a key differentiator; staff must speak to each sport credibly.',
    walkthrough: [
      'Golf, tennis, baseball, slow-pitch softball, and fast-pitch softball each have tailored models, equipment context, and coaching language.',
      'The user picks a sport (and can switch sports). The analysis, drills, and even camera guidance adapt to that sport.',
    ],
    commonMistakes: ['Treating slow-pitch and fast-pitch softball as identical — they are modeled separately.'],
    completionCriteria: 'List all five sports and one way guidance differs.',
    relatedFeatures: [{ label: 'Sports', route: '/sports' }],
  },
  {
    id: 'l-personas', title: 'Core User Personas', estMinutes: 7, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Identify the primary personas', 'Tailor language to each persona'],
    whyItMatters: 'The same feature is pitched and supported differently for an athlete, a parent, or a coach.',
    walkthrough: [
      'Athlete: wants to improve their own game. Parent: helping a young athlete, cares about simplicity, safety, and privacy. Coach: manages many athletes and wants to give each a clear next step. Team/Program: exploring SwingVantage for a group.',
      'Youth safety matters: parent and minor flows stay parent-oriented and private.',
    ],
    quizId: 'q-personas',
    bestPractices: ['Ask "who am I talking to?" before choosing words.'],
    completionCriteria: 'Pass the knowledge check.',
    relatedFeatures: [{ label: 'For Parents', route: '/parents' }, { label: 'For Coaches', route: '/coaches' }],
  },
  {
    id: 'l-journey', title: 'End-to-End User Journey', estMinutes: 8, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Trace the full first-use journey', 'Locate where each feature fits'],
    whyItMatters: 'Knowing the journey lets you orient any user (or bug, or demo) to the right step.',
    walkthrough: [
      'Discover → onboard → create a profile / pick a sport → capture a swing (record or upload, or import data) → understand the AI analysis → improve with drills and a practice plan → track progress and prove the change with a retest.',
      'Signing in makes the account the source of truth and syncs across devices.',
    ],
    steps: [
      { label: 'Capture', detail: 'Record in-app or upload; or import launch-monitor data.' },
      { label: 'Understand', detail: 'Read the prioritized analysis and confidence.' },
      { label: 'Improve', detail: 'Follow the recommended drill + practice plan.' },
      { label: 'Track', detail: 'Retest under the same conditions to prove change.' },
    ],
    completionCriteria: 'Sketch the journey from memory.',
    relatedFeatures: [{ label: 'Dashboard', route: '/dashboard' }, { label: 'Progress / Arc', route: '/arc' }],
  },
  {
    id: 'l-create-profile', title: 'Creating a Player Profile', estMinutes: 8, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Create a profile', 'Explain how profile richness changes AI confidence'],
    whyItMatters: 'Profile data is fuel for the AI: thin profiles yield low-confidence estimates; rich ones sharpen everything.',
    walkthrough: [
      'A profile captures sport, skill level, goals, equipment, and context. The AI uses it to personalize analysis and coaching.',
      'More and better inputs (equipment, sessions, measured data) raise both usefulness and confidence — a key thing to teach users.',
    ],
    steps: [
      { label: 'Pick the sport', detail: 'Profiles are sport-aware.' },
      { label: 'Set skill level', detail: 'Calibrates tone and expectations.' },
      { label: 'Add context/equipment', detail: 'Improves personalization.' },
    ],
    challengeId: 'ch-new-profile',
    commonMistakes: ['Leaving the profile empty and expecting high-confidence output.'],
    completionCriteria: 'Complete the hands-on challenge (create a beginner tennis profile).',
    relatedFeatures: [{ label: 'Profile setup', route: '/start' }],
  },
  {
    id: 'l-responsible-ai', title: 'Responsible AI & User Trust', estMinutes: 10, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Apply the AI guardrails', 'Rewrite non-compliant AI/user-facing statements'],
    whyItMatters: 'Trust is a moat. One overpromise or medical claim can damage users and the brand.',
    walkthrough: [
      'Guardrails: no medical or injury claims, no guaranteed results, no overstating AI accuracy, plain language, and never publish unreviewed AI-generated content.',
      'Confident-but-honest is the voice: results are data-backed estimates, labeled with a confidence level, that pair well with a qualified coach or professional.',
    ],
    commonMistakes: [
      'Saying the AI "diagnoses" injuries.',
      'Promising specific score/distance gains.',
      'Hiding confidence levels to look more certain.',
    ],
    bestPractices: ['When unsure, default to the honest, professional-pairing framing and escalate.'],
    quizId: 'q-responsible-ai',
    challengeId: 'ch-flag-bad-ai',
    completionCriteria: 'Pass the check (80%) and correctly flag the bad AI response.',
    docLinks: [{ label: 'Trust & Safety', href: '/trust' }, { label: 'Methodology', href: '/methodology' }],
    supportNotes: 'If a user reports a harmful or non-compliant AI message, flag it and escalate per the responsible-AI path.',
  },

  // ── Video Analysis Mastery ─────────────────────────────────
  {
    id: 'l-upload', title: 'How to Upload a Swing Video', estMinutes: 12, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: [
      'Explain supported formats and capture options',
      'Coach a user on camera angle and framing by sport',
      'Diagnose the most common upload and analysis failures',
    ],
    whyItMatters:
      'The quality of everything downstream — the analysis, the drills, the confidence — depends on the input video. Most "the AI is wrong" reports are really capture problems. Mastering this single topic resolves the majority of support tickets and makes every demo land.',
    walkthrough: [
      'Users can record directly in the app (the in-app recorder includes a "where to stand" overlay and front/back camera) or upload an existing video file. They can also skip video entirely and import launch-monitor data for some sports.',
      'When AI video analysis runs, the full video stays on the device; only a few sampled still frames are sent for analysis. This is a genuine privacy feature — state it exactly that way, never "we upload your video."',
      'The analyzer needs to see the whole swing, in frame, from a sport-appropriate angle, with the athlete well lit. Get those three things right and results are dramatically better.',
    ],
    scenario:
      'A user messages: "I recorded my swing but the feedback seems random." You walk them through a clean re-record and the result improves immediately.',
    steps: [
      { label: 'Choose capture', detail: 'Record in-app (recommended for beginners — it guides framing) or upload a file.' },
      { label: 'Set the angle', detail: 'Side-on (down-the-line) or face-on depending on sport and what you want to see; keep it consistent for retests.' },
      { label: 'Frame the whole body', detail: 'The entire swing must stay in frame from start to finish — no clipping the club/bat/arms.' },
      { label: 'Light the athlete', detail: 'Light in front of the athlete, not behind. Avoid filming into a window or bright sky (backlighting).' },
      { label: 'Steady the camera', detail: 'Prop or tripod the phone; a shaky frame degrades analysis.' },
      { label: 'Run analysis', detail: 'Submit; review the prioritized result and confidence.' },
    ],
    commonMistakes: [
      'Backlighting (filming into the light) — silhouettes the athlete.',
      'Clipping part of the swing out of frame.',
      'Moving/handheld camera.',
      'Wrong or inconsistent angle between a baseline and its retest.',
      'Telling users their full video is uploaded (it is not — only frames).',
    ],
    bestPractices: [
      'For beginners, recommend the in-app recorder so the overlay does the framing work.',
      'Lock the angle and conditions so retests are comparable.',
      'If a result looks off, re-record cleanly before doubting the AI.',
    ],
    quizId: 'q-upload',
    challengeId: 'ch-upload-sample',
    completionCriteria: 'Pass the knowledge check and complete the upload-and-judge challenge.',
    relatedFeatures: [{ label: 'Video Analyzer', route: '/video' }],
    docLinks: [{ label: 'Tutorial Center', href: '/tutorial' }],
    supportNotes:
      'First triage step for any analysis complaint: check angle, framing, and lighting. Re-record fixes most cases before escalation.',
  },
  {
    id: 'l-camera-angles', title: 'Camera Angles & Recording Standards by Sport', estMinutes: 8, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Recommend the right angle per sport', 'Explain why consistency matters for retests'],
    whyItMatters: 'Each sport reveals different faults from different angles; the right angle is half the battle.',
    walkthrough: [
      'Golf: down-the-line and face-on each show different things (path/plane vs. face/posture). Tennis, baseball, and softball each have preferred angles to capture the kinetic chain and contact.',
      'Whatever angle is chosen, keep it consistent between a baseline and its retest so the comparison is fair.',
    ],
    bestPractices: ['Pick one angle per goal and reuse it for retests.'],
    completionCriteria: 'State a sensible angle for each sport.',
    relatedFeatures: [{ label: 'Video Analyzer', route: '/video' }],
  },
  {
    id: 'l-analysis-workflow', title: 'The AI Swing Analysis Workflow', estMinutes: 9, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Describe how feedback is generated end to end', 'Explain what confidence reflects'],
    whyItMatters: 'Understanding the pipeline lets you explain results and troubleshoot them credibly.',
    walkthrough: [
      'From the captured swing, the system samples frames, runs the sport-specific analysis, and produces a prioritized result: the top issue, a recommended drill, and a confidence level.',
      'Confidence reflects how much real signal backs the result — thin/poor input gives lower confidence; clear video plus profile/measured data and repeat sessions raise it.',
    ],
    completionCriteria: 'Explain the pipeline and what raises confidence.',
    relatedFeatures: [{ label: 'Video Analyzer', route: '/video' }],
  },
  {
    id: 'l-explain-feedback', title: 'Explaining AI Swing Feedback to a Beginner', estMinutes: 11, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: [
      'Use a plain-English framework to explain results',
      'Frame confidence and safety honestly',
      'Avoid overwhelming or overpromising',
    ],
    whyItMatters:
      'A great analysis is useless if the user feels confused or oversold. How we explain feedback determines whether a user trusts the product and comes back.',
    walkthrough: [
      'Lead with one thing. SwingVantage deliberately surfaces the single highest-priority fix — mirror that in how you explain it. Name the one issue, give the one drill, and stop.',
      'Frame confidence as honesty, not weakness: "This is an estimate based on what we can see; it gets sharper as you add clearer video and more sessions."',
      'Stay within guardrails: no medical or injury talk, no guarantees. If pain comes up, point to a qualified professional.',
    ],
    scenario:
      'A nervous beginner says, "There are so many numbers, I don’t know what to do." You reply with one priority, one drill, and a confidence note — and they relax.',
    steps: [
      { label: 'Acknowledge', detail: '"Great swing to start from — let’s find the one thing that helps most."' },
      { label: 'One priority', detail: 'Name the single top issue in plain words.' },
      { label: 'One action', detail: 'Give the recommended drill and what "good" looks like.' },
      { label: 'Honest confidence', detail: 'Note the confidence level and how to raise it.' },
      { label: 'Safe close', detail: 'Encourage; mention a coach/pro for deeper or pain-related needs.' },
    ],
    commonMistakes: [
      'Reading out every metric.',
      'Using biomechanics jargon with a beginner.',
      'Implying the estimate is a certainty or a medical finding.',
    ],
    bestPractices: [
      'One priority, one drill, one encouraging sentence.',
      'Say "estimate" and name the confidence — it builds trust.',
    ],
    quizId: 'q-explain-feedback',
    completionCriteria: 'Pass the knowledge check (75%).',
    relatedFeatures: [{ label: 'Video Analyzer', route: '/video' }, { label: 'AI Coach', route: '/coach' }],
    docLinks: [{ label: 'Methodology (confidence)', href: '/methodology' }],
    supportNotes: 'Use this framework verbatim when a user is overwhelmed by their results.',
  },
  {
    id: 'l-3d-overview', title: 'Understanding 3D Motion Mapping', estMinutes: 11, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: [
      'Explain what 3D motion mapping does — and does not — do',
      'Describe it simply to a non-technical user',
      'Correct common misconceptions',
    ],
    whyItMatters:
      '3D motion is the most impressive-looking and most misunderstood feature. Explaining it simply and honestly builds trust; overstating it breaks our guardrails.',
    walkthrough: [
      'What it does: estimates how the body moves through the swing and how segments sequence, then turns that into visual, sport-specific insight — helping surface the movement that, if improved, helps the most.',
      'What it does not do: it is not certified medical biomechanics, not an injury scan, and not a guarantee of any performance gain. It is an estimate built from video.',
      'It compares against sport-appropriate baselines and carries confidence/limitation context, just like the rest of the product.',
    ],
    scenario:
      'A parent asks what the "3D stuff" means for their kid. You give a 30-second, plain-English answer that excites them without overpromising.',
    steps: [
      { label: 'Plain definition', detail: '"A smart, estimated model of how the body moves through the swing."' },
      { label: 'The benefit', detail: '"It helps spot the one movement worth working on."' },
      { label: 'The honest limit', detail: '"It’s a coaching aid — not a medical scan, not a promise of results."' },
    ],
    commonMistakes: [
      'Calling it medical-grade or an injury detector.',
      'Implying lab-precision joint angles.',
      'Burying the user in technical sequencing terms.',
    ],
    bestPractices: ['Use the stick-figure analogy; always pair the wow with the honest limit.'],
    quizId: 'q-3d',
    challengeId: 'ch-explain-3d',
    completionCriteria: 'Pass the check (75%) and complete the parent-explanation roleplay.',
    relatedFeatures: [{ label: 'Motion Lab', route: '/motion-lab' }],
    supportNotes: 'If a user treats 3D output as medical advice, gently correct and reframe as performance insight.',
  },

  // ── Coach Mode Certification ───────────────────────────────
  {
    id: 'l-coach-dash', title: 'Coach Dashboard Overview', estMinutes: 8, roleIds: ['coach', 'partner', 'power-user', 'support', 'sales'],
    difficulty: 'intermediate', version: V,
    objectives: ['Navigate the coach dashboard', 'Manage multiple athletes'],
    whyItMatters: 'Coaches live in the dashboard; fluency here is the heart of Coach Mode.',
    walkthrough: [
      'The coach view groups athletes (a roster) and surfaces each athlete’s progress and priority fix, so a coach can give many players one clear next step efficiently.',
      'Youth privacy applies: keep minors’ data private; never publicly compare children.',
    ],
    completionCriteria: 'Locate roster, an athlete’s priority fix, and progress.',
    relatedFeatures: [{ label: 'Coach', route: '/coach' }],
  },
  {
    id: 'l-assign-drills', title: 'Assigning Drills', estMinutes: 7, roleIds: ['coach', 'partner', 'power-user'],
    difficulty: 'intermediate', version: V,
    objectives: ['Assign the right drill for the priority fix', 'Avoid overcorrection'],
    whyItMatters: 'Good coaching is one fix at a time; the product supports that discipline.',
    walkthrough: [
      'Match the drill to the single priority issue. Resist stacking multiple fixes — it slows progress and overwhelms the athlete.',
      'Set up the retest so the change can be proven.',
    ],
    commonMistakes: ['Assigning several fixes at once.'],
    bestPractices: ['One priority → one drill → one retest.'],
    completionCriteria: 'Explain why one-fix-at-a-time matters.',
    relatedFeatures: [{ label: 'Drills / Fix', route: '/fix' }],
  },
  {
    id: 'l-review-progress', title: 'Reviewing Player Progress', estMinutes: 7, roleIds: ['coach', 'partner', 'power-user'],
    difficulty: 'intermediate', version: V,
    objectives: ['Read progress over time', 'Use the retest to prove change'],
    whyItMatters: 'Proof of improvement keeps athletes (and parents) engaged and trusting.',
    walkthrough: [
      'Review the athlete’s history and the before/after retest under matched conditions to show whether the fix worked.',
      'Frame progress around the athlete’s own trend, not comparison to others.',
    ],
    completionCriteria: 'Describe how to prove a change with a retest.',
    relatedFeatures: [{ label: 'Progress / Arc', route: '/arc' }],
  },

  // ── Customer Support Readiness ─────────────────────────────
  {
    id: 'l-support-triage', title: 'Support Console & Triage', estMinutes: 8, roleIds: ['support', 'admin', 'power-user'],
    difficulty: 'intermediate', version: V,
    objectives: ['Triage tickets systematically', 'Know the first checks for common issues'],
    whyItMatters: 'A consistent triage method makes support fast, fair, and accurate.',
    walkthrough: [
      'Classify the ticket, reproduce or inspect the input, apply the matching playbook, and escalate only when needed.',
      'For analysis complaints, the input (angle/framing/lighting) is almost always the first thing to check.',
    ],
    quizId: 'q-support-triage',
    completionCriteria: 'Pass the triage knowledge check.',
    relatedFeatures: [{ label: 'Support', route: '/support' }],
  },
  {
    id: 'l-top-issues', title: 'Top User Issues & Troubleshooting', estMinutes: 10, roleIds: ['support', 'admin', 'power-user'],
    difficulty: 'intermediate', version: V,
    objectives: ['Resolve the most frequent issues', 'Explain the storage/sync model accurately'],
    whyItMatters: 'A handful of issues drive most tickets; mastering them clears the queue.',
    walkthrough: [
      'Top issues: poor/odd analysis (input quality), "my data is gone" after switching devices (sign-in/cloud-sync or Backup & Restore), upload failures, and AI-output questions.',
      'Storage model: signed-in data syncs to the user’s private account across devices; without an account it stays on the device; the full video never leaves the device.',
    ],
    challengeId: 'ch-support-ticket',
    commonMistakes: ['Telling a user their synced data is gone without checking account sign-in.'],
    completionCriteria: 'Complete the mock support-ticket challenge.',
    relatedFeatures: [{ label: 'Backup & Restore', route: '/settings/backup' }],
  },
  {
    id: 'l-escalation', title: 'Escalation, Refunds & Trust Guidelines', estMinutes: 7, roleIds: ['support', 'admin'],
    difficulty: 'intermediate', version: V,
    objectives: ['Apply escalation rules', 'Handle refunds and trust issues consistently'],
    whyItMatters: 'Clear rules keep us fair to users and protect the company.',
    walkthrough: [
      'Escalate confirmed bugs and anything touching data, privacy, or security. Follow the documented refund/trust guidelines rather than improvising.',
      'Never make medical or guaranteed-outcome statements to de-escalate.',
    ],
    completionCriteria: 'List what must be escalated.',
  },

  // ── Sales & Demo Readiness ─────────────────────────────────
  {
    id: 'l-positioning', title: 'Product Positioning', estMinutes: 8, roleIds: ['sales', 'partner', 'marketing'],
    difficulty: 'intermediate', version: V,
    objectives: ['Deliver the core positioning', 'Name the real differentiators'],
    whyItMatters: 'Clear positioning makes every demo and message land.',
    walkthrough: [
      'Position SwingVantage as a multi-sport AI swing coach that tells you the one thing to work on next, with privacy and progress tracking built in.',
      'Differentiators: multi-sport in one app, honest prioritization, on-device video privacy. Never guarantee results.',
    ],
    quizId: 'q-sales-position',
    completionCriteria: 'Pass the positioning knowledge check.',
    relatedFeatures: [{ label: 'Pricing', route: '/pricing' }, { label: 'Features', route: '/features' }],
  },
  {
    id: 'l-demos', title: 'Persona-Based Demos', estMinutes: 12, roleIds: ['sales', 'partner'],
    difficulty: 'advanced', version: V,
    objectives: ['Tailor the demo flow per persona', 'Open with the job-to-be-done'],
    whyItMatters: 'A persona-tailored demo converts far better than a feature tour.',
    walkthrough: [
      'Start with the persona’s goal (coach: manage many athletes; parent: simple/safe improvement; facility: throughput), then show the shortest path to that value.',
      'Close with a concrete next step. Keep all claims honest.',
    ],
    challengeId: 'ch-coach-demo',
    completionCriteria: 'Complete the coach-demo roleplay challenge.',
    relatedFeatures: [{ label: 'Coach', route: '/coach' }],
  },
  {
    id: 'l-objections', title: 'Handling Objections', estMinutes: 8, roleIds: ['sales', 'partner'],
    difficulty: 'advanced', version: V,
    objectives: ['Respond to the common objections', 'Differentiate without overpromising'],
    whyItMatters: 'Objections are buying signals; handling them well builds trust.',
    walkthrough: [
      '"Just a video app?" → reframe to multi-sport AI coaching + prioritization + privacy. "Is it accurate?" → honest confidence framing + pairs-with-a-coach. "Too complex?" → show the one-priority simplicity.',
    ],
    commonMistakes: ['Beating an objection with a guarantee.'],
    completionCriteria: 'Give a clean reply to three objections.',
  },

  // ── Admin & Operations Mastery ─────────────────────────────
  {
    id: 'l-admin-users', title: 'Admin Dashboard & User Management', estMinutes: 9, roleIds: ['admin'],
    difficulty: 'advanced', version: V,
    objectives: ['Navigate admin tools', 'Plan internal structures like learning paths'],
    whyItMatters: 'Admins keep the platform — and this Academy — running and well-organized.',
    walkthrough: [
      'Admin tools are internal-only, server-guarded, and noindex. Treat them with care and follow audit/permission practices.',
      'Planning new structures (like a learning path) is part of operations.',
    ],
    quizId: 'q-admin-basics',
    challengeId: 'ch-admin-path',
    completionCriteria: 'Pass the admin basics check and complete the path-planning challenge.',
    relatedFeatures: [{ label: 'Admin', route: '/admin' }],
  },
  {
    id: 'l-security-privacy', title: 'Security & Privacy Basics', estMinutes: 8, roleIds: ['admin', 'engineering', 'ai-ml', 'support'],
    difficulty: 'advanced', version: V,
    objectives: ['Apply secrets hygiene', 'Describe the data/privacy posture accurately'],
    whyItMatters: 'A single leaked secret or wrong privacy claim is costly. Everyone touching internal tools needs the basics.',
    walkthrough: [
      'Secrets (service-role keys, DB passwords, JWT secrets) never go in chats, repos, or client code — if exposed, rotate immediately.',
      'Privacy posture: signed-in data syncs to the user’s private account (RLS-protected); video stays on device; we don’t sell personal data.',
    ],
    commonMistakes: ['Pasting secrets into chat or committing them.', 'Claiming data is "local only" now that cloud sync exists.'],
    bestPractices: ['Use env/secret stores; describe storage with the accurate hybrid framing.'],
    completionCriteria: 'State the secrets rule and the accurate storage framing.',
    docLinks: [{ label: 'Trust & Safety', href: '/trust' }, { label: 'Privacy', href: '/privacy' }],
  },

  // ── AI Coaching Engine Mastery ─────────────────────────────
  {
    id: 'l-ai-philosophy', title: 'AI Coaching Philosophy', estMinutes: 8, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['State the coaching philosophy', 'Explain the feedback hierarchy'],
    whyItMatters: 'The AI’s job is to prioritize, not to overwhelm — understanding that shapes how we build, test, sell, and support it.',
    walkthrough: [
      'The engine surfaces the single highest-priority fix, gives one drill, frames confidence honestly, and pairs with — never replaces — a human coach.',
      'It escalates to a human for pain/injury or anything beyond its confidence, and never makes medical or guaranteed-outcome claims.',
    ],
    bestPractices: ['One priority, one drill, honest confidence.'],
    quizId: 'q-ai-coaching',
    completionCriteria: 'Pass the knowledge check (80%).',
    relatedFeatures: [{ label: 'AI Coach', route: '/coach' }],
  },
  {
    id: 'l-ai-drills', title: 'How Drill Recommendations Are Created', estMinutes: 7, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Describe how a diagnosis maps to a drill', 'Explain sport-specific differences'],
    whyItMatters: 'Recommendations are explainable, not magic — knowing the mapping lets you justify and troubleshoot them.',
    walkthrough: [
      'A diagnosed priority issue maps to a sport-specific drill chosen to address that exact pattern, with a retest to prove change.',
      'The same issue can map to different drills across golf, tennis, baseball, and softball.',
    ],
    completionCriteria: 'Explain the diagnosis→drill→retest loop.',
    relatedFeatures: [{ label: 'Drills / Fix', route: '/fix' }],
  },
  {
    id: 'l-ai-personalization', title: 'Personalization & Confidence Logic', estMinutes: 7, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Explain what personalizes output', 'Connect data richness to confidence'],
    whyItMatters: 'Personalization and confidence are driven by data — this is the honest core of the product.',
    walkthrough: [
      'Profile, equipment, session history, and any measured data personalize the analysis and raise confidence.',
      'Thin input yields lower-confidence estimates; richer input sharpens both usefulness and confidence.',
    ],
    completionCriteria: 'Explain how confidence rises with data.',
  },

  // ── Product QA Academy ─────────────────────────────────────
  {
    id: 'l-qa-philosophy', title: 'QA Testing Philosophy', estMinutes: 7, roleIds: ['qa', 'product', 'engineering'],
    difficulty: 'intermediate', version: V,
    objectives: ['Test like an expert user', 'Prioritize realistic edge cases'],
    whyItMatters: 'QA protects trust: catching a bad analysis or a broken upload before users do is high-leverage.',
    walkthrough: [
      'Test the real journey across sports, not just the happy path; cover the failure modes users actually hit.',
      'Validate honesty too: outputs must lead with one priority, label confidence, and avoid medical/guarantee claims.',
    ],
    quizId: 'q-qa',
    completionCriteria: 'Pass the QA knowledge check.',
  },
  {
    id: 'l-qa-video-testing', title: 'Video Upload & Analysis Testing', estMinutes: 8, roleIds: ['qa', 'product', 'engineering'],
    difficulty: 'intermediate', version: V,
    objectives: ['Write video test cases', 'Cover capture failure modes'],
    whyItMatters: 'Video is the highest-traffic, highest-risk path; thorough tests here prevent the most support tickets.',
    walkthrough: [
      'Test formats, angles, lighting, and partial-frame/backlit/shaky inputs, plus the in-app recorder and file upload.',
      'Confirm the privacy behavior: only sampled frames are sent; the full video stays on device.',
    ],
    commonMistakes: ['Only testing one clean swing.'],
    completionCriteria: 'List five video test cases including edge cases.',
    relatedFeatures: [{ label: 'Video Analyzer', route: '/video' }],
  },
  {
    id: 'l-qa-ai-validation', title: 'AI Output Validation', estMinutes: 8, roleIds: ['qa', 'product', 'engineering', 'ai-ml'],
    difficulty: 'advanced', version: V,
    objectives: ['Validate AI responses against guardrails', 'Flag non-compliant output'],
    whyItMatters: 'Catching an overclaiming or unsafe AI response in QA prevents a trust-damaging incident.',
    walkthrough: [
      'Check that output leads with one priority, labels confidence, and contains no medical or guaranteed-outcome claims.',
      'When output violates a guardrail, flag and route it per the responsible-AI process.',
    ],
    completionCriteria: 'Correctly judge whether a sample AI output is compliant.',
    docLinks: [{ label: 'Trust & Safety', href: '/trust' }],
  },

  // ── Marketing Enablement ───────────────────────────────────
  {
    id: 'l-brand-voice', title: 'Brand Voice', estMinutes: 6, roleIds: ['marketing', 'content', 'sales'],
    difficulty: 'foundational', version: V,
    objectives: ['Apply the SwingVantage voice', 'Avoid hype'],
    whyItMatters: 'Consistent, honest voice is a brand asset and protects trust.',
    walkthrough: [
      'Confident, warm, plain-language; lead with the user’s benefit. We are honest about limits and never overpromise.',
      'Avoid jargon, hype, fear, and competitor bashing.',
    ],
    bestPractices: ['Confident but honest; benefit-first; plain words.'],
    completionCriteria: 'Rewrite a hypey sentence in brand voice.',
    docLinks: [{ label: 'Methodology', href: '/methodology' }],
  },
  {
    id: 'l-feature-messaging', title: 'Feature Messaging', estMinutes: 6, roleIds: ['marketing', 'content'],
    difficulty: 'intermediate', version: V,
    objectives: ['Translate features into value', 'Message by sport and persona'],
    whyItMatters: 'Messaging that leads with value (not features) converts and stays honest.',
    walkthrough: [
      'For each feature, finish "…so that the user can ___" and tailor to the persona and sport.',
      'Keep claims data-backed; mark estimates as estimates.',
    ],
    completionCriteria: 'Write a value-first message for one feature.',
  },
  {
    id: 'l-claims-guidelines', title: 'Responsible Performance Claims', estMinutes: 8, roleIds: ['marketing', 'content', 'sales'],
    difficulty: 'intermediate', version: V,
    objectives: ['Apply claim guardrails', 'Spot non-compliant claims'],
    whyItMatters: 'A single overclaim (medical or guaranteed result) is a legal and trust risk.',
    walkthrough: [
      'Allowed: data-backed estimates, confidence framing, pairs-with-a-coach. Not allowed: guaranteed outcomes, medical/injury claims.',
      'When unsure, soften to an estimate and add the honest qualifier.',
    ],
    commonMistakes: ['"Guaranteed +10 mph", "fixes your injury".'],
    quizId: 'q-marketing',
    completionCriteria: 'Pass the marketing knowledge check (80%).',
    docLinks: [{ label: 'Trust & Safety', href: '/trust' }],
  },
  {
    id: 'l-seo-aeo-geo', title: 'SEO / AEO / GEO Strategy', estMinutes: 7, roleIds: ['marketing', 'content'],
    difficulty: 'intermediate', version: V,
    objectives: ['Explain SEO/AEO/GEO at a high level', 'Keep content honest + answer-shaped'],
    whyItMatters: 'Discoverability across search and answer engines drives free growth — the company’s #1 priority.',
    walkthrough: [
      'Write clear, answer-shaped content for people and AI answer engines; keep claims accurate (answer engines penalize and mistrust overclaiming).',
      'Drafts stay drafts until substantive — an anti-thin-content gate enforces quality.',
    ],
    completionCriteria: 'Describe the difference between SEO and AEO/GEO.',
    docLinks: [{ label: 'Updates', href: '/updates' }],
  },

  // ── Executive Product Fluency ──────────────────────────────
  {
    id: 'l-exec-strategy', title: 'Platform Strategy & Positioning', estMinutes: 8, roleIds: ['executive', 'product'],
    difficulty: 'advanced', version: V,
    objectives: ['State the strategy and GTM order', 'Explain the moat'],
    whyItMatters: 'Leadership needs a shared, accurate strategic frame to make consistent calls.',
    walkthrough: [
      'GTM order: grow free users → ads (first revenue) → membership tiers. Subscriptions are a later phase, not next.',
      'Moat: honest, prioritized AI coaching across five sports, privacy, and a growing base of each athlete’s own progress data.',
    ],
    quizId: 'q-exec',
    completionCriteria: 'Pass the executive knowledge check.',
    docLinks: [{ label: 'Monetization strategy', href: '/pricing' }],
  },
  {
    id: 'l-exec-ai-map', title: 'AI Capability Map', estMinutes: 7, roleIds: ['executive', 'product'],
    difficulty: 'advanced', version: V,
    objectives: ['Map the AI capabilities and their limits', 'Speak to AI risk honestly'],
    whyItMatters: 'Executives must represent AI capability accurately to partners, press, and the team.',
    walkthrough: [
      'Capabilities: AI swing-video analysis (frames), AI coach/agents, 3D motion estimation, recommendations. Each is an estimate with confidence, not certified measurement.',
      'Risk posture: no medical claims, human review of AI content, guardrails enforced.',
    ],
    completionCriteria: 'List three AI capabilities and one limit of each.',
  },
  {
    id: 'l-exec-growth-risk', title: 'Growth Loops, Monetization & Risk', estMinutes: 8, roleIds: ['executive', 'product'],
    difficulty: 'advanced', version: V,
    objectives: ['Describe the growth loops', 'Name the top risks'],
    whyItMatters: 'Sequencing growth, revenue, and risk correctly is the core executive job.',
    walkthrough: [
      'Growth: free value → content/SEO discovery → retention via progress + coaching → ads → tiers.',
      'Risks: measurement gaps, compliance/legal before paid/youth scale, AI overclaim — all tracked in the master audit report.',
    ],
    completionCriteria: 'Name two growth loops and two risks.',
    docLinks: [{ label: 'Master audit report', href: '/admin' }],
  },

  // ── Support Deep Dives ─────────────────────────────────────
  {
    id: 'l-support-account-access', title: 'Account Access & Sign-in Issues', estMinutes: 7, roleIds: ['support', 'admin'],
    difficulty: 'intermediate', version: V,
    objectives: ['Resolve sign-in/access problems', 'Explain the auth + sync model'],
    whyItMatters: 'Access issues block everything; resolving them fast retains users.',
    walkthrough: [
      'Confirm the user is signing in to the right account; password reset uses a branded email link. Signed-in data syncs across devices.',
      'If a user "lost data" after a device switch, the fix is usually signing into the same account (cloud sync) or Backup & Restore.',
    ],
    commonMistakes: ['Assuming data is gone before checking account sign-in.'],
    completionCriteria: 'Walk through resolving a "can’t sign in / lost data" ticket.',
    relatedFeatures: [{ label: 'Backup & Restore', route: '/settings/backup' }],
  },
  {
    id: 'l-support-billing', title: 'Subscription & Billing Questions', estMinutes: 6, roleIds: ['support', 'admin'],
    difficulty: 'intermediate', version: V,
    objectives: ['Answer billing questions accurately', 'Set correct expectations'],
    whyItMatters: 'Money questions must be answered precisely and honestly.',
    walkthrough: [
      'SwingVantage is currently free-first; paid tiers may be waitlist/early. Never promise a price, date, or feature that isn’t live.',
      'For any real charge/refund, follow the documented guidelines and escalate when unsure.',
    ],
    commonMistakes: ['Quoting a price or launch date that isn’t confirmed.'],
    completionCriteria: 'Answer a billing question without overpromising.',
  },
  {
    id: 'l-support-macros', title: 'Support Macros & Tone', estMinutes: 6, roleIds: ['support'],
    difficulty: 'foundational', version: V,
    objectives: ['Use macros without sounding robotic', 'Keep tone warm + honest'],
    whyItMatters: 'Consistent, human tone at scale is what great support feels like.',
    walkthrough: [
      'Macros are starting points — personalize them. Acknowledge, guide to the fix, set a clear next step.',
      'Never use a macro that overpromises AI accuracy or makes a medical claim.',
    ],
    bestPractices: ['Empathize → guide → next step.'],
    completionCriteria: 'Adapt a macro for a frustrated user.',
  },

  // ── Product Deep Dives ─────────────────────────────────────
  {
    id: 'l-equipment', title: 'Equipment Profiles & Recommendations', estMinutes: 7, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Explain equipment context per sport', 'Frame recommendations honestly'],
    whyItMatters: 'Equipment context improves personalization; recommendations must stay suggestions, not guarantees.',
    walkthrough: [
      'Each sport captures relevant gear (clubs, racket, bats). It is optional — the app works without it — but it sharpens context.',
      'Recommendations are informational, never guaranteed performance promises.',
    ],
    commonMistakes: ['Implying a gear change guarantees results.'],
    completionCriteria: 'Explain why equipment context helps and its limits.',
    relatedFeatures: [{ label: 'Equipment', route: '/equipment' }],
  },
  {
    id: 'l-health-integrations', title: 'Smartwatch & Health Data', estMinutes: 8, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Explain health/wearable context honestly', 'Apply privacy + no-medical-claims rules'],
    whyItMatters: 'Health data is sensitive and easy to over-interpret; we use it for readiness context, never diagnosis.',
    walkthrough: [
      'Optional wellness/wearable inputs inform a readiness/coaching context (the BodySync layer). It is performance context, not medical advice.',
      'Be privacy-careful and never imply injury detection or medical diagnosis.',
    ],
    commonMistakes: ['Treating readiness as a medical assessment.'],
    completionCriteria: 'State what health data is (and is not) used for.',
    relatedFeatures: [{ label: 'BodySync', route: '/bodysync' }],
    docLinks: [{ label: 'Privacy', href: '/privacy' }],
  },
  {
    id: 'l-multisport-switch', title: 'Multi-Sport Switching', estMinutes: 5, roleIds: 'all',
    difficulty: 'foundational', version: V,
    objectives: ['Switch sports', 'Explain how context adapts'],
    whyItMatters: 'Multi-sport is a core differentiator; staff should demo switching smoothly.',
    walkthrough: [
      'A user can switch the active sport; analysis, drills, equipment, and guidance adapt to that sport.',
      'Progress is tracked per sport.',
    ],
    completionCriteria: 'Demonstrate switching sports and what changes.',
  },
  {
    id: 'l-practice-plans', title: 'Practice Plans', estMinutes: 6, roleIds: 'all',
    difficulty: 'intermediate', version: V,
    objectives: ['Explain how practice plans are built', 'Tie plans to the priority fix'],
    whyItMatters: 'Plans turn an analysis into action — the bridge from insight to improvement.',
    walkthrough: [
      'A plan organizes the recommended drill(s) for the current priority into a simple, repeatable routine, with a retest to prove change.',
      'Keep it focused — one priority at a time.',
    ],
    completionCriteria: 'Describe how a practice plan follows from a diagnosis.',
    relatedFeatures: [{ label: 'Training', route: '/fix' }],
  },
];
