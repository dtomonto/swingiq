// Admin publish overrides (slug → status), set from /admin/updates. Committed,
// merged at read time so a post can be unpublished — or a draft published —
// without editing this file. Empty `{}` = every post uses its own status.
import blogPublishOverrides from './blog-publish-overrides.json';

export type BlogPublishStatus = 'published' | 'draft';

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishDate: string; // YYYY-MM-DD
  displayDate: string; // "Month DD, YYYY"
  sport: 'golf' | 'tennis' | 'pickleball' | 'padel' | 'baseball' | 'softball' | 'all';
  category: string;
  readingTime: string;
  excerpt: string;
  content: string; // \n\n for paragraphs, ## for h2 headers
  tags: string[];
  relatedSlugs?: string[];
  /** Hidden from the public blog when 'draft'. Missing = published. */
  status?: BlogPublishStatus;
}

const BLOG_PUBLISH_OVERRIDES = blogPublishOverrides as Record<string, BlogPublishStatus>;

/** A post's effective status, applying any admin publish override by slug. */
export function effectiveBlogStatus(p: BlogPost): BlogPublishStatus {
  return BLOG_PUBLISH_OVERRIDES[p.slug] ?? p.status ?? 'published';
}

/** True when a post may appear on the public blog (list, route, sitemap). */
export function isPublishedBlogPost(p: BlogPost): boolean {
  return effectiveBlogStatus(p) === 'published';
}

/** Public posts only — use for the blog list, [slug] route, and sitemap. */
export function getPublishedBlogPosts(): BlogPost[] {
  return BLOG_POSTS.filter(isPublishedBlogPost);
}

/** Look up a single public post by slug (drafts return undefined → 404). */
export function getPublishedBlogPost(slug: string): BlogPost | undefined {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  return post && isPublishedBlogPost(post) ? post : undefined;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-fix-a-golf-slice',
    title: 'How to Fix a Golf Slice: The 5 Most Common Causes',
    metaTitle: 'How to Fix a Golf Slice | SwingVantage Golf Tips',
    metaDescription: 'Learn the 5 most common causes of a golf slice and how to fix them. Understand the club path vs face angle relationship and get 3 drills to try today.',
    publishDate: '2026-05-15',
    displayDate: 'May 15, 2026',
    sport: 'golf',
    category: 'Swing Fixes',
    readingTime: '6 min read',
    excerpt: 'A slice is the most common fault in amateur golf. Here are the 5 root causes — and what actually fixes them.',
    tags: ['golf', 'slice', 'club path', 'face angle', 'swing fix'],
    relatedSlugs: ['what-is-smash-factor', 'how-to-read-launch-monitor-data', 'practice-schedule-for-golfers'],
    content: `## What Causes a Golf Slice?

A slice happens when the ball curves sharply from left to right (for right-handed golfers). It feels weak, it loses distance, and it is the most common fault among recreational players. The good news: a slice always has a mechanical cause, and mechanical causes can be fixed.

The two primary factors in any curved shot are club path and face angle. Club path is the direction the clubhead travels through the hitting zone. Face angle is where the face is pointing at impact. A slice is caused when the face angle is significantly open relative to the club path — the ball starts left of the path and curves hard to the right.

## The 5 Most Common Causes

**1. An out-to-in club path.** When the club travels from outside the target line to inside on the downswing, the ball starts left and curves right. This path is often caused by the upper body leading the downswing — the shoulders unwind before the hips clear, and the club swings across the body.

**2. A weak grip.** A grip where both hands are rotated too far toward the target (counterclockwise for right-handers) makes it harder to close the face at impact. The club arrives with an open face, producing the curve.

**3. Poor weight transfer.** Staying too much on the back foot through impact causes the body to get in the way of the swing and forces the club to cut across the ball from outside to inside.

**4. Early extension.** Standing up out of your posture through the downswing blocks hip rotation. When the hips stall, the arms take over and tend to swing across the ball, creating an out-to-in path.

**5. Aiming left as a compensation.** Many slicers aim further left to allow for the curve, which actually makes the path worse. The more you aim left, the more outside-to-in your path becomes.

## The Club Path vs Face Angle Relationship

Here is the key insight most golfers miss: the face angle has more influence on starting direction than path does. About 75 to 85 percent of where the ball starts comes from face angle. The gap between face angle and path creates the curve.

So if your club path is 5° out-to-in and your face is 8° open, the ball starts right of the path and curves further right — a slice. If your face was only 3° open with the same path, you would get a gentle fade. The goal is to narrow the gap between face and path.

## 3 Drills to Try

The gate drill: place two tees just wider than the clubhead, one on each side of the ball. Swing through without hitting the tees. This forces an in-to-out or neutral path because an out-to-in swing will clip the outer tee.

The towel drill: place a head cover or folded towel under your right arm (for right-handers) and keep it there through the backswing. This encourages a connected swing that avoids the over-the-top move that creates out-to-in paths.

The face tape test: place impact tape or foot spray on the face before hitting. A slice almost always shows strikes toward the heel — where the face is most open relative to the path.

## When to Seek Professional Help

If you have tried these fixes and the slice persists, a few sessions with a qualified instructor who can see your swing in person is worth more than dozens of range sessions alone. A good coach can identify compensations that are hard to see without someone watching you from the right angle.

SwingVantage can give you data-driven evidence of whether your path and face angle are improving between lessons — use it as a supplement to coaching, not a replacement.`,
  },
  {
    slug: 'what-is-smash-factor',
    title: 'What Is Smash Factor and Why Does It Matter?',
    metaTitle: 'What Is Smash Factor in Golf? | SwingVantage',
    metaDescription: 'Learn what smash factor is in golf, what good numbers look like for your skill level, and how to improve it to maximize distance from your swing.',
    publishDate: '2026-05-10',
    displayDate: 'May 10, 2026',
    sport: 'golf',
    category: 'Data Explained',
    readingTime: '4 min read',
    excerpt: 'Smash factor measures how efficiently your club transfers energy to the ball. Here is what the numbers mean and how to improve yours.',
    tags: ['golf', 'smash factor', 'ball speed', 'club speed', 'launch monitor'],
    relatedSlugs: ['how-to-read-launch-monitor-data', 'how-to-fix-a-golf-slice'],
    content: `## What Is Smash Factor?

Smash factor is the ratio of ball speed to club head speed. If your club head is traveling at 100 mph and the ball leaves the face at 148 mph, your smash factor is 1.48.

The formula is simple: ball speed divided by club head speed. The result tells you how efficiently you transferred energy from the clubhead to the ball — essentially, how well you made contact.

## What Do Good Numbers Look Like?

The theoretical maximum for a driver is approximately 1.50, though equipment rules and physics prevent going beyond that. Here is how smash factor typically breaks down by skill level:

For recreational golfers, a smash factor between 1.35 and 1.45 is common. There is meaningful distance being left on the table, but it is not unusual. For mid-handicap players improving their contact, getting consistently above 1.42 represents real progress. For low-handicap and scratch golfers, smash factor above 1.45 is typical. Tour professionals average around 1.48 to 1.50 on driver.

For irons, the maximum smash factor is lower because irons have less loft and make contact differently. A smash factor of 1.35 to 1.40 on a 7-iron is considered good.

## What Smash Factor Tells You

Smash factor is a strike quality measurement, not a raw power measurement. A golfer with 95 mph club head speed and a smash factor of 1.50 will hit the ball further than a golfer with 105 mph club head speed and a smash factor of 1.35.

This matters because many golfers try to swing faster to gain distance. But if the additional speed comes at the cost of strike quality, the gains disappear. The most efficient path to more distance is often improving smash factor first, before working on increasing club speed.

Low smash factor almost always indicates off-center contact. Heel strikes and toe strikes both reduce smash factor. The ball does not compress the same way when it is not near the center of the face.

## How to Improve Your Smash Factor

The first step is finding out where you are striking the ball. Put foot spray or impact tape on the face for a session and look at the pattern. If your strikes cluster toward the heel, work on standing slightly further from the ball. Toe strikes suggest standing too close or having the shaft lean too far forward.

Slower, controlled swings at 70 to 80 percent tempo often produce higher smash factors than full-effort swings because the swing path becomes more consistent. Many players find that backing off their effort improves both contact quality and total distance.

After establishing a consistent strike pattern, then work on increasing club head speed with targeted training.

SwingVantage tracks your smash factor across sessions so you can see whether contact quality is trending in the right direction — even if your swing speed stays the same.`,
  },
  {
    slug: 'how-to-read-launch-monitor-data',
    title: 'How to Read Your Launch Monitor Data (And What to Do With It)',
    metaTitle: 'How to Read Launch Monitor Data | SwingVantage Golf Guide',
    metaDescription: 'A plain-English guide to launch monitor metrics — what launch angle, spin rate, ball speed, and attack angle mean and what good numbers look like for recreational golfers.',
    publishDate: '2026-05-05',
    displayDate: 'May 5, 2026',
    sport: 'golf',
    category: 'Data Explained',
    readingTime: '7 min read',
    excerpt: 'Launch monitors produce a lot of numbers. Here is what each metric actually means, which ones matter most, and the most common interpretation mistakes.',
    tags: ['golf', 'launch monitor', 'data', 'ball speed', 'spin rate', 'launch angle', 'attack angle'],
    relatedSlugs: ['what-is-smash-factor', 'how-to-fix-a-golf-slice', 'practice-schedule-for-golfers'],
    content: `## The Key Metrics Explained

Modern launch monitors produce dozens of data points. Most of them are useful, but a handful deserve the most attention when you are starting out.

**Ball Speed** is how fast the ball leaves the clubface. It is the primary driver of carry distance — everything else being equal, higher ball speed goes further. Ball speed is a product of club speed and contact quality. If your ball speed is low relative to your club speed, you are losing efficiency in the strike.

**Club Head Speed** is how fast the clubhead is moving just before impact. This is your raw power. But power without accuracy or contact quality does not produce distance — it produces inconsistency. Do not obsess over club speed until your smash factor is consistently above 1.42.

**Launch Angle** is the vertical angle at which the ball leaves the face. The optimal launch angle depends on your club. For a driver, the optimal range for most recreational golfers is roughly 12 to 16 degrees. Too low (under 10 degrees) and you are losing carry. Too high (above 18 degrees) and you are fighting the ball ballooning and losing distance.

**Spin Rate** is how fast the ball is spinning, measured in revolutions per minute. For a driver, high spin (above 3,500 RPM) is your enemy — it creates a ballooning flight that loses distance in any wind. The optimal driver spin rate for most players is between 2,200 and 2,800 RPM. For irons and wedges, more spin is generally good — it gives you control and stopping power.

**Attack Angle** is the angle at which the clubhead approaches the ball. Negative means hitting down. Positive means hitting up. For irons, a slightly negative attack angle (-2 to -5 degrees) is correct — it produces ball-first contact and compresses the shot. For driver, a slightly positive attack angle (+1 to +3 degrees) reduces spin and increases carry distance.

## What Good Numbers Look Like for Recreational Golfers

Recreational golfers should not compare themselves to tour averages. A mid-handicapper with 85 mph club head speed, 1.42 smash factor, 13 degree launch angle, and 3,000 RPM spin on driver is in a reasonable place and has room to improve in every category.

The more useful comparison is your own numbers over time. Is your smash factor trending up? Is your spin coming down? Is your launch angle getting closer to optimal for your speed? That trend line matters more than any single session.

## Common Interpretation Mistakes

The biggest mistake is treating a single session as diagnostic truth. Data from one day can be affected by conditions, equipment warmup, fatigue, or simply an off session. Look for patterns that repeat across three or more sessions before drawing conclusions.

Another common mistake is optimizing one metric while ignoring others. Lowering spin rate to reduce ballooning is good — unless it comes at the cost of launch angle dropping so low that carry distance falls off. The metrics work together.

Finally, do not assume that the fix is always a swing change. Sometimes low launch angle is a shaft flex issue. Sometimes high spin is a ball choice issue. Equipment matters alongside technique.

## Using SwingVantage With Your Launch Monitor

SwingVantage imports CSV data from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak, and most other common formats. Once imported, it compares your numbers against skill-level-adjusted benchmarks and identifies which metrics are outside the optimal range for your club and ability level — starting with the one that has the most impact on your performance.`,
  },
  {
    slug: 'tennis-forehand-technique-basics',
    title: 'Tennis Forehand Fundamentals: What the Data Shows About Consistent Hitters',
    metaTitle: 'Tennis Forehand Fundamentals | SwingVantage Tennis Guide',
    metaDescription: 'Learn the fundamental mechanics of a consistent tennis forehand — grip, contact point, follow-through, topspin, and the most common mistakes that cause errors.',
    publishDate: '2026-04-28',
    displayDate: 'April 28, 2026',
    sport: 'tennis',
    category: 'Technique',
    readingTime: '5 min read',
    excerpt: 'Consistency on the forehand comes down to a few repeatable mechanics. Here is what separates reliable hitters from streaky ones.',
    tags: ['tennis', 'forehand', 'topspin', 'technique', 'contact point'],
    relatedSlugs: ['how-ai-swing-analysis-works'],
    content: `## The Foundation: Grip

The semi-western grip is the most common grip among competitive recreational and professional players. It positions the base knuckle of the index finger on the fifth bevel of the racket handle. This grip naturally promotes topspin because the wrist position at contact allows for a low-to-high swing path.

The eastern grip is slightly more conservative — less natural topspin but easier for flat contact. The full western grip generates extreme topspin but makes it harder to handle balls at shoulder height and above.

Grip consistency matters as much as grip choice. Players who unconsciously change their grip during play will have inconsistent results regardless of which grip they start with.

## Contact Point and Footwork

The contact point is where the ball meets the strings. For most forehand shots, the ideal contact point is roughly 12 to 18 inches in front of the lead hip, with the arm extended but not fully straightened.

Hitting too close to the body leaves no room for the swing to accelerate. Hitting too far out front reduces power and makes it harder to control direction.

Footwork determines the contact point. Players who move to the ball early and set their feet before swinging consistently hit out of a better position than players who are still moving at contact. The split step — a small jump timed to the opponent's strike — is the foundation of good footwork because it activates fast-twitch muscle fibers for directional movement.

## Why Topspin Matters

Topspin is not just for generating spin — it is a consistency tool. A ball with topspin has more room to clear the net because the spin pulls it down into the court after it crosses. A flat ball must be hit with a very precise trajectory to stay in.

Topspin is created by swinging the racket head low-to-high through the contact zone, brushing up the back of the ball. The follow-through path — finishing over the non-dominant shoulder or wrapped around the neck — indicates whether the swing path was correct.

Players who want more topspin should not try to spin the ball consciously. Instead, they should focus on the contact point (slightly higher on the ball) and the follow-through direction. The spin follows naturally from the mechanics.

## Common Forehand Mistakes

The most common cause of forehand errors is late preparation. Players who start their unit turn too late — after the ball crosses the net rather than as soon as the opponent strikes — arrive at the contact point rushed and out of position.

A second common fault is failing to maintain the wrist position through contact. Letting the wrist flip before contact rolls the racket face over and produces net errors. The wrist should stay relatively stable through the hitting zone and only release after the ball has left the strings.

Finally, many players decelerate through contact — they slow the swing down as they approach the ball, concerned about control. This reduces both power and consistency. The swing should accelerate through the ball and finish with full extension in the follow-through direction.

## Putting It Into Practice

The best way to ingrain these mechanics is through slow-motion shadow swings that build the correct movement pattern before hitting. Practice the unit turn, contact point position, and follow-through path without a ball, then with a dropped ball, before working at full speed.

Video analysis gives you a reference point — seeing what your swing actually looks like, rather than what it feels like, is often surprising for players at every level.`,
  },
  {
    slug: 'baseball-exit-velocity-guide',
    title: 'Exit Velocity in Baseball: What It Is and How to Improve It',
    metaTitle: 'Baseball Exit Velocity Guide | SwingVantage',
    metaDescription: 'Learn what exit velocity is in baseball, why it matters for batting performance, typical values by age and level, and 3 proven ways to improve it.',
    publishDate: '2026-04-20',
    displayDate: 'April 20, 2026',
    sport: 'baseball',
    category: 'Data Explained',
    readingTime: '5 min read',
    excerpt: 'Exit velocity is the most important number in baseball hitting. Here is what it measures, what good looks like at your level, and how to improve it.',
    tags: ['baseball', 'exit velocity', 'bat speed', 'hitting', 'launch angle'],
    relatedSlugs: ['softball-bat-path-and-launch-angle', 'how-ai-swing-analysis-works'],
    content: `## What Is Exit Velocity?

Exit velocity is how fast the ball comes off the bat after contact, measured in miles per hour. It is the most important individual metric in baseball hitting because exit velocity is the ceiling on everything else. No matter how good the launch angle or spray angle, a ball hit at 60 mph will not become a home run. A ball hit at 110 mph has options.

Exit velocity is a function of bat speed, bat path through the zone, and contact location on the barrel. You can have high bat speed and still produce low exit velocity if you are making contact off the handle or on the end of the bat.

## Why It Matters

Exit velocity correlates directly with batting outcomes. In MLB Statcast data, balls with higher exit velocity produce significantly higher batting averages, slugging percentages, and on-base percentages. The correlation is not perfect — a 95 mph groundball into a shift will still get recorded as an out — but it is strong enough that exit velocity is one of the best predictors of hitter quality over time.

At the youth and amateur level, exit velocity correlates with player development progress and helps identify where a hitter's mechanics need attention.

## Typical Values by Age and Level

These are approximate averages that vary by player size, strength, and development stage:

Youth (10-12 years): 45–60 mph. High school (freshman/sophomore): 65–75 mph. High school (junior/senior): 75–85 mph. College: 85–95 mph. Independent/minor league: 88–95 mph. MLB average: approximately 88–92 mph. MLB elite: 100–115 mph.

If a hitter is significantly below these ranges for their age and level, bat path, contact quality, and physical development are all worth examining.

## 3 Ways to Improve Exit Velocity

**Improve contact quality first.** Before focusing on bat speed, identify where on the barrel you are consistently making contact. Tee work with an old bat or impact tape reveals the contact pattern. Barrel contact produces maximum energy transfer. Handle and end-of-bat contact bleeds exit velocity regardless of how fast the bat is moving.

**Develop hip rotation.** Exit velocity at the professional level correlates strongly with hip rotation speed. Players who rotate their hips slowly — or who stall their hips and use only the arms — generate less bat speed and less exit velocity. Drills that isolate hip rotation, like the hip-only rotation drill on a tee, build the pattern that transfers power into the swing.

**Add bat speed training.** Once contact quality is consistent, overload and underload training with heavier and lighter bats develops the neurological pathways for faster bat speed. This is most effective when combined with regular baseball-weight bat reps so the transfer carries into games.

## Tracking Your Progress With SwingVantage

SwingVantage tracks exit velocity across your sessions and shows you the trend over time. Improvement in exit velocity following a change in mechanics or a training block tells you the change was real — not just a good day.`,
  },
  {
    slug: 'softball-bat-path-and-launch-angle',
    title: 'Bat Path and Launch Angle in Softball: A Simple Guide',
    metaTitle: 'Softball Bat Path and Launch Angle | SwingVantage',
    metaDescription: 'Learn what launch angle means in softball, ideal ranges for slow pitch vs fast pitch, how bat path affects the ball, and what attack angle tells you about your swing.',
    publishDate: '2026-04-12',
    displayDate: 'April 12, 2026',
    sport: 'softball',
    category: 'Technique',
    readingTime: '5 min read',
    excerpt: 'Launch angle and bat path are the two most important mechanical factors in softball hitting. Here is a plain-English breakdown of both.',
    tags: ['softball', 'bat path', 'launch angle', 'attack angle', 'slow pitch', 'fast pitch'],
    relatedSlugs: ['baseball-exit-velocity-guide', 'how-ai-swing-analysis-works'],
    content: `## What Is Launch Angle in Softball?

Launch angle is the vertical angle the ball leaves the bat after contact. A negative launch angle means the ball was hit into the ground. Zero degrees is a perfect line drive. Positive angles produce fly balls, and very high angles produce pop-ups.

In baseball and softball, the ideal launch angle for a hard-hit ball is roughly 10 to 25 degrees. In that range, the ball has enough loft to carry into the outfield without going so high that it becomes easy to track and catch.

The same basic principle applies in both slow pitch and fast pitch softball, but the specifics differ because the pitch trajectory and timing demands are so different between the two disciplines.

## Ideal Ranges for Slow Pitch vs. Fast Pitch

In **slow pitch softball**, the arc of the pitch is already dropping steeply when the hitter makes contact. Most successful slow pitch hitters make contact as the ball is descending and swing slightly upward to produce a line drive. Launch angles between 8 and 20 degrees tend to produce the best results in slow pitch — enough lift to clear the infield without going too high.

In **fast pitch softball**, the pitch arrives much faster and with less arc. The timing window is shorter, and the swing needs to be more compact. Contact happens more out in front, and the ideal launch angle range is similar (10–25 degrees for optimal hard-hit balls), but the path to achieving it is different because you have less time to adjust.

## How Bat Path Affects the Ball

Bat path is the direction the barrel travels through the hitting zone. A downward path (chopping at the ball) tends to produce groundballs regardless of contact quality. An upward path (sweeping up through the ball) tends to produce fly balls and pop-ups. A slightly upward path — matching the descending plane of the pitch — produces the best combination of contact quality and launch angle.

This slightly upward path is described as **attack angle**. A positive attack angle (bat traveling upward at contact) typically ranges from +2 to +15 degrees for optimal hitters. An attack angle that is too steep (over +20 degrees) produces pop-ups. A negative attack angle (hitting down) produces groundballs.

## What Attack Angle Tells You

Attack angle is captured by bat tracking devices like Blast Motion and is one of the most actionable metrics for softball hitters. If your attack angle is very negative — meaning you are chopping down at the ball — the fix is usually about hip drop and the swing path, not contact point.

If your attack angle is extreme in the other direction (very high positive), you may be over-compensating for a pitch arc or dragging the barrel before contact.

Ideal attack angle ranges depend on your level and the pitch type you are facing, but starting in the +5 to +12 degree range gives most hitters the best chance of pairing good contact with a productive launch angle.

## Putting It Together

The relationship between bat path, attack angle, and launch angle is direct: your bat path creates the attack angle, and the attack angle combined with where you make contact on the ball determines the launch angle. Work backward from your launch angle data to understand whether the cause is bat path, contact point, or timing.

SwingVantage tracks these relationships across your sessions and flags when your launch angle trend is outside the productive range — so you can tell whether a bad result was a fluke or a pattern.`,
  },
  {
    slug: 'how-ai-swing-analysis-works',
    title: 'How AI Swing Analysis Works (And What It Can and Cannot Do)',
    metaTitle: 'How AI Swing Analysis Works | SwingVantage',
    metaDescription: 'Learn how AI swing analysis actually works — what it does, what data it analyzes, its real limitations vs professional coaching, and how to use it effectively.',
    publishDate: '2026-04-05',
    displayDate: 'April 5, 2026',
    sport: 'all',
    category: 'How It Works',
    readingTime: '6 min read',
    excerpt: 'AI swing analysis is a useful tool — but it is not magic. Here is an honest look at what it can do, what it cannot do, and how to get the most out of it.',
    tags: ['ai analysis', 'how it works', 'coaching', 'swing diagnosis', 'technology'],
    relatedSlugs: ['practice-schedule-for-golfers', 'how-to-read-launch-monitor-data'],
    content: `## What AI Swing Analysis Actually Does

The term "AI swing analysis" covers a range of different technologies with very different capabilities. It is worth understanding what the technology actually does before trusting its outputs.

SwingVantage compares your data against biomechanically-informed benchmarks tuned to your sport and skill level. When a metric falls outside the optimal range for your level, it flags it as a potential issue and ranks the issues by severity — so you always know the single most important thing to work on first.

The result is consistent and explainable: the same inputs always produce the same read, every finding is tied to the data behind it, and it's grounded in established coaching principles rather than a black box.

## What Data Gets Analyzed

For golf, the primary inputs are launch monitor metrics: ball speed, club head speed, launch angle, spin rate, club path, face angle, attack angle, smash factor, and carry distance. Each is compared to a benchmark adjusted for club type and skill level to surface the issue most likely to explain your misses.

For baseball and softball, the primary inputs are exit velocity, launch angle, bat speed, and attack angle — data that comes from devices like HitTrax, Rapsodo, and Blast Motion.

For video analysis, SwingVantage uses computer vision to read your actual footage — your setup, body positions, and movement through address, the top of the backswing, and impact — instead of guessing from a flat outline. It still isn't a substitute for a dedicated tracking device, so treat its feedback as informed coaching observations rather than precise measurements.

## Real Limitations vs. Professional Coaching

AI analysis has genuine limitations that are worth being honest about.

**It cannot see you.** A coach watching you swing can observe your grip pressure, your weight distribution, the feel of your timing. None of that is captured in data from a launch monitor or a phone video.

**It cannot ask questions.** A good instructor asks about your history, your goals, your body limitations, your equipment. Context matters enormously for diagnosis. An AI tool has only what you explicitly input.

**It cannot catch everything.** Heuristic engines are as good as their rules. If the engineer who built the system did not write a rule for a particular fault pattern, the engine will miss it.

**Results are estimates.** Every finding from SwingVantage comes with a confidence label for exactly this reason. High confidence means the issue appears clearly and repeatedly in your data. Low confidence means it is possible but needs more data to confirm.

## How to Use AI Analysis Effectively

The most productive way to use AI swing analysis is as a pattern-detector between coaching sessions, not as a replacement for instruction.

Use it to identify consistent patterns in your data that suggest a persistent mechanical issue. Use it to track whether a change you made in your last lesson shows up in the data over the following sessions. Use it to stay accountable to a practice plan when you do not have access to a coach.

Treat individual session results as data points, not verdicts. A single analysis tells you what happened that day. Three or more sessions showing the same pattern starts to be meaningful.

And when the data suggests something significant — a fault pattern that appears consistently, a metric that is dramatically outside the benchmark range — bring that data to a qualified coach. Arriving at a lesson with objective data about your swing is more efficient than arriving cold.`,
  },
  {
    slug: 'practice-schedule-for-golfers',
    title: 'How to Build a Practice Schedule That Actually Improves Your Golf',
    metaTitle: 'Golf Practice Schedule Guide | SwingVantage',
    metaDescription: 'Learn how to build a golf practice schedule that actually produces improvement. Understand deliberate practice, how to structure a session, and how SwingVantage helps you stay consistent.',
    publishDate: '2026-03-28',
    displayDate: 'March 28, 2026',
    sport: 'golf',
    category: 'Training',
    readingTime: '6 min read',
    excerpt: 'Hitting 200 balls without a plan is not practice — it is just hitting balls. Here is how to build a practice schedule that produces real improvement.',
    tags: ['golf', 'practice', 'improvement', 'training plan', 'deliberate practice'],
    relatedSlugs: ['how-to-fix-a-golf-slice', 'how-to-read-launch-monitor-data', 'how-ai-swing-analysis-works'],
    content: `## The Difference Between Practice and Hitting Balls

Most golfers hit balls. Fewer golfers practice. The difference is whether there is intention behind each swing.

Hitting balls is comfortable — it is social, it is familiar, and it creates the feeling of doing something productive. But without specific feedback on each shot and a defined skill target for the session, hitting balls reinforces existing habits. If your existing habit is a slice, hitting 200 balls without a focused fix makes you better at slicing.

Deliberate practice means working on a specific, measurable skill goal in each session. It is less comfortable than hitting balls because it requires attention and often produces worse short-term results before it produces better long-term results.

## How to Structure a Practice Session

A well-structured practice session has four phases.

**Warm-up (10-15 minutes):** Start with wedges or short irons. Gradually work through the bag toward longer clubs. This is not the time for drills — just getting loosened up and establishing contact.

**Focused skill work (20-30 minutes):** This is the core of the session. Pick one specific thing to work on, ideally tied to your most recent diagnosis. If your club path is out-to-in, do the gate drill. If your attack angle is too negative, hit from a forward ball position with a high tee. Every shot should have a specific intent tied to the skill.

**Transfer training (10-15 minutes):** Apply the skill work in a game-like setting. Pick targets. Vary clubs. Introduce mild pressure (challenge yourself to hit 7 of 10 shots within a defined area). This is where skill transfers from the drill environment to something more like real golf.

**Short game (if time allows):** Putting and chipping contribute as much as full swing work to your score. Do not skip it because it feels less exciting than hitting drivers.

## How SwingVantage's Practice Schedule Works

SwingVantage generates a weekly practice schedule based on three inputs: which days and times you have available, how long each session can be, and what your active swing diagnosis is.

The generated schedule assigns a focus theme to each day — not just "practice golf" but a specific area like contact quality, face angle control, or short game. Each session within that theme comes with recommended drills and a session structure that follows the four-phase format above.

The schedule updates as your diagnosis changes. If you resolve your primary fault and the engine identifies a new priority, the schedule rebuilds around that new focus.

## Tips for Staying Consistent

**Set a realistic volume.** Two or three focused sessions per week will produce more improvement than seven rushed ones. Overcommitting to a schedule leads to skipping, which breaks the habit.

**Log every session, even short ones.** A 20-minute putting session counts. Logging it maintains your practice streak, keeps your history complete, and gives SwingVantage more data to identify patterns.

**Track process, not just results.** A session where you worked on your face angle and hit the ball worse is still a valuable session if you were doing the right things. Swing changes often produce temporary regression before they produce improvement. Expect that and plan for it.

**Review your data monthly.** Monthly trend reviews — looking at three to five sessions at a time — reveal whether your work is producing results. SwingVantage's progress charts show whether your swing scores, key metrics, and personal bests are trending in the right direction.

The golfers who improve fastest are not the ones who hit the most balls. They are the ones who show up consistently, with a plan, and who track whether the plan is working.`,
  },
  {
    slug: 'pickleball-third-shot-drop-guide',
    title: 'The Pickleball Third-Shot Drop: A Beginner-to-3.5 Guide',
    metaTitle: 'Pickleball Third-Shot Drop Guide | SwingVantage',
    metaDescription: 'The third-shot drop gets you to the kitchen line. Learn the mechanics, the three reasons drops fail, and a practice progression to make it reliable.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'pickleball',
    category: 'Technique',
    readingTime: '6 min read',
    excerpt: 'The third-shot drop is the most important — and most missed — shot in pickleball. Here is how it works and how to make it reliable.',
    tags: ['pickleball', 'third shot drop', 'kitchen', 'soft game', 'technique'],
    relatedSlugs: ['padel-bandeja-explained'],
    content: `## Why the Third Shot Decides the Point

In doubles pickleball, the serving team starts at a disadvantage: the returning team gets to the kitchen line first. The third shot — the serving team's shot after the return — is how you erase that disadvantage. A good drop lands soft in the non-volley zone, can't be attacked, and buys you time to move up to the line. Miss it, and you stay pinned at the baseline trading drives you'll usually lose.

This is the single biggest skill gap between 3.0 and 3.5+ players, and it is NOT a tennis shot. There is no long backswing. The power comes from your legs, not a swing.

## The Mechanics

A third-shot drop is a soft, lofted shot that arcs up, peaks on YOUR side of the net, and falls into the kitchen. Four checkpoints:

**1. Compact preparation.** The paddle barely goes back past your hip. A long, tennis-style backswing is the number-one cause of inconsistent drops.

**2. Lift with the legs.** Bend your knees and extend them through the shot. The legs provide the upward lift; the arm stays calm and along for the ride.

**3. Stable, slightly open paddle face.** Set the angle early and keep your wrist quiet through contact. A flicking wrist sprays the height.

**4. Contact out in front.** Meet the ball ahead of your body, never beside or behind your hip.

## The Three Reasons Drops Fail

**Netting it.** You decelerated into the ball, used no leg lift, or contacted it behind your body. Fix: drive the lift from your legs and commit to the upward arc.

**Floating it (it gets attacked).** Your paddle face was too open or you added too much pace, so the ball sat up above net height. Fix: a calmer face and softer hands.

**Rushing forward.** You sprinted to the line before the drop was actually unattackable. Fix: drop, take two steps, split-step, and only advance behind a good ball.

## A Practice Progression

1. **Stationary drops** from the baseline to a cone target in the kitchen — 3 sets of 15. Track makes.
2. **Drop and advance** — hit a drop, take two controlled steps, split-step; only move up behind an unattackable ball.
3. **Live drop rallies** — drop against a partner feeding drives, working all the way to the line.

Film yourself from the side. SwingVantage's pickleball analysis reads your paddle-face angle, leg lift, and the arc relative to the net, then gives you the one thing to fix first.

The drop is hard, and that's exactly why it's worth the reps. It is the shot that lets you play the soft game where points are actually won.`,
  },
  {
    slug: 'padel-bandeja-explained',
    title: 'The Padel Bandeja Explained: How to Hold the Net',
    metaTitle: 'Padel Bandeja Explained | SwingVantage',
    metaDescription: 'The bandeja is the controlled overhead that keeps you at the net in padel. Learn what it is, when to use it instead of a smash, and how to groove it.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'padel',
    category: 'Technique',
    readingTime: '6 min read',
    excerpt: 'The bandeja is the shot that separates padel from tennis — and the one that lets your team keep the net. Here is how it works.',
    tags: ['padel', 'bandeja', 'overhead', 'net control', 'technique'],
    relatedSlugs: ['pickleball-third-shot-drop-guide'],
    content: `## The Most Important Shot You've Never Heard Of

In padel, whoever controls the net controls the point. When your opponents lob you — and they will, constantly — you have a choice: try to smash the ball (risky, and if you miss you lose the net), or play a bandeja, the controlled overhead that keeps you forward and keeps the pressure on.

The bandeja ("tray" in Spanish, named for the serving-tray motion) is what makes padel padel. It is not a smash, and it is definitely not a tennis serve.

## What the Bandeja Is

It's a slow, sliced, controlled overhead hit at roughly shoulder-to-head height, placed deep and usually cross-court. The goal is not to win the point outright — it's to keep your team at the net while pushing your opponents back and pinning them to the glass.

Four checkpoints:

**1. Turn side-on early.** As soon as you read the lob, turn sideways and point your non-paddle hand at the ball to track it.

**2. Contact out front and above the shoulder.** Not behind your head. Reach up and slightly in front.

**3. Brush with slice.** A little high-to-low slice gives you control and depth, and makes the ball skid low after the bounce.

**4. Finish low and out toward the target** — not over your shoulder like a smash. Stay balanced and forward; do not fall backward off the net.

## Bandeja vs. Víbora vs. Smash

- **Bandeja** — the safe, controlled default to hold the net on most lobs.
- **Víbora** — a more aggressive, side-spin overhead (a "snake") for when you want to attack without fully committing to a smash.
- **Smash** — only for short, high, comfortable balls you can finish. If the lob is deep or awkward, a smash is a low-percentage gamble that surrenders the net when it misses.

The discipline to choose the bandeja over the smash is one of the biggest markers of a developing padel player.

## How to Groove It

1. **Shadow reps** — slow side-on overhead motions grooving the turn, the out-front contact, and the low finish.
2. **Bandeja control & depth** — a partner lobs; you hit bandejas deep cross-court to a target near the side glass. 3 sets of 12.
3. **Smash-or-bandeja decision game** — mix deep lobs and short sit-ups, and only smash the easy ones.

Film yourself from the side. SwingVantage's padel analysis reads your preparation, contact point, slice, and finish, and tells you the one adjustment that will hold the net more often.

Power wins highlight reels. Control wins matches — and in padel, control starts with the bandeja.`,
  },
  {
    slug: 'how-to-stop-topping-the-golf-ball',
    title: 'How to Stop Topping the Golf Ball',
    metaTitle: 'How to Stop Topping the Golf Ball | SwingVantage',
    metaDescription: 'Topping the ball is a low-point problem, not a lifting problem. Learn the 5 real causes and 3 drills to start making ball-first contact.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'golf',
    category: 'Swing Fixes',
    readingTime: '6 min read',
    excerpt: 'Topping the ball comes from where the club bottoms out, not from failing to lift it. Here are the 5 real causes and the drills that fix them.',
    tags: ['golf', 'topping', 'thin shots', 'low point', 'ball striking', 'swing fix'],
    relatedSlugs: ['how-to-fix-a-golf-slice', 'what-is-smash-factor', 'practice-schedule-for-golfers'],
    content: `## What Topping Actually Is

A topped shot happens when the leading edge of the club strikes the middle or top of the ball instead of the bottom. The ball squirts low along the ground with almost no carry. It feels like you "came up" off the ball — and that feeling sends most golfers down the wrong path.

Here is the key idea: topping is a **low-point problem**. Every swing has a point where the clubhead reaches the bottom of its arc. With an iron off the ground, that low point should be slightly in front of the ball, so the club is still descending at impact and catches the ball first, then the turf. When the low point moves behind the ball or upward, the club is already rising by the time it reaches the ball — and it catches it high. That is a top.

## Why You Top It — the 5 Common Causes

**1. Early extension (standing up).** If your hips push toward the ball and you lose your posture on the downswing, your whole swing center rises — and the clubhead rises with it. This is the most common cause of topping among recreational players.

**2. Hanging back on your trail foot.** If your weight stays on your back foot through impact, the low point shifts behind the ball. The club bottoms out too early and is climbing by the time it reaches the ball.

**3. Trying to "lift" or scoop the ball into the air.** The loft on the club is what gets the ball up — you do not have to help it. When you flip your hands and try to scoop, you raise the low point and add the very topping you are trying to avoid.

**4. Ball position too far forward.** If the ball sits too far up in your stance, the club may already be past its low point and traveling upward when it arrives.

**5. Lifting your head or losing posture early.** Pulling up to see the result before you have hit it changes your spine angle and pulls the club up with you.

## A Quick Self-Check

Hit a few shots off a low tee or a clean lie and watch your divots. Solid iron contact leaves a shallow divot **after** the ball. If you take no divot and the ball comes off low, your low point is behind the ball. If your misses are mostly thin and low, this article is for you.

## 3 Drills to Fix It

**The line drill.** Spray a short line of foot spray or draw a chalk line on the mat or turf. Place the ball just behind the line and try to make your divot start on or just in front of the line. This trains your low point to move forward, ahead of the ball.

**The step-through drill.** Hit small, slow shots where you step your trail foot toward the target just after impact. You cannot step through while hanging back, so this drill forces your weight forward and moves your low point ahead of the ball.

**The posture-hold drill.** Make practice swings with your back against a wall or a chair behind your hips. The goal is to keep your trail hip from drifting back into the wall on the downswing — that keeps your spine angle and stops you from standing up out of the shot.

## Mistakes to Avoid

Do not try to fix topping by hitting down harder or swinging easier in isolation — those treat the symptom. Do not move the ball way back in your stance as a permanent fix; that masks the real cause and creates new problems. And do not consciously try to keep your head down so hard that you block your rotation — the goal is to keep your posture, not freeze your body.

## When to Work With a Coach

If you have worked on weight shift and posture and still top the ball regularly, a couple of lessons with a qualified instructor who can watch you in person is worth far more than another bucket alone. Early extension in particular is hard to feel and easy for a coach to spot.

SwingVantage can show you whether your contact and low-point tendencies are improving between sessions — use it as a supplement that tracks your progress, not a replacement for hands-on coaching. Remember that single-camera findings are heuristic estimates that get more reliable as you add data.`,
  },
  {
    slug: 'how-to-fix-a-late-forehand',
    title: 'How to Fix a Late Forehand in Tennis',
    metaTitle: 'How to Fix a Late Forehand | SwingVantage Tennis',
    metaDescription: 'A late forehand robs you of power and control. Learn why you contact the ball behind your body and how to prepare earlier and hit out in front.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'tennis',
    category: 'Technique',
    readingTime: '6 min read',
    excerpt: 'Late contact is usually a preparation and footwork problem, not a swing-speed problem. Here is how to meet the ball out in front again.',
    tags: ['tennis', 'forehand', 'late contact', 'timing', 'footwork', 'technique'],
    relatedSlugs: ['tennis-forehand-technique-basics', 'how-ai-swing-analysis-works'],
    content: `## What a "Late" Forehand Means

A forehand is late when you make contact with the ball behind your ideal contact point — too close to your body, and too far back in your stance. The ideal contact point on a forehand is out in front of your body and to the side, where your arm can extend and your body can rotate into the shot.

When you are late, you lose two things at once: power, because you can no longer use your body rotation and your arm is cramped; and control, because you end up steering the ball with your wrist and arm instead of swinging through it. Late forehands tend to spray, float long, or get jammed into the net.

## Why You Are Hitting It Late

**1. Slow preparation.** The single biggest cause. If your racket takeback does not start until the ball has already bounced on your side, you simply run out of time. Good players begin their unit turn as the ball leaves the opponent's racket.

**2. Watching instead of moving.** Standing flat-footed and admiring the incoming ball costs you the split second you need. Without a split step and first move, you arrive late to the ball.

**3. Poor spacing.** If you let the ball get too close to your body, there is no room to swing out in front — you are forced to make contact late and cramped. Good footwork sets your distance from the ball, not just your position on court.

**4. An oversized backswing.** A loop that is too big or too low takes too long to complete against a fast ball, so the racket is still on its way back when it should be coming forward.

**5. Decision delay.** Hesitating about where to hit eats the same time you need to prepare. Commit early.

## A Quick Self-Check

Have a partner feed you medium-paced balls and freeze at contact. Look at where your racket meets the ball: is it level with or behind your front hip, close to your body? That is late. It should be clearly out in front, with your arm extending. If you feel jammed or "handsy," you are likely late.

## 3 Drills to Fix It

**Racket-back-by-the-bounce.** As you rally, give yourself one cue: complete your turn and takeback before the ball bounces on your side. Saying "bounce... hit" out loud helps you feel how early the preparation needs to be.

**Shadow split-step and turn.** Without a ball, practice the rhythm: split step as the imaginary ball is struck, then immediately turn your shoulders and take the racket back as a unit. Build the habit of moving first, before you think about the swing.

**Contact-point-out-front feed.** Have a partner drop-feed balls and place a target cone where your ideal contact point is — out in front and to the side. Make it a game to strike every ball at that cone, not behind it.

## Mistakes to Avoid

Do not try to fix late contact by swinging faster — that usually makes you later and wilder. Do not take the racket back further; take it back **earlier**. And do not stand still waiting for the ball to come to you; move your feet to set your spacing so the contact point comes to the right place.

## When to Work With a Coach

If you prepare early and still feel late, a coach can check your footwork patterns and recovery between shots, which are hard to self-diagnose. A few sessions of fed-ball work with someone watching your timing can rebuild the habit quickly.

SwingVantage can help you see whether your contact point and preparation are improving over time. Treat its feedback as an honest supplement — single-camera analysis gives heuristic estimates that sharpen as you add more swings — not a substitute for on-court coaching.`,
  },
  {
    slug: 'how-to-stop-rolling-over-in-baseball',
    title: 'How to Stop Rolling Over Pitches in Baseball',
    metaTitle: 'How to Stop Rolling Over Pitches | SwingVantage',
    metaDescription: 'Rolling over leads to weak ground balls to the pull side. Learn why your barrel exits the zone early and the drills that keep you through the ball.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'baseball',
    category: 'Swing Fixes',
    readingTime: '6 min read',
    excerpt: 'Rolling over is a bat-path and direction problem, not a sign you should swing down. Here is what causes those weak grounders and how to fix them.',
    tags: ['baseball', 'rolling over', 'ground balls', 'bat path', 'hitting', 'swing fix'],
    relatedSlugs: ['baseball-exit-velocity-guide', 'how-ai-swing-analysis-works'],
    content: `## What "Rolling Over" Is

Rolling over is when your top hand turns the barrel over too early, so the bat cuts across the ball and you hit a weak ground ball, usually to the pull side. You will see a lot of topspin choppers and rollover grounders to the shortstop or second baseman. It is one of the most common patterns in amateur hitting.

The instinct is to blame your hands or to "stay on top of the ball." But rolling over is really a **bat-path and direction problem**: your barrel is leaving the hitting zone too soon, and your body is pulling off the ball so the barrel never works through it toward your target.

## Why You Roll Over

**1. Pulling off the ball (flying open).** When your front shoulder and head pull toward the pull side early, your barrel follows and exits the zone fast. You end up swinging across the ball instead of through it.

**2. A long, casting path.** If your hands push the barrel away from your body at the start of the swing, the barrel takes a long route and arrives late and across — leading to rollover contact, especially on outer pitches.

**3. Lunging at the ball.** Drifting forward onto a soft front side moves your contact point too far out front, where the barrel is already turning over.

**4. Top-hand dominance.** Letting the top hand take over and roll early closes the barrel before contact. The hands should stay in a palm-up, palm-down relationship through contact, not roll over until well after.

**5. Contact too far out front.** On the pitches you roll over, contact is usually happening too early in front of the plate, where the barrel is on its way back around your body.

## A Quick Self-Check

Track where your outs go for a few games or rounds of batting practice. If most of your weak contact is topspin ground balls to the pull side, you are rolling over. Tee work tells the same story: if your line off the tee dives to the pull side and rolls, your barrel is exiting early.

## 3 Drills to Fix It

**Opposite-field tee.** Set the tee slightly deeper in your stance and hit line drives to the opposite field. You cannot hit the ball the other way while rolling over, so this drill forces you to stay through the ball with the barrel working toward the middle.

**Stay-through-it / hold-the-finish.** Hit soft-toss or tee balls and consciously keep both palms in the palm-up, palm-down position a beat longer through contact, finishing high and extended toward the pitcher rather than wrapping fast around your body.

**Two-tee path drill.** Place a second tee (or a foam roller) just outside and in front of the contact tee. If your barrel is casting or rolling early, you will clip the outer tee. Grooving a path that misses it trains a tighter swing that stays in the zone longer.

## Mistakes to Avoid

Do not try to fix rolling over by "swinging down" or chopping — that steepens your path and kills your power. Do not muscle up to hit it harder; tension makes the top hand roll sooner. And do not move your contact point even further forward — that is where the rollover lives.

## When to Work With a Coach

If you have worked on direction and path and still roll over, a hitting coach can check your lower-half timing and whether you are pulling off the ball — both are hard to feel on your own. In-person eyes on your sequence will speed things up.

SwingVantage can help you see whether your contact and swing direction are trending the right way between sessions. Use it as an honest supplement — single-camera findings are heuristic estimates that improve as you log more swings — not a replacement for a coach.`,
  },
  {
    slug: 'slow-pitch-softball-stop-popping-up',
    title: 'Slow-Pitch Softball: How to Stop Popping Up',
    metaTitle: 'Slow-Pitch Softball: Stop Popping Up | SwingVantage',
    metaDescription: 'Pop-ups in slow-pitch come from a swing too steep for the descending arc. Learn to match your bat path to the pitch and drive line drives instead.',
    publishDate: '2026-06-06',
    displayDate: 'June 6, 2026',
    sport: 'softball',
    category: 'Swing Fixes',
    readingTime: '5 min read',
    excerpt: 'In slow-pitch, pop-ups usually mean your bat path does not match the high, descending arc of the pitch. Here is how to fix it and hit line drives.',
    tags: ['softball', 'slow pitch', 'pop ups', 'bat path', 'hitting', 'swing fix'],
    relatedSlugs: ['softball-bat-path-and-launch-angle', 'how-ai-swing-analysis-works'],
    content: `## Why Slow-Pitch Pop-Ups Happen

In slow-pitch softball the ball arrives on a high, looping arc and is **descending steeply** as it crosses the plate. That changes everything about your swing path. A pop-up happens when the bat meets the bottom half of the ball — the barrel slides under it and sends it straight up instead of out.

Most pop-ups are not bad luck. They come from a swing whose path does not match the steep downward angle of the incoming pitch. Get the match right and those same swings turn into line drives.

## The Common Causes

**1. Too much uppercut.** A big upswing made for a flat, fast pitch will go right under a steeply dropping slow-pitch ball. The steeper the pitch comes down, the more an uppercut misses under it.

**2. Dropping the back shoulder.** Letting your back shoulder dip tilts your swing up and gets the barrel beneath the ball.

**3. Trying to crush it.** Swinging for the fence makes hitters lengthen and lift, which exaggerates the under-the-ball miss. Driving the ball on a line travels farther than popping it up anyway.

**4. Mistiming the arc.** Because the pitch hangs in the air, timing is everything. Starting your swing too early or too late changes where in the descending arc you make contact.

**5. Eyes and head pulling up.** Lifting your head to watch the ball fly tilts your shoulders and pulls the barrel up with it.

## A Quick Self-Check

Watch your contact and your misses. If you are catching the bottom of the ball and sending lazy fly balls and infield pop-ups, your path is too steep for the pitch. Tee work at the height where you actually make contact will show whether your barrel is level through the zone or climbing.

## 3 Drills to Fix It

**Level-through-the-zone tee.** Set the tee at your real contact height and focus on driving the barrel through the back-middle of the ball on a flat, level path. Try to hit hard line drives, not high ones.

**Hit the top half.** Picture striking the top-inside quarter of the ball. Aiming slightly higher on the ball offsets the tendency to slide under it and produces line drives.

**Match the arc in soft toss.** Have a partner toss on a higher, descending arc that mimics slow-pitch, and practice timing your swing so contact happens out front with a level barrel. This rehearses the exact timing the game demands.

## Mistakes to Avoid

Do not swing harder to fix pop-ups — effort usually adds uppercut and lift. Do not consciously chop down on the ball either; the goal is a level path that matches the pitch, not a steep one. And do not change your whole swing for one bad game; check your path and timing first.

## When to Work With a Coach

If you have leveled your path and still pop up, a coach can check your timing against live arc and whether your shoulders are tilting. Slow-pitch timing is subtle and benefits from a second set of eyes. (Fast-pitch hitters pop up for different reasons — often the rise ball and late loading — so make sure the advice matches your game.)

SwingVantage can track whether your bat path and contact are trending toward line drives over time. Treat it as an honest supplement — its single-camera findings are heuristic estimates that improve as you add swings — alongside, not instead of, hands-on coaching.`,
  },
];
