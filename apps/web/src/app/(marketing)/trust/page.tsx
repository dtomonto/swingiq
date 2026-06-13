import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Trash2, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Trust & Safety | SwingVantage',
  description:
    'How SwingVantage protects your privacy, keeps your swing data safe, and sets honest expectations about what AI can and cannot do.',
  openGraph: {
    title: 'Trust & Safety | SwingVantage',
    description:
      'SwingVantage is privacy-focused and built with honest AI. Learn how your data is handled, kept private to your account, and what protections are in place.',
    type: 'website',
    url: 'https://swingvantage.com/trust',
  },
  alternates: { canonical: '/trust' },
};

const TRUST_SECTIONS = [
  {
    icon: Lock,
    title: 'Your data is private to you',
    body: "When you sign in, your profiles, sessions, and swing analyses are saved to your own private account and synced across your devices, so you never lose your progress. If you use SwingVantage without an account, that same data simply stays on your device. Either way it is yours alone — we never sell it, and you can export or delete everything at any time.",
  },
  {
    icon: Eye,
    title: 'Video privacy',
    body: "When you upload a swing video, it is analyzed in your browser. Videos are not transmitted to external servers by default. We do not share your video content publicly, and we do not use your footage to train AI models without your explicit consent.",
  },
  {
    icon: Shield,
    title: 'Export and portability',
    body: "You own your data. You can export everything SwingVantage knows about you as a single downloadable file at any time from Settings → Backup & Restore. You can take that file to another device, restore it later, or simply keep it as a personal archive.",
  },
  {
    icon: Trash2,
    title: 'Deletion controls',
    body: "You can delete individual records, specific data categories, or everything at once from Settings → Data Management. Deletion takes effect immediately. We do not retain deleted data.",
  },
  {
    icon: Users,
    title: 'Youth and minor safety',
    body: "SwingVantage is not directed at children under 13. We do not knowingly collect information from children under 13 without parental consent. For users under 18, we encourage parental involvement and supervision, especially when uploading videos. If a parent or guardian believes their child has provided personal data, contact us and we will delete it promptly.",
  },
  {
    icon: AlertTriangle,
    title: 'Honest AI — confident, data-backed, and clearly labelled',
    body: "SwingVantage combines precise, data-backed analysis with adaptive AI to pinpoint your swing patterns and prescribe the drills that fix them. Outputs are confident, data-backed estimates that sharpen as you add data, and every finding is labelled with the data behind it and a confidence level. SwingVantage pairs perfectly with a qualified coach, trainer, or medical professional for injury concerns and advanced technique work — so you bring them sharper questions and progress faster.",
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <MarketingHero
        title="Trust &"
        titleAccent="Safety"
        subtitle="SwingVantage is built on a simple principle: your data is yours, the AI is honest about its limits, and nothing happens without your knowledge."
      />

      {/* Summary row */}
      <div className="bg-primary/10 border-b border-primary/20 py-6 px-4">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4 text-center text-sm">
          {[
            { label: 'Private to your account', sub: 'Your data is yours — synced privately or kept on-device' },
            { label: 'User-controlled deletion', sub: 'Delete anything, anytime' },
            { label: 'Honest AI labels', sub: 'Every estimate is labeled as an estimate' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <CheckCircle className="text-primary" size={20} />
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {TRUST_SECTIONS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mt-0.5">
              <Icon className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          </section>
        ))}

        {/* Security posture */}
        <section className="bg-muted border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Security posture</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle size={15} className="text-primary mt-0.5 shrink-0" /><span>All SwingVantage pages are served over HTTPS with security headers including Content-Security-Policy, X-Frame-Options, and HSTS.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-primary mt-0.5 shrink-0" /><span>API keys and secrets are never included in pages delivered to your browser.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-primary mt-0.5 shrink-0" /><span>Automated security audits run on every code change using CodeQL, dependency scanning, and secret scanning.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-primary mt-0.5 shrink-0" /><span>User-generated content is sanitized before being rendered in the interface.</span></li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-2">Contact &amp; reporting</h2>
          <p className="text-sm text-muted-foreground">
            For a privacy concern or data deletion request, email{' '}
            <a href={`mailto:${siteConfig.privacyEmail}`} className="text-primary font-semibold hover:underline">{siteConfig.privacyEmail}</a>.
            To report a security issue, email{' '}
            <a href={`mailto:${siteConfig.securityEmail}`} className="text-primary font-semibold hover:underline">{siteConfig.securityEmail}</a>.
            We will respond within a reasonable timeframe.
          </p>
          <p className="text-xs text-muted-foreground mt-2 italic">
            This page reflects our current practices in plain English. We have not certified compliance with specific regulatory frameworks, and recommend independent legal review of our Privacy Policy and Terms before scaling commercially.
          </p>
        </section>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href="/" className="text-primary hover:underline">← SwingVantage Home</Link>
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
          <Link href="/parents" className="text-primary hover:underline">SwingVantage for Parents</Link>
          <Link href="/vulnerability-disclosure" className="text-primary hover:underline">Vulnerability Disclosure</Link>
        </nav>
      </div>
    </div>
  );
}
