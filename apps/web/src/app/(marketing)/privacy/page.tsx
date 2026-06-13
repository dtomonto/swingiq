import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy | SwingVantage',
  description: 'SwingVantage privacy policy — how we collect, use, and protect your data.',
  alternates: { canonical: '/privacy' },
};

const EFFECTIVE_DATE = 'May 31, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-sm text-primary hover:underline mb-6 block">← Back to SwingVantage</Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective date: {EFFECTIVE_DATE}. Written in plain English to describe how SwingVantage actually handles your data today.</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm text-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p>SwingVantage (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;SwingVantage&rdquo;) provides an AI-powered swing improvement platform for golf, tennis, baseball, and softball. This Privacy Policy explains how we handle information you provide when using SwingVantage.</p>
            <p className="mt-2">We are committed to protecting your privacy. We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> name and email address if you create an account</li>
              <li><strong>Swing and performance data:</strong> videos, launch monitor data, analysis results, session history, and notes you enter</li>
              <li><strong>Profile data:</strong> sport preferences, equipment info, skill level, and goals you provide</li>
              <li><strong>Usage data:</strong> pages visited, features used, and general interaction patterns</li>
            </ul>
            <p className="mt-3"><strong>Local storage:</strong> Before you connect an account, all your data is stored locally in your browser. It is not transmitted to our servers until you sign in and sync.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide swing analysis, diagnostic results, and drill recommendations</li>
              <li>To show your progress over time</li>
              <li>To improve SwingVantage&apos;s AI models and diagnostic engines</li>
              <li>To communicate important product or account updates</li>
            </ul>
            <p className="mt-3">We do not use your swing data for advertising. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Children&apos;s Privacy</h2>
            <p>SwingVantage is not directed at children under 13. We do not knowingly collect personal information from children under 13. If a parent or guardian believes their child has provided personal information, contact us immediately at the address below and we will delete it promptly.</p>
            <p className="mt-2">For users under 18, we recommend parental involvement and supervision when uploading videos or creating accounts.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Video Privacy</h2>
            <p>Swing videos you upload are used only for your personal analysis. Videos are not shared publicly by default. We do not use your video content to train AI models without explicit consent.</p>
            <p className="mt-2">You can delete your videos and analysis data at any time from Settings → Data Management.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Third-Party Services</h2>
            <p>SwingVantage may use third-party services including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cloud database &amp; authentication:</strong> securely stores your account, profile, and training data</li>
              <li><strong>Cloud hosting &amp; infrastructure:</strong> runs the app reliably and securely</li>
              <li><strong>Third-party AI providers:</strong> AI coaching narrative generation (only pre-computed stats are sent — no raw personal data)</li>
              <li><strong>Analytics:</strong> aggregate usage analytics to improve the product</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Export your data (Settings → Backup &amp; Restore)</li>
              <li>Delete your data and account</li>
              <li>Correct inaccurate information</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Data Deletion &amp; Requests</h2>
            <p>You can delete your data at any time from <strong>Settings → Data Management</strong>. Because pre-account data is stored only in your browser, clearing your browser storage also removes it. To request access to, or deletion of, any data associated with you, email{' '}
              <a href={`mailto:${siteConfig.privacyEmail}`} className="text-primary font-semibold hover:underline">{siteConfig.privacyEmail}</a> and we will respond promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
            <p>Questions about this policy? Email{' '}
              <a href={`mailto:${siteConfig.privacyEmail}`} className="text-primary font-semibold hover:underline">{siteConfig.privacyEmail}</a>.</p>
            <p className="mt-2 text-xs text-muted-foreground italic">This policy describes our current practices in plain English. We have not certified compliance with specific regulatory frameworks (such as GDPR, CCPA, or COPPA), and we recommend independent legal review before scaling or collecting data from users in regulated jurisdictions.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
