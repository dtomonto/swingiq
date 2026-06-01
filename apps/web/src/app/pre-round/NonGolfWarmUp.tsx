'use client';

// ============================================================
// SwingIQ — Non-Golf Pre-Game Warm-Up
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
  mobility: 'bg-blue-100 text-blue-700',
  footwork: 'bg-green-100 text-green-700',
  mechanics: 'bg-purple-100 text-purple-700',
  hitting: 'bg-orange-100 text-orange-700',
  stroke: 'bg-yellow-100 text-yellow-700',
  serve: 'bg-red-100 text-red-700',
  mental: 'bg-pink-100 text-pink-700',
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
          <h1 className="text-2xl font-bold text-gray-900">
            {sportEmoji} Pre-Game Warm-Up
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Personalized for: <span className="font-medium text-gray-700">{sportName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">{progress}%</p>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
      </div>

      {/* Pre-game strategy (agent layer) — complements the physical warm-up */}
      <PreGameStrategyCard />

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Routine header */}
      <Card className="border-green-200 bg-green-50">
        <CardBody className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-700">{routine.total_minutes}</p>
            <p className="text-xs text-green-600">minutes total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-700">{routine.exercises.length}</p>
            <p className="text-xs text-green-600">exercises</p>
          </div>
          <div>
            <p className="text-sm font-bold text-green-700 leading-tight">
              {routine.key_thought.length > 28 ? routine.key_thought.slice(0, 28) + '…' : routine.key_thought}
            </p>
            <p className="text-xs text-green-600">key thought</p>
          </div>
        </CardBody>
      </Card>

      {/* Key thought */}
      <Card className="border-l-4 border-l-green-500">
        <CardBody>
          <p className="text-xs text-gray-500 mb-1">Key Thought for Today</p>
          <p className="font-bold text-gray-900">&ldquo;{routine.key_thought}&rdquo;</p>
        </CardBody>
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        {routine.exercises.map((ex) => (
          <Card key={ex.id} className={completed.has(ex.id) ? 'bg-green-50 border-green-200' : ''}>
            <CardBody>
              <div className="flex items-start gap-3">
                <button onClick={() => toggle(ex.id)} className="mt-0.5 flex-shrink-0">
                  {completed.has(ex.id)
                    ? <CheckCircle size={22} className="text-green-500" />
                    : <Circle size={22} className="text-gray-300 hover:text-gray-400" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm ${completed.has(ex.id) ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {ex.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ex.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ex.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{ex.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={11} /> {ex.duration_seconds}s</span>
                    {ex.reps && <span>× {ex.reps} reps</span>}
                  </div>
                  <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 italic">
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
          <p className="text-xs text-green-300 mb-1">On-Game Reminder</p>
          <p className="font-semibold text-green-100">{routine.on_court_reminder}</p>
        </CardBody>
      </Card>

      {progress === 100 && (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">🎯</p>
          <p className="font-bold text-green-600 text-lg">Warm-up complete — go play your best game!</p>
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
