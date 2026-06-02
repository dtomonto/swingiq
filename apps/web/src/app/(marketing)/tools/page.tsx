import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

export const metadata = buildMetadata({
  title: 'Free Swing Tools — Quizzes, Drill & Practice Generators',
  description:
    'Free SwingIQ tools: slice fixer, multi-sport swing mistake quiz, at-home drill generator, practice plan builder, lesson savings calculator, and more.',
  path: '/tools',
});

const TOOLS = [
  { href: '/tools/golf-slice-fixer', emoji: '⛳', name: 'Golf Slice Fixer', desc: 'Diagnose your slice pattern and get drills + a 7-day plan.' },
  { href: '/tools/swing-mistake-quiz', emoji: '🏏', name: 'Swing Mistake Quiz', desc: 'Find your likely top issue across 5 sports.' },
  { href: '/tools/at-home-swing-drill-generator', emoji: '🏠', name: 'At-Home Drill Generator', desc: 'Drills tailored to your space, gear, and time.' },
  { href: '/tools/practice-plan-generator', emoji: '📅', name: 'Practice Plan Generator', desc: 'A focused 7-day (and 30-day) plan with retests.' },
  { href: '/tools/private-lesson-savings-calculator', emoji: '💰', name: 'Lesson Savings Calculator', desc: 'Estimate lesson spend and where SwingIQ can help.' },
  { href: '/tools/slow-pitch-line-drive-guide', emoji: '🥎', name: 'Slow-Pitch Line-Drive Guide', desc: 'Fix pop-ups and grounders in slow-pitch softball.' },
  { href: '/tools/equipment-diagnostic', emoji: '🔧', name: 'Equipment Diagnostic', desc: 'Spot possible equipment fit-risk flags to validate.' },
];

export default function ToolsIndex() {
  return (
    <main className="min-h-screen bg-card">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Free Tools', path: '/tools' }]} className="mb-5" />
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Free Swing Tools</h1>
        <p className="mt-2 text-muted-foreground">
          Quick, free tools to diagnose your swing and build a plan. No account required.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="block rounded-2xl border border-border p-5 transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <div className="text-2xl">{t.emoji}</div>
              <h2 className="mt-2 font-semibold text-foreground">{t.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
