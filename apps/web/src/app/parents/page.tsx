import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SwingIQ for Parents — Safe AI Swing Analysis for Young Athletes',
  description: 'SwingIQ helps parents and coaches support young athletes in golf, tennis, baseball, and softball with AI-powered swing analysis, drill recommendations, and progress tracking.',
  openGraph: {
    title: 'SwingIQ for Parents — Safe AI Swing Analysis for Young Athletes',
    description: 'Help your young athlete improve with AI-powered swing analysis. Safe, private, and designed for athletes of all ages.',
    type: 'website',
  },
};

export default function ParentsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#1a3a2a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Help Your Young Athlete Improve with AI Swing Analysis
          </h1>
          <p className="text-green-200 text-lg mb-8 max-w-2xl mx-auto">
            SwingIQ gives parents and coaches a tool to identify the highest-priority swing improvement,
            suggest sport-specific drills, and track progress — for golf, tennis, baseball, and softball.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors"
          >
            Try SwingIQ Free
          </Link>
        </div>
      </div>

      {/* Safety section */}
      <div className="bg-amber-50 border-y border-amber-200 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-amber-900 mb-3">Youth Safety &amp; Privacy</h2>
          <ul className="space-y-2 text-sm text-amber-800">
            <li>✓ SwingIQ does not share your child&apos;s videos or data publicly</li>
            <li>✓ All video analysis runs locally — videos are not uploaded to external servers by default</li>
            <li>✓ SwingIQ is not directed at children under 13. Accounts for minors require parent/guardian management</li>
            <li>✓ SwingIQ is an improvement tool, not a replacement for qualified coaching or medical advice</li>
            <li>✓ Always supervise young athletes when practicing drills or techniques</li>
          </ul>
        </div>
      </div>

      {/* What it does */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What SwingIQ Does for Young Athletes</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🎯', title: 'Identifies the Top Issue', desc: 'SwingIQ pinpoints the single most impactful swing problem — not a list of 20 things to fix at once.' },
            { icon: '📋', title: 'Sport-Specific Drills', desc: 'Every diagnosis comes with drill recommendations appropriate for the sport: golf, tennis, baseball, or softball.' },
            { icon: '📈', title: 'Tracks Progress', desc: 'Record sessions over time and see which issues are improving, helping athletes stay motivated.' },
          ].map((item) => (
            <div key={item.title} className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is SwingIQ safe for children?', a: 'SwingIQ is designed for athletes of all ages. We recommend parents manage accounts for users under 18 and supervise all practice sessions. SwingIQ does not share your child\'s data publicly and does not direct marketing at minors.' },
              { q: 'Does SwingIQ replace a coach?', a: 'No. SwingIQ is an AI-powered improvement assistant. It helps athletes and parents understand swing patterns and prioritize practice, but it is not a certified coach or instructor. For complex technical coaching, injury concerns, or advanced skill development, we always recommend working with a qualified professional.' },
              { q: 'What sports does SwingIQ support?', a: 'SwingIQ supports golf, tennis, baseball, slow pitch softball, and fast pitch softball — with sport-specific analysis engines for each.' },
              { q: 'Is my child\'s video data private?', a: 'Yes. Video analysis runs locally in the browser when possible. Videos are not shared publicly. See our Privacy Policy for full details.' },
              { q: 'What age range is SwingIQ for?', a: 'SwingIQ can be used by youth athletes (8+) with parent/guardian involvement, through high school, college, recreational adult, and competitive adult players. Accounts for users under 13 must be managed by a parent or guardian.' },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl p-6 shadow-xs">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-16 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Free Today</h2>
        <p className="text-gray-600 mb-6">No account required to try SwingIQ. All data saved locally in the browser.</p>
        <Link href="/dashboard" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
          Analyze My Athlete&apos;s Swing Free
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          By using SwingIQ you agree to our{' '}
          <Link href="/terms" className="underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
