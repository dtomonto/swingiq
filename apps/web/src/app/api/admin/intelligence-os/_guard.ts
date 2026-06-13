// Shared admin guard for Intelligence OS API routes (SERVER-ONLY).
// Mirrors the pattern in app/api/admin/ai/routing/route.ts.
import { NextResponse } from 'next/server';
import { requireAdmin, contextCan, type AdminContext } from '@/lib/admin/context';
import type { Permission } from '@/lib/admin/rbac';

export interface GuardResult {
  error: NextResponse | null;
  admin: AdminContext;
}

export async function guard(permission: Permission): Promise<GuardResult> {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }), admin };
  }
  if (!contextCan(admin, permission)) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }), admin };
  }
  return { error: null, admin };
}

export async function readJson<T>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { return {} as T; }
}
