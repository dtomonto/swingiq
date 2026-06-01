'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-hidden';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Supabase auth will be wired here once .env.local is populated
    // For now, show a helpful message
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setError(
      'Authentication is not yet connected. Add your Supabase keys to apps/web/.env.local to enable sign-in. ' +
      'In the meantime, your data is being saved locally — just click the logo to continue to the app.'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
        <input
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
          <label className="text-sm font-medium text-gray-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-green-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800 leading-relaxed">{error}</p>
          <Link href="/dashboard" className="mt-2 inline-block text-xs font-semibold text-green-700 hover:underline">
            Continue without signing in →
          </Link>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        <LogIn size={16} /> Sign In
      </Button>
    </form>
  );
}
