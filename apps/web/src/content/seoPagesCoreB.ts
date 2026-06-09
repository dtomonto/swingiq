// ============================================================
// SwingVantage — SEO Content Registry (core shard B of 3)
// ------------------------------------------------------------
// Size-shard of the hand-written core SEO pages, split out of seoPages.ts so no
// single registry file exceeds ~600 lines (fewer merge conflicts — roadmap #20).
// These are spread back into SEO_PAGES in seoPages.ts IN ORDER, so behavior is
// unchanged. A new page may live in any shard (or its own sibling); the grouping
// here is by size, not sport.
// ============================================================

import type { SeoPage } from './seoPages';

const TENNIS_FOREHAND: SeoPage = {
  slug: 'tennis/forehand-analysis',
  sport: 'tennis',
  audience: 'player',
  keyword: 'tennis forehand analysis',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'Tennis Forehand Analysis: Fix the Most Common Faults',
  metaDescription:
    'A reliable forehand comes from a unit turn, a relaxed low-to-high swing path, and contact out front. Diagnose your fault and groove it with simple drills.',
  directAnswer:
    'A consistent forehand depends on three things: an early unit turn (shoulders and hips together), a relaxed low-to-high swing path that creates topspin, and contact comfortably out in front. Most errors — spraying long, netting, or late contact — trace back to a late turn or hitting too close to the body.',
  problemExplanation: [
    'When the turn is late, everything else rushes, and the swing becomes all arm. A full early turn lets the legs and core drive the racket, adding both control and power.',
    'Topspin from a low-to-high path is what lets you swing freely and still keep the ball in. Flat, tense swings have a much smaller margin.',
  ],
  diagnosisSteps: [
    'Are your shoulders turned before the ball bounces on your side?',
    'Is your swing relaxed and low-to-high, or tense and flat?',
    'Is contact out in front, or even with/behind your body?',
    'Film from behind to see your turn, path, and contact point.',
  ],
  whatSwingVantageLooksFor: [
    'Timing and completeness of the unit turn',
    'Low-to-high swing path and topspin generation',
    'Contact point relative to the body',
    'Tempo and relaxation through the stroke',
  ],
  drills: [
    { name: 'Early turn shadow swings', how: 'Without a ball, turn fully as soon as you imagine the ball coming, then swing low-to-high. 10 reps each side of the split-step.' },
    { name: 'Drop-feed topspin', how: 'Drop a ball and brush up the back of it to feel low-to-high topspin, contacting out front. 2 sets of 10.' },
    { name: 'Contact-point catch', how: 'Catch a soft feed at your ideal contact point (out front) to train spacing and timing. 10 reps.' },
  ],
  mistakesToAvoid: [
    'Turning late and swinging with only the arm.',
    'A flat, tense swing with no topspin margin.',
    'Letting the ball get too close or behind you.',
    'Gripping too tightly, which kills racket-head speed.',
  ],
  whenToWorkWithCoach:
    'A coach is valuable for grip and footwork details that are hard to self-diagnose, and for managing any wrist or shoulder discomfort. SwingVantage helps you practice the right priority between lessons.',
  faqs: [
    { question: 'Why does my forehand spray long?', answer: 'Often a flat, tense swing with too little topspin, or late contact. Add low-to-high brush and meet the ball further out front.' },
    { question: 'How important is the grip?', answer: 'Very — most modern forehands use a semi-western grip that supports topspin. A coach can confirm the right grip for your style.' },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
    { label: 'Multi-sport swing quiz', href: '/tools/swing-mistake-quiz' },
  ],
  cta: { label: 'Analyze My Forehand Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up your shoulder and wrist. Stop if you feel joint pain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const FREE_SWING_ANALYSIS: SeoPage = {
  slug: 'free-swing-analysis',
  sport: 'multi',
  audience: 'player',
  keyword: 'free swing analysis',
  intent: 'transactional',
  funnelStage: 'conversion',
  priority: 1,
  title: 'Free Swing Analysis — Golf, Tennis, Baseball & Softball',
  metaDescription:
    'Get a free AI swing analysis — upload a video or import data and receive your top issue, beginner-safe drills, and a practice plan. No account, no credit card.',
  directAnswer:
    'SwingVantage gives you a genuinely free swing analysis for golf, tennis, baseball, and softball. Upload a swing video or import launch monitor data and you get your single highest-priority issue, three beginner-safe drills, and a simple practice plan — with no account, no credit card, and your data private by default.',
  problemExplanation: [
    'Most "free" analysis tools are demos that gate the useful part behind a paywall, or they bury you in numbers without telling you what to fix first. SwingVantage leads with one priority and a plan.',
    'Because SwingVantage keeps your full swing video on your device and your data private by default, you can try it with confidence before deciding to save anything. When you choose AI video analysis, only a few selected still frames are sent for review — never your whole video.',
  ],
  diagnosisSteps: [
    'Pick your sport.',
    'Upload a clear side-on or face-on video, or import your launch monitor data.',
    'Review your top priority issue and the evidence behind it.',
    'Follow the three drills and the practice plan, then retest.',
  ],
  whatSwingVantageLooksFor: [
    'Your highest-priority fault across sport-specific checkpoints',
    'Evidence and severity, not just a label',
    'Drills tied to your specific issue',
    'A realistic practice plan and retest point',
  ],
  drills: [
    { name: 'Start with one priority', how: 'Work only your top issue for a week before adding anything else.' },
    { name: 'Retest on a schedule', how: 'Re-record or re-import after your plan to confirm progress.' },
    { name: 'Keep videos consistent', how: 'Film from the same angle and distance so comparisons are fair.' },
  ],
  mistakesToAvoid: [
    'Trying to fix everything at once.',
    'Filming from inconsistent angles.',
    'Skipping the retest, so you never measure progress.',
    'Comparing yourself to pros instead of your own baseline.',
  ],
  whenToWorkWithCoach:
    'SwingVantage is built to make your practice and your coaching more effective — not to replace a coach. For injury concerns or advanced technique work, bring your SwingVantage priority to a qualified coach.',
  faqs: [
    { question: 'Is it really free?', answer: 'Yes. The core analysis, drills, and practice plan are free, with no account or credit card required.' },
    { question: 'Do you keep my video?', answer: 'Your full swing video stays on your device — analysis runs in your browser and only optional still frames are ever sent for AI review. Your data is private to you and never shared publicly.' },
    { question: 'Which sports are supported?', answer: 'Golf, tennis, pickleball, padel, baseball, slow-pitch softball, and fast-pitch softball — each with its own diagnostic engine.' },
  ],
  relatedLinks: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Trust & safety', href: '/trust' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'FAQPage',
  safetyNotes:
    'Drills suggested in your analysis are beginner-safe. Youth athletes should use SwingVantage with a parent or guardian. SwingVantage does not make youth data public by default.',
  publishStatus: 'published',
};

const GOLF_HIGH_HANDICAP: SeoPage = {
  slug: 'golf/high-handicap-swing-analysis',
  sport: 'golf', audience: 'player', keyword: 'high handicap swing analysis', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'High-Handicap Swing Analysis: Where to Actually Start',
  metaDescription:
    'High handicappers improve fastest by fixing contact and the big miss first — not by chasing tour positions. Here is how to diagnose your one priority and a plan.',
  directAnswer:
    'If you are a high-handicap golfer, the fastest way to lower scores is to fix solid contact and your one big miss first — not to copy tour swing positions. Most strokes are lost to mishits and one repeatable curve, so prioritize center-face contact and taming your worst shot before fine-tuning anything else.',
  problemExplanation: [
    'High handicappers often try to fix everything at once and end up grooving nothing. Scores live and die on contact quality and how bad the bad shots are.',
    'A single repeatable miss (usually a slice) plus frequent fat/thin contact accounts for most lost strokes. Fix those two things and the score drops before any "perfect" positions matter.',
  ],
  diagnosisSteps: [
    'Track a round: how many shots are mishits (fat, thin, off the toe/heel)?',
    'Identify your one big miss — the shot that costs you penalties or do-overs.',
    'Check setup basics: grip, alignment, ball position, posture.',
    'Film one swing face-on and one down-the-line to see contact and path.',
  ],
  whatSwingVantageLooksFor: [
    'Strike quality and centeredness of contact',
    'Your single highest-priority fault (not a list of 20)',
    'The dominant miss pattern and its likely cause',
    'Setup issues visible in your video',
  ],
  drills: [
    { name: 'Center-strike spray test', how: 'Spray foot powder on the face, hit five balls, and work toward centered contact before anything else. 2 sets.' },
    { name: 'Tee-in-front low-point drill', how: 'Place a tee a few inches ahead of the ball and try to clip it after the ball to groove a forward low point. 15 reps.' },
    { name: 'Half-swing alignment reps', how: 'Make half swings with an alignment stick to fix the start line and groove a repeatable path. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to copy tour-player positions before you make solid contact.',
    'Working on five faults in one session.',
    'Ignoring setup (grip/alignment) because it feels boring.',
    'Buying new clubs to fix a contact or path problem.',
  ],
  whenToWorkWithCoach:
    'A coach is hugely valuable early — a few lessons on setup and your one priority will save you months of guessing. SwingVantage helps you arrive knowing your priority and practice it between lessons.',
  faqs: [
    { question: 'What should a high handicapper fix first?', answer: 'Solid contact and your one big miss. Those two account for most lost strokes; positions can wait.' },
    { question: 'Do I need lessons or just practice?', answer: 'Both help. A few lessons on the basics plus focused, single-priority practice between them is the fastest combination.' },
  ],
  relatedLinks: [
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Stop topping the ball', href: '/golf/stop-topping-the-ball' },
    { label: 'Practice plan generator', href: '/tools/practice-plan-generator' },
  ],
  cta: { label: 'Find My #1 Priority Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Low-intensity drills suitable for most adult golfers. Warm up and stop if anything hurts. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_STOP_TOPPING: SeoPage = {
  slug: 'golf/stop-topping-the-ball',
  sport: 'golf', audience: 'player', keyword: 'how to stop topping the golf ball', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'How to Stop Topping the Golf Ball',
  metaDescription:
    'Topping the ball comes from your low point being behind the ball or your body rising through impact. Here is how to diagnose it and three drills to fix it.',
  directAnswer:
    'You top the ball when the club is still moving upward, or bottoming out behind the ball, at impact — usually from hanging back on your trail foot or standing up (early extension) through the downswing. The fix is to move your low point forward by shifting weight to your lead side and keeping your chest down through impact.',
  problemExplanation: [
    'A topped shot means the leading edge catches the top half of the ball. That happens when the swing\'s low point is behind the ball or the body lifts before contact.',
    'The two usual culprits are weight hanging on the trail foot and early extension (hips and chest rising), both of which raise the club at the worst moment.',
  ],
  diagnosisSteps: [
    'Check your finish: are you balanced on your lead foot, or falling back?',
    'Film down-the-line: do your hips and chest rise (stand up) before impact?',
    'Look at your divots — no divot or one behind the ball points to a back low point.',
    'Notice if it happens more with longer clubs (often a weight-shift issue).',
  ],
  whatSwingVantageLooksFor: [
    'Low-point location relative to the ball',
    'Weight transfer to the lead side through impact',
    'Early extension (loss of posture) in the downswing',
    'Chest and head movement through the strike',
  ],
  drills: [
    { name: 'Lead-side bump drill', how: 'Rehearse shifting pressure to your lead foot as you start down, finishing balanced on the lead side. 15 slow reps.' },
    { name: 'Towel-in-front drill', how: 'Place a towel a few inches ahead of the ball; try to brush it after the ball to move your low point forward. 2 sets of 10.' },
    { name: 'Chest-down cue', how: 'Make half swings keeping your chest pointing down at the ball slightly longer through impact to stop standing up. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Trying to "lift" the ball — that raises your low point and makes topping worse.',
    'Hanging back on your trail foot through impact.',
    'Standing up (losing posture) to make room for your arms.',
    'Swinging harder, which exaggerates the rise.',
  ],
  whenToWorkWithCoach:
    'If topping persists after weight-shift and posture work, a coach can quickly spot whether it is sequence, posture, or setup — and keep you from grooving a compensation.',
  faqs: [
    { question: 'Why do I top the ball with my driver but not irons?', answer: 'With a teed driver you can get away with hanging back, but a thin/topped strike still shows up. With irons the back low point catches the top of the ball. Both trace to low-point control.' },
    { question: 'Is topping a posture problem?', answer: 'Often, yes — early extension (standing up) is a leading cause. Keeping your chest down and shifting forward usually helps a lot.' },
  ],
  relatedLinks: [
    { label: 'High-handicap swing analysis', href: '/golf/high-handicap-swing-analysis' },
    { label: 'How to fix a slice', href: '/golf/fix-slice' },
    { label: 'Practice golf at home', href: '/golf/practice-at-home' },
  ],
  cta: { label: 'Analyze My Contact Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Low-intensity drills suitable for most adult golfers. Warm up and stop if anything hurts. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const SOFTBALL_STOP_POPUP: SeoPage = {
  slug: 'softball/stop-popping-up',
  sport: 'softball', discipline: 'slow_pitch', audience: 'player', keyword: 'stop popping up softball', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'How to Stop Popping Up in Softball',
  metaDescription:
    'Pop-ups come from swinging under the ball — dropping the back shoulder or chopping at a dropping pitch. Here is how to level your path and drive line drives.',
  directAnswer:
    'You pop the ball up when your bat path goes under it, usually from dropping your back shoulder too much or chopping down at a ball that is already descending. The fix is to level your swing to match the pitch and stay through the middle of the ball instead of swinging up and under it.',
  problemExplanation: [
    'A pop-up means the bat contacts the bottom half of the ball with an upward, glancing path. In slow-pitch especially, the ball is dropping, so an exaggerated uppercut sends it straight up.',
    'The common causes are a dropped back shoulder, lunging, or trying to lift the ball — all of which steepen the path under the ball.',
  ],
  diagnosisSteps: [
    'Chart your outs: mostly pop-ups, or a mix?',
    'Check your back shoulder — is it dipping low in the load?',
    'Are you trying to lift or "launch" the ball on purpose?',
    'Film from the side to see your bat path versus the pitch.',
  ],
  whatSwingVantageLooksFor: [
    'Bat path relative to the incoming pitch',
    'Back-shoulder height and posture through the swing',
    'Contact point on the ball (under vs. through the middle)',
    'Lunging or drifting that drops the barrel',
  ],
  drills: [
    { name: 'Belt-high tee drill', how: 'Set a tee at belt height and drive line drives into a net with a level path. Reward flat, hard contact. 3 sets of 10.' },
    { name: 'Level-shoulder cue', how: 'Make slow swings keeping your shoulders relatively level through the turn so the barrel stays in the zone longer. 2 sets of 10.' },
    { name: 'Stay-through soft toss', how: 'Soft toss focusing on driving through the middle of the ball toward the pitcher, not lifting it. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Dropping the back shoulder to "get under" the ball.',
    'Trying to lift or launch the ball on purpose.',
    'Lunging forward, which drops the barrel under the ball.',
    'Swinging up at a dropping pitch in slow-pitch.',
  ],
  whenToWorkWithCoach:
    'If pop-ups continue after leveling your path, a hitting coach can confirm whether it is shoulder tilt, timing, or posture and adjust your cue.',
  faqs: [
    { question: 'Why do I keep popping up?', answer: 'Almost always because the bat is traveling under the ball — usually a dropped back shoulder or trying to lift it. Level the path and stay through the middle.' },
    { question: 'Should my swing be level or slightly up?', answer: 'Match the pitch. In slow-pitch a slightly upward path matched to the drop works; an exaggerated uppercut causes pop-ups.' },
  ],
  relatedLinks: [
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Slow-pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Slow-pitch line-drive guide', href: '/tools/slow-pitch-line-drive-guide' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up first and use an age-appropriate bat. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const TENNIS_BACKHAND: SeoPage = {
  slug: 'tennis/backhand-basics',
  sport: 'tennis', audience: 'player', keyword: 'tennis backhand basics', intent: 'informational',
  funnelStage: 'awareness', priority: 4,
  title: 'Tennis Backhand Basics: Build a Reliable Stroke',
  metaDescription:
    'A reliable backhand starts with an early turn, a stable base, and a low-to-high path. Here is how to diagnose your backhand and three drills to groove it.',
  directAnswer:
    'A reliable backhand — one-handed or two-handed — comes from turning early, setting a stable base, and swinging low-to-high to contact out in front. Most backhand errors come from a late turn, a cramped contact point too close to the body, or no leg drive.',
  problemExplanation: [
    'The backhand has less margin than the forehand for many players, so preparation matters even more. An early shoulder turn buys time and lets the legs and core power the stroke.',
    'Contact too close to the body or behind it kills both control and power. A low-to-high path adds the topspin that keeps the ball in.',
  ],
  diagnosisSteps: [
    'Do you turn your shoulders as soon as you read the ball to your backhand side?',
    'Is your base stable, or are you reaching and off-balance?',
    'Is contact out in front, or cramped near your body?',
    'Film from behind to see turn, spacing, and path.',
  ],
  whatSwingVantageLooksFor: [
    'Timing of the shoulder turn / preparation',
    'Contact point relative to the body',
    'Low-to-high path and topspin',
    'Balance and leg drive through the stroke',
  ],
  drills: [
    { name: 'Early turn shadow swings', how: 'Without a ball, turn your shoulders fully on the backhand side and swing low-to-high. 10 reps.' },
    { name: 'Spacing footwork drill', how: 'Practice the small adjustment steps that set contact out in front, not cramped. 2 sets of 8.' },
    { name: 'Drop-feed topspin', how: 'Drop a ball and brush up the back of it to feel low-to-high topspin on the backhand. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Turning late and reaching for the ball.',
    'Letting the ball get too close to your body.',
    'A flat, armsy swing with no leg drive.',
    'Gripping too tightly and decelerating at contact.',
  ],
  whenToWorkWithCoach:
    'A coach can confirm whether a one- or two-handed backhand suits you and fix grip/footwork details that are hard to self-diagnose. SwingVantage helps you groove the right priority between lessons.',
  faqs: [
    { question: 'One-handed or two-handed backhand?', answer: 'Both work — two-handed is often easier to control for beginners. A coach can help you choose based on your strength and style.' },
    { question: 'Why is my backhand weaker than my forehand?', answer: 'Usually less preparation and leg drive. Turn earlier, set a stable base, and drive low-to-high.' },
  ],
  relatedLinks: [
    { label: 'Tennis forehand analysis', href: '/tennis/forehand-analysis' },
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'At-home drill generator', href: '/tools/at-home-swing-drill-generator' },
  ],
  cta: { label: 'Analyze My Backhand Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up your shoulder and wrist. Stop if you feel joint pain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const BASEBALL_EXIT_VELO: SeoPage = {
  slug: 'baseball/exit-velocity-drills', sport: 'baseball', audience: 'player', keyword: 'baseball exit velocity drills', intent: 'informational',
  funnelStage: 'consideration', priority: 3,
  title: 'Baseball Exit Velocity: Drills to Hit the Ball Harder',
  metaDescription:
    'Exit velocity comes from sequence and centered contact, not just strength. Here is how to diagnose what is leaking power and three drills to hit the ball harder.',
  directAnswer:
    'Higher exit velocity comes from an efficient sequence — hips leading the hands — and squaring the ball up on the barrel, not just from raw strength. Most hitters leak power by starting the swing with their arms or making off-center contact; fixing sequence and barrel accuracy raises exit velocity fast.',
  problemExplanation: [
    'Exit velocity is bat speed plus quality of contact. You can swing hard and still hit the ball softly if the sequence leaks energy or contact is off the sweet spot.',
    'The most common power leak is the hands and arms firing before the lower body, which wastes the energy the legs and hips create.',
  ],
  diagnosisSteps: [
    'Do your hips start the swing before your hands, or do the arms go first?',
    'Are you squaring the ball on the barrel, or hitting it off the end/handle?',
    'Is your contact point out in front where the bat is at full speed?',
    'Film from the side to see sequence and contact.',
  ],
  whatSwingVantageLooksFor: [
    'Kinematic sequence (hips → torso → hands)',
    'Barrel accuracy and centered contact',
    'Contact point depth and timing',
    'Connection between the upper and lower body',
  ],
  drills: [
    { name: 'Hip-lead rotation drill', how: 'Slow swings feeling the hips start the turn before the hands; pause at contact to check the sequence. 2 sets of 10.' },
    { name: 'Connection ball drill', how: 'Hold a ball/glove between your lead arm and chest through the turn to keep the swing connected and powerful. 2 sets of 10.' },
    { name: 'Barrel-accuracy tee work', how: 'Hit off a tee focusing on flush, centered contact (not max effort). Reward the hardest, flushest hits. 2 sets of 10.' },
  ],
  mistakesToAvoid: [
    'Starting the swing with the arms instead of the lower body.',
    'Swinging max-effort at the cost of centered contact.',
    'Casting / disconnecting the lead arm from the body.',
    'Chasing exit-velo numbers with poor mechanics.',
  ],
  whenToWorkWithCoach:
    'A hitting coach can confirm your sequence and barrel path and build a strength/mechanics plan. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    { question: 'Is exit velocity just strength?', answer: 'No. Strength helps, but sequence and centered contact matter more for most hitters. Fix those first, then build strength.' },
    { question: 'How do I measure exit velocity?', answer: 'A radar or hitting sensor measures it, but you can improve the inputs (sequence, contact) without one — and confirm with video.' },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Youth baseball hitting', href: '/baseball/youth-hitting' },
    { label: 'Practice plan generator', href: '/tools/practice-plan-generator' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes: 'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};


export const SEO_CORE_B: SeoPage[] = [
  TENNIS_FOREHAND,
  FREE_SWING_ANALYSIS,
  GOLF_HIGH_HANDICAP,
  GOLF_STOP_TOPPING,
  SOFTBALL_STOP_POPUP,
  TENNIS_BACKHAND,
  BASEBALL_EXIT_VELO,
];
