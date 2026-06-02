import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata = buildMetadata({
  title: 'Reset Your Password',
  description: 'Reset your SwingIQ password.',
  path: '/forgot-password',
  noindex: true,
});

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-muted">
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-xs">
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>

          <ForgotPasswordForm />

          <div className="mt-6 border-t border-border pt-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
