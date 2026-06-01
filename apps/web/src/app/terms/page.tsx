import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms of Service | SwingIQ',
  description: 'SwingIQ terms of service — what you can expect from us and what we ask of you.',
  alternates: { canonical: '/terms' },
};

const EFFECTIVE_DATE = 'May 31, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-sm text-primary hover:underline mb-6 block">← Back to SwingIQ</Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective date: {EFFECTIVE_DATE}. Written in plain English to describe how SwingIQ works today.</p>

        <div className="space-y-8 text-sm text-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By using SwingIQ, you agree to these Terms of Service. If you do not agree, please do not use SwingIQ.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. What SwingIQ Is</h2>
            <p>SwingIQ is an AI-powered swing analysis tool for educational and improvement purposes. It is <strong>not</strong> a substitute for:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Certified sports coaching or instruction</li>
              <li>Medical or physical therapy advice</li>
              <li>Professional athletic training supervision</li>
              <li>Biomechanical laboratory measurement</li>
            </ul>
            <p className="mt-3">SwingIQ provides heuristic analysis and educational information. Results are estimates and should not be treated as definitive measurements. SwingIQ does not guarantee any specific athletic outcome, score improvement, or competitive result.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. AI Disclaimer</h2>
            <p>SwingIQ uses artificial intelligence and deterministic engines to analyze swing patterns. AI outputs may be inaccurate, incomplete, or not applicable to your specific situation. Always exercise independent judgment and consult qualified professionals for safety-critical decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for your own physical safety when practicing any drills or techniques suggested by SwingIQ</li>
              <li>Minors (under 18) should train under adult supervision</li>
              <li>Do not rely on SwingIQ as your only source of coaching if injury risk is a concern</li>
              <li>Do not upload videos of others without their consent</li>
              <li>Do not upload videos of minors without parent/guardian consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Intellectual Property</h2>
            <p>SwingIQ&apos;s software, AI prompts, diagnostic logic, benchmarks, and content are proprietary. You may not copy, reverse-engineer, or redistribute SwingIQ&apos;s systems without written permission. See our LICENSE file for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
            <p>SwingIQ is provided &ldquo;as is&rdquo; without warranty. To the maximum extent permitted by law, SwingIQ is not liable for injury, loss, or damage arising from use of the platform or reliance on its analysis results.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
            <p>Questions about these terms? Email{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary font-semibold hover:underline">{siteConfig.contactEmail}</a>.</p>
            <p className="mt-2 text-xs text-muted-foreground italic">These terms describe how SwingIQ works today in plain English. We recommend independent legal review before scaling commercially.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
