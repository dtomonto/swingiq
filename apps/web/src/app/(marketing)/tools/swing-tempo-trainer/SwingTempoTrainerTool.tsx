'use client';

import Link from 'next/link';
import { ToolShell } from '@/components/tools/ToolShell';
import { TempoSyncTrainer } from '@/components/tempo-sync/TempoSyncTrainer';

const FAQ = [
  {
    q: 'What is swing tempo?',
    a: 'Tempo is the ratio of how long your backswing takes to how long your downswing takes. Across skill levels the rhythm that repeats best is remarkably consistent — a smooth 3:1 for the full swing (roughly 2:1 for putting). Tempo Sync plays that rhythm so you can feel it and groove it.',
  },
  {
    q: 'Why three tones instead of a normal metronome?',
    a: 'A swing has three moments that matter: the start (Set), the top (Top), and the strike (Strike). A single steady click can’t mark a 3:1 rhythm — three cues spaced to the ratio do. The strike tone is higher and a touch louder so you can time your impact to it.',
  },
  {
    q: 'How do I practice with it?',
    a: 'Pick a preset (start with Smooth or Balanced), turn on the count-in, and make slow rehearsal swings matching Set → Top → Strike. When it feels natural, nudge the speed up. The goal is the same rhythm at every speed, not the fastest swing.',
  },
  {
    q: 'Is my data stored?',
    a: 'No. The trainer runs entirely in your browser — there’s no recording, no upload, and no account required.',
  },
];

export function SwingTempoTrainerTool() {
  return (
    <ToolShell
      title="Swing Tempo Trainer"
      subtitle="Feel the classic 3:1 swing rhythm. Set → Top → Strike, in time, with a pendulum that swings with you."
      slug="swing-tempo-trainer"
    >
      <TempoSyncTrainer variant="page" />

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">How to use it</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li><span className="font-medium text-foreground">Start slow.</span> Pick the Smooth or Balanced preset and leave the count-in on.</li>
          <li><span className="font-medium text-foreground">Match the cues.</span> Begin your takeaway on “Set”, reach the top on “Top”, and strike on “Strike”.</li>
          <li><span className="font-medium text-foreground">Keep the ratio.</span> As you speed up with the slider, hold the same 3:1 feel — that’s the whole skill.</li>
          <li><span className="font-medium text-foreground">Sync to your own swing.</span> Run a <Link className="text-primary hover:underline" href="/swinglab">Motion Lab analysis</Link> and the trainer can match your real speed while fixing your ratio.</li>
        </ol>

        <h2 className="pt-2 text-lg font-semibold text-foreground">Questions</h2>
        <dl className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-border bg-card p-4">
              <dt className="font-medium text-foreground">{item.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </ToolShell>
  );
}
