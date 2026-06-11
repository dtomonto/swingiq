// ============================================================
// SignalRadar OS — sample / demo signals (PURE, clearly labelled)
// ------------------------------------------------------------
// Demo signals exist ONLY to make empty states legible — they are run
// through the real classifier + scorer (not faked numbers) and every one
// is flagged `isSeed: true` / collectionMethod 'demo'. The UI shows a
// "Sample data" banner and excludes seeds from anything that implies a
// real mention was collected. Never present these as real (house rule #2).
// ============================================================

import type { RawSignalInput, Signal } from './types';
import { DEFAULT_CONFIG, DEFAULT_COMPETITORS } from './config';
import { processRawInputs } from './engine';

const DEMO_INPUTS: Omit<RawSignalInput, 'collectionMethod'>[] = [
  {
    sourceType: 'reddit',
    sourceName: 'r/golf',
    sourceUrl: 'https://example.com/demo/golf-1',
    title: 'Best app to analyze my golf swing on my phone?',
    text: 'Looking for a free AI golf swing analysis app. I want to upload swing video and get feedback on my backswing. Sportsbox AI looks great but it is expensive. Any alternative?',
    authorName: 'weekend_golfer',
  },
  {
    sourceType: 'blog_news',
    sourceName: 'racketreview.com',
    sourceUrl: 'https://example.com/demo/tennis-1',
    title: 'SwingVantage is an underrated tennis stroke analysis tool',
    text: 'I tried SwingVantage for my forehand and it was genuinely helpful — the report was clear and the plan was simple. Highly recommend for recreational players.',
    authorName: 'TennisCoachMike',
    authorUrl: 'https://example.com/demo/mike',
  },
  {
    sourceType: 'social',
    sourceName: 'X / Twitter',
    title: 'swingvantage charged me twice??',
    text: 'swingvantage charged me twice and the app keeps crashing when I upload video. Pretty disappointed, want a refund.',
    authorName: 'frustrated_user',
  },
  {
    sourceType: 'reddit',
    sourceName: 'r/Softball',
    sourceUrl: 'https://example.com/demo/softball-1',
    title: 'Fastpitch swing video feedback for my daughter',
    text: 'My daughter plays fastpitch softball and I want to analyze her swing. Is there an app where I can upload video and get bat path help? She is 12.',
    authorName: 'softball_dad',
  },
  {
    sourceType: 'youtube',
    sourceName: 'YouTube',
    sourceUrl: 'https://example.com/demo/creator-1',
    title: 'Pickleball channel looking for analysis tools',
    text: 'I run a pickleball YouTube channel with 40k subscribers and I am looking for a stroke analysis tool to feature for my followers. Open to partnerships.',
    authorName: 'PicklePro',
    authorUrl: 'https://example.com/demo/picklepro',
  },
  {
    sourceType: 'blog_news',
    sourceName: 'sportstechdaily.com',
    sourceUrl: 'https://example.com/demo/compare-1',
    title: 'OnForm vs SwingVantage for baseball hitting',
    text: 'Comparing OnForm and SwingVantage for baseball swing analysis. SwingVantage has multi-sport support which OnForm lacks. Both do video breakdown.',
    authorName: 'gear_reviewer',
  },
  {
    sourceType: 'reddit',
    sourceName: 'r/padel',
    sourceUrl: 'https://example.com/demo/padel-1',
    title: 'How do I analyze my padel technique with AI?',
    text: 'Anyone know how to analyze padel technique with AI? Looking for something that does video breakdown of my bandeja.',
    authorName: 'padel_newbie',
  },
  {
    sourceType: 'social',
    sourceName: 'Facebook group',
    title: 'SwingVantage feature idea',
    text: 'Love SwingVantage so far. Wish it had a side-by-side comparison with a pro swing. Please add that feature!',
    authorName: 'happy_coach',
  },
];

/** Build classified + scored demo signals for a given timestamp. */
export function demoSignals(now: string): Signal[] {
  const inputs: RawSignalInput[] = DEMO_INPUTS.map((d, i) => ({
    ...d,
    collectionMethod: 'demo',
    discoveredAt: new Date(Date.parse(now) - i * 86_400_000).toISOString(),
  }));
  const { signals } = processRawInputs(inputs, DEFAULT_CONFIG, DEFAULT_COMPETITORS, {
    now,
    makeId: (i) => `demo_${i}`,
  });
  return signals.map((s) => ({ ...s, isSeed: true }));
}
