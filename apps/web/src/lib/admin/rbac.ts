// ============================================================
// SwingVantage Admin — Roles & Permissions (RBAC)
// ------------------------------------------------------------
// Pure, dependency-free model of admin roles and the permissions
// each one grants. This is the single source of truth used by:
//   • the nav model (lib/admin/nav.ts) to gate sidebar sections
//   • server pages/actions (via getServerAdminRole + can)
//   • the /admin/security matrix UI
//
// Authorization layering (defence in depth):
//   1. app/admin/layout.tsx already blocks anyone who is not an
//      admin at all (ADMIN_SECRET header OR allowlisted email).
//   2. RBAC then narrows WHAT an authenticated admin may do.
//
// Anyone who clears the layout guard is a Super Admin by default.
// Finer roles are opt-in via the ADMIN_ROLES env map
// ("email:role,email:role") or the client role-assignment overlay
// (lib/admin/stores/role-assignments.ts). Least privilege only ever
// REMOVES capability from the default, never grants entry.
// ============================================================

export const PERMISSIONS = [
  'users.view',
  'users.edit',
  'users.delete',
  'media.view',
  'media.delete',
  'ai.review',
  'content.edit',
  'content.publish',
  'seo.edit',
  'sports.manage',
  'ads.manage',
  'monetization.manage',
  'support.manage',
  'flags.manage',
  'analytics.view',
  'data.export',
  'integrations.manage',
  'admins.manage',
  'legal.manage',
  'logs.view',
  'settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_IDS = [
  'super_admin',
  'admin',
  'content_manager',
  'seo_manager',
  'sports_editor',
  'ai_reviewer',
  'support_agent',
  'monetization_manager',
  'analyst',
  'read_only',
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export interface RoleDef {
  id: RoleId;
  label: string;
  /** Plain-English description for the /admin/security matrix. */
  description: string;
  /** Granted permissions. `'*'` means every permission (super admin). */
  permissions: readonly Permission[] | '*';
}

// Read-style permissions a "viewer" may always have.
const VIEW_ONLY: Permission[] = ['users.view', 'media.view', 'analytics.view', 'logs.view'];

export const ROLES: Record<RoleId, RoleDef> = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    description: 'Full, unrestricted access including managing other admins and system settings.',
    permissions: '*',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Operate the whole platform. Cannot manage other admin accounts.',
    permissions: PERMISSIONS.filter((p) => p !== 'admins.manage'),
  },
  content_manager: {
    id: 'content_manager',
    label: 'Content Manager',
    description: 'Create, edit and publish website, blog and tutorial content.',
    permissions: ['content.edit', 'content.publish', 'media.view', 'analytics.view', 'logs.view'],
  },
  seo_manager: {
    id: 'seo_manager',
    label: 'SEO Manager',
    description: 'Manage SEO/AEO/GEO pages, metadata and the content calendar.',
    permissions: ['seo.edit', 'content.edit', 'analytics.view', 'logs.view'],
  },
  sports_editor: {
    id: 'sports_editor',
    label: 'Sports Content Editor',
    description: 'Configure per-sport content, drills, faults and templates.',
    permissions: ['sports.manage', 'content.edit', 'content.publish', 'analytics.view'],
  },
  ai_reviewer: {
    id: 'ai_reviewer',
    label: 'AI Review Specialist',
    description: 'Review AI analysis outputs and generated content quality.',
    permissions: ['ai.review', 'media.view', 'content.edit', 'analytics.view'],
  },
  support_agent: {
    id: 'support_agent',
    label: 'Support Agent',
    description: 'Handle support tickets and user feedback with read access to user context.',
    permissions: ['support.manage', 'users.view', 'media.view', 'analytics.view'],
  },
  monetization_manager: {
    id: 'monetization_manager',
    label: 'Monetization Manager',
    description: 'Manage ads, affiliate and monetization surfaces.',
    permissions: ['monetization.manage', 'ads.manage', 'analytics.view'],
  },
  analyst: {
    id: 'analyst',
    label: 'Analyst',
    description: 'Read analytics, view logs and export reports. No edit access.',
    permissions: ['analytics.view', 'logs.view', 'data.export', 'users.view', 'media.view'],
  },
  read_only: {
    id: 'read_only',
    label: 'Read-Only Viewer',
    description: 'View-only access across the dashboard. Cannot change anything.',
    permissions: VIEW_ONLY,
  },
};

/** True when `role` is allowed to perform `permission`. */
export function roleHasPermission(role: RoleId, permission: Permission): boolean {
  const def = ROLES[role];
  if (!def) return false;
  if (def.permissions === '*') return true;
  return def.permissions.includes(permission);
}

/** Convenience: does this role have ALL of the given permissions? */
export function roleHasAll(role: RoleId, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

/** A normalized role-assignment record (email → role). */
export interface RoleAssignment {
  email: string;
  role: RoleId;
}

/**
 * Resolve the effective role for an email given a set of assignments.
 * Falls back to `fallback` (Super Admin by default) when no explicit
 * assignment exists — anyone who passed the layout guard is trusted.
 */
export function resolveRoleForEmail(
  email: string | null | undefined,
  assignments: RoleAssignment[],
  fallback: RoleId = 'super_admin',
): RoleId {
  if (!email) return fallback;
  const norm = email.trim().toLowerCase();
  const hit = assignments.find((a) => a.email.trim().toLowerCase() === norm);
  return hit?.role ?? fallback;
}

/**
 * Parse the optional ADMIN_ROLES env var into assignments.
 * Format: "alice@x.com:content_manager, bob@x.com:analyst".
 * Unknown roles are ignored (never silently escalate).
 */
export function parseAdminRolesEnv(raw: string | undefined): RoleAssignment[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [email, role] = pair.split(':').map((s) => s?.trim().toLowerCase());
      return { email, role } as RoleAssignment;
    })
    .filter((a): a is RoleAssignment => Boolean(a.email) && ROLE_IDS.includes(a.role as RoleId));
}
