'use client';

// Theme Lab operator console. Reads the registry + live device control, lets an
// operator pin/kill a theme and opt into seasonal, and shows exactly what
// resolveThemeForUser() returns for this browser. Local-first; every change is
// audit-logged and broadcast so the live ThemeApplicator re-resolves instantly.

import { useEffect, useState } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { recordAudit } from '@/lib/admin/stores/audit-log';
import { useSwingVantageStore } from '@/store';
import { THEMES, DEFAULT_THEME_ID, normalizeThemeId, type ThemeId } from '@/lib/theme/themes';
import { THEME_LAB_REGISTRY, resolveThemeForUser } from '@/lib/theme-lab';
import {
  readThemeLabControl,
  writeThemeLabControl,
  envForcedTheme,
  effectiveForcedTheme,
  DEFAULT_CONTROL,
  THEME_LAB_CHANGE_EVENT,
  type ThemeLabControl,
} from '@/lib/theme-lab/control';

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  draft: 'warning',
  retired: 'neutral',
};
const VIS_TONE: Record<string, BadgeTone> = {
  all: 'success',
  'opt-in': 'warning',
  admin: 'danger',
};

const themeName = (id: ThemeId) => THEMES.find((t) => t.id === id)?.name ?? id;

export function ThemeLabClient({ actor }: { actor: string }) {
  const [mounted, setMounted] = useState(false);
  const [control, setControl] = useState<ThemeLabControl>(DEFAULT_CONTROL);

  // The operator's own saved preference — used to illustrate resolution.
  const savedPreference = useSwingVantageStore((s) => normalizeThemeId(s.settings.colorTheme));

  useEffect(() => {
    // Mount gate + initial read: localStorage (the device control) is only
    // available client-side, so we intentionally sync once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const sync = () => setControl(readThemeLabControl());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(THEME_LAB_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(THEME_LAB_CHANGE_EVENT, sync);
    };
  }, []);

  if (!mounted) return <p className="text-sm text-gray-500">Loading Theme Lab…</p>;

  const env = envForcedTheme();
  const effectiveForce = effectiveForcedTheme(control);
  const resolution = resolveThemeForUser({
    forcedThemeId: effectiveForce,
    userPreferenceThemeId: savedPreference,
    allowSeasonal: control.allowSeasonal,
  });

  function setPin(id: ThemeId | null) {
    writeThemeLabControl({ forcedThemeId: id });
    recordAudit({
      actor,
      action: id ? 'theme.pin' : 'theme.unpin',
      entityType: 'theme',
      entityId: id ?? 'none',
      summary: id ? `Pinned all visitors (this device) to "${themeName(id)}"` : 'Cleared the theme pin',
      severity: id ? 'warning' : 'info',
    });
  }

  function setSeasonal(next: boolean) {
    writeThemeLabControl({ allowSeasonal: next });
    recordAudit({
      actor,
      action: 'theme.seasonal',
      entityType: 'theme',
      entityId: 'seasonal',
      summary: `Seasonal themes ${next ? 'opted IN' : 'opted OUT'} (this device)`,
    });
  }

  const activeThemes = THEME_LAB_REGISTRY.filter((e) => e.status === 'active');

  return (
    <div className="space-y-6">
      {/* Live resolution */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          This browser resolves to
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-gray-100">{themeName(resolution.themeId)}</span>
          <StatusBadge tone="neutral">via {resolution.source}</StatusBadge>
        </div>
        <p className="mt-1 font-mono text-[11px] text-gray-600">
          force={effectiveForce ?? '—'} · preference={savedPreference} · seasonal=
          {control.allowSeasonal ? 'on' : 'off'}
        </p>
      </div>

      {/* Operator pin / kill-switch */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-gray-100">Operator pin (kill-switch)</h3>
        </div>
        <p className="text-xs text-gray-500">
          Force every visitor on this device to one theme. The cross-device pin is the build env{' '}
          <code className="font-mono text-gray-400">NEXT_PUBLIC_THEME_LAB_FORCE</code>, currently{' '}
          <span className="font-mono text-gray-300">{env ? themeName(env) : 'unset'}</span>. A device
          pin overrides it for you.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Pin to
            <select
              value={control.forcedThemeId ?? ''}
              onChange={(e) => setPin(e.target.value ? (e.target.value as ThemeId) : null)}
              className="rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-sm text-gray-200"
            >
              <option value="">No pin (off)</option>
              {activeThemes.map((e) => (
                <option key={e.themeId} value={e.themeId}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          {control.forcedThemeId !== DEFAULT_THEME_ID && (
            <button
              onClick={() => setPin(DEFAULT_THEME_ID)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Kill-switch → default
            </button>
          )}

          {control.forcedThemeId && (
            <button
              onClick={() => setPin(null)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <RotateCcw className="h-3 w-3" /> Clear pin
            </button>
          )}
        </div>

        {control.forcedThemeId && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
            Pinned to <strong>{themeName(control.forcedThemeId)}</strong> on this device. Visitors&apos;
            saved preferences are ignored until you clear the pin.
          </p>
        )}
      </div>

      {/* Seasonal opt-in */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100">Seasonal themes</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Opt this device into seasonal themes. They only show inside their active window. None are
            registered yet.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={control.allowSeasonal}
          aria-label="Opt into seasonal themes"
          onClick={() => setSeasonal(!control.allowSeasonal)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            control.allowSeasonal ? 'bg-emerald-500' : 'bg-gray-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              control.allowSeasonal ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Registry */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-100">Theme registry</h3>
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Theme</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Visibility</th>
                <th className="px-3 py-2 text-right font-medium">Rollout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {THEME_LAB_REGISTRY.map((e) => (
                <tr key={e.themeId}>
                  <td className="px-3 py-2 text-gray-200">
                    {e.name}
                    {e.themeId === DEFAULT_THEME_ID && (
                      <span className="ml-1.5 text-[10px] text-emerald-400">default</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{e.labCategory}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={STATUS_TONE[e.status] ?? 'neutral'}>{e.status}</StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={VIS_TONE[e.visibility] ?? 'neutral'}>
                      {e.visibility}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-gray-400">
                    {e.rolloutPercent ?? 100}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
