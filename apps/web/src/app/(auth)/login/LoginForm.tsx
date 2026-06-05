'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';

export function LoginForm() {
  const router = useRouter();
  const { signIn, mode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.ok) {
      const next =
        (typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('next')) ||
        '/dashboard';
      router.push(next.startsWith('/') ? next : '/dashboard');
      return;
    }
    setError(result.message ?? 'Could not sign in.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="text-sm font-medium text-foreground block mb-1">Email</label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
          <p className="text-xs text-warning leading-relaxed">{error}</p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
            Continue without signing in →
          </Link>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        <LogIn size={16} /> Sign In
      </Button>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          New to SwingVantage?{' '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
        {mode === 'local' && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your account is saved on this device. No internet account is required.
          </p>
        )}
        <Link href="/dashboard" className="inline-block text-xs text-muted-foreground hover:text-foreground hover:underline">
          Continue without an account →
        </Link>
      </div>
    </form>
  );
}
