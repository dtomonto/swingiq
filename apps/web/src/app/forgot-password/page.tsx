import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/config/site';

export const metadata = buildMetadata({
  title: 'Reset Your Password',
  description: 'How to reset your SwingIQ password.',
  path: '/forgot-password',
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-xs">
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>

          <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm leading-relaxed text-warning">
              Account sign-in and sync aren&apos;t connected yet, so there&apos;s no password to reset right now.
              SwingIQ works without an account — your data is saved locally in your browser, and you can start
              analyzing immediately.
            </p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            When cloud accounts launch, you&apos;ll be able to reset your password from this page. Until then, if you
            need help, email{' '}
            <a href={`mailto:${siteConfig.supportEmail}`} className="font-semibold text-primary hover:underline">
              {siteConfig.supportEmail}
            </a>
            .
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard" className="rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary">
              Continue to SwingIQ
            </Link>
            <Link href="/login" className="rounded-xl border border-border py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
