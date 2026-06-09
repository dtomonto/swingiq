// ============================================================
// SwingVantage — Feature Registry: Analysis core
// (Swing Diagnosis · Data Import · Video Analysis · Motion Lab)
// ============================================================

import type { Feature } from './types';

export const ANALYSIS_FEATURES: Feature[] = [
  // ── Swing Diagnosis ──────────────────────────────────────
  {
    slug: 'ai-diagnostic-engine',
    name: 'AI Diagnostic Engine',
    group: 'Swing Diagnosis',
    sports: 'All 7 sports',
    summary:
      'A rules-based engine compares your data against sport-specific benchmarks and identifies your highest-priority swing fault — ranked by severity, confidence, and impact on performance.',
    note: 'Each finding includes the evidence used to reach the conclusion, likely causes, and what to expect if the issue is corrected.',
    overview: [
      'The Diagnostic Engine is the brain of SwingVantage. Instead of dumping a wall of numbers on you, it reads your shot data, video, or logged session and answers the only question that matters for getting better: "What is the one thing holding me back right now, and what do I do about it?"',
      'It works by comparing what it sees against sport-specific benchmarks for your level — not against a tour professional you have nothing in common with. Every candidate fault is scored on three axes: severity (how far outside the healthy range it is), confidence (how much trustworthy data supports the read), and impact (how much fixing it would actually move your performance). The highest-scoring fault becomes your priority; the rest are kept in view but de-emphasised so you are never working on six things at once.',
      'Crucially, the engine is transparent. Each finding shows the exact evidence behind it, the most likely causes, and an honest forecast of what changes if you correct it — so you can agree or disagree with the diagnosis rather than taking it on faith.',
    ],
    bestFor: [
      'Players who get overwhelmed by raw launch-monitor or video data and want a clear next step',
      'Anyone practising without a coach who needs an objective second opinion',
      'Self-coached athletes who want to work on the highest-leverage fault first',
    ],
    guide: [
      {
        title: 'Feed it real data',
        body: 'Import a launch-monitor CSV, upload a swing video, snap a screenshot of a stats table, or log a session manually. The more honest the input, the sharper the diagnosis — the engine is upfront when it has too little to be confident.',
      },
      {
        title: 'Read the priority fault first',
        body: 'Open your diagnosis and start at the top. The single highest-priority fault is the one to work on now; resist the urge to chase the secondary items until the first is retested.',
      },
      {
        title: 'Check the evidence and confidence',
        body: 'Expand the finding to see which data points drove it and the confidence label. If the confidence is low, add another session or a clearer video before committing practice time to it.',
      },
      {
        title: 'Send it into a Fix Stack',
        body: 'Turn the priority fault into a Fix Stack — a body cue, a matched drill, and a retest — so the diagnosis becomes a concrete practice loop instead of just information.',
      },
      {
        title: 'Re-run after focused practice',
        body: 'After a week of working the fix, feed the engine fresh data and compare. A diagnosis is only useful if you close the loop and prove the change.',
      },
    ],
    proTips: [
      'Capture data under similar conditions each time (same range, same camera angle) so the engine is comparing like with like.',
      'If you disagree with a finding, look at the evidence it cites — usually it has spotted a real pattern you were discounting.',
    ],
    limitations: [
      'It is a rules-and-benchmarks engine, not a launch-monitor or a biomechanics lab — it is only as good as the data you give it.',
      'Single-camera video reads are estimates; treat them as a confident starting point, not measured truth.',
    ],
    faqs: [
      {
        question: 'Does the Diagnostic Engine need an account or internet connection?',
        answer:
          'No. The core diagnosis is deterministic and runs locally in your browser. An account simply syncs your history across devices, and the optional AI Coach adds conversational explanations on top.',
      },
      {
        question: 'Why does it only show one priority fault?',
        answer:
          'Because improvement comes from focused repetition, not scattered attention. Working a single highest-leverage fault to a retest beats nibbling at five at once. The others stay visible so nothing is hidden.',
      },
      {
        question: 'How is this different from a launch monitor?',
        answer:
          'A launch monitor measures what happened (ball speed, spin, path). The Diagnostic Engine interprets it — it tells you which number is the real problem, why, and what to do, ranked by impact.',
      },
    ],
    relatedSlugs: ['confidence-labels', 'competing-hypotheses', 'fix-stack', 'swing-score-trends'],
    relatedLinks: [
      { label: 'How SwingVantage works', href: '/how-it-works' },
      { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    ],
  },
  {
    slug: 'confidence-labels',
    name: 'Confidence Labels',
    group: 'Swing Diagnosis',
    sports: 'All 7 sports',
    summary:
      'Every diagnosis shows a confidence level and lists exactly what data was used. When data is limited, SwingVantage says so rather than guessing.',
    note: 'Labels include: High Confidence, Moderate Confidence, Low Confidence / Limited Data.',
    overview: [
      'Confidence Labels are SwingVantage’s honesty mechanism. Every diagnosis, score, and recommendation carries a plain-English confidence level and a list of the data points it was built from — so you always know how much weight to put on a given read.',
      'This matters because the worst thing a coaching tool can do is sound certain when it is guessing. A high-confidence read backed by 30 shots deserves your practice time; a low-confidence read from a single blurry clip is a hint to gather more data, not a verdict. By surfacing this on every output, SwingVantage lets you calibrate your trust instead of taking everything at face value.',
    ],
    bestFor: [
      'Data-minded players who want to know the basis for a recommendation',
      'Anyone deciding whether a finding is solid enough to rebuild a swing around',
    ],
    guide: [
      {
        title: 'Glance at the label before you act',
        body: 'On any diagnosis or score, find the confidence chip (High / Moderate / Low–Limited Data). Treat it as the headline before you read the detail.',
      },
      {
        title: 'Open the "what data was used" list',
        body: 'Expand the finding to see exactly which inputs supported it — shot count, video angle, logged sessions. This tells you what to add to strengthen the read.',
      },
      {
        title: 'Raise confidence deliberately',
        body: 'If a label is Low, capture more of the same kind of data under consistent conditions, then re-run. Watch the label climb as the evidence grows.',
      },
    ],
    proTips: [
      'Use Low-confidence findings as a to-do list for data collection, not as practice priorities.',
      'A Moderate label that stays moderate across several sessions is often a real, stable pattern worth addressing.',
    ],
    limitations: [
      'Confidence reflects the quantity and consistency of your data, not a guarantee — even high-confidence reads are interpretations, not lab measurements.',
    ],
    faqs: [
      {
        question: 'What makes a diagnosis "high confidence"?',
        answer:
          'Enough consistent, good-quality data points (e.g. a solid sample of shots, a clear video from a usable angle) that the pattern is unlikely to be noise. The exact basis is listed on every finding.',
      },
      {
        question: 'Should I ignore low-confidence findings?',
        answer:
          'Don’t ignore them — treat them as leads. A low-confidence finding is the engine saying "this might be something; get me more data." Capture another session and see if it firms up.',
      },
    ],
    relatedSlugs: ['ai-diagnostic-engine', 'competing-hypotheses', 'retest'],
  },
  {
    slug: 'competing-hypotheses',
    name: 'Competing Hypotheses',
    group: 'Swing Diagnosis',
    sports: 'Golf',
    summary:
      'For golf diagnoses, SwingVantage shows the secondary issue most likely to co-exist with the primary fault — helping you understand pattern relationships rather than treating issues in isolation.',
    overview: [
      'Swing faults rarely live alone. A slice is often tangled up with an over-the-top move; a topped shot can share a root cause with a thin strike. Competing Hypotheses surfaces the secondary issue most likely to co-exist with your primary golf fault, so you understand the pattern rather than chasing a single symptom.',
      'This reframes practice from "fix this one thing" to "understand how these things relate" — which is how good coaches actually think. Seeing the likely partner-fault helps you pick a fix that addresses the root cause both share, instead of playing whack-a-mole with symptoms.',
    ],
    bestFor: [
      'Golfers whose miss has more than one plausible cause',
      'Players who have "fixed" a fault only to see it return in a new form',
    ],
    guide: [
      {
        title: 'Read the primary, then the partner',
        body: 'After your golf diagnosis, note the priority fault, then open the competing hypothesis to see the issue most likely riding alongside it.',
      },
      {
        title: 'Look for the shared root',
        body: 'Ask which single change would influence both faults. SwingVantage’s drill recommendations often target that shared cause.',
      },
      {
        title: 'Retest both together',
        body: 'When you re-analyse, check whether the partner-fault moved too. If it did, you found the real lever; if only one changed, you treated a symptom.',
      },
    ],
    limitations: [
      'Currently golf-specific, where fault co-occurrence patterns are best established.',
      'A hypothesis is a likelihood, not a certainty — your video and data still decide.',
    ],
    faqs: [
      {
        question: 'Why is this golf-only right now?',
        answer:
          'Golf has the richest, most consistent data (launch monitors, decades of fault taxonomy), so co-occurrence patterns are well established. The approach will extend to other sports as their data matures.',
      },
    ],
    relatedSlugs: ['ai-diagnostic-engine', 'confidence-labels', 'fix-stack'],
    relatedLinks: [{ label: 'Fix your slice', href: '/golf/fix-slice' }],
  },

  // ── Data Import ──────────────────────────────────────────
  {
    slug: 'launch-monitor-csv-import',
    name: 'Launch Monitor CSV Import',
    group: 'Data Import',
    sports: 'Golf',
    summary:
      'Import CSV exports from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak, and other common formats. A 7-step wizard walks you through column mapping and session setup.',
    note: 'The normalizer handles different column name formats and unit conversions automatically.',
    overview: [
      'If you own or rent time on a launch monitor, this is the fastest way to turn its raw export into a full diagnosis. SwingVantage reads CSV files from the major brands — FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak and more — and a 7-step wizard guides you through mapping columns and setting up the session.',
      'The normalizer does the tedious part: it recognises different column-name conventions, converts units (mph/kph, yards/metres), and reconciles the dozens of ways brands label the same metric. The result is a clean, comparable dataset the Diagnostic Engine can read regardless of which device produced it.',
      'Because the mapping is remembered, your second import from the same device is nearly one-click — SwingVantage reuses the column layout it learned the first time.',
    ],
    bestFor: [
      'Golfers with access to a launch monitor at a range, studio, or at home',
      'Players who want diagnosis from measured ball/club data rather than video estimates',
    ],
    guide: [
      {
        title: 'Export a CSV from your device',
        body: 'On your launch monitor or its app, export the session as CSV. Most brands have a share/export option; you do not need a special format.',
      },
      {
        title: 'Start the import wizard',
        body: 'Open SwingVantage → import, choose the CSV, and let the wizard auto-detect the source. It pre-fills the column mapping when it recognises the format.',
      },
      {
        title: 'Confirm the column mapping',
        body: 'Check that each column (carry, ball speed, club path, face angle, etc.) is mapped to the right field. Adjust any it could not auto-detect — it learns your choices for next time.',
      },
      {
        title: 'Set the session context',
        body: 'Tag the club(s), conditions, and what you were working on. Context sharpens the diagnosis and makes session history more useful.',
      },
      {
        title: 'Review and run the diagnosis',
        body: 'Confirm the parsed shots look right, save, and open your diagnosis. Re-importing from the same device later reuses this mapping automatically.',
      },
    ],
    proTips: [
      'Keep the same export settings between sessions so the learned mapping keeps working and your data stays comparable.',
      'Import shorter, focused blocks (e.g. one club at a time) when diagnosing a specific issue.',
    ],
    limitations: [
      'Quality of diagnosis depends on the quality and quantity of shots in the file — a handful of warm-up swings is not enough for a confident read.',
      'Exotic or heavily customised CSV layouts may need a manual column mapping the first time.',
    ],
    faqs: [
      {
        question: 'My launch monitor isn’t in the list — can I still import?',
        answer:
          'Yes. The wizard lets you map columns manually for any CSV, and it remembers the mapping so subsequent imports are quick. Most "unsupported" devices work fine this way.',
      },
      {
        question: 'Does it handle metric and imperial units?',
        answer:
          'Yes — the normalizer converts units automatically based on the detected or selected format, so you can mix devices and regions without breaking your history.',
      },
    ],
    relatedSlugs: ['screenshot-image-import', 'ai-diagnostic-engine', 'swing-score-trends', 'loft-gapping-analysis'],
    relatedLinks: [{ label: 'Reading a launch monitor', href: '/golf/launch-monitor' }],
  },
  {
    slug: 'screenshot-image-import',
    name: 'Screenshot / Image Import',
    group: 'Data Import',
    sports: 'All 7 sports',
    summary:
      'Upload a photo of a launch monitor screen, stats table, or scoreboard. SwingVantage provides a side-by-side data entry form so you can enter values while referencing the image.',
    note: 'Optional OCR auto-extraction activates when an extraction provider is configured — it pre-fills the review table from your image and you confirm every value before saving. Manual entry is always the default.',
    overview: [
      'Not every device exports a clean CSV — many show your numbers only on a screen. Screenshot Import bridges that gap: snap a photo of a launch-monitor display, a stats table, or a scoreboard, and SwingVantage puts the image side-by-side with a data-entry form so you can transcribe values quickly and accurately.',
      'When an OCR provider is configured, the optional auto-extraction reads the image and pre-fills the review table for you — but you confirm every value before it is saved. Manual entry is always the default, so nothing is ever guessed into your record without your sign-off. This keeps the data honest while saving the drudgery of typing.',
    ],
    bestFor: [
      'Players whose device shows numbers on-screen but has no export',
      'Anyone capturing stats from a simulator bay, gym monitor, or printed sheet',
    ],
    guide: [
      {
        title: 'Capture a clear image',
        body: 'Photograph the screen or table straight-on with good light and minimal glare. The clearer the image, the easier the transcription (and the better any OCR read).',
      },
      {
        title: 'Upload and reference side-by-side',
        body: 'Open the image importer; your photo sits next to the entry form so you can read and type without switching screens.',
      },
      {
        title: 'Confirm every value',
        body: 'If OCR pre-filled the table, check each number against the image and correct anything off. If not, type the values you need for a diagnosis.',
      },
      {
        title: 'Save and diagnose',
        body: 'Add session context and save. The data flows into the same Diagnostic Engine as a CSV import.',
      },
    ],
    proTips: [
      'You only need the metrics relevant to your question — for a path issue, club path and face angle matter more than spin.',
      'Crop the photo to just the numbers before uploading to make OCR and manual entry faster.',
    ],
    limitations: [
      'OCR is optional and only as good as the photo — always verify; SwingVantage never saves an unconfirmed extracted value.',
      'A photo of a screen is a transcription aid, not a measurement device — accuracy depends on what you enter.',
    ],
    faqs: [
      {
        question: 'Do I need to turn on OCR?',
        answer:
          'No. Manual entry with the side-by-side image is the default and works everywhere. OCR is an optional accelerator that activates only when an extraction provider is configured, and you still confirm every value.',
      },
    ],
    relatedSlugs: ['launch-monitor-csv-import', 'manual-session-log', 'ai-diagnostic-engine'],
  },
  {
    slug: 'manual-session-log',
    name: 'Manual Session Log',
    group: 'Data Import',
    sports: 'Tennis, Pickleball, Padel, Baseball, Softball',
    summary:
      'Log a session manually — session type, duration, perceived effort, key metrics, and what you worked on. No tracking device required.',
    overview: [
      'You do not need any hardware to build a meaningful training record. The Manual Session Log lets you capture a practice or match in under a minute: the type of session, how long it ran, how hard it felt, any key metrics you tracked, and what you were working on.',
      'Logged consistently, these entries become a powerful signal. SwingVantage reads patterns across them — recurring focuses, effort trends, what you keep returning to — and folds them into your progress timeline and cross-sport profile. It is the lowest-friction way to keep an honest history when video or device data is not available.',
    ],
    bestFor: [
      'Racket and bat-sport athletes training without a tracker',
      'Anyone who wants a durable practice record with near-zero friction',
    ],
    guide: [
      {
        title: 'Log right after the session',
        body: 'Capture it while it’s fresh — type, duration, perceived effort (1–10), and a sentence on what you worked on.',
      },
      {
        title: 'Add any metrics you tracked',
        body: 'If you counted serves, reps, or a target hit-rate, add them. Even a single recurring metric becomes a trend over time.',
      },
      {
        title: 'Be honest about effort and focus',
        body: 'The value comes from consistency and candour — a true 4/10 day is more useful to your record than an inflated one.',
      },
      {
        title: 'Review the pattern monthly',
        body: 'Open your timeline and look for what keeps appearing. Recurring focuses are candidates for a dedicated fix.',
      },
    ],
    limitations: [
      'Self-reported entries are clearly treated as lower-confidence than measured data — useful for patterns, not precision.',
    ],
    faqs: [
      {
        question: 'Is a manual log worth it without numbers?',
        answer:
          'Yes. Consistency beats precision for tracking trends. Even effort and focus notes reveal patterns — which issues recur, when you train hardest — that drive better practice decisions.',
      },
    ],
    relatedSlugs: ['daily-notes', 'session-history', 'tracking-device-support'],
  },
  {
    slug: 'tracking-device-support',
    name: 'Tracking Device Support',
    group: 'Data Import',
    sports: 'Baseball & Softball',
    summary:
      'Accepts data from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, and similar hitting trackers.',
    overview: [
      'For baseball and softball hitters using a tracker, SwingVantage accepts data from the common systems — HitTrax, Rapsodo, Blast Motion, Diamond Kinetics and similar — so your exit velocity, launch angle, bat speed and related metrics flow straight into diagnosis and progress tracking.',
      'This turns a hitting facility’s raw output into something actionable: instead of a spreadsheet of numbers per cage session, you get a ranked read on the one mechanical issue most limiting your contact, plus trends across sessions so you can see whether a change is sticking.',
    ],
    bestFor: [
      'Hitters with access to a cage tracker or facility system',
      'Players who want exit-velo and bat-speed trends tied to mechanical feedback',
    ],
    guide: [
      {
        title: 'Export from your tracker',
        body: 'Export the session from your device or its app (CSV or the supported format). Facility systems like HitTrax can usually email or export a session file.',
      },
      {
        title: 'Import and map',
        body: 'Bring the file into SwingVantage; the importer maps the metrics (exit velo, launch angle, bat speed) and remembers the layout.',
      },
      {
        title: 'Pair with a swing video',
        body: 'Add a swing clip from the same session so the mechanical read and the measured outcomes reinforce each other.',
      },
      {
        title: 'Track the trend',
        body: 'Review exit velocity and contact quality across sessions to confirm a mechanical change is producing real output gains.',
      },
    ],
    limitations: [
      'Available metrics depend on what your tracker captures — SwingVantage works with what the export provides.',
    ],
    faqs: [
      {
        question: 'Which hitting trackers are supported?',
        answer:
          'HitTrax, Rapsodo, Blast Motion, Diamond Kinetics and similar systems. As with golf CSVs, you can map columns manually for any export, so most devices work even if not named explicitly.',
      },
    ],
    relatedSlugs: ['screenshot-image-import', 'swing-video-upload', 'ai-diagnostic-engine'],
    relatedLinks: [{ label: 'Baseball swing analysis', href: '/baseball-swing-analysis' }],
  },

  // ── Video Analysis ───────────────────────────────────────
  {
    slug: 'swing-video-upload',
    name: 'Swing Video Upload',
    group: 'Video Analysis',
    sports: 'All 7 sports',
    summary:
      'Upload a video of your swing from the face-on, down-the-line, or sport-specific angle. SwingVantage segments the video into phases and provides coaching notes for each phase.',
    note: 'Every video read is a heuristic estimate that sharpens as you add data — a confident starting point you can act on today. For full on-device pose tracking and a rotatable 3D reconstruction, see Motion Lab.',
    overview: [
      'Swing Video Upload turns a phone clip into a structured, phase-by-phase read of your motion. Record from the face-on, down-the-line, or a sport-specific angle, upload it, and SwingVantage segments the swing into its natural phases and attaches coaching notes to each one — so you can see where in the motion the problem actually originates.',
      'Your video is processed locally in your browser. When you run an analysis, only sampled still frames — not your full video — are sent to the AI vision provider for review, and the frames are not retained afterward. Your original footage never leaves your device, and it is never used to train a shared model.',
      'Treat the read as a confident starting point rather than a measurement: single-camera video is interpreted heuristically and sharpens as you add data. For on-device pose tracking and a rotatable 3D reconstruction, step up to Motion Lab.',
    ],
    bestFor: [
      'Players in video-first sports (tennis, pickleball, padel, baseball, softball)',
      'Golfers who want a phase-level look to complement launch-monitor data',
    ],
    guide: [
      {
        title: 'Film a usable angle',
        body: 'Record face-on or down-the-line (or your sport’s standard angle), full body in frame, steady camera, good light. A clean clip is worth more than a long one.',
      },
      {
        title: 'Accept the privacy notice and upload',
        body: 'Confirm the on-device processing notice, then upload. Only sampled frames are sent for the read, and they aren’t kept.',
      },
      {
        title: 'Step through the phases',
        body: 'Open the phase-by-phase timeline and read the note on each phase. Find the earliest phase where things go wrong — that’s usually the real cause.',
      },
      {
        title: 'Cross-check with data',
        body: 'Where you have launch-monitor or tracker data, compare. When the video and the numbers agree, your confidence goes up.',
      },
      {
        title: 'Graduate to Motion Lab when ready',
        body: 'For a measured 3D view, film the same rep from two angles ~90° apart and run it through Motion Lab.',
      },
    ],
    proTips: [
      'Film the same angle every time so reads are comparable session to session.',
      'A two-second clip centred on the actual swing beats a thirty-second clip with setup and reaction.',
    ],
    limitations: [
      'Single-camera reads are heuristic estimates, not lab biomechanics — labelled as such throughout.',
      'No medical, injury, or tour-grade claims are made from video.',
    ],
    faqs: [
      {
        question: 'Is my video uploaded to a server?',
        answer:
          'Your full video is processed on your device and is never uploaded or stored on our servers. When you analyse, only sampled still frames are sent to the vision provider, and they are not retained afterward.',
      },
      {
        question: 'What angle should I film from?',
        answer:
          'Face-on and down-the-line are the workhorses for most sports. Film full-body, steady, in good light. Consistency of angle matters more than which one you pick.',
      },
    ],
    relatedSlugs: ['phase-by-phase-timeline', 'pro-reference-comparison', 'motion-lab-3d'],
  },
  {
    slug: 'phase-by-phase-timeline',
    name: 'Phase-by-Phase Timeline',
    group: 'Video Analysis',
    sports: 'All 7 sports',
    summary:
      'Each sport has its own swing phases. Golf: address, backswing, transition, downswing, impact, follow-through. Tennis, pickleball, padel, baseball, and softball have sport-appropriate phases.',
    overview: [
      'The Phase-by-Phase Timeline breaks your motion into the segments a coach actually thinks in — for golf: address, backswing, transition, downswing, impact, follow-through; for racket and bat sports, their own sport-appropriate phases. Each segment gets its own coaching note, so feedback is anchored to a specific moment instead of a vague "your swing looks off."',
      'Thinking in phases changes how you practise. Most faults trace back to an earlier phase than where they show up — a poor impact position is often set up in transition. The timeline helps you find the earliest link in the chain, which is where a fix has the most leverage.',
    ],
    bestFor: [
      'Visual learners who want feedback tied to a specific moment in the swing',
      'Players trying to trace a symptom back to its mechanical cause',
    ],
    guide: [
      {
        title: 'Scrub through each phase',
        body: 'Step the timeline one phase at a time rather than watching the swing at full speed. Read the note attached to each segment.',
      },
      {
        title: 'Find the earliest fault',
        body: 'Identify the first phase where something goes wrong. Earlier faults cause later ones — fix the source, not the symptom.',
      },
      {
        title: 'Pair phases with drills',
        body: 'Match the problem phase to a drill that targets it (your Fix Stack does this automatically for the priority fault).',
      },
    ],
    limitations: [
      'Phase boundaries are estimated from video; a clearer, well-angled clip yields cleaner segmentation.',
    ],
    faqs: [
      {
        question: 'Do non-golf sports get real phases too?',
        answer:
          'Yes — each sport has its own phase model appropriate to its motion (e.g. a tennis serve or a baseball swing), not a golf template forced onto it.',
      },
    ],
    relatedSlugs: ['swing-video-upload', 'pro-reference-comparison', 'motion-lab-3d'],
  },
  {
    slug: 'pro-reference-comparison',
    name: 'Pro Reference Comparison',
    group: 'Video Analysis',
    sports: 'All 7 sports',
    summary:
      'Browse a curated library of professional athlete swing references filtered by sport. Use as a visual learning reference alongside your own video.',
    note: 'References are publicly available YouTube videos. SwingVantage does not host or own the footage.',
    overview: [
      'Pro Reference Comparison gives you a curated library of professional swing references, filtered by sport, to study alongside your own video. Seeing a model motion next to your own sharpens your eye for the positions and sequencing you are trying to build.',
      'The references are publicly available videos curated for clarity — SwingVantage does not host or own the footage. The goal is calibration, not imitation: use the pros to understand what a sound move looks like, then translate it into a fix appropriate for your body and level (which is exactly what your diagnosis and benchmarks are for).',
    ],
    bestFor: [
      'Players who learn best by watching a model and comparing',
      'Anyone wanting to calibrate "what good looks like" for their sport',
    ],
    guide: [
      {
        title: 'Pick a reference for your sport',
        body: 'Filter the library by sport and choose a reference that demonstrates the position or phase you’re working on.',
      },
      {
        title: 'Compare a specific phase, not the whole swing',
        body: 'Line up the same phase in your video and the reference. Looking at one moment at a time is far more useful than watching both at speed.',
      },
      {
        title: 'Translate, don’t copy',
        body: 'Use the reference to understand the intent of a move, then apply the fix your diagnosis recommends for your level — don’t try to clone a tour swing wholesale.',
      },
    ],
    limitations: [
      'References are learning aids, not templates to match exactly — your build, mobility, and level differ from a professional’s.',
    ],
    faqs: [
      {
        question: 'Does SwingVantage host these pro videos?',
        answer:
          'No. They are publicly available videos curated for teaching clarity. SwingVantage links to and frames them as references; it does not own or host the footage.',
      },
    ],
    relatedSlugs: ['swing-video-upload', 'phase-by-phase-timeline'],
  },

  // ── 3D Motion Analysis ───────────────────────────────────
  {
    slug: 'motion-lab-3d',
    name: 'Motion Lab (3D)',
    group: '3D Motion Analysis — Motion Lab',
    sports: 'All 7 sports',
    summary:
      'Turn a phone clip into a 3D figure of your motion you can spin, slow down, and step through — with a phase-by-phase breakdown, scores for power, rotation, balance, sequencing, timing, and consistency, your top 3 fixes, and a practice plan.',
    note: 'Runs privately on your own device. One camera gives an estimated 3D read; filming the same rep from two angles about 90° apart produces measured 3D. No medical, injury, or tour-grade claims.',
    overview: [
      'Motion Lab is SwingVantage’s most advanced analysis surface: it reconstructs your swing as a rotatable 3D figure you can spin, slow down, and step through frame by frame — all from a phone clip, all on your own device. Alongside the 3D view you get a phase-by-phase breakdown and scores for power, rotation, balance, sequencing, timing, and consistency, plus your top three fixes and a practice plan.',
      'It runs entirely in your browser using on-device pose tracking — your video never leaves your phone. A single camera produces an estimated 3D read, which is plenty to act on; filming the same rep from two angles roughly 90° apart unlocks measured 3D for higher fidelity. Either way, every score carries its basis so you know how literally to take it.',
      'Motion Lab is built for performance coaching, not clinical assessment — it makes no medical, injury, or tour-grade claims. It is the bridge between a quick video read and a true biomechanics session, available to anyone with a phone.',
    ],
    bestFor: [
      'Players who want a 3D, multi-dimensional view without studio equipment',
      'Athletes ready to go deeper than a single-angle video read',
    ],
    guide: [
      {
        title: 'Film a clean single-camera rep',
        body: 'Record one full swing, full body in frame, steady and well-lit. Run it through Motion Lab for an estimated 3D reconstruction and scores.',
      },
      {
        title: 'Spin and step through the 3D figure',
        body: 'Rotate the model to angles you can’t film in real life, slow it down, and step phase by phase to see your sequencing and rotation.',
      },
      {
        title: 'Read your six scores and top 3 fixes',
        body: 'Review power, rotation, balance, sequencing, timing, and consistency, then focus on the top three fixes it surfaces — not all six scores at once.',
      },
      {
        title: 'Unlock measured 3D with two angles',
        body: 'For higher fidelity, film the same rep from two cameras about 90° apart and run the two-camera mode for a measured reconstruction.',
      },
      {
        title: 'Work the practice plan, then re-film',
        body: 'Follow the generated plan for a week, then re-run Motion Lab to see whether your scores and sequencing improved.',
      },
    ],
    proTips: [
      'Two phones on cheap tripods ~90° apart is enough for measured 3D — you don’t need a studio.',
      'Compare the same rep type each time (e.g. full driver) so scores stay comparable.',
    ],
    limitations: [
      'Single-camera 3D is an estimate; treat the values as directional until you capture two angles.',
      'Performance coaching only — no medical, injury, or tour-grade biomechanics claims.',
    ],
    faqs: [
      {
        question: 'Do I need special equipment for the 3D view?',
        answer:
          'No. One phone gives an estimated 3D reconstruction. For measured 3D, add a second phone filming the same rep from about 90° away. Everything runs on your device.',
      },
      {
        question: 'Is my video sent anywhere for Motion Lab?',
        answer:
          'No. Motion Lab’s pose tracking and reconstruction run locally in your browser. Your footage stays on your device.',
      },
    ],
    relatedSlugs: ['swing-video-upload', 'phase-by-phase-timeline', 'ai-diagnostic-engine'],
    relatedLinks: [{ label: 'Open Motion Lab', href: '/motion-lab' }],
  },
];
