// ============================================================
// SwingVantage — Flagship concept pages (grip, weight distribution,
// swing plane). Deep, original instruction. Multi-sport aware.
// Content is synthesized in SwingVantage's own voice — no coach
// scripts, branded frameworks, or copied lesson material.
// ============================================================

import type { LearnEntry } from './types';

const REVIEWED = '2026-06-08';

const GRIP: LearnEntry = {
  id: 'grip',
  slug: 'grip',
  kind: 'concept',
  title: 'Grip',
  category: 'setup',
  sports: ['golf', 'baseball', 'softball_slow', 'softball_fast', 'tennis', 'pickleball', 'padel'],
  difficultyLevels: ['beginner', 'intermediate', 'advanced'],
  status: 'published',
  flagship: true,
  descriptionShort:
    'Your grip is the only connection between you and the club, bat, or racket — it quietly sets your face angle, release, and consistency before you ever move.',
  explanationBeginner:
    'The grip is how your hands hold the handle. It feels small, but it controls a lot: where the face (or barrel) points at contact, how freely your wrists can hinge and release, and how repeatable your strike is. A grip that fits you lets the rest of the swing work without compensations.',
  explanationAdvanced:
    'Grip orientation governs the clubface/racket-face relationship to the arc and the timing of release. A "stronger" lead-hand position (rotated away from the target) tends to close the face through impact and promote a draw/hook bias; a "weaker" position opens it and biases fade/slice. Grip pressure modulates wrist torque: too tight stalls passive release and shortens the arc, too loose costs control of the face at speed. The trail hand sets leverage and supplies the snap of release in implement sports.',
  whyItMatters:
    'Because the grip determines face angle, and face angle is the single biggest contributor to starting direction and curve, a grip fault forces every other part of the swing to compensate. Fix the grip and many "swing" faults (slice, hook, weak contact) simply stop appearing.',
  detectionLogic:
    'From an upload, SwingVantage looks at hand placement at setup (how many knuckles are visible on the lead hand), the relationship of the hands to each other, visible grip pressure cues (tension in the forearms, white knuckles), and the downstream signature of a grip issue in ball flight or contact. Grip is inferred from setup frames plus its consequences, not measured directly.',
  evidenceBasis: 'estimated',
  confidenceExplanation:
    'Grip is read from setup video and ball-flight consequences, so it is labeled estimated, not measured. A clear face-on and down-the-line setup frame raises confidence; a single blurry angle lowers it.',
  goodPattern:
    'Hands work together as one unit, lead-hand knuckles visible in a repeatable amount, trail hand sitting under the handle, and pressure firm-but-soft (roughly a 4–5 out of 10) so the wrists can still move.',
  poorPatterns: [
    'Lead hand rotated too far on top ("strong") for the player, slamming the face shut',
    'Lead hand rotated under ("weak"), leaving the face open at contact',
    'Hands fighting each other (one strong, one weak) so the release is unpredictable',
    'A "death grip" with white knuckles that kills wrist hinge and shortens the swing',
    'Grip resetting between reps, so contact is never repeatable',
  ],
  commonCauses: [
    'Never being shown a neutral reference, so the grip drifts to whatever feels comfortable',
    'Trying to steer the face with the hands instead of letting the grip set it',
    'Gripping in the palm instead of the fingers, removing leverage',
    'Tension from trying to hit hard',
  ],
  symptoms: [
    'The face feels "out of your hands" at contact',
    'Forearms tire quickly during a session',
    'You feel like you have to time a hand flip to square things up',
    'Blisters or calluses in odd places from regripping',
  ],
  ballFlightOrResult: [
    'Strong-grip bias: shots that start straight and turn hard left (right-handed) or low hooks',
    'Weak-grip bias: shots that leak right, slices, and weak high contact',
    'Inconsistent grip: a two-way miss with no pattern',
  ],
  sportVariations: [
    { sport: 'golf', note: 'Lead-hand knuckle count and the "V" of each hand pointing toward the trail shoulder is the classic neutral reference. Interlock, overlap, or ten-finger are all valid base grips.' },
    { sport: 'baseball', note: 'Line up the door-knocking knuckles for a quicker, looser barrel release; box up the knuckles for more control. Choking up shortens the lever for contact.' },
    { sport: 'softball_slow', note: 'A slightly looser, knuckles-aligned grip helps whip the barrel for the lift needed on a slow, arcing pitch.' },
    { sport: 'softball_fast', note: 'A controlled, knuckles-aligned grip with quick hands helps catch up to velocity without casting the barrel early.' },
    { sport: 'tennis', note: 'Grip is named by bevel (Continental, Eastern, Semi-Western, Western). The grip you choose is the single biggest setter of natural contact point and spin.' },
    { sport: 'pickleball', note: 'A Continental "shake-hands" grip covers most shots and lets you switch between forehand, backhand, and dink without regripping.' },
    { sport: 'padel', note: 'A Continental grip dominates because of the volume of volleys, bandejas, and wall play that need one versatile face.' },
  ],
  selfChecks: [
    { label: 'Knuckle check', detail: 'Set up in a mirror and count the lead-hand knuckles you can see. Two to two-and-a-half is a neutral starting reference for most golfers; note yours so you can repeat it.' },
    { label: 'Pressure check', detail: 'Rate your grip pressure 1–10. Aim for 4–5 — firm enough to control, soft enough to feel the head.' },
    { label: 'Unity check', detail: 'After gripping, gently waggle. The hands should move as one piece. If they separate or twist, rebuild the grip.' },
  ],
  videoUploadTips: [
    'Capture a face-on setup frame and a down-the-line frame so both hand positions are visible.',
    'Keep hands in the frame and well-lit; gloves with high contrast help.',
    'Record a normal, relaxed grip — do not pose a "perfect" grip you would not actually swing.',
  ],
  drills: [
    { name: 'Neutral Rebuild', goal: 'Groove a repeatable, fitted grip', how: 'Build the grip lead hand first, then trail hand, checking your knuckle and pressure reference each time. Re-grip 10 times without swinging.', feel: 'The handle sits more in the fingers than the palm', reps: '10 rebuilds, twice a day', equipment: 'None', level: 'beginner' },
    { name: 'Pressure Ladder', goal: 'Calibrate grip pressure', how: 'Make slow swings at pressure 8, then 5, then 3. Notice how release changes. Settle on the lowest pressure that still controls the face.', feel: 'Free wrist hinge at lower pressure', reps: '3 swings per level', equipment: 'None', level: 'intermediate' },
    { name: 'Split-Hand Release', goal: 'Feel each hand’s job in the release', how: 'Grip with a small gap between the hands and make half swings. The gap exaggerates how the trail hand rolls over the lead hand through contact.', feel: 'Trail forearm rotating over the lead forearm', reps: '10 half swings', equipment: 'None', level: 'advanced' },
  ],
  practicePlan: [
    'Day 1–2: Neutral Rebuild, 10 reps morning and night — no ball.',
    'Day 3–5: Add Pressure Ladder before short, slow swings.',
    'Day 6: Hit half shots holding your reference grip.',
    'Day 7: Record a retest swing and compare face control and start direction.',
  ],
  progressionLadder: [
    'Build a repeatable neutral grip with no swing',
    'Keep the grip through slow half swings',
    'Hold it through full-speed swings off a tee or soft toss',
    'Own it in live play without re-checking',
  ],
  troubleshooting: [
    { heading: 'The new grip feels weird and I hit it worse at first', body: 'Expected. A changed grip changes the face, so the old swing now over-corrects. Give it short, slow reps before judging — feel is not real for the first few sessions.' },
    { heading: 'My hands keep drifting back to the old grip', body: 'Add reps without a ball. Grip changes are habit changes; the no-ball Neutral Rebuild is what makes them stick.' },
  ],
  relatedFaultIds: ['casting_hands', 'over_the_top'],
  relatedDataPointSlugs: ['face-control', 'casting', 'contact-quality'],
  relatedConceptSlugs: ['swing-plane'],
  relatedCoachStyleIds: ['technical', 'feel'],
  drillFamilies: ['setup & grip', 'release & face control'],
  extraSections: [
    { heading: 'Lead-hand vs. trail-hand jobs', body: 'Think of the lead hand as the steering wheel — it sets the face and controls the low point — and the trail hand as the accelerator — it adds speed and supplies the snap of release. When one hand overpowers the other, the face becomes unpredictable.' },
    { heading: 'Strong, neutral, and weak — without the jargon', body: 'These words describe how rotated your hands are on the handle, not how hard you squeeze. "Strong" tends to close the face, "weak" tends to open it, "neutral" is the middle reference you adjust from. The right one for you is the one that lets you swing freely and still find the face.' },
    { heading: 'Personalizing grip by level and sport', body: 'Beginners benefit from a neutral, forgiving reference they can repeat. Advanced players may run slightly strong or weak on purpose to bias a shot shape. In racket sports, grip is a deliberate choice that sets your whole contact style — pick the grip that matches the shots you want to hit most.' },
  ],
  seoTitle: 'Golf & Swing Grip Guide: Face Control, Pressure, and Drills',
  seoDescription:
    'A complete guide to the swing grip across golf, baseball, softball, tennis, pickleball, and padel: lead/trail hands, pressure, neutral vs strong vs weak, faults, and drills.',
  faqs: [
    { question: 'How tight should I grip?', answer: 'Aim for about 4–5 out of 10 — firm enough to control the face, soft enough that your wrists can still hinge and release freely. A "death grip" kills speed and shortens the swing.' },
    { question: 'Is a stronger grip better?', answer: 'Not inherently. A stronger grip tends to close the face and can cure a slice, but it can also cause hooks if it is too strong for you. The best grip is the most neutral one that lets you square the face without timing a hand flip.' },
    { question: 'Why do I hit it worse right after changing my grip?', answer: 'A grip change changes your face angle, so your old swing now over-corrects. Use slow, no-ball reps for a few sessions before judging — the early "worse" phase is normal.' },
    { question: 'Does grip matter in racket sports too?', answer: 'Yes — possibly more. In tennis, pickleball, and padel the grip (by bevel) sets your natural contact point and spin, so it shapes your whole stroke style.' },
  ],
  lastReviewedAt: REVIEWED,
  sourceNotes:
    'Synthesized from widely-taught, public fundamentals (neutral grip references, pressure scales, lead/trail-hand roles). No coach-specific scripts or branded frameworks used.',
};

const WEIGHT_DISTRIBUTION: LearnEntry = {
  id: 'weight-distribution',
  slug: 'weight-distribution',
  kind: 'concept',
  title: 'Weight Distribution',
  category: 'motion',
  sports: ['golf', 'baseball', 'softball_slow', 'softball_fast', 'tennis', 'pickleball', 'padel'],
  difficultyLevels: ['beginner', 'intermediate', 'advanced'],
  status: 'published',
  flagship: true,
  descriptionShort:
    'Where your pressure sits — and when it moves — is the engine of power, the key to clean contact, and one of the most common hidden causes of inconsistency.',
  explanationBeginner:
    'Weight distribution is how your body pressure is shared between your feet, and how that pressure shifts as you swing. Good players load into the back side, then move pressure forward through contact, finishing balanced. When pressure moves at the wrong time, contact and direction suffer.',
  explanationAdvanced:
    'Center-of-mass and center-of-pressure (CoP) trace distinct paths through the swing. The efficient pattern loads CoP toward the trail side in the backswing, then shifts it toward the lead side early in transition — typically before the arms unload — creating ground reaction force that powers rotation. Early extension, hanging back, and reverse pivots are all CoP-timing errors that bleed speed and move the low point.',
  whyItMatters:
    'Pressure timing controls where the bottom of your swing arc (the low point) lands. Get pressure forward in time and you compress the ball with the low point ahead of it; leave it back and you hit it fat, thin, or scoop it. It is also your biggest free source of speed.',
  detectionLogic:
    'SwingVantage reads balance and pressure cues from video — setup stance, whether the hips slide or rotate, where you finish, and whether you hold the finish. Where launch-monitor or contact data is available, low-point and strike patterns corroborate the visual read. Pressure timing is inferred from motion, so it is labeled estimated unless paired with sensor data.',
  evidenceBasis: 'estimated',
  confidenceExplanation:
    'Without a pressure plate, weight shift is inferred from how your body moves and where you finish, so it is estimated. A clean down-the-line and face-on view, plus a held finish, sharpen the read.',
  goodPattern:
    'Athletic, balanced setup; a controlled load into the trail side; pressure moving toward the lead side early in transition; and a balanced, held finish with most weight on the lead foot.',
  poorPatterns: [
    'Hanging back — pressure stuck on the trail foot at contact (fat/thin, scoopy contact)',
    'Early sway — sliding off the ball instead of loading rotationally',
    'Reverse pivot — leaning toward the target on the backswing, then falling back',
    'Spinning out — pressure leaving the ground too early with no forward shift',
    'No finish balance — falling off the shot, a sign the sequence was off',
  ],
  commonCauses: [
    'Trying to "lift" or help the ball up instead of trusting forward shift + loft',
    'A backswing that sways instead of turns',
    'Poor lower-body mobility limiting the load',
    'Swinging too hard, so balance is sacrificed for effort',
  ],
  symptoms: [
    'You feel stuck on your back foot at contact',
    'You fall backward or step to keep balance after the swing',
    'Big hits feel "armsy" with no ground push',
    'Contact quality swings wildly shot to shot',
  ],
  ballFlightOrResult: [
    'Hanging back: fat shots, thin shots, weak high "scoops," loss of distance',
    'Sway: inconsistent low point and a two-way miss',
    'Good shift: compressed, solid contact and a penetrating flight',
  ],
  sportVariations: [
    { sport: 'golf', note: 'Driver favors a touch more pressure staying back at impact for a slight upward strike; irons want pressure clearly forward to hit ball-then-turf.' },
    { sport: 'baseball', note: 'A controlled load and a firm front side ("squish the bug" is a myth if it stalls the hips) lets you rotate against a braced lead leg for power.' },
    { sport: 'softball_slow', note: 'Because you create all the power, an early, smooth load and forward shift into a firm front side is what turns a slow pitch into a line drive instead of a pop-up.' },
    { sport: 'softball_fast', note: 'Pressure must move forward fast to catch velocity; a late or stuck-back load is the classic cause of being jammed.' },
    { sport: 'tennis', note: 'Groundstrokes load into the back leg, then drive forward and up into contact; staying back leaks power and shortens the stroke.' },
    { sport: 'pickleball', note: 'On drives and serves a small forward shift adds pace; at the kitchen, a quiet, balanced base matters more than weight transfer.' },
    { sport: 'padel', note: 'Wall play and overheads reward a balanced, ready base with small adjustments rather than big weight shifts.' },
  ],
  selfChecks: [
    { label: 'Finish-and-hold', detail: 'Swing and freeze your finish for three seconds. If you cannot hold it with weight on your lead foot, your pressure pattern needs work.' },
    { label: 'Foot-pressure feel', detail: 'Make slow swings and feel where pressure is under your feet at the top and at contact. It should travel from trail to lead.' },
    { label: 'Step test', detail: 'Hit soft shots while stepping toward the target as you swing. If that feels powerful and clean, you were hanging back before.' },
  ],
  videoUploadTips: [
    'Film down-the-line so a sway vs. turn is visible.',
    'Capture the full finish, not just impact, so balance can be judged.',
    'Wear fitted clothing so hip and torso movement reads clearly.',
  ],
  drills: [
    { name: 'Step-Through Contact', goal: 'Get pressure moving forward in time', how: 'From a narrow stance, start the downswing by stepping your trail foot toward the target as you swing through. Begin with soft contact.', feel: 'Pressure flowing toward the target before the arms fire', reps: '3 sets of 8', equipment: 'None or a ball on a tee', level: 'beginner' },
    { name: 'Finish-and-Freeze', goal: 'Build finish balance', how: 'Make full swings and hold a balanced finish for three seconds every rep. If you fall, slow down until you cannot.', feel: 'Tall, balanced, weight on the lead foot', reps: '10 swings', equipment: 'None', level: 'beginner' },
    { name: 'Trail-Heel-Down Load', goal: 'Replace a sway with a rotational load', how: 'Keep your trail heel lightly down as you turn back, feeling pressure go into the trail leg rather than sliding outside the foot.', feel: 'Coiling against the trail leg, not sliding', reps: '10 slow backswings', equipment: 'None', level: 'intermediate' },
  ],
  practicePlan: [
    'Day 1–2: Finish-and-Freeze, 10 reps, no ball.',
    'Day 3–5: Step-Through Contact into soft shots.',
    'Day 6: Normal-speed swings keeping a held finish.',
    'Day 7: Record a retest and compare contact quality and finish balance.',
  ],
  progressionLadder: [
    'Hold a balanced finish on slow swings',
    'Feel pressure shift forward with the Step-Through drill',
    'Keep the pattern at full speed off a tee/toss',
    'Carry a balanced, forward finish into live play',
  ],
  troubleshooting: [
    { heading: 'I shift forward but now I hit pulls', body: 'Forward shift fixes the low point but can leave the face/path early; pair this work with grip and plane checks so direction catches up to your better contact.' },
    { heading: 'My finish is balanced but I still hang back at impact', body: 'A posed finish can hide an early-impact stall. Use the Step-Through drill, which forces the shift to happen before contact, not after.' },
  ],
  relatedFaultIds: ['early_extension', 'lunging_forward', 'hip_stall', 'fp_late_load'],
  relatedDataPointSlugs: ['early-extension', 'contact-quality', 'rotation'],
  relatedConceptSlugs: ['swing-plane'],
  relatedCoachStyleIds: ['feel', 'data'],
  drillFamilies: ['pressure & balance', 'lower-body sequencing'],
  extraSections: [
    { heading: 'Loading vs. swaying', body: 'Loading is pressure going INTO the trail leg while you turn around a stable base. Swaying is your whole center sliding away from the target. Loading stores power you can release; swaying just moves the low point and makes timing harder.' },
    { heading: 'Mat / net practice version', body: 'Indoors, you cannot read ball flight, so judge by contact sound and finish balance. Place a towel just behind the ball — if you brush the towel first, your low point is too far back (pressure stuck behind).' },
    { heading: 'Taking it on-course / on-field / on-court', body: 'Under pressure, players revert to hanging back. Keep one simple thought — "finish forward" — and let the held finish be your only checkpoint during play, not a list of mechanics.' },
  ],
  seoTitle: 'Weight Distribution & Pressure Shift: Power, Contact, and Drills',
  seoDescription:
    'Master weight distribution across golf, baseball, softball, and racket sports: setup pressure, loading, transition, impact pressure, finish balance, faults, and drills.',
  faqs: [
    { question: 'Should my weight stay back or move forward?', answer: 'For most full swings, pressure loads into the trail side, then moves forward through contact, finishing on the lead foot. The exception is the driver, where a touch more weight stays back for a slight upward strike.' },
    { question: 'What is the difference between loading and swaying?', answer: 'Loading is pressure moving into your trail leg while you rotate around a stable base. Swaying is your whole body sliding off the ball. Loading stores power; swaying just moves your low point and hurts contact.' },
    { question: 'Why do I keep hitting it fat or thin?', answer: 'Both are usually low-point errors from pressure staying back. When weight hangs on the trail foot, the bottom of your arc moves behind the ball — fat if you catch ground first, thin if you recover by lifting.' },
    { question: 'How can I tell if my weight shift is good?', answer: 'Freeze your finish for three seconds. If you can hold it balanced with most weight on your lead foot, your pressure pattern is likely working.' },
  ],
  lastReviewedAt: REVIEWED,
  sourceNotes:
    'Synthesized from public, widely-taught concepts (center of pressure, load/transition/impact, finish balance). No coach-specific or paid material used.',
};

const SWING_PLANE: LearnEntry = {
  id: 'swing-plane',
  slug: 'swing-plane',
  kind: 'concept',
  title: 'Swing Plane',
  category: 'motion',
  sports: ['golf', 'baseball', 'softball_slow', 'softball_fast', 'tennis'],
  difficultyLevels: ['beginner', 'intermediate', 'advanced'],
  status: 'published',
  flagship: true,
  descriptionShort:
    'Swing plane is the tilted circle your club, bat, or racket travels on — the simplest way to understand why your shots curve, get fat, or come "over the top."',
  explanationBeginner:
    'Think of your swing as a giant tilted hoop around your body. Swing plane describes the angle and direction of that hoop. When your hands and the club stay on a sensible plane, the face meets the ball squarely and on a good path. When the plane gets too steep or too flat, you start fighting slices, pulls, and fat shots.',
  explanationAdvanced:
    'Plane is the orientation of the hand path and the shaft (or bat/racket) through the arc. The downswing plane relative to the target line drives club path; combined with face-to-path it determines start line and curve. "Over the top" is a steep, out-to-in downswing plane; "under plane" is excessively shallow and in-to-out. Plane is a matchup problem — it must pair with grip, posture, rotation, and release, not be chased in isolation.',
  whyItMatters:
    'Path and face together create your shot shape. Plane is the part of path you can feel and see, so understanding it turns a mysterious slice or pull into a fixable picture. It is also where the most damaging fault — coming over the top — lives.',
  detectionLogic:
    'From a down-the-line view, SwingVantage estimates hand path and shaft angle through the backswing and downswing and flags steep, flat, or over-the-top tendencies. Because plane is read from a 2D video, camera angle matters a lot; the read is estimated and improves with a true down-the-line camera position.',
  evidenceBasis: 'estimated',
  confidenceExplanation:
    'Plane is inferred from a single 2D angle, so it is estimated. A true down-the-line camera (behind the hands, on the target line, at hip height) is the single biggest factor in an accurate read; off-axis footage can fake a plane problem that is not there.',
  goodPattern:
    'A backswing that stays in a comfortable window, a transition that shallows slightly, and a downswing that approaches from slightly inside the target line — letting the face release down the line.',
  poorPatterns: [
    'Over the top — the club moves out and over in transition, cutting across the ball (steep, out-to-in)',
    'Too steep — the club works up too vertically, encouraging chops and fat shots',
    'Too flat / under plane — the club drops too far behind, causing pushes, hooks, and blocks',
    'Plane that changes every swing — no repeatable path, so the miss is two-way',
  ],
  commonCauses: [
    'Starting the downswing with the upper body and arms instead of the lower body (the classic over-the-top trigger)',
    'A grip or face issue the body compensates for by re-routing the club',
    'Poor posture or early extension changing the available space for the arms',
    'Trying to add speed with the shoulders from the top',
  ],
  symptoms: [
    'You feel the club "throw out" away from you at the start of the downswing',
    'You sense you are swinging "across" the ball',
    'Your arms feel disconnected from your body turn',
    'Divots point well left (over the top) or well right (too far inside)',
  ],
  ballFlightOrResult: [
    'Over the top: pull-slices, pulls, and steep, weak contact',
    'Too flat/under: pushes, blocks, and big hooks',
    'On-plane: a controllable, repeatable shape with a one-way miss',
  ],
  sportVariations: [
    { sport: 'golf', note: 'Plane is most often discussed here. The goal is not one "perfect" plane but a repeatable downswing path that matches your face for your intended shape.' },
    { sport: 'baseball', note: 'Bat path should match the pitch plane — a slight upward path matching the downward pitch produces flush, in-the-air contact. "Over the top" in hitting shows as a steep, choppy bat path.' },
    { sport: 'softball_slow', note: 'Because the pitch arcs down steeply, a matched, slightly-upward bat path is what turns it into a line drive rather than a ground ball or pop-up.' },
    { sport: 'softball_fast', note: 'A short, on-plane path that matches a flatter, faster pitch is essential to not be late or under it.' },
    { sport: 'tennis', note: 'Stroke "plane" shows as a low-to-high swing path for topspin; too flat sails long, too steep dumps into the net. The same matchup logic applies.' },
  ],
  selfChecks: [
    { label: 'Divot direction', detail: 'Check where your divots (or the brushed grass/mat) point. Hard left of target suggests over the top; well right suggests too far inside.' },
    { label: 'Down-the-line mirror', detail: 'In a mirror behind you, make a slow backswing and downswing. Watch whether the club stays in a comfortable window or throws out over the top in transition.' },
    { label: 'Start-line read', detail: 'Note where shots start, not just where they finish. A consistent start well left/right of target is a plane/path clue.' },
  ],
  videoUploadTips: [
    'This is the page where camera angle matters most: stand the camera directly behind your hands, on the target line, at about hip height.',
    'Keep the whole club and arc in frame for the full swing.',
    'Avoid filming from too high or off to the side — it can invent a plane problem that is not real.',
  ],
  drills: [
    { name: 'Pump-and-Drop', goal: 'Feel the club shallow instead of going over the top', how: 'From the top, pump the downswing halfway three times, feeling the club drop slightly behind your hands, then swing through on the fourth.', feel: 'The club falling into a slot, not throwing out', reps: '3 pumps + 1 swing, 8 times', equipment: 'None', level: 'intermediate' },
    { name: 'Headcover Gate', goal: 'Stop the over-the-top move', how: 'Place a headcover or soft object just outside the ball. Swing so you miss it — an over-the-top path hits it, an inside path clears it.', feel: 'Approaching from inside the object', reps: '10 swings', equipment: 'Headcover / soft object', level: 'beginner' },
    { name: 'Lower-Body-First Transition', goal: 'Fix the cause of over the top', how: 'Make swings that start the downswing by shifting pressure to the lead foot before the arms move. Exaggerate the sequence at half speed.', feel: 'Lower body leading, arms following', reps: '10 slow swings', equipment: 'None', level: 'advanced' },
  ],
  practicePlan: [
    'Day 1–2: Headcover Gate at half speed, no full effort.',
    'Day 3–5: Add Pump-and-Drop to feel the shallow move.',
    'Day 6: Lower-Body-First Transition into normal swings.',
    'Day 7: Record a down-the-line retest and compare path and start line.',
  ],
  progressionLadder: [
    'See and feel your current plane on slow swings',
    'Clear the Headcover Gate consistently at half speed',
    'Keep the inside approach at full speed',
    'Own a repeatable shape in play',
  ],
  troubleshooting: [
    { heading: 'I shallowed the club but now I hook it', body: 'Shallowing fixes path but can over-close the face if your grip/release are not matched. Treat plane, grip, and release together — that is why this page links to all three.' },
    { heading: 'The app says I am over the top but my coach disagrees', body: 'Check the camera angle first. Plane is read from 2D; off-axis footage commonly fakes an over-the-top look. Re-film truly down the line before trusting the read.' },
  ],
  relatedFaultIds: ['over_the_top', 'casting_hands', 'poor_hip_shoulder_separation'],
  relatedDataPointSlugs: ['over-the-top', 'casting', 'face-control', 'rotation'],
  relatedConceptSlugs: ['grip', 'weight-distribution'],
  relatedCoachStyleIds: ['technical', 'data'],
  drillFamilies: ['plane & path', 'transition & sequencing'],
  extraSections: [
    { heading: 'Shallow vs. steep — in plain English', body: 'Steep means the club works up and down more vertically; shallow means it works more around you. Most amateurs are too steep coming down (the over-the-top family). A small "shallow in transition" feel fixes a lot, but more is not better — too shallow brings its own misses.' },
    { heading: 'Why plane is a matchup, not a target', body: 'There is no single perfect plane. What matters is that your downswing path matches your face angle for the shot you want. That is why chasing plane alone fails — it has to pair with grip, posture, rotation, and release.' },
    { heading: 'Keep it simple', body: 'You do not need to memorize angles. For most players, one feel — "let the club drop and swing from the inside" — plus a true down-the-line camera is enough to move plane in the right direction.' },
  ],
  seoTitle: 'Swing Plane Explained: Over the Top, Shallow vs Steep, and Drills',
  seoDescription:
    'Understand swing plane in plain English: hand path, shaft/bat/racket path, over the top, shallow vs steep, how camera angle affects detection, and drills to fix it.',
  faqs: [
    { question: 'What is swing plane in simple terms?', answer: 'It is the tilted circle your club, bat, or racket travels on. The angle and direction of that circle, combined with your face angle, decide where the ball starts and how it curves.' },
    { question: 'What does "over the top" mean?', answer: 'It is a steep, out-to-in downswing where the club moves out and over the ideal path at the start of the downswing, cutting across the ball. It is the most common cause of the pull-slice.' },
    { question: 'Is steep or shallow better?', answer: 'Neither is universally better — plane is a matchup with your face and intended shape. That said, most amateurs are too steep coming down, so a slight "shallow in transition" feel usually helps.' },
    { question: 'Why does the camera angle matter for plane?', answer: 'Plane is read from a 2D video, so an off-axis camera can fake a plane problem that is not really there. Film directly down the line — behind your hands, on the target line, at hip height — for an accurate read.' },
  ],
  lastReviewedAt: REVIEWED,
  sourceNotes:
    'Synthesized from public, widely-taught plane concepts (path, shallow/steep, over the top, face-to-path matchups). No coach-specific or branded material used.',
};

export const CONCEPT_ENTRIES: LearnEntry[] = [GRIP, WEIGHT_DISTRIBUTION, SWING_PLANE];
