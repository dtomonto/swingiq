// ============================================================
// SwingVantage — SEO Content Registry (core shard C of 3)
// ------------------------------------------------------------
// Size-shard of the hand-written core SEO pages, split out of seoPages.ts so no
// single registry file exceeds ~600 lines (fewer merge conflicts — roadmap #20).
// These are spread back into SEO_PAGES in seoPages.ts IN ORDER, so behavior is
// unchanged. A new page may live in any shard (or its own sibling); the grouping
// here is by size, not sport.
// ============================================================

import type { SeoPage } from './seoPages';

const GOLF_STOP_OVER_THE_TOP: SeoPage = {
  slug: 'golf/stop-coming-over-the-top',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to stop coming over the top',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Coming Over the Top (Beginner-Safe Guide)',
  metaDescription:
    'Coming over the top means the club swings out and across the ball from the top — the cause behind most slices and pulls. Here is how to diagnose and fix it with drills.',
  directAnswer:
    'Coming over the top is when your downswing starts with your shoulders and arms throwing the club up and outward, so it drops onto an out-to-in path that cuts across the ball. You fix it by starting the downswing from the ground up — let your weight shift and hips lead while your trail elbow drops in front of your hip — so the club falls onto an inside path instead of being thrown over it.',
  problemExplanation: [
    'The "top" in "over the top" is the top of your backswing. From there, the club should drop slightly down and to the inside before it swings out to the ball. When you come over the top, the first move is your upper body spinning and your arms casting the club outward, so it approaches from outside the target line and swings left through impact.',
    'That out-to-in path is the engine behind the two most common amateur misses: a slice (face open to that path) and a pull (face square to it). Because the path itself is the problem, chasing the face alone — grip tweaks, aiming further left — usually makes it worse.',
    'The usual causes are a sequence problem (everything fires at once from the top instead of bottom-up), a backswing that gets steep or stuck, and tension that makes you "hit from the top" rather than let the club drop.',
  ],
  diagnosisSteps: [
    'Watch your ball flight: a shot that starts left of target (for a right-handed golfer) is the calling card of an out-to-in path.',
    'Check your divots — divots pointing left of the target line indicate the club is travelling out-to-in.',
    'Film one swing down-the-line. Pause at the top, then at the first move down: are your hands and the club moving out toward the ball, or dropping down and behind?',
    'Feel your first move from the top. If your chest and shoulders spin open before your weight shifts to your lead foot, you are coming over the top.',
  ],
  whatSwingVantageLooksFor: [
    'The direction and steepness of the club path through impact',
    'Whether the downswing sequences from the ground up or from the upper body',
    'Early extension or a steep "throw" from the top',
    'The face-to-path relationship that turns the same path into a slice or a pull',
  ],
  drills: [
    {
      name: 'Pump-and-drop rehearsal',
      how: 'Swing to the top, then slowly "pump" the club halfway down twice, feeling your trail elbow drop in front of your trail hip while your hands stay back. On the third rep, swing through at half speed. This grooves the bottom-up drop instead of the over-the-top throw.',
    },
    {
      name: 'Headcover-outside-the-ball drill',
      how: 'Set a headcover a few inches outside and just behind the ball. Make swings that miss the headcover on the way down — hard if you come over the top, natural when you drop the club to the inside.',
    },
    {
      name: 'Step-through drill',
      how: 'Start with your feet together. As you start the downswing, step your lead foot toward the target, then swing. The step forces your weight and lower body to lead, so the club can no longer fire from the top.',
    },
  ],
  mistakesToAvoid: [
    'Aiming further left to cover the leftward start — it reinforces the out-to-in path.',
    'Trying to fix the face (grip, hands) without changing the sequence and path first.',
    'Swinging hard before the bottom-up feel is grooved — speed brings the old pattern straight back.',
    'Yanking the club steeply inside on the backswing, which often causes an over-the-top recovery coming down.',
  ],
  whenToWorkWithCoach:
    'If the over-the-top move persists after a week or two of sequencing work, if you feel any strain in your lower back or lead shoulder, or if your videos do not clearly show whether the issue is sequence or backswing shape, a qualified coach can pinpoint the cause quickly and stop you from grooving a compensation.',
  faqs: [
    {
      question: 'Is coming over the top the same as slicing?',
      answer:
        'Not exactly — coming over the top is the out-to-in path that causes the slice. The same path with a square face produces a pull instead. Fixing the over-the-top move addresses both misses at the source.',
    },
    {
      question: 'What is the number one cause of coming over the top?',
      answer:
        'For most amateurs it is sequence: the upper body and arms start the downswing instead of the lower body. Letting your weight shift and hips lead, with the trail elbow dropping, is the core fix.',
    },
    {
      question: 'How long does it take to stop coming over the top?',
      answer:
        'Most golfers see the path shallow out within one to two weeks of slow, sequence-first reps. Grooving it at full speed takes longer, but ball flight usually improves quickly once the first move changes.',
    },
  ],
  relatedLinks: [
    { label: 'How to fix a golf slice', href: '/golf/fix-slice' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const BASEBALL_STOP_ROLLING_OVER: SeoPage = {
  slug: 'baseball/stop-rolling-over',
  sport: 'baseball',
  audience: 'player',
  keyword: 'how to stop rolling over in baseball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Rolling Over in Baseball (Weak Grounders)',
  metaDescription:
    'Rolling over is when your top hand turns the barrel over too early, producing weak ground balls to the pull side. Here is how to diagnose and fix it with drills.',
  directAnswer:
    'You roll over when your wrists turn the barrel over before or at contact, so the bat face closes and you catch the top of the ball — usually a weak grounder to the pull side. The fix is to stay through the ball with a palm-up, palm-down hand position at contact and let the wrists release naturally AFTER the ball is gone, driven by a proper sequence rather than an early flip of the top hand.',
  problemExplanation: [
    'Rolling over is a contact-point and sequence problem, not just a "wrist" problem. When the hips and torso stall and the arms take over, the top hand rolls the barrel closed early. The face is shut at contact, so even a solid-feeling swing produces a topspin ground ball, often pulled.',
    'It is frequently confused with "rolling your wrists," but the wrists are usually the symptom. The real causes are casting (the barrel leaving its path early), a swing that gets long and around the ball, and stalling the lower half so the hands have to rescue the swing.',
    'The goal is not to freeze your wrists — it is to keep the barrel in the hitting zone longer and let the natural release happen past contact, where it adds bat speed instead of closing the face early.',
  ],
  diagnosisSteps: [
    'Look at your results: weak ground balls pulled to the side (third base for a righty, first base for a lefty) are the classic rolling-over pattern.',
    'Film from the open side. Freeze at contact: is your top-hand palm already turning down, or still palm-up?',
    'Check your finish — a very wrappy, around-the-body finish often means the barrel left the zone early.',
    'Hit a few off a tee aimed up the middle. If you still pull weak grounders off a stationary ball, the issue is your path and release, not timing.',
  ],
  whatSwingVantageLooksFor: [
    'Barrel path and how long it stays in the hitting zone',
    'Contact point relative to your body (too deep often forces an early roll)',
    'Sequence: whether the lower half leads or the hands take over',
    'Whether the release happens at contact or after it',
  ],
  drills: [
    {
      name: 'Tee, palm-up checkpoint',
      how: 'Set a tee at belt height. Make slow swings and stop at contact to check that your top-hand palm faces up and your bottom-hand palm faces down. Groove the feeling of arriving at the ball before the wrists release.',
    },
    {
      name: 'Two-tee path drill',
      how: 'Place a second tee about a ball-width in front of the contact tee, toward the pitcher. Try to drive both — staying through to "hit" the front tee keeps the barrel in the zone and stops the early roll.',
    },
    {
      name: 'Opposite-field tee work',
      how: 'Move the tee back slightly and hit line drives the other way for a set of reps. Going the other way is nearly impossible if you roll over, so it trains staying through the ball and releasing late.',
    },
  ],
  mistakesToAvoid: [
    'Trying to consciously freeze or stiffen your wrists — it kills bat speed and does not fix the path.',
    'Setting the contact point too deep in the zone, which forces the barrel to close early.',
    'Swinging harder to "drive" the grounders — more speed with the same path just hits them harder into the ground.',
    'Only working off a tee at full speed before the staying-through feel is grooved.',
  ],
  whenToWorkWithCoach:
    'If you keep rolling over after a couple of weeks of tee and path work, if it only shows up against live pitching (a timing issue), or if you cannot tell from video whether it is path or sequence, a hitting coach can confirm the cause quickly and build a plan. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    {
      question: 'What does "rolling over" mean in baseball?',
      answer:
        'It means your wrists turn the bat barrel over too early, closing the face at contact. The result is usually a weak ground ball pulled to the side. The wrists are typically the symptom of a path or sequence problem, not the root cause.',
    },
    {
      question: 'Why do I keep hitting weak ground balls?',
      answer:
        'Most weak grounders come from catching the top half of the ball — an early barrel roll or a steep, out-of-the-zone path. Staying through the ball and releasing after contact turns those into line drives.',
    },
    {
      question: 'Is rolling over a timing problem or a mechanics problem?',
      answer:
        'It can be either. If you roll over even off a tee, it is mechanics (path and release). If it only happens against live pitching, it is more likely timing — getting beat and rescuing the swing with your hands.',
    },
  ],
  relatedLinks: [
    { label: 'Baseball swing analysis', href: '/baseball-swing-analysis' },
    { label: 'Baseball exit velocity drills', href: '/baseball/exit-velocity-drills' },
    { label: 'Baseball benchmarks by age', href: '/benchmarks/baseball' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_FIX_HOOK: SeoPage = {
  slug: 'golf/how-to-fix-a-hook',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to fix a hook',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Fix a Hook in Golf (Beginner-Safe Guide)',
  metaDescription:
    'A hook happens when the club face is closed relative to your path at impact, so the ball curves hard left. Here is how to diagnose and fix it with three drills.',
  directAnswer:
    'A hook is the mirror image of a slice: the club face is closed relative to your path at impact (for a right-handed golfer the ball starts right of target and curves hard left). You fix it by neutralizing an overly strong grip and calming overactive hands so the face stops closing too fast — and by checking that your path is not excessively in-to-out, which exaggerates the curve.',
  problemExplanation: [
    'The ball curves from the relationship between path and face. When the face points well left of your path at impact, the ball gets right-to-left side spin and hooks. A little draw is desirable; a hook is when it turns over too much and runs off the target.',
    'The most common causes are a grip that is too strong (hands rotated too far away from the target), hands that flip and close the face through impact, and a path that swings too far in-to-out so the face has further to rotate.',
    'Hooks often appear after a golfer over-corrects a slice. The cure is balance: a neutral grip and a face that squares with body rotation rather than a fast hand flip.',
  ],
  diagnosisSteps: [
    'Watch the start line: a hook usually starts right of target (for a right-handed golfer), then curves left.',
    'Check your grip — can you see three or more knuckles on your lead hand? That strong grip tends to shut the face.',
    'Film one swing down-the-line and watch the club face after impact: is the toe flipping past the heel quickly?',
    'Hit a few easy shots at 70%. If the hook shrinks, overactive hands and timing are involved.',
  ],
  whatSwingVantageLooksFor: [
    'Face-to-path relationship at impact (the real driver of the curve)',
    'How fast the face is rotating (closing) through impact',
    'Whether the path is excessively in-to-out',
    'Grip strength clues and release timing',
  ],
  drills: [
    {
      name: 'Neutral-grip checkpoint',
      how: 'Set your grip so you see about two knuckles on the lead hand and the trail palm faces the target. Hit slow wedges and confirm the ball flight straightens before adding speed.',
    },
    {
      name: 'Body-rotation release',
      how: 'Make half swings feeling your chest keep turning through impact while your hands stay quiet. Letting the body square the face — instead of a hand flip — tames the closing rate.',
    },
    {
      name: 'Gate path check',
      how: 'Place two tees just wider than the club head to form a gate on the target line. Swing through the gate so your path is closer to neutral, reducing the in-to-out exaggeration.',
    },
  ],
  mistakesToAvoid: [
    'Weakening the grip so much that you start slicing — aim for neutral, not the opposite extreme.',
    'Trying to hold the face open by stiffening the hands, which kills speed and consistency.',
    'Ignoring the path: a big in-to-out swing makes any face issue worse.',
    'Adding full speed before the new grip and release feel are grooved.',
  ],
  whenToWorkWithCoach:
    'If the hook persists after a week of grip and release work, if you cannot tell whether the cause is grip, hands, or path from your videos, or if you feel any wrist discomfort, a qualified coach can confirm the cause quickly and prevent a new compensation.',
  faqs: [
    {
      question: 'What is the difference between a hook and a draw?',
      answer:
        'Both curve right-to-left for a right-handed golfer, but a draw is a small, controlled curve that holds its line while a hook turns over too much and runs off target. The fix is to reduce how fast the face closes, not to eliminate the curve entirely.',
    },
    {
      question: 'Does a strong grip cause a hook?',
      answer:
        'Often, yes. A grip rotated too far from the target makes the face close more easily through impact. Moving to a neutral grip is usually the first and biggest fix.',
    },
    {
      question: 'Why did I start hooking after fixing my slice?',
      answer:
        'Slice fixes (stronger grip, more in-to-out path, more release) can overshoot into a hook. Dial each one back toward neutral until the ball flight straightens.',
    },
  ],
  relatedLinks: [
    { label: 'How to fix a golf slice', href: '/golf/fix-slice' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const GOLF_STOP_FAT: SeoPage = {
  slug: 'golf/stop-hitting-it-fat',
  sport: 'golf',
  audience: 'player',
  keyword: 'how to stop hitting it fat',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 1,
  title: 'How to Stop Hitting It Fat (Chunked Irons) in Golf',
  metaDescription:
    'A fat shot happens when the club hits the ground before the ball — usually a low point behind the ball. Here is how to diagnose and fix it with three drills.',
  directAnswer:
    'You hit it fat when the lowest point of your swing arc falls behind the ball, so the club digs into the turf before contact and loses speed and distance. The fix is to move your low point forward — get your weight onto your lead side by impact and keep your chest turning through — so the club bottoms out just in front of the ball.',
  problemExplanation: [
    'With an iron, the club should still be descending at impact and bottom out a few inches in front of the ball, taking a divot after contact. A fat shot means the arc bottomed out too early, behind the ball.',
    'The usual causes are weight hanging on the trail foot at impact, early extension or a backward lean of the upper body, and casting the club so it releases too soon. All of them move the low point backward.',
    'The single biggest lever for most golfers is pressure shift: getting onto the lead foot through impact moves the bottom of the arc forward where it belongs.',
  ],
  diagnosisSteps: [
    'Look at your divots: no divot, or one that starts behind the ball, points to a low point that is too far back.',
    'Notice the pattern — fat shots that alternate with thin shots usually mean an unstable low point, not bad luck.',
    'Film face-on: at impact, is your weight still on your trail foot or has it shifted to your lead side?',
    'Do a step-and-hit rehearsal; if striking improves when your weight clearly moves forward, pressure shift is the issue.',
  ],
  whatSwingVantageLooksFor: [
    'Where the low point of the swing falls relative to the ball',
    'Weight/pressure shift to the lead side through impact',
    'Early extension or backward upper-body lean at impact',
    'Casting or early release that bottoms the club out too soon',
  ],
  drills: [
    {
      name: 'Lead-side pressure step',
      how: 'Start with feet together; as you start down, step your lead foot toward the target and swing. The forced weight shift moves your low point in front of the ball.',
    },
    {
      name: 'Towel-behind-the-ball drill',
      how: 'Lay a small towel a few inches behind the ball. Make swings that miss the towel and strike ball-then-turf — impossible if your low point is too far back.',
    },
    {
      name: 'Line drill',
      how: 'Draw a short line on a mat or spray a line in the grass. Practice taking your divot on the target side of the line, training a forward low point.',
    },
  ],
  mistakesToAvoid: [
    'Trying to "lift" the ball — that adds backward lean and makes fat (and thin) shots worse.',
    'Hanging back on the trail foot to help the ball up.',
    'Gripping tighter and swinging harder instead of fixing the low point.',
    'Ignoring ball position: too far forward in the stance can also move the low point behind the ball.',
  ],
  whenToWorkWithCoach:
    'If fat shots persist after a week of pressure-shift work, if you also feel lower-back strain, or if your videos do not show whether the cause is weight shift or early extension, a qualified coach can pinpoint it quickly.',
  faqs: [
    {
      question: 'Why do I hit it fat with irons but not my driver?',
      answer:
        'The driver is hit off a tee on the upswing, so a low point that is slightly behind the ball still catches it cleanly. Irons need a descending strike with the low point in front of the ball, which exposes the fault.',
    },
    {
      question: 'Is hitting fat a weight-shift problem?',
      answer:
        'For most amateurs, yes — weight stuck on the trail foot at impact is the most common cause. Getting onto the lead side through impact is usually the biggest single fix.',
    },
    {
      question: 'Where should my divot be?',
      answer:
        'With an iron, your divot should start at or just after the ball, on the target side — not behind it. A divot behind the ball is the signature of a fat strike.',
    },
  ],
  relatedLinks: [
    { label: 'How to stop topping the ball', href: '/golf/stop-topping-the-ball' },
    { label: 'Golf swing analysis', href: '/golf-swing-analysis' },
    { label: 'Golf benchmarks by skill level', href: '/benchmarks/golf' },
    { label: 'Free swing analysis', href: '/free-swing-analysis' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'These drills are low-intensity and suitable for most adult golfers. Stop if you feel pain. Junior golfers should practice with adult supervision.',
  publishStatus: 'published',
};

const TENNIS_GRIPS: SeoPage = {
  slug: 'tennis/tennis-grips-explained',
  sport: 'tennis',
  audience: 'player',
  keyword: 'tennis grips explained',
  intent: 'informational',
  funnelStage: 'awareness',
  priority: 1,
  title: 'Tennis Grips Explained: Forehand, Backhand & Serve',
  metaDescription:
    'A plain-English guide to the main tennis grips — continental, eastern, semi-western, western — and which to use for the forehand, backhand, serve, and volley.',
  directAnswer:
    'Tennis grips are named by where the base knuckle of your index finger sits on the handle. The practical starting points: a semi-western grip for a modern topspin forehand, an eastern or two-handed grip for the backhand, and a continental grip for serves and volleys. Your grip sets your natural spin and contact point, so getting it right is the foundation almost every other stroke fix depends on.',
  problemExplanation: [
    'The handle has eight bevels; which bevel your index knuckle rests on defines the grip. Continental, eastern, semi-western, and western move progressively "under" the handle, adding topspin potential but raising the comfortable contact point.',
    'A grip that is too far one way fights you: continental on a forehand makes topspin very hard, while a full western makes low balls and volleys awkward. Most recreational players are best served by a semi-western forehand and a continental for serve and net play.',
    'Backhands split by style: a one-handed backhand uses an eastern backhand grip, while a two-handed backhand typically uses a continental in the dominant hand and an eastern forehand in the non-dominant hand.',
  ],
  diagnosisSteps: [
    'Find the bevel: hold the racket edge-on and lay your palm flat on the strings, then slide down to the handle — that is roughly a continental grip.',
    'Check your forehand: if topspin feels impossible and balls fly long, you may be too close to continental; if low balls feel awful, you may be too far to western.',
    'Check your serve and volleys: if you cannot slice the serve or punch a volley, you are likely using a forehand grip instead of continental.',
    'Note grip changes: do you re-grip between forehand, backhand, and serve? Beginners often forget to, which limits every stroke.',
  ],
  whatSwingVantageLooksFor: [
    'Contact point relative to the body for each stroke',
    'Whether spin and trajectory match the grip you are using',
    'Consistency of the grip change between strokes',
    'Wrist and forearm position through contact',
  ],
  drills: [
    {
      name: 'Grip-change shadow swings',
      how: 'Without a ball, cycle through forehand, backhand, serve, and volley grips, re-gripping each time. Build the habit of changing grips automatically before each shot.',
    },
    {
      name: 'Semi-western feed drill',
      how: 'From a semi-western forehand grip, have a partner feed easy balls. Brush up the back of the ball and feel the topspin; adjust the bevel slightly until the trajectory clears the net comfortably and dips in.',
    },
    {
      name: 'Continental serve taps',
      how: 'With a continental grip, tap serves gently into the box, feeling the edge of the racket lead so you can later add slice and spin. If the ball only goes flat and long, your grip has crept toward a forehand.',
    },
  ],
  mistakesToAvoid: [
    'Using one grip for everything — especially a forehand grip on serves and volleys.',
    'Jumping straight to a full western grip before you can handle low balls.',
    'Forgetting to re-grip between strokes during rallies.',
    'Gripping the handle too tightly, which restricts the wrist and reduces spin.',
  ],
  whenToWorkWithCoach:
    'A coach can confirm your grip on each stroke in minutes and spot grip changes that are hard to feel on your own. If you are battling a stubborn forehand or serve, a quick grip check is often the fastest win.',
  faqs: [
    {
      question: 'What grip should a beginner use for the forehand?',
      answer:
        'An eastern or semi-western forehand grip is the friendliest starting point. Eastern is the easiest to control; semi-western adds the topspin most modern players want once the basics feel comfortable.',
    },
    {
      question: 'What grip is best for serving?',
      answer:
        'The continental grip. It lets you hit flat, slice, and kick serves from the same grip and is also the grip for volleys and overheads.',
    },
    {
      question: 'Do I really need to change grips during a point?',
      answer:
        'Yes. Different strokes need different grips, and changing automatically is a core skill. Practicing grip changes without a ball builds the habit faster than you would expect.',
    },
  ],
  relatedLinks: [
    { label: 'Tennis swing analysis', href: '/tennis-swing-analysis' },
    { label: 'Tennis forehand analysis', href: '/tennis/forehand-analysis' },
    { label: 'Tennis backhand basics', href: '/tennis/backhand-basics' },
    { label: 'Tennis benchmarks by level', href: '/benchmarks/tennis' },
  ],
  cta: { label: 'Analyze My Strokes Free', href: '/dashboard' },
  schemaType: 'Article',
  safetyNotes:
    'Grip changes are low-impact, but build up gradually to avoid wrist or forearm strain. Junior players should practice with adult supervision.',
  publishStatus: 'published',
};

const SOFTBALL_HIT_SLOW_PITCH: SeoPage = {
  slug: 'softball/how-to-hit-slow-pitch',
  sport: 'softball',
  discipline: 'slow_pitch',
  audience: 'player',
  keyword: 'how to hit a slow pitch softball',
  intent: 'informational',
  funnelStage: 'consideration',
  priority: 2,
  title: 'How to Hit a Slow Pitch Softball (Timing & Contact)',
  metaDescription:
    'Hitting a slow pitch is a timing challenge: let the ball travel and stay back instead of lunging. Here is how to diagnose timing problems, three drills, and a practice plan.',
  directAnswer:
    'The hardest part of hitting a slow, arcing pitch is timing: because the ball floats in, hitters get anxious, start early, and decelerate or lunge, which kills power. The fix is to let the ball travel deeper, keep your weight back until it arrives, and then drive through contact near your front hip rather than reaching out for it.',
  problemExplanation: [
    'A high, arcing slow pitch gives you lots of time — and that is the trap. Players load early, drift forward, and then have to slow the swing down to make contact, producing weak fly balls and rollovers.',
    'Because the ball is descending steeply, your contact point and timing matter more than raw effort. Staying back and letting the ball get deep lets you swing on time and on plane with the descending pitch.',
    'The goal is a patient load and a committed, accelerating swing through the ball — not an early, decelerating one.',
  ],
  diagnosisSteps: [
    'Notice your misses: weak fly balls and pop-ups often mean you started early and got under the descending ball.',
    'Check your weight: are you drifting onto your front foot before the ball arrives?',
    'Film from the side: is your swing still accelerating at contact, or slowing down?',
    'Try letting one pitch travel an extra beat before you swing — if contact improves, your timing was early.',
  ],
  whatSwingVantageLooksFor: [
    'Timing of the load and stride relative to the pitch',
    'Contact point relative to the body (too far out front loses power)',
    'Whether the swing is accelerating or decelerating through contact',
    'Swing plane matched to the descending pitch',
  ],
  drills: [
    {
      name: 'Stay-back count drill',
      how: 'Have a partner toss high, arcing feeds. Count "one" as it peaks and swing on "two," forcing yourself to let the ball travel before committing.',
    },
    {
      name: 'Belly-button contact tee',
      how: 'Set a tee so contact is near your front hip / belly button, not way out front. Drive line drives from there to groove a deeper, more powerful contact point.',
    },
    {
      name: 'Accelerate-through finish',
      how: 'On soft feeds, exaggerate finishing the swing high and full. Feeling the swing speed up through the ball cures the deceleration that causes weak contact.',
    },
  ],
  mistakesToAvoid: [
    'Lunging or drifting forward before the ball arrives.',
    'Decelerating mid-swing to "guide" the ball — commit and accelerate.',
    'Trying to pull every pitch; let a deep pitch go the other way for power.',
    'Swinging level under a steeply descending ball, which produces pop-ups.',
  ],
  whenToWorkWithCoach:
    'If you keep getting under the ball or feel stuck lunging after a couple of weeks of timing work, a hitting coach can read your load and contact point quickly. SwingVantage helps you target the right priority between sessions.',
  faqs: [
    {
      question: 'Why do I keep popping up slow pitches?',
      answer:
        'Pop-ups usually come from starting early and swinging up under a steeply descending ball, often with a dropped back shoulder. Staying back, letting the ball travel, and matching the swing to the descending pitch fixes most of them.',
    },
    {
      question: 'Where should I make contact on a slow pitch?',
      answer:
        'Closer to your body than you think — around your front hip rather than reached out front. A deeper contact point keeps your swing powerful and on plane with the descending ball.',
    },
    {
      question: 'How do I stop slowing down my swing?',
      answer:
        'Commit to a patient load, then accelerate all the way through to a full finish. Drills that exaggerate finishing high retrain a swing that speeds up at contact.',
    },
  ],
  relatedLinks: [
    { label: 'Softball swing analysis', href: '/softball-swing-analysis' },
    { label: 'How to hit line drives', href: '/softball/how-to-hit-line-drives' },
    { label: 'Slow pitch power', href: '/softball/slow-pitch-power' },
    { label: 'Softball benchmarks', href: '/benchmarks/softball' },
  ],
  cta: { label: 'Analyze My Swing Free', href: '/dashboard' },
  schemaType: 'HowTo',
  safetyNotes:
    'Warm up before full-speed swings and use age-appropriate equipment. Youth players should practice with adult supervision.',
  publishStatus: 'published',
};

export const SEO_CORE_C: SeoPage[] = [
  GOLF_STOP_OVER_THE_TOP,
  BASEBALL_STOP_ROLLING_OVER,
  GOLF_FIX_HOOK,
  GOLF_STOP_FAT,
  TENNIS_GRIPS,
  SOFTBALL_HIT_SLOW_PITCH,
];
