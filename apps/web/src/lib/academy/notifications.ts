// ============================================================
// SwingVantage Academy — notifications (pure derivation)
// ------------------------------------------------------------
// Derives the learner's notifications from their progress:
// claimable/expiring/expired certs, due/overdue assignments,
// and streak nudges. No backend — computed from local state.
// ============================================================
import type { AcademyProgress } from './types';
import { getCertification, getCourse, getPath } from './content';
import { claimableCertifications, currentStreak } from './engine';

export type NotifKind =
  | 'cert-ready' | 'cert-expiring' | 'cert-expired'
  | 'assignment-due' | 'assignment-overdue' | 'streak';

export type NotifSeverity = 'info' | 'warn' | 'success';

export interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  href: string;
  severity: NotifSeverity;
}

const DAY = 86_400_000;
const SEV_ORDER: Record<NotifSeverity, number> = { warn: 0, success: 1, info: 2 };

export function academyNotifications(progress: AcademyProgress): Notification[] {
  const out: Notification[] = [];
  const now = Date.now();

  for (const cert of claimableCertifications(progress)) {
    out.push({
      id: `cr-${cert.id}`, kind: 'cert-ready', severity: 'success',
      title: `Ready to claim: ${cert.name}`, detail: 'You meet every requirement.',
      href: '/admin/academy/certifications',
    });
  }

  for (const [certId, rec] of Object.entries(progress.certifications)) {
    if (!rec.expiresAt) continue;
    const exp = new Date(rec.expiresAt).getTime();
    const name = getCertification(certId)?.name ?? certId;
    if (exp < now) {
      out.push({ id: `ce-${certId}`, kind: 'cert-expired', severity: 'warn', title: `Expired: ${name}`, detail: 'Recertify to stay current.', href: '/admin/academy/certifications' });
    } else if (exp - now <= 30 * DAY) {
      const days = Math.ceil((exp - now) / DAY);
      out.push({ id: `cx-${certId}`, kind: 'cert-expiring', severity: 'warn', title: `Expiring soon: ${name}`, detail: `Expires in ${days} day(s).`, href: '/admin/academy/certifications' });
    }
  }

  for (const a of progress.assignments ?? []) {
    const target = a.targetType === 'course' ? getCourse(a.targetId) : getPath(a.targetId);
    if (!target) continue;
    const href = `/admin/academy/${a.targetType}/${target.slug}`;
    if (!a.dueAt) continue;
    const due = new Date(a.dueAt).getTime();
    if (due < now) {
      out.push({ id: `ao-${a.id}`, kind: 'assignment-overdue', severity: 'warn', title: `Overdue: ${target.title}`, detail: 'Past its due date.', href });
    } else if (due - now <= 7 * DAY) {
      const days = Math.ceil((due - now) / DAY);
      out.push({ id: `ad-${a.id}`, kind: 'assignment-due', severity: 'warn', title: `Due soon: ${target.title}`, detail: `Due in ${days} day(s).`, href });
    }
  }

  const streak = currentStreak(progress);
  if (streak >= 3) {
    out.push({ id: 'streak', kind: 'streak', severity: 'success', title: `🔥 ${streak}-day streak`, detail: 'Keep it going with one more lesson today.', href: '/admin/academy/dashboard' });
  }

  return out.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}
