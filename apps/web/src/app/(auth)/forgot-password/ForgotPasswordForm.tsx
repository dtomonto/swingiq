'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/useAuth';
import { siteConfig } from '@/config/site';

export function ForgotPasswordForm() {
  const { resetPassword, mode } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputClass =
    'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const result = await resetPassword(email, mode === 'local' ? newPassword : undefined);
    setLoading(false);
    if (result.ok) setSuccess(result.message ?? 'Done.');
    else setError(result.message ?? 'Could not reset password.');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {mode === 'local'
          ? 'Your account lives on this device, so you can set a new password right here.'
          : 'Enter your email and we’ll send you a secure link to reset your password.'}
      </p>

      <div>
        <label htmlFor="forgot-email" className="text-sm font-medium text-foreground block mb-1">Email</label>
        <input
          id="forgot-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      {mode === 'local' && (
        <div>
          <label htmlFor="forgot-new-password" className="text-sm font-medium text-foreground block mb-1">New password</label>
          <input
            id="forgot-new-password"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-xs text-warning leading-relaxed">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-xs text-success leading-relaxed">{success}</p>
          <Link href="/login" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Back to sign in →
          </Link>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {mode === 'local' ? 'Set new password' : 'Send reset link'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Still stuck? Email{' '}
        <a href={`mailto:${siteConfig.supportEmail}`} className="font-semibold text-primary hover:underline">
          {siteConfig.supportEmail}
        </a>
      </p>
    </form>
  );
}
