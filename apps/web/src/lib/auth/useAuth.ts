'use client';

// ============================================================
// SwingVantage — Unified auth hook
//
// One API for the whole app, two backends:
//   • cloud  — real Supabase auth (when keys are configured)
//   • local  — device-only account store (keyless default)
//
// Components never branch on which backend is active; they call
// signIn / signUp / signOut and render `mode` for honest copy.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  getLocalUser,
  signInLocal,
  signUpLocal,
  signOutLocal,
  resetLocalPassword,
  onLocalAuthChange,
  LocalAuthError,
} from './localAuth';
import { markReturningUser } from './returning';

export type AuthMode = 'cloud' | 'local';
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  ok: boolean;
  /** Human-readable message (error, or e.g. "check your email to confirm"). */
  message?: string;
  /** True when cloud sign-up needs email confirmation before the session is active. */
  needsConfirmation?: boolean;
}

export function authMode(): AuthMode {
  return isSupabaseConfigured ? 'cloud' : 'local';
}

interface SupabaseUserLike {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string | null } | null;
}

function mapSupabaseUser(user: SupabaseUserLike | null | undefined): AuthUser | null {
  if (!user) return null;
  const email = user.email ?? '';
  return {
    id: user.id,
    email,
    name: user.user_metadata?.name?.trim() || email.split('@')[0] || 'Athlete',
  };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof LocalAuthError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function useAuth() {
  const mode = authMode();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    if (mode === 'cloud' && supabase) {
      const client = supabase;
      client.auth.getSession().then(({ data }) => {
        if (!active) return;
        const mapped = mapSupabaseUser(data.session?.user);
        setUser(mapped);
        setStatus(mapped ? 'authenticated' : 'anonymous');
      });
      const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
        const mapped = mapSupabaseUser(session?.user);
        setUser(mapped);
        setStatus(mapped ? 'authenticated' : 'anonymous');
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    // Local (keyless) mode.
    const refresh = () => {
      const u = getLocalUser();
      setUser(u ? { id: u.id, email: u.email, name: u.name } : null);
      setStatus(u ? 'authenticated' : 'anonymous');
    };
    refresh();
    const off = onLocalAuthChange(refresh);
    return () => {
      active = false;
      off();
    };
  }, [mode]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        if (mode === 'cloud' && supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { ok: false, message: error.message };
          markReturningUser();
          return { ok: true };
        }
        await signInLocal(email, password);
        markReturningUser();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: errorMessage(err, 'Could not sign in.') };
      }
    },
    [mode],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      try {
        if (mode === 'cloud' && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) return { ok: false, message: error.message };
          markReturningUser();
          // No active session → email confirmation is required.
          if (!data.session) {
            return {
              ok: true,
              needsConfirmation: true,
              message: 'Account created. Check your email to confirm, then sign in.',
            };
          }
          return { ok: true };
        }
        await signUpLocal(email, password, name);
        markReturningUser();
        return { ok: true };
      } catch (err) {
        return { ok: false, message: errorMessage(err, 'Could not create account.') };
      }
    },
    [mode],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (mode === 'cloud' && supabase) {
      await supabase.auth.signOut();
      return;
    }
    signOutLocal();
  }, [mode]);

  const resetPassword = useCallback(
    async (email: string, newPassword?: string): Promise<AuthResult> => {
      try {
        if (mode === 'cloud' && supabase) {
          const redirectTo =
            typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
          if (error) return { ok: false, message: error.message };
          return { ok: true, message: 'Password reset email sent. Check your inbox.' };
        }
        // Local mode: reset directly on this device.
        if (!newPassword) {
          return { ok: false, message: 'Enter a new password to reset on this device.' };
        }
        await resetLocalPassword(email, newPassword);
        return { ok: true, message: 'Password updated on this device. You can sign in now.' };
      } catch (err) {
        return { ok: false, message: errorMessage(err, 'Could not reset password.') };
      }
    },
    [mode],
  );

  return { user, status, mode, signIn, signUp, signOut, resetPassword };
}
