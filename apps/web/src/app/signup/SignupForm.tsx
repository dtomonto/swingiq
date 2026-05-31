'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import Link from 'next/link';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setError(
      'Account creation requires Supabase. Add your project keys to apps/web/.env.local to enable sign-up. ' +
      'Until then, SwingIQ saves everything locally — click below to start using the app now.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Your Name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Tiger Woods" autoComplete="name" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-10`} placeholder="At least 8 characters" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 leading-relaxed">{error}</p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs font-semibold text-green-700 hover:underline">
            Use SwingIQ without an account →
          </Link>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        <UserPlus size={16} /> Create Account
      </Button>

      <p className="text-xs text-gray-400 text-center">
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline hover:text-gray-600">terms of service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-gray-600">privacy policy</Link>.
      </p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
        <strong>Under 13?</strong> A parent or guardian must create and manage your account.
        SwingIQ is not directed at children under 13.
      </p>
    </form>
  );
}
