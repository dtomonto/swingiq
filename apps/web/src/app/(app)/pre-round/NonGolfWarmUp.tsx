'use client';

// ============================================================
// SwingVantage — Non-Golf Pre-Game Warm-Up
// Sport-specific warm-up checklists for tennis, baseball,
// and softball. Golf uses the existing PreRoundPage.
// ============================================================

import { useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { useSport } from '@/contexts/SportContext';
import type { SportId } from '@swingiq/core';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PreGameStrategyCard } from '@/components/agents/PreGameStrategyCard';

interface WarmUpExercise {
  id: string;
  title: string;
  description: string;
  duration_seconds: number;
  reps?: number;
  category: string;
  coaching_cue: string;
}

interface WarmUpRoutine {
  total_minutes: number;
  key_thought: string;
  on_court_reminder: string;
  exercises: WarmUpExercise[];
}

const WARM_UP_ROUTINES: Record<Exclude<SportId, 'golf'>, WarmUpRoutine> = {
  tennis: {
    total_minutes: 15,
    key_thought: 'See the ball early, move your feet.',
    on_court_reminder: 'Split step before every shot — get in position before you swing.',
    exercises: [
      { id: 't1', title: 'Arm Circles', description: 'Forward and backward arm circles to loosen shoulder joints', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Full range of motion, relax the arm' },
      { id: 't2', title: 'Wrist Rotations', description: 'Rotate wrists in both directions to warm up the racquet-side arm', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Loose grip, circular motion' },
      { id: 't3', title: 'Hip Circles', description: 'Hands on hips, make wide circles with your hips', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Keep feet planted, maximize hip range' },
      { id: 't4', title: 'Lateral Shuffle', description: 'Side-to-side shuffles along the baseline with split-step stops', duration_seconds: 60, category: 'footwork', coaching_cue: 'Stay on your toes, land with a split step' },
      { id: 't5', title: 'Shadow Forehand Swings', description: 'Slow-motion forehand swings focusing on unit turn and contact point', duration_seconds: 60, reps: 15, category: 'stroke', coaching_cue: 'Lead with the shoulder, contact out front' },
      { id: 't6', title: 'Shadow Backhand Swings', description: 'Slow-motion backhand swings (one or two handed)', duration_seconds: 60, reps: 15, category: 'stroke', coaching_cue: 'Turn the hips, keep the head still at contact' },
      { id: 't7', title: 'Mini-Rally from Service Box', description: 'Short cross-court mini-rally from the service box to warm up timing', duration_seconds: 120, category: 'hitting', coaching_cue: 'Controlled pace, focus on contact consistency' },
      { id: 't8', title: 'Serve Warm-Up (Half Speed)', description: '5–8 serves at half speed focusing on trophy position and contact', duration_seconds: 60, reps: 8, category: 'serve', coaching_cue: 'Smooth toss, reach up to meet the ball' },
    ],
  },
  pickleball: {
    total_minutes: 12,
    key_thought: 'Soft hands, compact stroke, win the kitchen.',
    on_court_reminder: 'Get to the kitchen line and split-step — be patient, wait for the ball to pop up.',
    exercises: [
      { id: 'pb1', title: 'Arm & Wrist Circles', description: 'Loosen the paddle-arm shoulder and wrist with controlled circles', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Loose grip, full range of motion' },
      { id: 'pb2', title: 'Lateral Shuffle + Split Step', description: 'Shuffle along the baseline, landing a split step on each stop', duration_seconds: 60, category: 'footwork', coaching_cue: 'Stay low on the balls of your feet — land loaded' },
      { id: 'pb3', title: 'Get-to-the-Kitchen Steps', description: 'Practice advancing from the baseline to the NVZ line and stopping balanced', duration_seconds: 60, reps: 6, category: 'footwork', coaching_cue: 'Arrive behind the line on balance — no momentum over it' },
      { id: 'pb4', title: 'Shadow Dink Reps', description: 'Slow-motion cross-court dinks focusing on a stable, slightly open paddle face', duration_seconds: 60, reps: 15, category: 'stroke', coaching_cue: 'Lift with the legs, quiet wrist, compact motion' },
      { id: 'pb5', title: 'Cross-Court Dink Warm-Up', description: 'Live dink rally at the kitchen, keeping the ball low and unattackable', duration_seconds: 120, category: 'hitting', coaching_cue: 'Net-skimmers — soft and low, not up' },
      { id: 'pb6', title: 'Third-Shot Drop Reps', description: '8–10 drops from the baseline focusing on a soft arc into the kitchen', duration_seconds: 90, reps: 10, category: 'hitting', coaching_cue: 'Arc peaks on your side, lands soft — drive with the legs' },
      { id: 'pb7', title: 'Serve & Return Warm-Up', description: '5–8 serves and returns at controlled pace', duration_seconds: 60, reps: 8, category: 'serve', coaching_cue: 'Deep, consistent — contact out front' },
    ],
  },
  padel: {
    total_minutes: 14,
    key_thought: 'Control the bandeja, read the glass, hold the net.',
    on_court_reminder: 'Give balls off the wall space, and default to control on overheads — bandeja before smash.',
    exercises: [
      { id: 'pd1', title: 'Shoulder & Wrist Mobility', description: 'Arm circles and wrist rotations to prepare for overheads', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Full range, relaxed — no pain on overheads' },
      { id: 'pd2', title: 'Lateral & Backpedal Footwork', description: 'Shuffle side to side, then backpedal as if tracking a lob to the glass', duration_seconds: 60, category: 'footwork', coaching_cue: 'Turn and run for lobs — never backpedal flat-footed' },
      { id: 'pd3', title: 'Split Step at the Net', description: 'Practice the split step on a partner’s contact while holding the net', duration_seconds: 45, reps: 8, category: 'footwork', coaching_cue: 'Land loaded as they hit — ready to volley or chase the lob' },
      { id: 'pd4', title: 'Shadow Bandeja Reps', description: 'Slow side-on overhead reps grooving the controlled bandeja (not a smash)', duration_seconds: 60, reps: 12, category: 'stroke', coaching_cue: 'Turn sideways, contact out front, finish low and out' },
      { id: 'pd5', title: 'Net Volley Warm-Up', description: 'Block volleys at the net, placing them deep with a firm, stable face', duration_seconds: 90, category: 'hitting', coaching_cue: 'Short and firm — guide it deep, recover the paddle' },
      { id: 'pd6', title: 'Back-Glass Reads', description: 'Have a partner feed deep; track the ball into the wall and play it with space', duration_seconds: 90, reps: 8, category: 'hitting', coaching_cue: 'Let the wall bring it back — never crowd the corner' },
      { id: 'pd7', title: 'Lob & Recover Reps', description: 'Hit deep lobs and advance to the net with an imaginary partner', duration_seconds: 60, reps: 8, category: 'hitting', coaching_cue: 'High and deep, then move up together' },
    ],
  },
  baseball: {
    total_minutes: 15,
    key_thought: 'Stay back, drive through contact.',
    on_court_reminder: 'Load early, commit to a pitch — trust your hands.',
    exercises: [
      { id: 'b1', title: 'Arm Circles & Shoulder Rotation', description: 'Large arm circles to loosen shoulder and rotator cuff', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Full circles, relax the arm' },
      { id: 'b2', title: 'Hip Flexor Stretch', description: 'Lunge position hold to open the hip flexors for stride mechanics', duration_seconds: 30, reps: 5, category: 'mobility', coaching_cue: 'Keep the back straight, feel the stretch in the front hip' },
      { id: 'b3', title: 'Torso Rotations with Bat', description: 'Hold the bat across the shoulders and rotate side to side', duration_seconds: 30, reps: 15, category: 'mobility', coaching_cue: 'Rotate the hips, not just the shoulders' },
      { id: 'b4', title: 'Stance & Load Practice', description: 'Practice your stance and load position without swinging — feel the weight shift', duration_seconds: 60, reps: 10, category: 'mechanics', coaching_cue: 'Small comfortable stride, weight loaded on back hip' },
      { id: 'b5', title: 'Slow-Motion Swings (No Ball)', description: 'Full swing at 50% speed focusing on hip-shoulder separation', duration_seconds: 60, reps: 10, category: 'mechanics', coaching_cue: 'Hips first, hands follow — feel the separation' },
      { id: 'b6', title: 'Tee Work — Contact Point', description: 'Hit 10 balls off the tee focusing on ideal contact point (out front)', duration_seconds: 120, reps: 10, category: 'hitting', coaching_cue: 'See the barrel make contact, extend through the ball' },
      { id: 'b7', title: 'Soft Toss (5–10 pitches)', description: 'Soft toss from the side at comfortable pace to groove timing', duration_seconds: 90, reps: 10, category: 'hitting', coaching_cue: 'Stay back, wait for the pitch to travel' },
    ],
  },
  softball_slow: {
    total_minutes: 12,
    key_thought: 'Read the arc, let the ball come to you.',
    on_court_reminder: 'The arc pitch drops — wait longer than you think, then drive it.',
    exercises: [
      { id: 'sp1', title: 'Arm Circles', description: 'Loosen shoulder and rotator cuff with large arm circles', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Full range, relaxed arm' },
      { id: 'sp2', title: 'Wrist Flexion & Extension', description: 'Extend and flex both wrists to warm up the swing-side arm', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Slow and controlled' },
      { id: 'sp3', title: 'Hip Circles', description: 'Hands on hips, make wide circular motions to loosen the hips', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Maximize range, slow rotation' },
      { id: 'sp4', title: 'Load & Hip Drive Practice', description: 'Practice load position and explosive hip rotation with bat at contact zone', duration_seconds: 60, reps: 10, category: 'mechanics', coaching_cue: 'Rotate the hips before the hands — feel the power sequence' },
      { id: 'sp5', title: 'Arc Pitch Visualization', description: 'Visualize tracking a high-arc pitch coming down — imagine its full flight path', duration_seconds: 30, category: 'mental', coaching_cue: 'Watch the ball all the way to the contact zone' },
      { id: 'sp6', title: 'Tee Work — High Contact', description: 'Set the tee above waist height and drive balls focusing on driving down and through', duration_seconds: 90, reps: 10, category: 'hitting', coaching_cue: 'Stay on top of the ball, drive through level contact' },
      { id: 'sp7', title: 'Soft Arc Tosses', description: 'Have a partner toss in a slow arc — focus on timing and pulling the trigger at the right moment', duration_seconds: 90, reps: 8, category: 'hitting', coaching_cue: 'Be patient — wait for the ball to drop to the contact zone' },
    ],
  },
  softball_fast: {
    total_minutes: 15,
    key_thought: 'Quick load, compact path, trust your hands.',
    on_court_reminder: 'The ball rises — keep your weight back and your path through the zone.',
    exercises: [
      { id: 'fp1', title: 'Arm Circles & Shoulder Warm-Up', description: 'Forward and backward arm circles, then shoulder crosses', duration_seconds: 30, reps: 10, category: 'mobility', coaching_cue: 'Full range, no pain — stop if discomfort' },
      { id: 'fp2', title: 'Wrist Snaps', description: 'Snap the wrists quickly in front of you to warm up the swing-side hand', duration_seconds: 20, reps: 15, category: 'mobility', coaching_cue: 'Snap through — like cracking a whip' },
      { id: 'fp3', title: 'Hip Flexor & Stride Stretch', description: 'Lunge forward and hold to open the stride hip', duration_seconds: 30, reps: 5, category: 'mobility', coaching_cue: 'Drive the knee forward, feel the front hip opening' },
      { id: 'fp4', title: 'Quick Load Reps', description: 'Practice your load and stride in rapid succession — 10 quick reps', duration_seconds: 30, reps: 10, category: 'mechanics', coaching_cue: 'Quick, small stride — not a big step' },
      { id: 'fp5', title: 'Compact Swing Reps (No Ball)', description: 'Slow swings emphasizing the compact, direct-to-contact path against a rising pitch', duration_seconds: 60, reps: 10, category: 'mechanics', coaching_cue: 'Stay in the zone longer — keep the barrel level' },
      { id: 'fp6', title: 'Tee Work — Low & Away', description: 'Set the tee low and away, drive the ball the other way to practice staying back', duration_seconds: 90, reps: 8, category: 'hitting', coaching_cue: 'Drive through the ball, extension to the opposite field' },
      { id: 'fp7', title: 'Front Toss (Medium Speed)', description: 'Front toss from ~10 feet, focus on reading and timing', duration_seconds: 90, reps: 10, category: 'hitting', coaching_cue: 'Read the pitch early, stay back, keep the path compact' },
      { id: 'fp8', title: 'Mental Focus: Rise Ball Simulation', description: 'Visualize a rise ball coming in at the knees — practice keeping your swing path from dropping', duration_seconds: 30, category: 'mental', coaching_cue: 'Keep the barrel up — fight the rise ball with the path' },
    ],
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  mobility: 'bg-accent-secondary/15 text-accent-secondary',
  footwork: 'bg-primary/15 text-primary',
  mechanics: 'bg-accent-secondary/15 text-accent-secondary',
  hitting: 'bg-warning/15 text-warning',
  stroke: 'bg-warning/15 text-warning',
  serve: 'bg-error/15 text-error',
  mental: 'bg-accent-secondary/15 text-accent-secondary',
};

export function NonGolfWarmUp() {
  const { activeSport, isGolf, sportEmoji, sportName } = useSport();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  if (isGolf) return null;

  const sport = activeSport as Exclude<SportId, 'golf'>;
  const routine = WARM_UP_ROUTINES[sport];

  const toggle = (id: string) =>
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const progress = routine.exercises.length
    ? Math.round((completed.size / routine.exercises.length) * 100)
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} Pre-Game Warm-Up
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Personalized for: <span className="font-medium text-foreground">{sportName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{progress}%</p>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Pre-game strategy (agent layer) — complements the physical warm-up */}
      <PreGameStrategyCard />

      {/* Progress bar */}
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Routine header */}
      <Card className="border-primary/30 bg-primary/10">
        <CardBody className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{routine.total_minutes}</p>
            <p className="text-xs text-primary">minutes total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{routine.exercises.length}</p>
            <p className="text-xs text-primary">exercises</p>
          </div>
          <div>
            <p className="text-sm font-bold text-primary leading-tight">
              {routine.key_thought.length > 28 ? routine.key_thought.slice(0, 28) + '…' : routine.key_thought}
            </p>
            <p className="text-xs text-primary">key thought</p>
          </div>
        </CardBody>
      </Card>

      {/* Key thought */}
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <p className="text-xs text-muted-foreground mb-1">Key Thought for Today</p>
          <p className="font-bold text-foreground">&ldquo;{routine.key_thought}&rdquo;</p>
        </CardBody>
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        {routine.exercises.map((ex) => (
          <Card key={ex.id} className={completed.has(ex.id) ? 'bg-primary/10 border-primary/30' : ''}>
            <CardBody>
              <div className="flex items-start gap-3">
                <button onClick={() => toggle(ex.id)} className="mt-0.5 shrink-0">
                  {completed.has(ex.id)
                    ? <CheckCircle size={22} className="text-primary" />
                    : <Circle size={22} className="text-muted-foreground hover:text-muted-foreground" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm ${completed.has(ex.id) ? 'text-primary line-through' : 'text-foreground'}`}>
                      {ex.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-muted text-muted-foreground'}`}>
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={11} /> {ex.duration_seconds}s</span>
                    {ex.reps && <span>× {ex.reps} reps</span>}
                  </div>
                  <p className="text-xs text-accent-secondary bg-accent-secondary/10 px-2 py-1 rounded-sm mt-2 italic">
                    &ldquo;{ex.coaching_cue}&rdquo;
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* On-game reminder */}
      <Card className="border-golf-dark bg-golf-dark text-white">
        <CardBody>
          <p className="text-xs text-primary-foreground/80 mb-1">On-Game Reminder</p>
          <p className="font-semibold text-primary-foreground/90">{routine.on_court_reminder}</p>
        </CardBody>
      </Card>

      {progress === 100 && (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-bold text-primary text-lg">Warm-up complete — go play your best game!</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/training" className="flex-1">
          <Button variant="outline" className="w-full">View Training Plan</Button>
        </Link>
        <Link href="/video" className="flex-1">
          <Button className="w-full">Analyze Video After</Button>
        </Link>
      </div>
    </div>
  );
}
