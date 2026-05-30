// ============================================================
// /login — Sign-in page
// Currently shows a UI-complete form that explains Supabase
// is not yet connected. Fully functional once .env.local
// is populated with NEXT_PUBLIC_SUPABASE_URL and keys.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | SwingIQ',
  description: 'Sign in to your SwingIQ account.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-golf-dark flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-base">SQ</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">SwingIQ</p>
          <p className="text-green-400 text-xs">Golf Performance System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to your SwingIQ account</p>
        <LoginForm />
        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-green-600 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>

      <p className="text-green-400 text-xs mt-6 text-center max-w-xs">
        While signing in, you can still use SwingIQ — your data is saved locally in your browser.
      </p>
    </div>
  );
}
