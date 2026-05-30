import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Create Account | SwingIQ',
  description: 'Create your free SwingIQ account.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-golf-dark flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-golf-fairway rounded-xl flex items-center justify-center">
          <span className="text-white font-black text-base">SQ</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">SwingIQ</p>
          <p className="text-green-400 text-xs">Golf Performance System</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">Start improving your game today — it&apos;s free.</p>
        <SignupForm />
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>

      <div className="mt-6 text-center text-green-300 text-xs max-w-xs space-y-1">
        <p>⛳ Golf · 🎾 Tennis · ⚾ Baseball · 🥎 Softball</p>
        <p>All swing sports. One genie.</p>
      </div>
    </div>
  );
}
