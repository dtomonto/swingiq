// ============================================================
// /login — Sign-in page
// Renders the sign-in form. Backed by cloud accounts when
// configured, otherwise a device-local account (lib/auth/useAuth).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | SwingVantage',
  description: 'Sign in to your SwingVantage account.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-golf-dark flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-base">SV</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">SwingVantage</p>
          <p className="text-primary-foreground/90 text-xs">Golf Performance System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm mb-6">Sign in to your SwingVantage account</p>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      <p className="text-primary-foreground/90 text-xs mt-6 text-center max-w-xs">
        {isSupabaseConfigured
          ? 'Signing in saves your progress to your account and keeps it synced across every device you use.'
          : 'No internet account needed — your progress is saved right here in this browser on this device.'}
      </p>
    </div>
  );
}
