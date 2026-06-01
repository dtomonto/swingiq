import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Trash2, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Trust & Safety | SwingIQ',
  description:
    'How SwingIQ protects your privacy, keeps your swing data safe, and sets honest expectations about what AI can and cannot do.',
  openGraph: {
    title: 'Trust & Safety | SwingIQ',
    description:
      'SwingIQ is local-first, privacy-focused, and built with honest AI. Learn how your data is handled and what protections are in place.',
    type: 'website',
    url: 'https://swingiq.app/trust',
  },
  alternates: { canonical: '/trust' },
};

const TRUST_SECTIONS = [
  {
    icon: Lock,
    title: 'Your data stays on your device',
    body: "By default, every profile, session, swing analysis, and video you create in SwingIQ is stored locally in your browser — not on a remote server. Nothing leaves your device unless you choose to sync or back up to the cloud when that feature becomes available.",
  },
  {
    icon: Eye,
    title: 'Video privacy',
    body: "When you upload a swing video, it is analyzed in your browser. Videos are not transmitted to external servers by default. We do not share your video content publicly, and we do not use your footage to train AI models without your explicit consent.",
  },
  {
    icon: Shield,
    title: 'Export and portability',
    body: "You own your data. You can export everything SwingIQ knows about you as a single downloadable file at any time from Settings → Backup & Restore. You can take that file to another device, restore it later, or simply keep it as a personal archive.",
  },
  {
    icon: Trash2,
    title: 'Deletion controls',
    body: "You can delete individual records, specific data categories, or everything at once from Settings → Data Management. Deletion takes effect immediately. We do not retain deleted data.",
  },
  {
    icon: Users,
    title: 'Youth and minor safety',
    body: "SwingIQ is not directed at children under 13. We do not knowingly collect information from children under 13 without parental consent. For users under 18, we encourage parental involvement and supervision, especially when uploading videos. If a parent or guardian believes their child has provided personal data, contact us and we will delete it promptly.",
  },
  {
    icon: AlertTriangle,
    title: 'Honest AI — what SwingIQ does and does not claim',
    body: "SwingIQ uses a rules-based diagnostic engine and an AI language model to identify swing patterns and suggest drills. Diagnostic outputs are labeled as estimates and should be treated as improvement suggestions, not professional instruction. SwingIQ does not guarantee performance improvement. SwingIQ is not a replacement for a qualified coach, trainer, or medical professional. For injury concerns or complex technique work, work with a qualified specialist.",
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1a3a2a] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SQ</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-green-300 transition-colors">SwingIQ</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Trust &amp; Safety</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            SwingIQ is built on a simple principle: your data is yours, the AI is honest about its limits, and nothing happens without your knowledge.
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="bg-green-50 border-b border-green-100 py-6 px-4">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-4 text-center text-sm">
          {[
            { label: 'Local-first storage', sub: 'Data stays on your device by default' },
            { label: 'User-controlled deletion', sub: 'Delete anything, anytime' },
            { label: 'Honest AI labels', sub: 'Every estimate is labeled as an estimate' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <CheckCircle className="text-green-600" size={20} />
              <p className="font-semibold text-gray-800">{item.label}</p>
              <p className="text-gray-500 text-xs">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {TRUST_SECTIONS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mt-0.5">
              <Icon className="text-green-700" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
            </div>
          </section>
        ))}

        {/* Security posture */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Security posture</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" /><span>All SwingIQ pages are served over HTTPS with security headers including Content-Security-Policy, X-Frame-Options, and HSTS.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" /><span>API keys and secrets are never included in pages delivered to your browser.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Automated security audits run on every code change using CodeQL, dependency scanning, and secret scanning.</span></li>
            <li className="flex gap-2"><CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" /><span>User-generated content is sanitized before being rendered in the interface.</span></li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Contact &amp; reporting</h2>
          <p className="text-sm text-gray-600">
            For a privacy concern or data deletion request, email{' '}
            <a href={`mailto:${siteConfig.privacyEmail}`} className="text-green-700 font-semibold hover:underline">{siteConfig.privacyEmail}</a>.
            To report a security issue, email{' '}
            <a href={`mailto:${siteConfig.securityEmail}`} className="text-green-700 font-semibold hover:underline">{siteConfig.securityEmail}</a>.
            We will respond within a reasonable timeframe.
          </p>
          <p className="text-xs text-gray-400 mt-2 italic">
            This page reflects our current practices in plain English. We have not certified compliance with specific regulatory frameworks, and recommend independent legal review of our Privacy Policy and Terms before scaling commercially.
          </p>
        </section>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-gray-200">
          <Link href="/" className="text-green-700 hover:underline">← SwingIQ Home</Link>
          <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-green-700 hover:underline">Terms of Service</Link>
          <Link href="/faq" className="text-green-700 hover:underline">FAQ</Link>
          <Link href="/parents" className="text-green-700 hover:underline">SwingIQ for Parents</Link>
          <Link href="/vulnerability-disclosure" className="text-green-700 hover:underline">Vulnerability Disclosure</Link>
        </nav>
      </div>
    </div>
  );
}
