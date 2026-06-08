'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function SignupForm() {
  const router = useRouter();
  const { signUp, mode } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputClass = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const result = await signUp(email, password, name);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? 'Could not create account.');
      return;
    }

    // Funnel: bottom-of-funnel conversion. Fires for both an instant local
    // account and a cloud account still pending email confirmation.
    track(ANALYTICS_EVENTS.ACCOUNT_CREATED, {
      mode,
      needs_confirmation: Boolean(result.needsConfirmation),
    });

    if (result.needsConfirmation) {
      setNotice(result.message ?? 'Check your email to confirm your account.');
      return;
    }
    router.push('/start');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="text-sm font-medium text-foreground block mb-1">Your Name</label>
        <input id="signup-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tiger Woods" autoComplete="name" />
      </div>
      <div>
        <label htmlFor="signup-email" className="text-sm font-medium text-foreground block mb-1">Email</label>
        <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="signup-password" className="text-sm font-medium text-foreground block mb-1">Password</label>
        <div className="relative">
          <input id="signup-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} placeholder="At least 8 characters" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-xs text-warning leading-relaxed">{error}</p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Use SwingVantage without an account →
          </Link>
        </div>
      )}

      {notice && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-xs text-success leading-relaxed">{notice}</p>
          <Link href="/login" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Go to sign in →
          </Link>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        <UserPlus size={16} /> Create Free Account
      </Button>

      {mode === 'cloud' ? (
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Free forever. Your progress saves to your account and syncs across every device
          you sign in on — so you never lose it. Anything already on this device comes with you.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Your account is created right here on this device — no email confirmation needed.
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
      </p>

      <p className="text-xs text-muted-foreground text-center">
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline hover:text-muted-foreground">terms of service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-muted-foreground">privacy policy</Link>.
      </p>
      <p className="text-xs text-warning bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
        <strong>Under 13?</strong> A parent or guardian must create and manage your account.
        SwingVantage is not directed at children under 13.
      </p>
    </form>
  );
}
