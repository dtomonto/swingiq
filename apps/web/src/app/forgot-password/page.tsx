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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-relaxed text-amber-800">
              Account sign-in and sync aren&apos;t connected yet, so there&apos;s no password to reset right now.
              SwingIQ works without an account — your data is saved locally in your browser, and you can start
              analyzing immediately.
            </p>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            When cloud accounts launch, you&apos;ll be able to reset your password from this page. Until then, if you
            need help, email{' '}
            <a href={`mailto:${siteConfig.supportEmail}`} className="font-semibold text-green-700 hover:underline">
              {siteConfig.supportEmail}
            </a>
            .
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard" className="rounded-xl bg-green-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-green-700">
              Continue to SwingIQ
            </Link>
            <Link href="/login" className="rounded-xl border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
