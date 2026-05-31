import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | SwingIQ — Free AI Swing Analysis',
  description: 'SwingIQ is free to use. Analyze your swing, get personalized drills, and track progress at no cost.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#1a3a2a] text-white py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Honest Pricing</h1>
        <p className="text-green-200 text-lg">Start free. No credit card required.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">

          {/* Free */}
          <div className="border-2 border-green-500 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-green-600 font-bold text-sm uppercase tracking-wide mb-2">Free</div>
            <div className="text-5xl font-bold text-gray-900 mb-1">$0</div>
            <div className="text-gray-500 text-sm mb-6">Forever free</div>
            <ul className="text-sm text-gray-700 space-y-2 text-left mb-8">
              {[
                'All 5 sports (golf, tennis, baseball, softball)',
                'AI swing analysis',
                'Diagnostic engine — priority issue detection',
                'Drill recommendations with YouTube search links',
                'Session history',
                'Progress tracking',
                'Data backup & restore',
                'Golf bag loft autofill',
                'Professional reference library (browse)',
                'Side-by-side swing comparison',
                'Local data storage (no account needed)',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-center">
              Start Free
            </Link>
          </div>

          {/* Pro — Coming Soon */}
          <div className="border border-gray-200 rounded-2xl p-8 text-center bg-gray-50">
            <div className="text-gray-400 font-bold text-sm uppercase tracking-wide mb-2">Pro</div>
            <div className="text-3xl font-bold text-gray-400 mb-1">Coming Soon</div>
            <div className="text-gray-400 text-sm mb-6">Planned for future release</div>
            <ul className="text-sm text-gray-500 space-y-2 text-left mb-8">
              {[
                'Everything in Free',
                'Cloud sync across devices',
                'Video storage & history',
                'OCR/image data extraction',
                'Verified professional swing library',
                'AI narrative coaching (unlimited)',
                'PDF reports',
                'Coach sharing',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5 flex-shrink-0">○</span>
                  {f}
                </li>
              ))}
            </ul>
            <button disabled className="w-full bg-gray-200 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-12">
          Have questions? Contact us at <strong>[Add contact email]</strong>.
        </p>
      </div>
    </div>
  );
}
