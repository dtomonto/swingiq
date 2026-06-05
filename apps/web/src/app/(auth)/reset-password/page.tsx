'use client';

// ============================================================
// /reset-password — set a new password
//
// Landing page for the password-recovery email. The email links to
// /auth/confirm?type=recovery&next=/reset-password, which verifies the
// one-time token and establishes a session BEFORE redirecting here — so
// by the time this page loads the user is authenticated and can set a
// new password with supabase.auth.updateUser().
// ============================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const inputClass =
    'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Password reset is unavailable right now. Please try again later.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(
        updateError.message ||
          'Could not update your password. This link may have expired — request a new one.',
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-golf-dark flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-base">SV</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">SwingVantage</p>
          <p className="text-primary-foreground/90 text-xs">Golf Performance System</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Choose a new password</h1>
        <p className="text-muted-foreground text-sm mb-6">Enter a new password for your account.</p>

        {done ? (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-sm text-success leading-relaxed">
              Password updated. Taking you to your dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="text-sm font-medium text-foreground block mb-1">
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-xs text-warning leading-relaxed">{error}</p>
                <Link
                  href="/forgot-password"
                  className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Request a new link →
                </Link>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <Lock size={16} /> Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
