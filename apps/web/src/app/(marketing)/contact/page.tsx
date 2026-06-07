import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageSquare, Clock, Hammer } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact Us | SwingVantage',
  description:
    'Have feedback, found a bug, or have an idea? SwingVantage is in active development and we read every message. Send us a note and help shape the product.',
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
};

const POINTS = [
  {
    icon: MessageSquare,
    title: 'We read every message',
    body: 'Feedback, bug reports, and feature ideas all land in the same inbox. The most useful ones often ship.',
  },
  {
    icon: Clock,
    title: 'We reply by email',
    body: 'Leave a real email address and we’ll get back to you there. No newsletter sign-up, no spam.',
  },
  {
    icon: Hammer,
    title: 'We’re still building',
    body: 'SwingVantage is in active development. If something feels off or missing, telling us is the fastest way to fix it.',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Contact us</h1>
        </div>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
          SwingVantage is in active development, so your input genuinely shapes what we build next. Tell us what’s
          working, what isn’t, or what you’d love to see — we read every note.
        </p>

        {/* Why contact */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-muted/40 p-4">
              <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mb-1 text-sm font-semibold text-foreground">{title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
          <ContactForm supportEmail={siteConfig.contactEmail} />
        </div>

        {/* Direct email fallback */}
        <p className="mt-6 text-sm text-muted-foreground">
          Prefer email? Reach us directly at{' '}
          <a href={`mailto:${siteConfig.contactEmail}`} className="font-medium text-primary underline">
            {siteConfig.contactEmail}
          </a>
          . For security reports, see our{' '}
          <Link href="/vulnerability-disclosure" className="text-primary underline">
            vulnerability disclosure policy
          </Link>
          .
        </p>

        {/* Footer links */}
        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms of Service
          </Link>
          <Link href="/trust" className="hover:text-foreground hover:underline">
            Trust &amp; Safety
          </Link>
        </div>
      </div>
    </div>
  );
}
